/* Centralises localStorage keys and Supabase Cloud sync */
import { getSupabaseClient } from '../config/supabase-config.js';

export const STORAGE_KEYS = {
  HISTORY: 'labReportsHistory',
  GLOBAL_SERIAL: 'globalHistorySerial',
  PURPLE_TUBE: 'purpleTubeCount',
  RED_TUBE: 'redTubeCount',
  TYPHOID_KIT: 'typhoidKitCount',
  MALARIA_KIT: 'malariaKitCount'
};
export const SESSION_KEYS = { CURRENT_PATIENT_ID: 'currentPatientId' };

export function loadHistoryData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
  } catch (e) {
    console.error('storage load failed', e);
    return [];
  }
}
export function saveHistoryData(history) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
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
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
      badge = document.createElement('div');
      badge.id = 'cloudStatusBadge';
      badge.className = 'cloud-status-badge';
      logoContainer.appendChild(badge);
    }
  }
  if (badge) {
    badge.setAttribute('data-status', status);
    badge.innerHTML = text;
    badge.title = status === 'connected' 
      ? 'Connected to Supabase Cloud - reports sync across all devices' 
      : 'Working locally in browser';
  }
}

export async function syncReportToCloud(reportItem) {
  const client = getSupabaseClient();
  if (!client || !reportItem) return;
  try {
    const { error } = await client.from('lab_reports').upsert({
      id: reportItem.id,
      serial: reportItem.serial,
      patient_id: reportItem.patientId || '',
      patient_name: reportItem.patientName || '',
      reported_date: reportItem.reportedDate || '',
      data: reportItem
    });
    if (error) {
      console.warn('Cloud sync error for report:', error.message);
    } else {
      updateCloudStatusBadge('connected', '🟢 Cloud Synced');
    }
  } catch (err) {
    console.warn('Network error syncing report to cloud:', err);
  }
}

export async function deleteReportFromCloud(id) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client
      .from('lab_reports')
      .delete()
      .eq('id', parseInt(id));
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
  if (isSyncing) return;
  isSyncing = true;
  try {
    const { data, error } = await client
      .from('lab_reports')
      .select('data')
      .order('serial', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      updateCloudStatusBadge('offline', '🟡 Local Mode');
      isSyncing = false;
      return;
    }

    updateCloudStatusBadge('connected', '🟢 Cloud Synced');

    if (data) {
      const cloudReports = data.map(row => {
        const r = row.data;
        if (r) r._synced = true;
        return r;
      }).filter(Boolean);

      const localReports = loadHistoryData();
      const offlineReports = localReports.filter(r => r && r._synced === false);
      for (const offItem of offlineReports) {
        await syncReportToCloud(offItem);
        cloudReports.unshift(offItem);
      }

      cloudReports.sort((a, b) => (b.serial || 0) - (a.serial || 0));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(cloudReports));

      const maxSerial = cloudReports.reduce((max, r) => Math.max(max, r.serial || 0), 0);
      if (maxSerial > getGlobalSerial()) {
        setGlobalSerial(maxSerial);
      }

      if (callbacks.onUpdate) {
        try { callbacks.onUpdate(); } catch (cbErr) { console.warn('Sync onUpdate non-critical warning:', cbErr); }
      }
    }
  } catch (err) {
    console.warn('Error during cloud sync:', err);
    updateCloudStatusBadge('offline', '🟡 Local Mode');
  } finally {
    isSyncing = false;
  }
}

export function initRealtimeSync(callbacks = {}, retryCount = 0) {
  const client = getSupabaseClient();
  if (!client) {
    if (retryCount < 10) {
      setTimeout(() => initRealtimeSync(callbacks, retryCount + 1), 400);
    }
    return;
  }
  try {
    client
      .channel('public:lab_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports' }, () => {
        syncReportsFromCloud(callbacks);
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription error:', err);
  }
}
