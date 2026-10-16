/* Centralises localStorage keys and Supabase Cloud sync */
import { getSupabaseClient, getCloudAuthSession, signInCloudStaff, signOutCloudStaff } from '../config/supabase-config.js';

export const STORAGE_KEYS = {
  HISTORY: 'labReportsHistory',
  DELETED_IDS: 'deletedReportIds',
  GLOBAL_SERIAL: 'globalHistorySerial',
  // Consumable inventory: authoritative in Supabase public.lab_inventory (id = 1);
  // localStorage keys below serve as the offline cache with delta-aware reconnect flush.
  PURPLE_TUBE: 'purpleTubeCount',
  RED_TUBE: 'redTubeCount',
  TYPHOID_KIT: 'typhoidKitCount',
  MALARIA_KIT: 'malariaKitCount',
  DENGUE_KIT: 'dengueKitCount',
  OFFLINE_INVENTORY_DELTAS: 'offlineInventoryDeltas'
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
        if (tombstones.has(idStr) || item.is_deleted === true || (item.data && item.data.is_deleted === true)) return false;
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

  const numericId = /^\d+$/.test(strId) ? Number(strId) : strId;

  const payload = {
    id: numericId,
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
      const currentList = loadHistoryData();
      const match = currentList.find(item => String(item.id) === strId);
      if (match) {
        match._synced = true;
        saveHistoryData(currentList);
      }
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
  const numericId = /^\d+$/.test(strId) ? Number(strId) : strId;
  try {
    // 1. Attempt soft-delete by setting is_deleted: true on the record and in data JSONB
    let { error } = await client
      .from('lab_reports')
      .update({
        is_deleted: true,
        data: { id: strId, is_deleted: true }
      })
      .eq('id', numericId);

    // If is_deleted column is not in schema cache (PGRST204), update JSONB data column
    if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('is_deleted')))) {
      const dataUpdateRes = await client
        .from('lab_reports')
        .update({
          data: { id: strId, is_deleted: true }
        })
        .eq('id', numericId);
      error = dataUpdateRes.error;
    }

    // 2. Fallback to hard delete if update fails or table enforces delete
    if (error) {
      const delRes = await client.from('lab_reports').delete().eq('id', numericId);
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
      // 1. Record any deleted rows from cloud as local tombstones, and sync pending offline deletes
      const tombstones = new Set(getDeletedReportIds().map(String));
      data.forEach(row => {
        const isCloudDeleted = row.is_deleted === true || (row.data && row.data.is_deleted === true);
        if (isCloudDeleted || tombstones.has(String(row.id))) {
          addTombstone(String(row.id));
          // If deleted locally while offline but still active in cloud, propagate delete to cloud
          if (!isCloudDeleted && tombstones.has(String(row.id))) {
            deleteReportFromCloud(String(row.id)).catch(e => console.warn('Sync offline tombstone error:', e));
          }
        }
      });
      const activeTombstones = new Set(getDeletedReportIds().map(String));

      // 2. Active reports from cloud (not soft-deleted and not in tombstones)
      const cloudReports = data
        .filter(row => {
          const isDeleted = row.is_deleted === true || (row.data && row.data.is_deleted === true);
          return !isDeleted && !activeTombstones.has(String(row.id));
        })
        .map(row => {
          const r = row.data || row.report_data;
          if (r) {
            r.id = String(r.id || row.id);
            r._synced = true;
          }
          return r;
        })
        .filter(Boolean);

      // Build map of cloud reports by ID
      const cloudReportMap = new Map();
      cloudReports.forEach(r => cloudReportMap.set(String(r.id), r));

      // 3. Merge local reports: ONLY preserve genuine offline unsynced reports.
      // If a local report was already previously synced (_synced === true) but is no longer present
      // in the cloud database, it was deleted on another device or in the database!
      // NEVER resurrect it! Tombstone it locally and discard it from local history.
      const localReports = loadHistoryData();
      for (const localItem of localReports) {
        if (!localItem || localItem.id === undefined || localItem.id === null) continue;
        const sId = String(localItem.id);
        if (activeTombstones.has(sId)) continue; // Already tombstoned, skip

        if (!cloudReportMap.has(sId)) {
          if (localItem._synced === true) {
            // Deleted from cloud on another device! Tombstone locally and drop.
            addTombstone(sId);
            continue;
          }
          // Genuine new report created while offline on this device: keep and upload
          syncReportToCloud(localItem).catch(e => console.warn('Background sync error:', e));
          cloudReportMap.set(sId, localItem);
        }
      }

      const mergedReports = Array.from(cloudReportMap.values());
      mergedReports.sort((a, b) => (b.serial || 0) - (a.serial || 0));
      saveHistoryData(mergedReports);

      const maxSerial = mergedReports.reduce((max, r) => Math.max(max, r.serial || 0), 0);
      if (maxSerial > getGlobalSerial()) {
        setGlobalSerial(maxSerial);
      }

      if (callbacks && callbacks.onUpdate) {
        try { callbacks.onUpdate(); } catch (cbErr) { console.warn('Sync onUpdate non-critical warning:', cbErr); }
      }
      try {
        if (document.getElementById('historyList') && typeof loadHistory === 'function') loadHistory();
        if (document.getElementById('todayTestCount') && typeof updateTodayReportCount === 'function') updateTodayReportCount();
        if ((document.getElementById('dashTodayTotal') || document.getElementById('todayTotal')) && typeof updateTodayTotal === 'function') updateTodayTotal();
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

/* ---- Cross-device inventory sync (Inventory Plan Phase 2) ----
 * Single-row public.lab_inventory (id = 1). localStorage keys stay the
 * offline cache. Only the originating device writes; remote devices apply
 * realtime broadcasts via handleRemoteInventoryUpdate (never re-derived). */
function readLocalInventoryCounts() {
  const num = k => {
    const n = parseInt(localStorage.getItem(k) || '0');
    return isNaN(n) || n < 0 ? 0 : n;
  };
  return {
    purple: num(STORAGE_KEYS.PURPLE_TUBE),
    red: num(STORAGE_KEYS.RED_TUBE),
    typhoid: num(STORAGE_KEYS.TYPHOID_KIT),
    malaria: num(STORAGE_KEYS.MALARIA_KIT),
    dengue: num(STORAGE_KEYS.DENGUE_KIT)
  };
}

function writeLocalInventoryCounts(counts) {
  const num = v => {
    const n = parseInt(v);
    return isNaN(n) || n < 0 ? 0 : n;
  };
  try {
    localStorage.setItem(STORAGE_KEYS.PURPLE_TUBE, String(num(counts.purple)));
    localStorage.setItem(STORAGE_KEYS.RED_TUBE, String(num(counts.red)));
    localStorage.setItem(STORAGE_KEYS.TYPHOID_KIT, String(num(counts.typhoid)));
    localStorage.setItem(STORAGE_KEYS.MALARIA_KIT, String(num(counts.malaria)));
    localStorage.setItem(STORAGE_KEYS.DENGUE_KIT, String(num(counts.dengue)));
  } catch (e) {}
}

function refreshInventoryUI() {
  try {
    if (document.getElementById('statisticsContent') && typeof renderStatistics === 'function') renderStatistics();
  } catch (uiErr) {}
}

let _inventoryPushInFlight = false;
let _inventoryPushQueued = false;

export function handleRemoteInventoryUpdate(row) {
  if (!row || typeof row !== 'object') return;
  // If a local write is in-flight or queued, avoid overwriting with a stale interim snapshot
  if (_inventoryPushInFlight || _inventoryPushQueued) return;
  writeLocalInventoryCounts({
    purple: row.purple_stock,
    red: row.red_stock,
    typhoid: row.typhoid_stock,
    malaria: row.malaria_stock,
    dengue: row.dengue_stock
  });
  refreshInventoryUI();
}

export async function fetchCloudInventory() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('lab_inventory').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return null;
    const counts = {
      purple: data.purple_stock,
      red: data.red_stock,
      typhoid: data.typhoid_stock,
      malaria: data.malaria_stock,
      dengue: data.dengue_stock
    };
    writeLocalInventoryCounts(counts);
    refreshInventoryUI();
    return readLocalInventoryCounts();
  } catch (err) {
    return null;
  }
}

export async function pushCloudInventory() {
  const client = getSupabaseClient();
  if (!client) return false;
  if (_inventoryPushInFlight) {
    _inventoryPushQueued = true;
    return true;
  }
  _inventoryPushInFlight = true;
  try {
    const counts = readLocalInventoryCounts();
    const { error } = await client.from('lab_inventory').upsert({
      id: 1,
      purple_stock: counts.purple,
      red_stock: counts.red,
      typhoid_stock: counts.typhoid,
      malaria_stock: counts.malaria,
      dengue_stock: counts.dengue,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.warn('Inventory cloud push failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error pushing inventory:', err);
    return false;
  } finally {
    _inventoryPushInFlight = false;
    if (_inventoryPushQueued) {
      _inventoryPushQueued = false;
      pushCloudInventory();
    }
  }
}

/* ---- Delta-aware offline recovery (Inventory Plan Phase 3) ----
 * Offline report actions queue relative deltas (never stale absolute
 * numbers). On reconnect, flush fetches the fresh cloud row, applies queued
 * deltas, clamps at >= 0, and upserts the reconciled totals. */
const DELTA_FIELDS = ['purple', 'red', 'typhoid', 'malaria', 'dengue'];

export function getInventoryDeltas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_INVENTORY_DELTAS)) || {};
  } catch (e) {
    return {};
  }
}

function saveInventoryDeltas(deltas) {
  try {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_INVENTORY_DELTAS, JSON.stringify(deltas));
  } catch (e) {}
}

export function queueInventoryDeltas(delta) {
  if (!delta || typeof delta !== 'object') return;
  const cur = getInventoryDeltas();
  DELTA_FIELDS.forEach(k => {
    cur[k] = (parseInt(cur[k]) || 0) + (parseInt(delta[k]) || 0);
  });
  Object.keys(cur).forEach(k => { if (!cur[k]) delete cur[k]; });
  saveInventoryDeltas(cur);
}

export async function flushInventoryDeltas() {
  const deltas = getInventoryDeltas();
  if (!deltas || Object.keys(deltas).length === 0) return true;
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { data, error } = await client.from('lab_inventory').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return false;
    const num = v => {
      const n = parseInt(v);
      return isNaN(n) || n < 0 ? 0 : n;
    };
    const reconciled = {
      id: 1,
      purple_stock: Math.max(0, num(data.purple_stock) + (parseInt(deltas.purple) || 0)),
      red_stock: Math.max(0, num(data.red_stock) + (parseInt(deltas.red) || 0)),
      typhoid_stock: Math.max(0, num(data.typhoid_stock) + (parseInt(deltas.typhoid) || 0)),
      malaria_stock: Math.max(0, num(data.malaria_stock) + (parseInt(deltas.malaria) || 0)),
      dengue_stock: Math.max(0, num(data.dengue_stock) + (parseInt(deltas.dengue) || 0)),
      updated_at: new Date().toISOString()
    };
    const { error: upErr } = await client.from('lab_inventory').upsert(reconciled);
    if (upErr) {
      console.warn('Inventory delta flush failed:', upErr.message);
      return false;
    }
    writeLocalInventoryCounts({
      purple: reconciled.purple_stock,
      red: reconciled.red_stock,
      typhoid: reconciled.typhoid_stock,
      malaria: reconciled.malaria_stock,
      dengue: reconciled.dengue_stock
    });
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_INVENTORY_DELTAS);
    } catch (e) {}
    refreshInventoryUI();
    return true;
  } catch (err) {
    console.warn('Network error flushing inventory deltas:', err);
    return false;
  }
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('online', () => {
    flushInventoryDeltas().catch(e => console.warn('Inventory delta flush error:', e));
  });
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
      .channel('public:lab_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports' }, (payload) => {
        console.log('Cloud change detected from another device:', payload ? payload.eventType : 'event');
        if (payload) {
          // If a DELETE or soft-delete event is received, immediately record tombstone locally
          if (payload.eventType === 'DELETE' && payload.old && payload.old.id) {
            addTombstone(String(payload.old.id));
          } else if (payload.new && (payload.new.is_deleted === true || (payload.new.data && payload.new.data.is_deleted === true))) {
            addTombstone(String(payload.new.id));
          }
        }
        syncReportsFromCloud(callbacks);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_inventory' }, (payload) => {
        if (payload && payload.new) handleRemoteInventoryUpdate(payload.new);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Supabase realtime subscribed successfully.');
          (async () => {
            try {
              const pending = getInventoryDeltas();
              if (pending && Object.keys(pending).length > 0) await flushInventoryDeltas();
              else await fetchCloudInventory();
            } catch (e) {
              console.warn('Inventory snapshot fetch error:', e);
            }
          })();
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
