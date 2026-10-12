/* Centralises localStorage keys and Supabase Cloud sync */
import { getSupabaseClient, getCloudAuthSession, signInCloudStaff, signOutCloudStaff } from '../config/supabase-config.js';

export { getCloudAuthSession, signInCloudStaff, signOutCloudStaff };

export const STORAGE_KEYS = {
  HISTORY: 'labReportsHistory',
  DELETED_IDS: 'deletedReportIds',
  GLOBAL_SERIAL: 'globalHistorySerial',
  // Consumable inventory counters are workstation-local (tracked in localStorage per counter)
  PURPLE_TUBE: 'purpleTubeCount',
  RED_TUBE: 'redTubeCount',
  TYPHOID_KIT: 'typhoidKitCount',
  MALARIA_KIT: 'malariaKitCount'
};
export const SESSION_KEYS = { CURRENT_PATIENT_ID: 'currentPatientId' };

const SYNC_LOCK_KEY = 'shc_sync_lock';
const SYNC_LOCK_TIMEOUT_MS = 10000;

function acquireSyncLock() {
  try {
    const now = Date.now();
    const currentLock = parseInt(localStorage.getItem(SYNC_LOCK_KEY) || '0');
    if (now - currentLock < SYNC_LOCK_TIMEOUT_MS) {
      return false; // Another tab holds an active lock
    }
    localStorage.setItem(SYNC_LOCK_KEY, String(now));
    return true;
  } catch (e) {
    return true;
  }
}

function releaseSyncLock() {
  try {
    localStorage.removeItem(SYNC_LOCK_KEY);
  } catch (e) {}
}

export function getDeletedReportIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_IDS)) || [];
  } catch (e) {
    return [];
  }
}

export function addTombstone(id) {
  if (id === null || id === undefined || id === '') return;
  const strId = String(id);
  const ids = getDeletedReportIds();
  if (!ids.includes(strId)) {
    ids.push(strId);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save tombstone ID:', e);
    }
  }
}

export function loadHistoryData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    if (!Array.isArray(raw)) return [];
    const tombstones = new Set(getDeletedReportIds().map(String));
    return raw
      .filter(item => {
        if (!item || typeof item !== 'object') return false;
        const idStr = String(item.id);
        if (tombstones.has(idStr) || item.is_deleted === true) return false;
        return true;
      })
      .map(item => {
        // Migration: coerce numeric Date.now() IDs to String
        if (item.id !== undefined && item.id !== null) {
          item.id = String(item.id);
        }
        return item;
      });
  } catch (e) {
    console.error('storage load failed', e);
    return [];
  }
}

export function saveHistoryData(history) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
      console.warn('localStorage quota exceeded. Trimming older reports to avoid data loss.');
      if (Array.isArray(history) && history.length > 50) {
        try {
          const trimmed = history.slice(0, Math.floor(history.length * 0.8));
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
          return;
        } catch (trimErr) {
          console.error('Failed to save even after trimming:', trimErr);
        }
      }
    }
    console.error('Error saving history data:', e);
  }
}

export function getGlobalSerial() {
  return parseInt(localStorage.getItem(STORAGE_KEYS.GLOBAL_SERIAL) || '0');
}
export function setGlobalSerial(n) {
  localStorage.setItem(STORAGE_KEYS.GLOBAL_SERIAL, String(n));
}

export function updateCloudStatusBadge(status, text) {
  let badge = document.getElementById('cloudStatusBadge');
  if (!badge) {
    const container = document.querySelector('.header-status-area') || document.querySelector('.logo-container');
    if (container) {
      badge = document.createElement('div');
      badge.id = 'cloudStatusBadge';
      badge.className = 'cloud-status-badge';
      container.prepend(badge);
    }
  }
  if (badge) {
    badge.setAttribute('data-status', status);
    badge.innerHTML = '<span class="status-dot"></span>';
    badge.title = status === 'connected' 
      ? 'Cloud Synced - Supabase Connected' 
      : (text || 'Local Mode - Working locally');
  }
}

export async function syncReportToCloud(reportItem) {
  const client = getSupabaseClient();
  if (!client || !reportItem) return;
  const strId = String(reportItem.id);
  const tombstones = new Set(getDeletedReportIds().map(String));
  if (tombstones.has(strId) || reportItem.is_deleted === true) return;

  const payload = {
    id: strId,
    serial: reportItem.serial,
    patient_id: reportItem.patientId || '',
    patient_name: reportItem.patientName || '',
    reported_date: reportItem.reportedDate || '',
    data: reportItem
  };

  try {
    let { error } = await client.from('lab_reports').upsert(payload);
    if (error) {
      console.warn('Cloud sync error for report:', error.message);
      if (error.code === '42501' || (error.message && (error.message.includes('policy') || error.message.includes('permission') || error.message.includes('JWT')))) {
        updateCloudStatusBadge('offline', '🟡 Local Mode (Auth Required)');
      }
    } else {
      reportItem._synced = true;
      updateCloudStatusBadge('connected', '🟢 Cloud Synced');
    }
  } catch (err) {
    console.warn('Network error syncing report to cloud:', err);
  }
}

export async function deleteReportFromCloud(id) {
  if (id === null || id === undefined || id === '') return;
  const strId = String(id);
  addTombstone(strId);
  const client = getSupabaseClient();
  if (!client) return;
  try {
    // Attempt soft-delete via is_deleted flag; fallback to delete if column does not exist
    let { error } = await client
      .from('lab_reports')
      .upsert({
        id: strId,
        is_deleted: true
      });
    if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('is_deleted')))) {
      const delRes = await client.from('lab_reports').delete().eq('id', strId);
      error = delRes.error;
    }
    if (error) console.warn('Cloud report delete error:', error.message);
  } catch (err) {
    console.warn('Network error deleting report from cloud:', err);
  }
}

let isSyncing = false;
export async function syncReportsFromCloud(callbacks = {}, retryCount = 0) {
  const client = getSupabaseClient();
  if (!client) {
    if (retryCount < 10) {
      setTimeout(() => syncReportsFromCloud(callbacks, retryCount + 1), 400);
    } else {
      updateCloudStatusBadge('offline', '🟡 Local Mode');
    }
    return;
  }
  if (isSyncing || !acquireSyncLock()) return;
  isSyncing = true;
  try {
    const { data, error } = await client
      .from('lab_reports')
      .select('*')
      .order('serial', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      if (error.code === '42501' || (error.message && (error.message.includes('policy') || error.message.includes('permission') || error.message.includes('JWT')))) {
        updateCloudStatusBadge('offline', '🟡 Local Mode (Auth Required)');
      } else {
        updateCloudStatusBadge('offline', '🟡 Local Mode');
      }
      return;
    }

    updateCloudStatusBadge('connected', '🟢 Cloud Synced');

    if (data) {
      // Record any deleted rows as local tombstones
      const tombstones = new Set(getDeletedReportIds().map(String));
      data.forEach(row => {
        if (row.is_deleted === true || tombstones.has(String(row.id))) {
          addTombstone(String(row.id));
        }
      });
      const activeTombstones = new Set(getDeletedReportIds().map(String));

      const cloudReports = data
        .filter(row => row.is_deleted !== true && !activeTombstones.has(String(row.id)))
        .map(row => {
          const r = row.data || row.report_data;
          if (r) {
            r.id = String(r.id || row.id);
            r._synced = true;
          }
          return r;
        })
        .filter(Boolean);

      const localReports = loadHistoryData();
      const offlineReports = localReports.filter(r => r && r._synced === false && !activeTombstones.has(String(r.id)));
      for (const offItem of offlineReports) {
        await syncReportToCloud(offItem);
        cloudReports.unshift(offItem);
      }

      cloudReports.sort((a, b) => (b.serial || 0) - (a.serial || 0));
      saveHistoryData(cloudReports);

      const maxSerial = cloudReports.reduce((max, r) => Math.max(max, r.serial || 0), 0);
      if (maxSerial > getGlobalSerial()) {
        setGlobalSerial(maxSerial);
      }

      if (callbacks && callbacks.onUpdate) {
        try { callbacks.onUpdate(); } catch (cbErr) { console.warn('Sync onUpdate non-critical warning:', cbErr); }
      }
      try {
        if (document.getElementById('historyList') && typeof loadHistory === 'function') loadHistory();
        if (document.getElementById('todayTestCount') && typeof updateTodayReportCount === 'function') updateTodayReportCount();
        if (document.getElementById('todayTotal') && typeof updateTodayTotal === 'function') updateTodayTotal();
        if (document.getElementById('statisticsContent') && typeof renderStatistics === 'function') renderStatistics();
      } catch (uiErr) {}
    }
  } catch (err) {
    console.warn('Error during cloud sync:', err);
    updateCloudStatusBadge('offline', '🟡 Local Mode');
  } finally {
    isSyncing = false;
    releaseSyncLock();
  }
}

let _realtimeChannel = null;

export function initRealtimeSync(callbacks = {}, retryCount = 0) {
  if (_realtimeChannel) return; // Prevent duplicate subscriptions
  const client = getSupabaseClient();
  if (!client) {
    if (retryCount < 10) {
      setTimeout(() => initRealtimeSync(callbacks, retryCount + 1), 400);
    }
    return;
  }
  try {
    _realtimeChannel = client
      .channel('public:lab_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports' }, (payload) => {
        console.log('Cloud change detected from another device:', payload ? payload.eventType : 'event');
        syncReportsFromCloud(callbacks);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Supabase realtime subscribed successfully.');
        }
      });
  } catch (err) {
    console.warn('Realtime subscription error:', err);
  }
}

export function unsubscribeRealtime() {
  if (_realtimeChannel) {
    try {
      const client = getSupabaseClient();
      if (client) client.removeChannel(_realtimeChannel);
    } catch (e) {}
    _realtimeChannel = null;
  }
}
