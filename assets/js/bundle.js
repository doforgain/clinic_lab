/**
 * SHAMS HEALTH CARE - Lab Report Generator
 * Universal Bundle (Supports both file:/// local execution & HTTP servers)
 * Generated automatically from modular architecture in assets/js/
 * 
 * To rebuild after editing source modules:
 *   node scripts/build-bundle.js
 */
(function () {
  'use strict';

  /* ===== Module: assets/js/config/auth-config.js ===== */
  /**
   * SHAMS HEALTH CARE - OPERATIONAL ACCESS CONFIGURATION
   * 
   * IMPORTANT SECURITY NOTE:
   * These credentials and PINs serve as UI OPERATIONAL PRIVACY LOCKS for single-workstation
   * clinic workflows (preventing walk-in patients or casual observers from viewing financial 
   * collections and sensitive history over the counter). They are NOT cryptographic security
   * boundaries. True data security for cloud synchronization is enforced at the database level 
   * via Supabase Row-Level Security (RLS) policies.
   */
  
  const STAFF_USERNAME = 'staff124';
  const STAFF_PASSWORD = 'admin124';
  const AUTH_SESSION_KEY = 'shc_auth_session';
  
  const INVENTORYUPDATE_PASSWORD = '9211';
  const COLLECTION_PASSWORD = 'admin1';

  /* ===== Module: assets/js/config/test-constants.js ===== */
  /* Extracted from index.html L1673-2013 (createReportHTML) — reference ranges single source of truth.
   * Parity with reference/index.legacy.html. Fixes v1 gap: ranges were buried in template. */
  
  const TEST_TYPES = ['cbc','esr','typhi','dengue','malaria','widal','bloodGroup','bilirubin','crp'];
  
  // index.html L1707-1725
  const CBC_PARAMS = [
    { id: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', maleRef: '13.5-17.5', femaleRef: '12.0-15.0' },
    { id: 'tlc', name: 'Total Leucocyte Count', unit: 'cells/cumm', ref: '4000-11000' },
    { id: 'neutrophils', name: 'Neutrophils', unit: '%', ref: '40-75' },
    { id: 'lymphocytes', name: 'Lymphocytes', unit: '%', ref: '20-40' },
    { id: 'mid', name: 'Mid', unit: '%', ref: '3-9' },
    { id: 'absoluteNeutrophils', name: 'Absolute Neutrophils', unit: 'cells/cumm', ref: '2000-7000' },
    { id: 'absoluteLymphocytes', name: 'Absolute Lymphocytes', unit: 'cells/cumm', ref: '1000-3500' },
    { id: 'absoluteMid', name: 'Absolute Mid', unit: 'cells/cumm', ref: '200-800' },
    { id: 'rbcCount', name: 'RBC Count', unit: 'million/cumm', maleRef: '4.5-5.5', femaleRef: '4.0-5.0' },
    { id: 'pcv', name: 'PCV', unit: '%', maleRef: '40-50', femaleRef: '40-50' },
    { id: 'mcv', name: 'MCV', unit: 'fL', ref: '80-100' },
    { id: 'mch', name: 'MCH', unit: 'pg', ref: '27-32' },
    { id: 'mchc', name: 'MCHC', unit: 'g/dL', ref: '31.5-36' },
    { id: 'platelet', name: 'Platelet Count', unit: 'lakhs/cumm', ref: '1.50-4.50' }
  ];
  
  // index.html L1800-1805
  const WIDAL_PARAMS = [
    { id: 'oAntigen', name: 'O Antigen' },
    { id: 'hAntigen', name: 'H Antigen' },
    { id: 'ahAntigen', name: 'AH Antigen' },
    { id: 'bhAntigen', name: 'BH Antigen' }
  ];
  const WIDAL_CUTOFF = '< 1:80';
  function isWidalPositive(value) {
    if (!value) return false;
    const str = String(value).trim();
    const positiveTitres = ['1:160', '1:320', '1:640', '1:1280'];
    return positiveTitres.some(titre => {
      const regex = new RegExp(`(^|[^0-9])${titre.replace(':', '\\:')}([^0-9]|$)`);
      return regex.test(str);
    });
  }
  
  const ESR_REF = { unit: 'mm/hr', max: 20, display: '0-20' };
  
  const BILIRUBIN_REF = {
    total: { display: '0.3-1.2', max: 1.2 },
    direct: { display: '0.1-0.3', max: 0.3 },
    indirect: { display: '0.2-0.8', max: 0.8 }
  };
  
  // index.html L1917-1935 CRP tiers
  function crpTier(numValue) {
    if (typeof numValue !== 'number' || Number.isNaN(numValue)) {
      return { statusClass: '', refRange: '<10 (Normal)' };
    }
    if (numValue < 10) return { statusClass: 'normal', refRange: '<10 (Normal)' };
    if (numValue < 20) return { statusClass: 'elevated', refRange: '10-20 (Elevated)' };
    if (numValue <= 50) return { statusClass: 'high', refRange: '20-50 (High)' };
    return { statusClass: 'veryhigh', refRange: '>50 (Very High)' };
  }
  
  function refRangeFor(param, patientGender) {
    if (!param) return '';
    if (param.ref) return param.ref;
    const g = String(patientGender || '').trim().toLowerCase();
    if (g === 'male' || g === 'm') return param.maleRef || '';
    if (g === 'female' || g === 'f') return param.femaleRef || '';
    if (param.maleRef && param.femaleRef) {
      const min = param.femaleRef.split('-')[0];
      const max = param.maleRef.split('-')[1];
      return `${min}-${max}`;
    }
    return param.maleRef || param.femaleRef || '';
  }
  
  function isAbnormalByRange(value, rangeStr) {
    if (!rangeStr || value === '' || value === null || value === undefined) return false;
    const v = parseFloat(value);
    if (Number.isNaN(v)) return false;
    const [min, max] = rangeStr.split('-').map(Number);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    return v < min || v > max;
  }

  /* ===== Module: assets/js/config/pricing-config.js ===== */
  /* Extracted from index.html L1008-1056 (updateSuggestedCost). Pure + DOM wrapper split. */
  
  const PRICES = {
    cbc: 200,
    esr: 100,
    typhi: 100,
    dengue: 400,
    malaria: 100,
    widal: 100,
    bloodGroup: 100,
    bilirubin: 200,
    crp: 250
  };
  
  // Cumulative combo pricing: applies combo discount for fever packages and adds any extra panels (Bilirubin, CRP, Dengue, etc.)
  function computeSuggestedCost(t) {
    if (!t || typeof t !== 'object') return 0;
    const cbc = !!t.cbc;
    const esr = !!t.esr;
    const typhi = !!t.typhi;
    const dengue = !!t.dengue;
    const malaria = !!t.malaria;
    const widal = !!t.widal;
    const bloodGroup = !!t.bloodGroup;
    const bilirubin = !!t.bilirubin;
    const crp = !!t.crp;
  
    let comboBase = 0;
    const covered = { cbc: false, typhi: false, malaria: false, widal: false };
  
    // Combo 1 & 2: CBC + Malaria + Typhoid (Typhi or Widal) -> ₹300 bundle
    if (cbc && (typhi || widal) && malaria) {
      comboBase = 300;
      covered.cbc = true;
      covered.malaria = true;
      if (typhi) covered.typhi = true;
      else covered.widal = true;
    }
    // Combo 3, 4, 5: CBC + one of (Typhi, Widal, Malaria) -> ₹250 bundle
    else if (cbc && (typhi || widal || malaria)) {
      comboBase = 250;
      covered.cbc = true;
      if (typhi) covered.typhi = true;
      else if (widal) covered.widal = true;
      else if (malaria) covered.malaria = true;
    }
  
    let total = comboBase;
    if (!covered.cbc && cbc) total += PRICES.cbc;
    if (!covered.typhi && typhi) total += PRICES.typhi;
    if (!covered.malaria && malaria) total += PRICES.malaria;
    if (!covered.widal && widal) total += PRICES.widal;
    if (esr) total += PRICES.esr;
    if (dengue) total += PRICES.dengue;
    if (bloodGroup) total += PRICES.bloodGroup;
    if (bilirubin) total += PRICES.bilirubin;
    if (crp) total += PRICES.crp;
  
    return total;
  }
  
  // DOM wrapper — updates suggested cost in UI
  function updateSuggestedCost() {
    const t = {
      cbc: document.getElementById('testCBC') ? document.getElementById('testCBC').checked : false,
      esr: document.getElementById('testESR') ? document.getElementById('testESR').checked : false,
      typhi: document.getElementById('testTyphi') ? document.getElementById('testTyphi').checked : false,
      dengue: document.getElementById('testDengue') ? document.getElementById('testDengue').checked : false,
      malaria: document.getElementById('testMalaria') ? document.getElementById('testMalaria').checked : false,
      widal: document.getElementById('testWidal') ? document.getElementById('testWidal').checked : false,
      bloodGroup: document.getElementById('testBloodGroup') ? document.getElementById('testBloodGroup').checked : false,
      bilirubin: document.getElementById('testBilirubin') ? document.getElementById('testBilirubin').checked : false,
      crp: document.getElementById('testCRP') ? document.getElementById('testCRP').checked : false
    };
    const costEl = document.getElementById('testCost');
    if (costEl) costEl.value = computeSuggestedCost(t);
  }

  /* ===== Module: assets/js/config/supabase-config.js ===== */
  const SUPABASE_CONFIG = {
    url: 'https://ufiquhjvlcqvfamdhxin.supabase.co',
    anonKey: 'sb_publishable_UJnX0-JZIlGfKMpwT2Q5_Q_tiTzL6Yd'
  };
  
  let _client = null;
  
  function getSupabaseClient() {
    if (!_client && typeof window !== 'undefined' && window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
      try {
        _client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      } catch (e) {
        console.warn('Supabase initialization failed:', e);
      }
    }
    return _client;
  }
  
  /**
   * Check if active authenticated Supabase session exists.
   * Returns null in local offline mode or if unauthenticated.
   */
  async function getCloudAuthSession() {
    const client = getSupabaseClient();
    if (!client || !client.auth) return null;
    try {
      const { data } = await client.auth.getSession();
      return data ? data.session : null;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Authenticate staff with Supabase for cloud sync mode under tightened RLS.
   */
  async function signInCloudStaff(email, password) {
    const client = getSupabaseClient();
    if (!client || !client.auth) return { success: false, error: 'Supabase client not available' };
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, session: data.session };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }
  
  /**
   * Sign out from cloud sync session, reverting to local-only offline mode.
   */
  async function signOutCloudStaff() {
    const client = getSupabaseClient();
    if (!client || !client.auth) return;
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Error signing out from Supabase:', e);
    }
  }

  /* ===== Module: assets/js/state/storage.js ===== */
  /* Centralises localStorage keys and Supabase Cloud sync */
  
  const STORAGE_KEYS = {
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
  const SESSION_KEYS = { CURRENT_PATIENT_ID: 'currentPatientId' };
  
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
  
  function getDeletedReportIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_IDS)) || [];
    } catch (e) {
      return [];
    }
  }
  
  function addTombstone(id) {
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
  
  function loadHistoryData() {
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
          if (item.guardianName && (typeof item.guardianName !== 'string' || item.guardianName === '[object Object]')) {
            item.guardianName = '';
          }
          return item;
        });
    } catch (e) {
      console.error('storage load failed', e);
      return [];
    }
  }
  
  function saveHistoryData(history) {
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
  
  function getGlobalSerial() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.GLOBAL_SERIAL) || '0');
  }
  function setGlobalSerial(n) {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SERIAL, String(n));
  }
  
  function updateCloudStatusBadge(status, text) {
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
  
  async function syncReportToCloud(reportItem) {
    const client = getSupabaseClient();
    if (!client || !reportItem) return;
    const strId = String(reportItem.id);
    const tombstones = new Set(getDeletedReportIds().map(String));
    if (tombstones.has(strId) || reportItem.is_deleted === true) return;
  
    const numericId = /^\d+$/.test(strId) ? Number(strId) : strId;
  
    if (reportItem.guardianName && (typeof reportItem.guardianName !== 'string' || reportItem.guardianName === '[object Object]')) {
      reportItem.guardianName = '';
    }
  
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
  
  async function deleteReportFromCloud(id) {
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
  async function syncReportsFromCloud(callbacks = {}, retryCount = 0) {
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
              if (r.guardianName && (typeof r.guardianName !== 'string' || r.guardianName === '[object Object]')) {
                r.guardianName = '';
              }
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
  
  function handleRemoteInventoryUpdate(row) {
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
  
  async function fetchCloudInventory() {
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
  
  async function pushCloudInventory() {
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
  
  function getInventoryDeltas() {
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
  
  function queueInventoryDeltas(delta) {
    if (!delta || typeof delta !== 'object') return;
    const cur = getInventoryDeltas();
    DELTA_FIELDS.forEach(k => {
      cur[k] = (parseInt(cur[k]) || 0) + (parseInt(delta[k]) || 0);
    });
    Object.keys(cur).forEach(k => { if (!cur[k]) delete cur[k]; });
    saveInventoryDeltas(cur);
  }
  
  async function flushInventoryDeltas() {
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
  
  function initRealtimeSync(callbacks = {}, retryCount = 0) {
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
  
  function unsubscribeRealtime() {
    if (_realtimeChannel) {
      try {
        const client = getSupabaseClient();
        if (client) client.removeChannel(_realtimeChannel);
      } catch (e) {}
      _realtimeChannel = null;
    }
  }

  /* ===== Module: assets/js/state/app-state.js ===== */
  /* NEW in v2 — owns globals from index.html L571-572 + L2028-2039.
   * Breaks report-actions <-> history cycle by owning toggleGenerateUpdateButton (was L880-895). */
  
  const appState = {
    isEditing: false,
    currentEditingId: null,
    lastGeneratedReportId: null,
    currentPreviewHistoryId: null,
    currentFilters: {
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      testType: '',
      paymentMode: '',
      minCost: '',
      maxCost: '',
      gender: '',
      ageFrom: '',
      ageTo: ''
    }
  };
  
  function getAppState() { return appState; }
  function setEditing(isEditMode, reportId = null) {
    appState.isEditing = !!isEditMode;
    appState.currentEditingId = reportId;
  }
  function setLastGeneratedReportId(id) {
    appState.lastGeneratedReportId = id;
  }
  function getLastGeneratedReportId() {
    return appState.lastGeneratedReportId;
  }
  function setCurrentPreviewHistoryId(id) {
    appState.currentPreviewHistoryId = id;
  }
  function getCurrentPreviewHistoryId() {
    return appState.currentPreviewHistoryId;
  }
  function getCurrentFilters() { return appState.currentFilters; }
  function setCurrentFilters(patch) {
    Object.assign(appState.currentFilters, patch);
  }
  function resetCurrentFilters() {
    appState.currentFilters = {
      searchTerm: '', dateFrom: '', dateTo: '', testType: '', paymentMode: '',
      minCost: '', maxCost: '', gender: '', ageFrom: '', ageTo: ''
    };
  }
  
  // Moved from report-builder (v2 delta to break cycle): L880-895 identical behaviour
  function toggleGenerateUpdateButton(isEditMode = false, reportId = null) {
    const generateBtn = document.getElementById('generateReport');
    const updateBtn = document.getElementById('updateReport');
    const isPreview = document.body.classList.contains('report-preview-active') ||
      (document.getElementById('reportOutput') && document.getElementById('reportOutput').style.display === 'block');
  
    if (isEditMode) {
      if (generateBtn) generateBtn.style.display = 'none';
      if (updateBtn) updateBtn.style.display = isPreview ? 'none' : 'block';
      setEditing(true, reportId);
    } else {
      if (generateBtn) generateBtn.style.display = isPreview ? 'none' : 'block';
      if (updateBtn) updateBtn.style.display = 'none';
      setEditing(false, null);
    }
  }

  /* ===== Module: assets/js/state/inventory-state.js ===== */
  /* Extracted from index.html L732-877. Identical behaviour. Dead stubs deleted per v2. */
  
  /* Originating-device write-through (Inventory Plan Phase 3): every local
   * consumption/restock mutation pushes to cloud when online, or queues a
   * relative delta when offline. Remote devices never call these — they apply
   * realtime broadcasts via handleRemoteInventoryUpdate. */
  let _writeThroughTimer = null;
  let _pendingDeltas = {};
  
  function writeThroughInventory(delta) {
    try {
      if (!getSupabaseClient()) return; // pure local mode, nothing to sync
      if (delta && typeof delta === 'object') {
        Object.keys(delta).forEach(k => {
          _pendingDeltas[k] = (_pendingDeltas[k] || 0) + (parseInt(delta[k]) || 0);
        });
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (delta) queueInventoryDeltas(delta);
        return;
      }
      // Coalesce rapid mutations (e.g. decrementTube followed immediately by decrementKits)
      if (_writeThroughTimer) clearTimeout(_writeThroughTimer);
      _writeThroughTimer = setTimeout(() => {
        _writeThroughTimer = null;
        const batchedDelta = { ..._pendingDeltas };
        _pendingDeltas = {};
        pushCloudInventory().then(ok => {
          if (!ok && Object.keys(batchedDelta).length > 0) queueInventoryDeltas(batchedDelta);
        }).catch(() => {
          try { if (Object.keys(batchedDelta).length > 0) queueInventoryDeltas(batchedDelta); } catch (e) {}
        });
      }, 50);
    } catch (e) {}
  }
  
  function getTubeCounts() {
    return {
      purple: parseInt(localStorage.getItem(STORAGE_KEYS.PURPLE_TUBE) || '0'),
      red: parseInt(localStorage.getItem(STORAGE_KEYS.RED_TUBE) || '0')
    };
  }
  function setTubeCounts(purple, red) {
    localStorage.setItem(STORAGE_KEYS.PURPLE_TUBE, purple.toString());
    localStorage.setItem(STORAGE_KEYS.RED_TUBE, red.toString());
  }
  
  function decrementTube(tubeUsed) {
    const tubeCounts = getTubeCounts();
    if (tubeUsed === 'Purple') {
      if (tubeCounts.purple > 0) { setTubeCounts(tubeCounts.purple - 1, tubeCounts.red); writeThroughInventory({ purple: -1 }); }
      else alert('Warning: No purple (EDTA) tubes left in inventory!');
    } else if (tubeUsed === 'Red') {
      if (tubeCounts.red > 0) { setTubeCounts(tubeCounts.purple, tubeCounts.red - 1); writeThroughInventory({ red: -1 }); }
      else alert('Warning: No red (plain) tubes left in inventory!');
    }
  }
  function incrementTube(tubeUsed) {
    const tubeCounts = getTubeCounts();
    if (tubeUsed === 'Purple') { setTubeCounts(tubeCounts.purple + 1, tubeCounts.red); writeThroughInventory({ purple: 1 }); }
    else if (tubeUsed === 'Red') { setTubeCounts(tubeCounts.purple, tubeCounts.red + 1); writeThroughInventory({ red: 1 }); }
  }
  function getKitCounts() {
    return {
      typhoid: parseInt(localStorage.getItem(STORAGE_KEYS.TYPHOID_KIT) || '0'),
      malaria: parseInt(localStorage.getItem(STORAGE_KEYS.MALARIA_KIT) || '0'),
      dengue: parseInt(localStorage.getItem(STORAGE_KEYS.DENGUE_KIT) || '0')
    };
  }
  function setKitCounts(typhoid, malaria, dengue = getKitCounts().dengue) {
    localStorage.setItem(STORAGE_KEYS.TYPHOID_KIT, typhoid.toString());
    localStorage.setItem(STORAGE_KEYS.MALARIA_KIT, malaria.toString());
    localStorage.setItem(STORAGE_KEYS.DENGUE_KIT, dengue.toString());
  }
  function decrementKits(tests) {
    const kitCounts = getKitCounts();
    let updated = false;
    const delta = {};
    if (tests.typhi) {
      if (kitCounts.typhoid > 0) { kitCounts.typhoid--; updated = true; delta.typhoid = -1; }
      else alert('⚠️ WARNING: No Typhoid test kits left in inventory!');
    }
    if (tests.malaria) {
      if (kitCounts.malaria > 0) { kitCounts.malaria--; updated = true; delta.malaria = -1; }
      else alert('⚠️ WARNING: No Malaria test kits left in inventory!');
    }
    if (tests.dengue) {
      if (kitCounts.dengue > 0) { kitCounts.dengue--; updated = true; delta.dengue = -1; }
      else alert('⚠️ WARNING: No Dengue test kits left in inventory!');
    }
    if (updated) { setKitCounts(kitCounts.typhoid, kitCounts.malaria, kitCounts.dengue); writeThroughInventory(delta); }
  }
  function incrementKits(tests) {
    const kitCounts = getKitCounts();
    let updated = false;
    const delta = {};
    if (tests.typhi) { kitCounts.typhoid++; updated = true; delta.typhoid = 1; }
    if (tests.malaria) { kitCounts.malaria++; updated = true; delta.malaria = 1; }
    if (tests.dengue) { kitCounts.dengue++; updated = true; delta.dengue = 1; }
    if (updated) { setKitCounts(kitCounts.typhoid, kitCounts.malaria, kitCounts.dengue); writeThroughInventory(delta); }
  }
  function adjustKitsForEdit(oldTests, newTests) {
    if (!oldTests.typhi && newTests.typhi) decrementKits({ typhi: true });
    if (!oldTests.malaria && newTests.malaria) decrementKits({ malaria: true });
    if (!oldTests.dengue && newTests.dengue) decrementKits({ dengue: true });
    if (oldTests.typhi && !newTests.typhi) incrementKits({ typhi: true });
    if (oldTests.malaria && !newTests.malaria) incrementKits({ malaria: true });
    if (oldTests.dengue && !newTests.dengue) incrementKits({ dengue: true });
  }

  /* ===== Module: assets/js/utils/date-helpers.js ===== */
  /* Extracted from index.html L575-581,584-588,649-664,667-677. Pure, no DOM. */
  
  // L575
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // L584
  function getCurrentMonthName() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  }
  
  // L649
  function formatTimeDifference(timestamp) {
    const reportTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - reportTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }
  
  // L667
  function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatLabDate(dateString) {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateString;
  }

  /* ===== Module: assets/js/utils/patient-id.js ===== */
  function generatePatientId() {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
    const currentYear = currentDate.getFullYear();
    const prefix = `${currentMonth}-${currentYear}-`;
    const history = loadHistoryData();
    let maxSerial = 0;
    history.forEach(item => {
      if (item && item.patientId && String(item.patientId).toUpperCase().startsWith(prefix)) {
        const parts = String(item.patientId).split('-');
        if (parts.length >= 3) {
          const serial = parseInt(parts[2], 10);
          if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
        }
      }
    });
    let nextSerial = maxSerial + 1;
    let candidateId = `${prefix}${nextSerial.toString().padStart(4, '0')}`;
    while (isPatientIdExists(candidateId)) {
      nextSerial++;
      candidateId = `${prefix}${nextSerial.toString().padStart(4, '0')}`;
    }
    return candidateId;
  }
  
  function isPatientIdExists(patientId, excludeId = null) {
    const history = loadHistoryData();
    return history.some(item => {
      if (!item) return false;
      if (excludeId && String(item.id) === String(excludeId)) return false;
      return item.patientId === patientId;
    });
  }
  
  // Legacy DOM wrapper (L711): reads #patientId, toggles #patientIdWarning.
  // excludeId defaults to app-state currentEditingId for parity with global.
  function validatePatientId(excludeId = null) {
    const id = excludeId !== null ? excludeId : getAppState().currentEditingId;
    const patientId = document.getElementById('patientId').value;
    const warningElement = document.getElementById('patientIdWarning');
    if (isPatientIdExists(patientId, id)) {
      warningElement.classList.remove('is-hidden');
      warningElement.style.display = 'block';
      return false;
    } else {
      warningElement.classList.add('is-hidden');
      warningElement.style.display = 'none';
      return true;
    }
  }

  /* ===== Module: assets/js/utils/dom-helpers.js ===== */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ===== Module: assets/js/calculators/cbc-calculator.js ===== */
  /* Extracted from index.html L898-959. Pure cores + legacy DOM wrappers (identical behaviour). */
  
  
  
  // DOM wrapper L898-904
  function calculateIndirectBilirubin() {
    const total = parseFloat(document.getElementById('totalBilirubin').value) || 0;
    const direct = parseFloat(document.getElementById('directBilirubin').value) || 0;
    const indirect = total - direct;
    document.getElementById('indirectBilirubin').value = indirect >= 0 ? indirect.toFixed(2) : '';
  }
  
  // Pure cores for CBC
  const CBC_DECIMAL_FIELD_IDS = [
    'hemoglobin',
    'neutrophils',
    'lymphocytes',
    'mid',
    'rbcCount',
    'mcv',
    'pcv',
    'mch',
    'mchc'
  ];
  
  function formatPointValue(val) {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str === '') return '';
    const num = parseFloat(str);
    if (isNaN(num)) return str;
    if (!str.includes('.')) {
      return num.toFixed(1);
    }
    if (str.endsWith('.')) {
      return str + '0';
    }
    return str;
  }
  
  function formatPlateletValue(val) {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str === '') return '';
    const num = parseFloat(str);
    if (isNaN(num)) return str;
  
    // If user already wrote decimal value (e.g. 1.45, 0.83, 2.5), leave it as is
    if (str.includes('.')) {
      if (str.endsWith('.')) return str + '0';
      return str;
    }
  
    // If user entered without decimal (e.g. 5000 -> 0.05, 145 -> 1.45, 83 -> 0.83, 250 -> 2.50)
    if (num >= 1000) {
      return (num / 100000).toFixed(2);
    } else if (num >= 10) {
      return (num / 100).toFixed(2);
    } else if (num > 0) {
      return num.toFixed(2);
    }
    return str;
  }
  
  function formatCBCDecimalInputs() {
    CBC_DECIMAL_FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value !== '') {
        el.value = formatPointValue(el.value);
      }
    });
    const plateletEl = document.getElementById('platelet');
    if (plateletEl && plateletEl.value !== '') {
      plateletEl.value = formatPlateletValue(plateletEl.value);
    }
  }
  
  
  
  // DOM wrapper L907-959 — byte-behaviour identical to legacy
  function calculateCBCParameters() {
    const hemoglobin = parseFloat(document.getElementById('hemoglobin').value) || 0;
    const tlc = parseFloat(document.getElementById('tlc').value) || 0;
    const neutrophils = parseFloat(document.getElementById('neutrophils').value) || 0;
    const lymphocytes = parseFloat(document.getElementById('lymphocytes').value) || 0;
    const mid = parseFloat(document.getElementById('mid').value) || 0;
    const rbcCount = parseFloat(document.getElementById('rbcCount').value) || 0;
    const mcv = parseFloat(document.getElementById('mcv').value) || 0;
    let pcv = parseFloat(document.getElementById('pcv').value) || 0;
  
    if (tlc > 0) {
      document.getElementById('absoluteNeutrophils').value = neutrophils > 0 ? Math.round((tlc * neutrophils) / 100) : '';
      document.getElementById('absoluteLymphocytes').value = lymphocytes > 0 ? Math.round((tlc * lymphocytes) / 100) : '';
      document.getElementById('absoluteMid').value = mid > 0 ? Math.round((tlc * mid) / 100) : '';
    }
    if (rbcCount > 0 && mcv > 0) {
      pcv = (rbcCount * mcv) / 10;
      document.getElementById('pcv').value = pcv.toFixed(1);
    }
    if (hemoglobin > 0 && rbcCount > 0) {
      document.getElementById('mch').value = ((hemoglobin / rbcCount) * 10).toFixed(1);
    } else {
      document.getElementById('mch').value = '';
    }
    if (hemoglobin > 0 && pcv > 0) {
      document.getElementById('mchc').value = ((hemoglobin / pcv) * 100).toFixed(1);
    } else {
      document.getElementById('mchc').value = '';
    }
  }

  /* ===== Module: assets/js/calculators/cost-calculator.js ===== */
  function readHistory() {
    return loadHistoryData();
  }
  
  function sumWhere(pred) {
    let total = 0;
    readHistory().forEach(item => {
      if (pred(item) && item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
        total += parseFloat(item.testCost);
      }
    });
    return Number(total.toFixed(2));
  }
  
  // L1068
  function getTodayTotal() {
    const today = getTodayDate();
    return sumWhere(item => item.reportedDate === today);
  }
  // L1080
  function getTodayCashTotal() {
    const today = getTodayDate();
    return sumWhere(item => item.reportedDate === today && item.paymentMode === 'Cash');
  }
  // L1092
  function getTodayOnlineTotal() {
    const today = getTodayDate();
    return sumWhere(item => item.reportedDate === today && item.paymentMode === 'Online');
  }
  
  // L1059
  function updateTodayTotal() {
    const totalEl = document.getElementById('todayTotal');
    const dashTotal = document.getElementById('dashTodayTotal');
    if (!totalEl && !dashTotal) return;
    const total = getTodayTotal();
    const cash = getTodayCashTotal();
    const online = getTodayOnlineTotal();
    if (totalEl) totalEl.innerText = `₹${total.toFixed(2)}`;
    const cashEl = document.getElementById('todayCashTotal');
    if (cashEl) cashEl.innerText = `₹${cash.toFixed(2)}`;
    const onlineEl = document.getElementById('todayOnlineTotal');
    if (onlineEl) onlineEl.innerText = `₹${online.toFixed(2)}`;
  
    if (dashTotal) dashTotal.innerText = `₹${total.toFixed(2)}`;
    const dashCash = document.getElementById('dashTodayCash');
    if (dashCash) dashCash.innerText = `₹${cash.toFixed(2)}`;
    const dashOnline = document.getElementById('dashTodayOnline');
    if (dashOnline) dashOnline.innerText = `₹${online.toFixed(2)}`;
  }
  
  // Password modal controls for Today's Collection
  function openCollectionPasswordModal() {
    const modal = document.getElementById('collectionPasswordModal');
    const input = document.getElementById('collectionPasswordInput');
    const error = document.getElementById('collectionPasswordError');
    if (modal) {
      modal.style.display = 'flex';
      if (error) error.style.display = 'none';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
    }
  }
  
  function closeCollectionPasswordModal() {
    const modal = document.getElementById('collectionPasswordModal');
    const input = document.getElementById('collectionPasswordInput');
    const error = document.getElementById('collectionPasswordError');
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
    if (error) error.style.display = 'none';
  }
  
  function submitCollectionPassword() {
    const input = document.getElementById('collectionPasswordInput');
    const error = document.getElementById('collectionPasswordError');
    const content = document.getElementById('collectionContent');
    const btn = document.getElementById('toggleBtn');
    
    if (input && input.value === COLLECTION_PASSWORD) {
      if (content) content.classList.remove('blurred');
      if (btn) btn.textContent = '✔ Hide';
      closeCollectionPasswordModal();
    } else {
      if (error) error.style.display = 'block';
      if (input) {
        input.focus();
        input.select();
      }
    }
  }
  
  // L1272 — password gate for Today's Collection blur
  function toggleCollection() {
    const content = document.getElementById('collectionContent');
    const btn = document.getElementById('toggleBtn');
    if (content && content.classList.contains('blurred')) {
      openCollectionPasswordModal();
    } else if (content && btn) {
      content.classList.add('blurred');
      btn.textContent = '✖ Show';
    }
  }

  /* ===== Module: assets/js/services/duplicate-service.js ===== */
  function areTestsIdentical(tests1, tests2) {
    for (const testType of TEST_TYPES) {
      if (tests1[testType] !== tests2[testType]) return false;
    }
    return true;
  }
  
  function checkDuplicatePatient(patientName, patientAge, patientGender, tests) {
    try {
      const history = loadHistoryData();
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const recentReports = history
        .filter(item => {
          const reportTime = new Date(item.timestamp || item.reportedDate);
          return (
            item &&
            String(item.patientName || '').toLowerCase() === String(patientName || '').toLowerCase() &&
            item.patientAge === patientAge &&
            item.patientGender === patientGender &&
            (reportTime > thirtyMinutesAgo || history.length - history.slice().reverse().findIndex(r => r === item) <= 10)
          );
        })
        .slice(0, 10);
      if (recentReports.length === 0) return null;
      for (const report of recentReports) {
        if (report.tests && areTestsIdentical(report.tests, tests)) {
          return {
            isDuplicate: true,
            existingReport: report,
            message: `This patient already had the same tests done recently (${formatTimeDifference(report.timestamp || report.reportedDate)}).`
          };
        }
      }
      return { isDuplicate: false, message: "Different tests detected - allowing new report generation." };
    } catch (error) {
      console.error('Error checking duplicate patient:', error);
      return null;
    }
  }

  /* ===== Module: assets/js/services/pdf-service.js ===== */
  /* Extracted from index.html L2015-2025. */
  
  // One A4 sheet inside the 5mm @page margins declared in print.css.
  const PAGE_MARGIN_MM = 5;
  const PAGE_WIDTH_MM = 200;
  const PAGE_HEIGHT_MM = 286.5;
  
  // Adds a captured card to the PDF, slicing it when a single test section is
  // taller than one sheet (the paginator marks those cards .report-page--tall).
  function addCanvasPages(pdf, canvas) {
    const sliceHeight = Math.ceil(canvas.width * PAGE_HEIGHT_MM / PAGE_WIDTH_MM);
    for (let top = 0; top < canvas.height; top += sliceHeight) {
      const height = Math.min(sliceHeight, canvas.height - top);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = height;
      slice.getContext('2d').drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
      pdf.addPage();
      pdf.addImage(
        slice.toDataURL('image/jpeg', 0.98),
        'JPEG',
        PAGE_MARGIN_MM,
        PAGE_MARGIN_MM,
        PAGE_WIDTH_MM,
        PAGE_WIDTH_MM * height / canvas.width
      );
    }
  }
  
  function saveAsPDF() {
    const element = document.getElementById('reportOutput');
    if (!element) return;
  
    // Offline / CDN unavailable fallback (file:/// dual execution requirement)
    if (typeof window === 'undefined' || typeof window.html2pdf !== 'function') {
      alert('PDF export library is unavailable offline. Opening print dialog as fallback (select "Save as PDF").');
      window.print();
      return;
    }
  
    const patientIdEl = document.getElementById('patientId');
    const patientId = patientIdEl && patientIdEl.value ? patientIdEl.value.trim() : 'report';
    const filename = `lab_report_${patientId}.pdf`;
    const opt = {
      margin: PAGE_MARGIN_MM,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
  
    element.classList.add('is-exporting');
    const restore = () => element.classList.remove('is-exporting');
  
    // One capture per A4 card. Capturing the whole stack at once lets html2pdf
    // re-slice it at its own page height, which stretches cards or adds a page.
    const build = async () => {
      const cards = [...element.querySelectorAll('.report-page')];
      if (!cards.length) {
        // Legacy/unpaginated report: html2pdf slices the single capture itself.
        await window.html2pdf().set(opt).from(element).save();
        return;
      }
  
      const first = window.html2pdf().set(opt).from(cards[0]);
      await first.toPdf();
      const pdf = await first.get('pdf');
  
      for (const card of cards.slice(1)) {
        const worker = window.html2pdf().set(opt).from(card);
        await worker.toCanvas();
        addCanvasPages(pdf, await worker.get('canvas'));
      }
      pdf.save(filename);
    };
  
    return build().then(restore, err => {
      restore();
      console.warn('html2pdf generation failed, falling back to window.print():', err);
      window.print();
    });
  }

  /* ===== Module: assets/js/services/stats-service.js ===== */
  /* Extracted from index.html L725-729, L2571-2932. */
  
  // L725
  function getTodayReportCount() {
    const history = loadHistoryData();
    const today = getTodayDate();
    return history.filter(item => item && item.reportedDate === today && item.tests && typeof item.tests === 'object').length;
  }
  
  // L2571
  function calculateSearchStatistics(filteredHistory, filters) {
    try {
      const stats = {
        totalReports: filteredHistory.length, totalTests: 0,
        testBreakdown: { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 },
        totalCollection: 0, paymentBreakdown: { Cash: 0, Online: 0 },
        dateRange: filters.dateFrom && filters.dateTo ? `${formatDisplayDate(filters.dateFrom)} to ${formatDisplayDate(filters.dateTo)}` : 'All dates'
      };
      filteredHistory.forEach(item => {
        if (item.tests && typeof item.tests === 'object') {
          Object.keys(item.tests).forEach(test => {
            if (item.tests[test]) { stats.totalTests++; if (stats.testBreakdown[test] !== undefined) stats.testBreakdown[test]++; }
          });
        }
        if (item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) stats.totalCollection += parseFloat(item.testCost);
        if (item.paymentMode && stats.paymentBreakdown[item.paymentMode] !== undefined) stats.paymentBreakdown[item.paymentMode]++;
      });
      return stats;
    } catch (error) {
      console.error('Error calculating search statistics:', error);
      return { totalReports: 0, totalTests: 0, testBreakdown: {}, totalCollection: 0, paymentBreakdown: {}, dateRange: 'Error calculating statistics' };
    }
  }
  
  // L2636
  function getMonthlyTestStats() {
    const history = loadHistoryData();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let totalTests = 0, totalReports = 0;
    const testCounts = { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 };
    const todayCounts = { ...testCounts };
    const today = getTodayDate();
    history.forEach(item => {
      if (item && item.tests && typeof item.tests === 'object') {
        const dateParts = String(item.reportedDate || '').split('-');
        const reportYear = dateParts.length >= 2 ? parseInt(dateParts[0]) : NaN;
        const reportMonth = dateParts.length >= 2 ? parseInt(dateParts[1]) : NaN;
        if (reportYear === currentYear && reportMonth === currentMonth) {
          totalReports++;
          for (const test in item.tests) {
            if (item.tests[test]) { totalTests++; testCounts[test]++; if (item.reportedDate === today) todayCounts[test]++; }
          }
        }
      }
    });
    return { totalTests, totalReports, testCounts, todayCounts };
  }
  
  // L2679
  function updateTestStats() {
    const { todayCounts } = getMonthlyTestStats();
    if (document.getElementById('todayCBC')) {
      document.getElementById('todayCBC').innerText = `CBC: ${todayCounts.cbc}`;
      document.getElementById('todayESR').innerText = `ESR: ${todayCounts.esr}`;
      document.getElementById('todayTyphoid').innerText = `Typhoid: ${todayCounts.typhi}`;
      document.getElementById('todayDengue').innerText = `Dengue: ${todayCounts.dengue}`;
      document.getElementById('todayMalaria').innerText = `Malaria: ${todayCounts.malaria}`;
      document.getElementById('todayWidal').innerText = `Widal: ${todayCounts.widal}`;
      document.getElementById('todayBloodGroup').innerText = `Blood Group: ${todayCounts.bloodGroup}`;
      document.getElementById('todayBilirubin').innerText = `Bilirubin: ${todayCounts.bilirubin}`;
      document.getElementById('todayCRP').innerText = `CRP: ${todayCounts.crp}`;
      hideZeroTodayTests();
    }
  
    // Sync Dashboard Overview test chip counts
    const dashMap = {
      dashCBC: todayCounts.cbc,
      dashESR: todayCounts.esr,
      dashTyphoid: todayCounts.typhi,
      dashDengue: todayCounts.dengue,
      dashMalaria: todayCounts.malaria,
      dashWidal: todayCounts.widal,
      dashBloodGroup: todayCounts.bloodGroup,
      dashBilirubin: todayCounts.bilirubin,
      dashCRP: todayCounts.crp
    };
    Object.keys(dashMap).forEach(k => {
      const el = document.getElementById(k);
      if (el) el.innerText = dashMap[k];
    });
  }
  
  // L2695
  function hideZeroTodayTests() {
    const ids = ['todayCBC','todayESR','todayTyphoid','todayDengue','todayMalaria','todayWidal','todayBloodGroup','todayBilirubin','todayCRP'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) { const count = parseInt(el.innerText.split(':')[1].trim()); el.style.display = count > 0 ? '' : 'none'; }
    });
  }
  
  // L2710
  function updateTodayReportCount() {
    const reportCount = getTodayReportCount();
    const displayElement = document.getElementById('todayTestCount');
    if (displayElement) {
      const formatted = reportCount.toString().padStart(2, '0');
      displayElement.innerText = formatted;
      const parent = displayElement.closest('.header-test-counter');
      if (parent) parent.title = `Today's Reports Generated: ${formatted}`;
    }
    const dashTodayTests = document.getElementById('dashTodayTests');
    if (dashTodayTests) {
      dashTodayTests.innerText = reportCount.toString();
    }
  }
  
  // Password modal close kept for Escape handler (modal removed in multi-page split)
  function closeStatisticsPasswordModal() {
    const modal = document.getElementById('statisticsPasswordModal');
    const input = document.getElementById('statisticsPasswordInput');
    const error = document.getElementById('statisticsPasswordError');
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
    if (error) error.style.display = 'none';
  }
  
  function stockLowClass(n) {
    return n <= 10 ? ' low-stock' : '';
  }
  
  function renderStatistics() {
    updateTestStats();
    const history = loadHistoryData();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthName = getCurrentMonthName();
    let monthlyCollection = 0, monthlyCash = 0, monthlyOnline = 0, monthlyReports = 0;
    const testCounts = { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 };
    let purpleTubeUsage = 0, redTubeUsage = 0;
    history.forEach(item => {
      if (item && item.tests && typeof item.tests === 'object') {
        const dateParts = String(item.reportedDate || '').split('-');
        const reportYear = dateParts.length >= 2 ? parseInt(dateParts[0]) : NaN;
        const reportMonth = dateParts.length >= 2 ? parseInt(dateParts[1]) : NaN;
        if (reportYear === currentYear && reportMonth === currentMonth) {
          monthlyReports++;
          if (item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
            monthlyCollection += parseFloat(item.testCost);
            if (item.paymentMode === 'Cash') monthlyCash += parseFloat(item.testCost);
            else if (item.paymentMode === 'Online') monthlyOnline += parseFloat(item.testCost);
          }
          for (const test in item.tests) { if (item.tests[test] && testCounts[test] !== undefined) testCounts[test]++; }
          if (item.tubeUsed === 'Purple') purpleTubeUsage++;
          else if (item.tubeUsed === 'Red') redTubeUsage++;
        }
      }
    });
    const tubeCounts = getTubeCounts();
    const kitCounts = getKitCounts();
    const statContent = document.getElementById('statisticsContent');
    if (statContent) {
      statContent.innerHTML = `
        <!-- Monthly Financial KPI Summary Cards -->
        <div class="stats-kpi-grid">
          <div class="dash-card total">
            <div class="dash-card-icon">💰</div>
            <div class="dash-card-info">
              <div class="dash-label">${currentMonthName} Total Collection</div>
              <div class="dash-val">₹${monthlyCollection.toFixed(2)}</div>
            </div>
          </div>
          <div class="dash-card cash">
            <div class="dash-card-icon">💵</div>
            <div class="dash-card-info">
              <div class="dash-label">Cash Collection</div>
              <div class="dash-val">₹${monthlyCash.toFixed(2)}</div>
            </div>
          </div>
          <div class="dash-card online">
            <div class="dash-card-icon">📱</div>
            <div class="dash-card-info">
              <div class="dash-label">Online Payments</div>
              <div class="dash-val">₹${monthlyOnline.toFixed(2)}</div>
            </div>
          </div>
          <div class="dash-card tests">
            <div class="dash-card-icon">📋</div>
            <div class="dash-card-info">
              <div class="dash-label">Total Reports (${currentMonthName})</div>
              <div class="dash-val">${monthlyReports}</div>
            </div>
          </div>
        </div>
  
        <!-- Analytics Breakdown Panels -->
        <div class="stats-panels-grid">
          <div class="stats-panel-card">
            <div class="stats-panel-header">
              <h4><span>🧪</span> Diagnostic Tests Breakdown (${currentMonthName} ${currentYear})</h4>
            </div>
            <div class="dashboard-chips-grid stats-chips-grid">
              <div class="test-chip"><span>CBC:</span> <span class="chip-count">${testCounts.cbc}</span></div>
              <div class="test-chip"><span>ESR:</span> <span class="chip-count">${testCounts.esr}</span></div>
              <div class="test-chip"><span>Typhoid:</span> <span class="chip-count">${testCounts.typhi}</span></div>
              <div class="test-chip"><span>Dengue:</span> <span class="chip-count">${testCounts.dengue}</span></div>
              <div class="test-chip"><span>Malaria:</span> <span class="chip-count">${testCounts.malaria}</span></div>
              <div class="test-chip"><span>Widal:</span> <span class="chip-count">${testCounts.widal}</span></div>
              <div class="test-chip"><span>Blood Group:</span> <span class="chip-count">${testCounts.bloodGroup}</span></div>
              <div class="test-chip"><span>Bilirubin:</span> <span class="chip-count">${testCounts.bilirubin}</span></div>
              <div class="test-chip"><span>CRP:</span> <span class="chip-count">${testCounts.crp}</span></div>
            </div>
          </div>
  
          <div class="stats-panel-card">
            <div class="stats-panel-header">
              <h4><span>📦</span> Tube Consumption & Remaining Stock</h4>
            </div>
            <div class="stats-inventory-grid">
              <div class="inv-stat-item">
                <span class="inv-stat-label">🟣 Purple Tubes Used</span>
                <span class="inv-stat-val usage">${purpleTubeUsage}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🟣 Purple Tubes In Stock</span>
                <span class="inv-stat-val stock${stockLowClass(tubeCounts.purple)}">${tubeCounts.purple}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🔴 Red Tubes Used</span>
                <span class="inv-stat-val usage">${redTubeUsage}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🔴 Red Tubes In Stock</span>
                <span class="inv-stat-val stock${stockLowClass(tubeCounts.red)}">${tubeCounts.red}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🧪 Typhoid Kits Used</span>
                <span class="inv-stat-val usage">${testCounts.typhi}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🧪 Typhoid Kits In Stock</span>
                <span class="inv-stat-val stock${stockLowClass(kitCounts.typhoid)}">${kitCounts.typhoid}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🦟 Malaria Kits Used</span>
                <span class="inv-stat-val usage">${testCounts.malaria}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🦟 Malaria Kits In Stock</span>
                <span class="inv-stat-val stock${stockLowClass(kitCounts.malaria)}">${kitCounts.malaria}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🦠 Dengue Kits Used</span>
                <span class="inv-stat-val usage">${testCounts.dengue}</span>
              </div>
              <div class="inv-stat-item">
                <span class="inv-stat-label">🦠 Dengue Kits In Stock</span>
                <span class="inv-stat-val stock${stockLowClass(kitCounts.dengue)}">${kitCounts.dengue}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    const statsModal = document.getElementById('statisticsModal');
    if (statsModal) statsModal.style.display = 'block';
  }

  /* ===== Module: assets/js/services/search-service.js ===== */
  /* Extracted from index.html L1104-1139, L2097-2406. No import of history-service (cycle broken via hook). */
  
  // Hook set by app.js to break search<->history import cycle (behaviour identical to legacy direct call)
  let loadHistoryHook = null;
  function setLoadHistoryHook(fn) { loadHistoryHook = fn; }
  function callLoadHistory(filters) {
    if (loadHistoryHook) loadHistoryHook(filters);
  }
  
  // L1104
  function showAdvancedSearch() {
    document.getElementById('advancedSearchModal').style.display = 'block';
  }
  // Collects 9 inputs (pure part of L1108)
  function collectAdvancedFilters() {
    return {
      dateFrom: document.getElementById('searchDateFrom').value,
      dateTo: document.getElementById('searchDateTo').value,
      testType: document.getElementById('searchTestType').value,
      paymentMode: document.getElementById('searchPaymentMode').value,
      minCost: document.getElementById('searchMinCost').value,
      maxCost: document.getElementById('searchMaxCost').value,
      gender: document.getElementById('searchGender').value,
      ageFrom: document.getElementById('searchAgeFrom').value,
      ageTo: document.getElementById('searchAgeTo').value
    };
  }
  // L1108
  function applyAdvancedSearch() {
    const filters = collectAdvancedFilters();
    callLoadHistory(filters);
    document.getElementById('advancedSearchModal').style.display = 'none';
  }
  // L1125
  function resetAdvancedSearch() {
    ['searchDateFrom','searchDateTo','searchTestType','searchPaymentMode','searchMinCost','searchMaxCost','searchGender','searchAgeFrom','searchAgeTo'].forEach(id => { document.getElementById(id).value = ''; });
  }
  // L1137
  function closeAdvancedSearch() {
    document.getElementById('advancedSearchModal').style.display = 'none';
  }
  
  // L2097
  function applyAdvancedFilters(history, filters) {
    if (!Array.isArray(history)) return [];
    if (!filters || typeof filters !== 'object') return history;
    const searchTerm = filters.searchTerm ? String(filters.searchTerm).trim() : '';
    const searchLower = searchTerm.toLowerCase();
  
    return history.filter(item => {
      if (!item) return false;
      if (searchTerm) {
        const pName = String(item.patientName || '').toLowerCase();
        const pId = String(item.patientId || '').toLowerCase();
        const refBy = String(item.referredBy || '').toLowerCase();
        const cDate = String(item.collectionDate || '');
        const rDate = String(item.reportedDate || '');
        const matchesSearch =
          pName.includes(searchLower) ||
          pId.includes(searchLower) ||
          refBy.includes(searchLower) ||
          cDate.toLowerCase().includes(searchLower) ||
          rDate.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      const itemRepDate = String(item.reportedDate || '');
      if (filters.dateFrom && itemRepDate < filters.dateFrom) return false;
      if (filters.dateTo && itemRepDate > filters.dateTo) return false;
      if (filters.testType && (!item.tests || !item.tests[filters.testType])) return false;
      if (filters.paymentMode && item.paymentMode !== filters.paymentMode) return false;
      if (filters.minCost && item.testCost && item.testCost !== 'Not specified') {
        if (parseFloat(item.testCost) < parseFloat(filters.minCost)) return false;
      }
      if (filters.maxCost && item.testCost && item.testCost !== 'Not specified') {
        if (parseFloat(item.testCost) > parseFloat(filters.maxCost)) return false;
      }
      if (filters.gender && item.patientGender !== filters.gender) return false;
      if (filters.ageFrom && parseInt(item.patientAge) < parseInt(filters.ageFrom)) return false;
      if (filters.ageTo && parseInt(item.patientAge) > parseInt(filters.ageTo)) return false;
      return true;
    });
  }
  
  // L2143 — needs calculateSearchStatistics + getActiveFilters (same module below)
  function updateSearchSummary(filteredCount, totalCount, searchStats) {
    try {
      const summaryElement = document.getElementById('searchSummary');
      const activeFiltersElement = document.getElementById('activeFilters');
      if (!summaryElement || !activeFiltersElement) return;
      const activeFilters = getActiveFilters();
      if (activeFilters.length > 0 || filteredCount < totalCount) {
        summaryElement.style.display = 'block';
        activeFiltersElement.innerHTML = '';
        activeFilters.forEach(filter => {
          const filterTag = document.createElement('span');
          filterTag.className = 'filter-tag';
          filterTag.innerHTML = `${escapeHtml(filter.label)}: ${escapeHtml(filter.value)}<span class="remove-filter" data-filter="${escapeHtml(filter.key)}">&times;</span>`;
          activeFiltersElement.appendChild(filterTag);
        });
        const statsHTML = `
          <div class="search-statistics"><h4>Search Results Summary</h4>
          <div class="stats-overview">
            <div class="stat-main"><span class="stat-number">${searchStats.totalReports}</span><span class="stat-label">Total Reports</span></div>
            <div class="stat-main"><span class="stat-number">${searchStats.totalTests}</span><span class="stat-label">Total Tests</span></div>
            <div class="stat-main"><span class="stat-number">₹${searchStats.totalCollection.toFixed(2)}</span><span class="stat-label">Total Collection</span></div>
          </div>
          <div class="test-breakdown"><h5>Test Breakdown:</h5><div class="test-stats-list">
            ${searchStats.testBreakdown.cbc > 0 ? `<div class="test-stat"><span>CBC:</span> <strong>${searchStats.testBreakdown.cbc}</strong></div>` : ''}
            ${searchStats.testBreakdown.esr > 0 ? `<div class="test-stat"><span>ESR:</span> <strong>${searchStats.testBreakdown.esr}</strong></div>` : ''}
            ${searchStats.testBreakdown.typhi > 0 ? `<div class="test-stat"><span>Typhoid:</span> <strong>${searchStats.testBreakdown.typhi}</strong></div>` : ''}
            ${searchStats.testBreakdown.dengue > 0 ? `<div class="test-stat"><span>Dengue:</span> <strong>${searchStats.testBreakdown.dengue}</strong></div>` : ''}
            ${searchStats.testBreakdown.malaria > 0 ? `<div class="test-stat"><span>Malaria:</span> <strong>${searchStats.testBreakdown.malaria}</strong></div>` : ''}
            ${searchStats.testBreakdown.widal > 0 ? `<div class="test-stat"><span>Widal:</span> <strong>${searchStats.testBreakdown.widal}</strong></div>` : ''}
            ${searchStats.testBreakdown.bloodGroup > 0 ? `<div class="test-stat"><span>Blood Group:</span> <strong>${searchStats.testBreakdown.bloodGroup}</strong></div>` : ''}
            ${searchStats.testBreakdown.bilirubin > 0 ? `<div class="test-stat"><span>Bilirubin:</span> <strong>${searchStats.testBreakdown.bilirubin}</strong></div>` : ''}
            ${searchStats.testBreakdown.crp > 0 ? `<div class="test-stat"><span>CRP:</span> <strong>${searchStats.testBreakdown.crp}</strong></div>` : ''}
          </div></div></div>`;
        const statsElement = document.createElement('div');
        statsElement.innerHTML = statsHTML;
        activeFiltersElement.appendChild(statsElement);
        document.querySelectorAll('.remove-filter').forEach(btn => {
          btn.addEventListener('click', function (e) { e.stopPropagation(); removeFilter(this.dataset.filter); });
        });
      } else {
        summaryElement.style.display = 'none';
      }
    } catch (error) { console.error('Error updating search summary:', error); }
  }
  
  // L2221
  function getActiveFilters() {
    const currentFilters = getCurrentFilters();
    const activeFilters = [];
    if (currentFilters.searchTerm) activeFilters.push({ key: 'searchTerm', label: 'Search', value: currentFilters.searchTerm });
    if (currentFilters.dateFrom) activeFilters.push({ key: 'dateFrom', label: 'From Date', value: formatDisplayDate(currentFilters.dateFrom) });
    if (currentFilters.dateTo) activeFilters.push({ key: 'dateTo', label: 'To Date', value: formatDisplayDate(currentFilters.dateTo) });
    if (currentFilters.testType) activeFilters.push({ key: 'testType', label: 'Test Type', value: currentFilters.testType });
    if (currentFilters.paymentMode) activeFilters.push({ key: 'paymentMode', label: 'Payment', value: currentFilters.paymentMode });
    if (currentFilters.minCost) activeFilters.push({ key: 'minCost', label: 'Min Cost', value: `₹${currentFilters.minCost}` });
    if (currentFilters.maxCost) activeFilters.push({ key: 'maxCost', label: 'Max Cost', value: `₹${currentFilters.maxCost}` });
    if (currentFilters.gender) activeFilters.push({ key: 'gender', label: 'Gender', value: currentFilters.gender });
    if (currentFilters.ageFrom) activeFilters.push({ key: 'ageFrom', label: 'Min Age', value: currentFilters.ageFrom });
    if (currentFilters.ageTo) activeFilters.push({ key: 'ageTo', label: 'Max Age', value: currentFilters.ageTo });
    return activeFilters;
  }
  
  // L2259
  function removeFilter(filterKey) {
    setCurrentFilters({ [filterKey]: '' });
    callLoadHistory();
    const inputField = document.getElementById(`search${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`);
    if (inputField) inputField.value = '';
  }
  
  // L2284
  function setupQuickFilters() {
    const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
    quickFilterButtons.forEach(btn => { btn.replaceWith(btn.cloneNode(true)); });
    document.querySelectorAll('.quick-filter-btn[data-days]').forEach(btn => {
      btn.addEventListener('click', function () {
        const days = parseInt(this.dataset.days);
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);
        const filters = { dateFrom: startDate.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0], searchTerm: '' };
        setCurrentFilters(filters);
        callLoadHistory(filters);
        setActiveQuickFilter(this);
      });
    });
    document.querySelectorAll('.quick-filter-btn[data-test]').forEach(btn => {
      btn.addEventListener('click', function () {
        const filters = { testType: this.dataset.test, searchTerm: '' };
        setCurrentFilters(filters);
        callLoadHistory(filters);
        setActiveQuickFilter(this);
      });
    });
    document.querySelectorAll('.quick-filter-btn[data-payment]').forEach(btn => {
      btn.addEventListener('click', function () {
        const filters = { paymentMode: this.dataset.payment, searchTerm: '' };
        setCurrentFilters(filters);
        callLoadHistory(filters);
        setActiveQuickFilter(this);
      });
    });
  }
  
  // L2346
  function setActiveQuickFilter(activeBtn) {
    document.querySelectorAll('.quick-filter-btn').forEach(btn => { btn.classList.remove('active'); });
    activeBtn.classList.add('active');
  }
  
  // L2354
  function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchHistory');
    const clearSearchBtn = document.getElementById('clearSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const filters = { searchTerm: this.value.trim(), dateFrom: '', dateTo: '', testType: '', paymentMode: '', minCost: '', maxCost: '', gender: '', ageFrom: '', ageTo: '' };
        document.querySelectorAll('.quick-filter-btn').forEach(btn => { btn.classList.remove('active'); });
        callLoadHistory(filters);
      });
    }
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', function () {
        if (document.getElementById('searchHistory')) document.getElementById('searchHistory').value = '';
        setCurrentFilters({ searchTerm: '', dateFrom: '', dateTo: '', testType: '', paymentMode: '', minCost: '', maxCost: '', gender: '', ageFrom: '', ageTo: '' });
        // need full reset object merge: clear all
        const cf = getCurrentFilters();
        Object.keys(cf).forEach(k => cf[k] = '');
        callLoadHistory();
        document.querySelectorAll('.quick-filter-btn').forEach(btn => { btn.classList.remove('active'); });
      });
    }
  }

  /* ===== Module: assets/js/services/report-builder.js ===== */
  /* Extracted from index.html L1673-2013. Template logic identical; ranges via config/test-constants.js */
  function formatAlternatingRows(rowsHtml) {
    if (!rowsHtml) return '';
    const sections = rowsHtml.split(/(?=<tr\s+class=["']\s*report-section-row\s*["']>)/);
    return sections.map(section => {
      let rowIndex = 0;
      return section.replace(/<tr(?!\s+class=["']\s*report-section-row\s*["'])([^>]*)>/g, (match, attrs) => {
        rowIndex++;
        if (rowIndex % 2 === 0) {
          if (attrs && attrs.includes('class=')) {
            return `<tr${attrs.replace(/class=(["'])/, 'class=$1alt-row ')}>`;
          }
          return `<tr class="alt-row"${attrs}>`;
        }
        return match;
      });
    }).join('');
  }
  
  function formatDengueSubtype(subtype) {
    switch (subtype) {
      case 'NS1':
        return 'Positive (NS1)';
      case 'IgM':
        return 'Positive (IgM)';
      case 'IgG':
        return 'Positive (IgG)';
      case 'NS1 and IgM':
      case 'NS1_IgM':
        return 'Positive (NS1, IgM)';
      case 'IgM and IgG':
      case 'IgM_IgG':
        return 'Positive (IgM, IgG)';
      case 'NS1 and IgG':
      case 'NS1_IgG':
        return 'Positive (NS1, IgG)';
      case 'All':
      case 'All (NS1, IgM and IgG)':
        return 'Positive (NS1, IgM, IgG)';
      default:
        return subtype ? `Positive (${subtype})` : 'Positive';
    }
  }
  
  function createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed) {
    const hasWholeBloodTest = !!(tests.cbc || tests.esr || tests.malaria || tests.bloodGroup);
    const hasSerumTest = !!(tests.typhi || tests.dengue || tests.widal || tests.bilirubin || tests.crp);
    let specimenType;
    if (hasWholeBloodTest && hasSerumTest) {
      specimenType = 'EDTA Blood / Serum';
    } else if (hasWholeBloodTest || tubeUsed === 'Purple') {
      specimenType = 'EDTA Whole Blood';
    } else if (hasSerumTest || tubeUsed === 'Red') {
      specimenType = 'Serum / Clotted Blood';
    } else {
      specimenType = 'Whole Blood / Serum';
    }
  
    const patientId = document.getElementById('patientId') ? document.getElementById('patientId').value : '';
    const rawColl = document.getElementById('collectionDate') ? document.getElementById('collectionDate').value : '';
    const rawRecv = document.getElementById('receivedDate') ? document.getElementById('receivedDate').value : '';
    const rawRep = document.getElementById('reportedDate') ? document.getElementById('reportedDate').value : '';
    const collDate = formatLabDate(rawColl);
    const recvDate = formatLabDate(rawRecv);
    const repDate = formatLabDate(rawRep);
    const referredBy = document.getElementById('referredBy') ? (document.getElementById('referredBy').value.trim() || 'SELF') : 'SELF';
    const patientPhone = document.getElementById('patientPhone') ? document.getElementById('patientPhone').value.trim() : '';
    const patientCity = document.getElementById('patientCity') ? document.getElementById('patientCity').value.trim() : '';
    const fastingStatus = document.getElementById('fastingStatus') ? document.getElementById('fastingStatus').value.trim() : '';
  
    let cleanPatientName = patientName;
    let relationType = document.getElementById('relationType') ? document.getElementById('relationType').value : 'S/O';
    let rawGuardian = document.getElementById('guardianName') ? document.getElementById('guardianName').value.trim() : '';
    let guardianName = (rawGuardian === '[object Object]') ? '' : rawGuardian;
  
    const guardianMatch = cleanPatientName.match(/\s*\((S\/O|W\/O|D\/O|C\/O)(?:\s+([^)]*))?\)/i);
    if (guardianMatch) {
      if (!guardianName) {
        relationType = guardianMatch[1].toUpperCase();
        const extractedGuardian = (guardianMatch[2] || '').trim();
        guardianName = (extractedGuardian === '[object Object]') ? '' : extractedGuardian;
      }
      cleanPatientName = cleanPatientName.replace(guardianMatch[0], '').trim();
    }
  
    const ageGenderStr = patientAge && patientGender ? `${patientAge} / ${patientGender}` : (patientAge || patientGender || '');
  
    let patientInfoHTML = `
        <div><strong>Patient Name:</strong> ${escapeHtml(cleanPatientName)}</div>`;
  
    if (guardianName && guardianName !== '[object Object]') {
      patientInfoHTML += `\n      <div><strong>${escapeHtml(relationType)}:</strong> ${escapeHtml(guardianName)}</div>`;
    }
  
    patientInfoHTML += `\n      <div><strong>Age / Gender:</strong> ${escapeHtml(ageGenderStr)}</div>
        <div><strong>Patient ID:</strong> ${escapeHtml(patientId)}</div>`;
  
    if (patientPhone) {
      patientInfoHTML += `\n      <div><strong>Contact:</strong> ${escapeHtml(patientPhone)}</div>`;
    }
    if (patientCity) {
      patientInfoHTML += `\n      <div><strong>City:</strong> ${escapeHtml(patientCity)}</div>`;
    }
  
    if (collDate) {
      patientInfoHTML += `\n      <div><strong>Collection Date:</strong> ${escapeHtml(collDate)}</div>`;
    }
    if (recvDate) {
      patientInfoHTML += `\n      <div><strong>Received Date:</strong> ${escapeHtml(recvDate)}</div>`;
    }
    if (repDate) {
      patientInfoHTML += `\n      <div><strong>Reported Date:</strong> ${escapeHtml(repDate)}</div>`;
    }
    patientInfoHTML += `\n      <div><strong>Referred By:</strong> ${escapeHtml(referredBy)}</div>`;
  
    if (fastingStatus) {
      patientInfoHTML += `\n      <div><strong>Fasting Status:</strong> ${escapeHtml(fastingStatus)}</div>`;
    }
  
    patientInfoHTML += `\n      <div><strong>Specimen:</strong> ${escapeHtml(specimenType)}</div>
        <div class="no-print"><strong>Tube Used:</strong> ${escapeHtml(tubeUsed)}</div>`;
  
    let reportHTML = `
      <div class="report-header">
        <div class="header-container">
          <svg class="header-svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"
               viewBox="300 330 29400 5320"
               style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
            <defs>
              <style type="text/css">
                .fil9 {fill:#9D9E9E}
                .fil8 {fill:#21846B}
                .fil0 {fill:#0289C1}
                .fil4 {fill:#233B9F}
                .fil6 {fill:#591C9B}
                .fil7 {fill:#5B7B23}
                .fil1 {fill:#9CDA32}
                .fil2 {fill:#A527A3}
                .fil5 {fill:#EC3813}
                .fil3 {fill:#FEAF0B}
                .fnt2 {font-weight:bold;font-size:590.45px;font-family:'Calibri','Roboto Condensed',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
                .fnt1 {font-weight:bold;font-size:2357.84px;font-family:'Calibri','Roboto Condensed',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
                .fnt0 {font-weight:bold;font-size:4346.53px;font-family:'Calibri','Roboto Condensed',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
              </style>
            </defs>
            <g id="Layer_x0020_1">
              <g id="_2740097163536">
                <path class="fil0" d="M13063 3119l14 -842 835 -2 -1 -1275c-165,-17 -365,-7 -534,-8 -191,-1 -300,35 -311,228 -14,226 -19,843 11,1051 -388,7 -627,-45 -918,150 -183,123 -370,345 -366,699l1270 -1z"/>
                <path class="fil1" d="M14107 3098c59,46 65,27 237,25 88,-1 177,0 266,0 177,0 354,-2 531,-2 356,0 718,6 1072,-1 25,-134 11,-374 11,-520 1,-191 -18,-306 -192,-326 -237,-27 -847,-13 -1099,3l12 821 -838 0z"/>
                <path class="fil2" d="M14938 4141l-838 10 1 1282c176,5 357,2 534,3 194,0 297,-20 310,-222 16,-250 20,-835 -7,-1073z"/>
                <path class="fil3" d="M13063 4145l12 -837c-219,-6 -444,-1 -664,-1 -755,0 -623,-146 -624,528 0,181 18,302 212,319 183,16 898,18 1064,-9z"/>
                <path class="fil2" d="M14938 4141c312,62 713,7 928,-137 162,-109 376,-388 352,-692 -226,-21 -2018,-31 -2116,8 192,-6 683,-29 846,14l-10 807z"/>
                <path class="fil3" d="M13911 4147l-848 -2c20,381 -51,631 150,919 154,219 375,362 699,368l-1 -1285z"/>
                <path class="fil1" d="M14102 2272l831 5c51,-332 18,-680 -132,-909 -131,-199 -410,-394 -701,-367l2 1271z"/>
                <polygon class="fil4" points="13063,3119 13913,3119 13912,2275 13077,2277 "/>
                <polygon class="fil5" points="13063,4145 13911,4147 13903,3308 13075,3308 "/>
                <path class="fil6" d="M14100 4151l838 -10 10 -807c-163,-43 -654,-20 -846,-14l-2 831z"/>
                <polygon class="fil7" points="14107,3098 14945,3098 14933,2277 14102,2272 "/>
              </g>
              <g transform="matrix(0.804033 0 0 1 -11533.7 1478.3)">
                <text x="14850" y="3000" class="fil8 fnt0" textLength="13000" lengthAdjust="spacingAndGlyphs">SHAMS</text>
              </g>
              <g transform="matrix(0.948662 0 0 1 2698.3 886.328)">
                <text x="14850" y="3000" class="fil8 fnt1" textLength="12200" lengthAdjust="spacingAndGlyphs">HEALTH CARE</text>
              </g>
              <g transform="matrix(1.1105 0 0 1 4702.27 1416.22)">
                <text x="14850" y="3000" class="fil9 fnt2" textLength="6400" lengthAdjust="spacingAndGlyphs">YOUR HEALTH, OUR PRIORITY</text>
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div class="report-patient-info">
  ${patientInfoHTML}
      </div>`;
  
    let tableRows = '';
    let cbcRows = '';
  
    // 1. COMPLETE BLOOD COUNT (CBC)
    if (tests.cbc) {
      CBC_PARAMS.forEach(param => {
        let value = document.getElementById(param.id).value || '';
        if (value) {
          if (param.id === 'platelet') {
            value = formatPlateletValue(value);
          } else if (CBC_DECIMAL_FIELD_IDS.includes(param.id)) {
            value = formatPointValue(value);
          }
          const refRange = refRangeFor(param, patientGender);
          const isAbnormal = isAbnormalByRange(value, refRange);
          cbcRows += `<tr><td>${escapeHtml(param.name)}</td><td class="${isAbnormal ? 'abnormal' : ''}">${escapeHtml(value)}</td><td>${escapeHtml(param.unit)}</td><td>${escapeHtml(refRange)}</td></tr>`;
        }
      });
      if (cbcRows) {
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">COMPLETE BLOOD COUNT (CBC)</span>
                <span class="method-badge">Method: 3-Part Automated Cell Counter</span>
              </div>
            </td>
          </tr>
          ${cbcRows}`;
      }
    }
  
    // 2. HEMATOLOGY (ESR)
    let hasEsr = false;
    if (tests.esr) {
      const esrValue = document.getElementById('esr').value || '';
      if (esrValue) {
        hasEsr = true;
        const isAbnormal = parseFloat(esrValue) > ESR_REF.max;
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">HEMATOLOGY (ESR)</span>
                <span class="method-badge">Method: Westergren Method (1 hr)</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>Erythrocyte Sedimentation Rate (ESR)</td>
            <td class="${isAbnormal ? 'abnormal' : ''}">${escapeHtml(esrValue)}</td>
            <td>${ESR_REF.unit}</td>
            <td>${ESR_REF.display}</td>
          </tr>`;
      }
    }
  
    // 3. SEROLOGY & RAPID CARD TESTS (Malaria, Typhoid, Dengue)
    let hasMalaria = false;
    let hasTyphi = false;
    let hasDengue = false;
    const hasRapidTests = (tests.malaria && (document.getElementById('malariaResult').value || '')) ||
      (tests.typhi && (document.getElementById('typhiResult').value || '')) ||
      (tests.dengue && (document.getElementById('dengueResult').value || ''));
  
    if (hasRapidTests) {
      let rapidRows = '';
      // Malaria (EDTA Whole Blood)
      if (tests.malaria) {
        const result = document.getElementById('malariaResult').value || '';
        if (result) {
          hasMalaria = true;
          let displayResult = result;
          if (result === 'Positive') {
            const subtype = document.getElementById('malariaSubtype').value;
            displayResult = `Positive (${subtype === 'Both' ? 'Pf and Pv' : subtype})`;
          }
          rapidRows += `<tr><td>Malaria Parasite Antigen (Pv / Pf)</td><td class="${result === 'Positive' ? 'positive' : ''}">${escapeHtml(displayResult)}</td><td>—</td><td>Negative</td></tr>`;
        }
      }
      // Typhoid (Serum)
      if (tests.typhi) {
        const result = document.getElementById('typhiResult').value || '';
        if (result) {
          hasTyphi = true;
          let displayResult = result;
          if (result === 'Positive') {
            const subtype = document.getElementById('typhiSubtype').value;
            displayResult = `Positive (${subtype === 'Both' ? 'IgM and IgG' : subtype})`;
          }
          rapidRows += `<tr><td>Typhoid Rapid (IgM / IgG)</td><td class="${result === 'Positive' ? 'positive' : ''}">${escapeHtml(displayResult)}</td><td>—</td><td>Negative</td></tr>`;
        }
      }
  
      // Dengue (Serum)
      if (tests.dengue) {
        const result = document.getElementById('dengueResult').value || '';
        if (result) {
          hasDengue = true;
          let displayResult = result;
          if (result === 'Positive') {
            const subtype = document.getElementById('dengueSubtype')?.value || '';
            displayResult = formatDengueSubtype(subtype);
          }
          rapidRows += `<tr><td>Dengue Rapid (NS1, IgM, IgG)</td><td class="${result === 'Positive' ? 'positive' : ''}">${escapeHtml(displayResult)}</td><td>—</td><td>Negative</td></tr>`;
        }
      }
      if (rapidRows) {
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">SEROLOGY / RAPID CARD TESTS</span>
                <span class="method-badge">Method: Immunochromatographic Rapid Card Assay (ICT)</span>
              </div>
            </td>
          </tr>
          ${rapidRows}`;
      }
    }
  
    // 4. SEROLOGY (WIDAL TEST)
    let widalRows = '';
    if (tests.widal) {
      WIDAL_PARAMS.forEach(param => {
        const value = document.getElementById(param.id).value || '';
        if (value) {
          const isPositive = isWidalPositive(value);
          widalRows += `<tr><td>S. Typhi '${escapeHtml(param.name.replace(' Antigen', ''))}' Antigen</td><td class="${isPositive ? 'positive' : ''}">${escapeHtml(value)}</td><td>Titre</td><td>${WIDAL_CUTOFF.replace('<', '&lt;')}</td></tr>`;
        }
      });
      if (widalRows) {
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">SEROLOGY (WIDAL TEST)</span>
                <span class="method-badge">Method: Slide Agglutination Method</span>
              </div>
            </td>
          </tr>
          ${widalRows}`;
      }
    }
  
    // 5. BIOCHEMISTRY (BILIRUBIN & CRP)
    let hasBilirubin = false;
    if (tests.bilirubin) {
      const totalBilirubin = document.getElementById('totalBilirubin').value || '';
      const directBilirubin = document.getElementById('directBilirubin').value || '';
      const indirectBilirubin = document.getElementById('indirectBilirubin').value || '';
      if (totalBilirubin || directBilirubin || indirectBilirubin) {
        hasBilirubin = true;
        let rows = '';
        if (totalBilirubin) rows += `<tr><td>Total Bilirubin</td><td class="${parseFloat(totalBilirubin) > BILIRUBIN_REF.total.max ? 'abnormal' : ''}">${escapeHtml(totalBilirubin)}</td><td>mg/dL</td><td>${BILIRUBIN_REF.total.display}</td></tr>`;
        if (directBilirubin) rows += `<tr><td>Direct Bilirubin</td><td class="${parseFloat(directBilirubin) > BILIRUBIN_REF.direct.max ? 'abnormal' : ''}">${escapeHtml(directBilirubin)}</td><td>mg/dL</td><td>${BILIRUBIN_REF.direct.display}</td></tr>`;
        if (indirectBilirubin) rows += `<tr><td>Indirect Bilirubin</td><td class="${parseFloat(indirectBilirubin) > BILIRUBIN_REF.indirect.max ? 'abnormal' : ''}">${escapeHtml(indirectBilirubin)}</td><td>mg/dL</td><td>${BILIRUBIN_REF.indirect.display}</td></tr>`;
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">BIOCHEMISTRY (BILIRUBIN)</span>
                <span class="method-badge">Method: Photometric (Diazo Method)</span>
              </div>
            </td>
          </tr>
          ${rows}`;
      }
    }
  
    let hasCrp = false;
    if (tests.crp) {
      const crpValue = document.getElementById('crp').value || '';
      if (crpValue) {
        hasCrp = true;
        const tier = crpTier(parseFloat(crpValue));
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">BIOCHEMISTRY (CRP)</span>
                <span class="method-badge">Method: Semi-Quantitative Latex / Turbidimetry</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>C-Reactive Protein (CRP)</td>
            <td class="${tier.statusClass}">${escapeHtml(crpValue)}</td>
            <td>mg/L</td>
            <td>${tier.refRange}</td>
          </tr>`;
      }
    }
  
    // 6. IMMUNOHEMATOLOGY (BLOOD GROUP)
    let hasBloodGroup = false;
    if (tests.bloodGroup) {
      const bloodGroupValue = document.getElementById('bloodGroup').value || '';
      if (bloodGroupValue) {
        hasBloodGroup = true;
        tableRows += `
          <tr class="report-section-row">
            <td colspan="4">
              <div class="section-banner">
                <span class="section-name">IMMUNOHEMATOLOGY (BLOOD GROUP)</span>
                <span class="method-badge">Method: Slide Hemagglutination</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>ABO & Rh Blood Group</td>
            <td style="font-weight: 600;">${escapeHtml(bloodGroupValue)}</td>
            <td>—</td>
            <td>—</td>
          </tr>`;
      }
    }
  
    reportHTML += `
      <table class="unified-report-table">
        <thead>
          <tr>
            <th class="col-investigation">INVESTIGATION</th>
            <th class="col-result">RESULT</th>
            <th class="col-unit">UNIT</th>
            <th class="col-ref">REFERENCE RANGE</th>
          </tr>
        </thead>
        <tbody>
          ${formatAlternatingRows(tableRows)}
        </tbody>
      </table>`;
  
    // Dynamically assemble methodology notes only for tests present in current report
    const methodItems = [];
    if (cbcRows) {
      methodItems.push('CBC performed by 3-Part Automated Hematology Analyzer');
    }
    if (hasEsr) {
      methodItems.push('ESR evaluated by Westergren Method');
    }
    if (hasMalaria) {
      methodItems.push('Malaria evaluated by EDTA whole blood ICT Rapid Card');
    }
    const serumRapid = [];
    if (hasTyphi) serumRapid.push('Typhoid');
    if (hasDengue) serumRapid.push('Dengue');
    if (serumRapid.length > 0) {
      methodItems.push(`${serumRapid.join(' and ')} evaluated by serum ICT Rapid Card`);
    }
    if (widalRows) {
      methodItems.push('Widal evaluated by Slide Agglutination Method');
    }
    if (hasBilirubin) {
      methodItems.push('Bilirubin evaluated by Photometric Diazo Method');
    }
    if (hasCrp) {
      methodItems.push('CRP evaluated by Semi-Quantitative Latex / Turbidimetry');
    }
    if (hasBloodGroup) {
      methodItems.push('Blood Group evaluated by Slide Hemagglutination');
    }
  
    const methodologyText = methodItems.length > 0
      ? methodItems.join('. ') + '.'
      : 'Tests evaluated according to standard validated clinical laboratory methods.';
  
    // Dynamically assemble test limitations relevant to tests performed
    const limitationItems = [];
    if (hasMalaria || hasTyphi || hasDengue) {
      limitationItems.push('Rapid card tests have biological window periods; negative results do not completely rule out acute early infection');
    }
    if (cbcRows) {
      limitationItems.push('Automated analyzer values are screening counts; confirmatory testing (manual PBS) is advised for marked cytopenias or abnormal cell populations');
    }
  
    let disclaimerHTML = `
      <div class="end-of-report">*** END OF REPORT ***</div>
      <div class="compact-disclaimer-box">
        <div class="disclaimer-title">IMPORTANT LABORATORY NOTES & CLINICAL DISCLAIMER:</div>
        <p>• <strong>Methodology & Screening:</strong> ${methodologyText}</p>
        <p>• <strong>Clinical Correlation:</strong> All findings are preliminary diagnostic screening aids and must be correlated clinically by the treating physician with patient history and signs. Test results alone do not constitute a standalone medical diagnosis.</p>`;
  
    if (limitationItems.length > 0) {
      disclaimerHTML += `
        <p>• <strong>Technical Limitations:</strong> ${limitationItems.join('. ')}.</p>`;
    }
  
    disclaimerHTML += `
        <p>• <strong>Legal Immunity & Specimen:</strong> Samples are not preserved after testing; results reflect specimen condition strictly at the time of processing. Any repeat testing requires fresh sample collection. The laboratory accepts no medical, legal, or financial liability for diagnostic decisions or clinical management based on this report. Not valid for medico-legal or judicial purposes.</p>
      </div>
      
      <div class="report-signatures-compact">
        <div class="sig-column">
          <div class="sig-space">
            <img src="assets/images/signature.png" class="doctor-signature-img" alt="Doctor Signature" onerror="this.onerror=null; this.src='assets/images/signature.svg';">
          </div>
          <div class="sig-title">Dr. Shahid Khan, MBBS</div>
          <div class="sig-sub">Consultant Doctor / Authorized Signatory</div>
        </div>
      </div>
      
      <div class="report-page-footer">
        <div class="footer-content">
          <div class="footer-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span><strong>SHAMS HEALTH CARE</strong>, Nuh Road, Tauru</span>
          </div>
          <div class="footer-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>Ph: <strong>8901469099</strong></span>
          </div>
          <div class="footer-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Page <strong class="page-number">1/1</strong></span>
          </div>
        </div>
      </div>`;
  
    reportHTML += disclaimerHTML;
  
    return reportHTML;
  }

  /* ===== Module: assets/js/services/report-paginator.js ===== */
  /* A4 report paginator.
   * Re-flows a rendered report into fixed A4 page cards so that:
   *   - the letterhead + patient info repeat at the top of every page,
   *   - the footer is pinned to the bottom of every page (not floating),
   *   - page numbers are exact ("Page 1/3", "Page 2/3", ...),
   *   - a test section is never broken across pages (unless it is taller than a page),
   *   - the disclaimer + signature appear only on the last page.
   * The preview uses the same DOM that prints, so screen and paper match.
   */
  
  // 200mm A4 content width (210mm - 2 x 5mm page margins) expressed in CSS pixels.
  const PAGE_WIDTH_PX = (200 / 25.4) * 96;
  const TOLERANCE_PX = 1;
  
  function setPageNumber(footer, index, total) {
    if (!footer) return;
    let number = footer.querySelector('.page-number');
    if (!number) {
      const items = [...footer.querySelectorAll('.footer-item')];
      const pageItem = items.find(item => /^\s*Page\b/i.test(item.textContent));
      if (!pageItem) return;
      const label = pageItem.querySelector('span');
      if (label) {
        label.innerHTML = 'Page <strong class="page-number">1/1</strong>';
        number = label.querySelector('.page-number');
      } else {
        const icons = [...pageItem.querySelectorAll('svg')];
        pageItem.innerHTML = '';
        icons.forEach(icon => pageItem.appendChild(icon));
        pageItem.insertAdjacentHTML('beforeend', 'Page <strong class="page-number">1/1</strong>');
        number = pageItem.querySelector('.page-number');
      }
    }
    number.textContent = `${index}/${total}`;
  }
  
  function fitReportPreview(container) {
    if (!container || !container.classList.contains('report-paginated')) return;
    const styles = window.getComputedStyle(container);
    const padding = parseFloat(styles.paddingLeft || 0) + parseFloat(styles.paddingRight || 0);
    const available = container.clientWidth - padding;
    if (available <= 0) return;
    const zoom = available < PAGE_WIDTH_PX ? available / PAGE_WIDTH_PX : 1;
    container.style.setProperty('--report-zoom', zoom.toFixed(4));
  }
  
  function paginateReport(container) {
    if (!container || container.querySelector('.report-page')) return;
  
    const header = container.querySelector('.report-header');
    const patientInfo = container.querySelector('.report-patient-info');
    const footer = container.querySelector('.report-page-footer');
    const table = container.querySelector('.unified-report-table');
    if (!header && !table) return;
  
    const headHTML = (header ? header.outerHTML : '') + (patientInfo ? patientInfo.outerHTML : '');
    const footHTML = footer ? footer.outerHTML : '';
    const endingEls = [...container.children].filter(el =>
      el.classList.contains('end-of-report') ||
      el.classList.contains('compact-disclaimer-box') ||
      el.classList.contains('report-signatures-compact'));
  
    // Group the unified table rows per test section (section banner + its result rows).
    const theadHTML = table && table.tHead ? table.tHead.outerHTML : null;
    const groups = [];
    if (table) {
      for (const tbody of table.tBodies) {
        let group = null;
        for (const row of tbody.rows) {
          if (row.classList.contains('report-section-row')) {
            group = { head: row.outerHTML, rows: [] };
            groups.push(group);
          } else {
            if (!group) {
              group = { head: '', rows: [] };
              groups.push(group);
            }
            group.rows.push(row.outerHTML);
          }
        }
      }
    }
  
    const stage = document.createElement('div');
    stage.className = 'report-pagination-stage';
    document.body.appendChild(stage);
  
    const makePage = () => {
      const page = document.createElement('div');
      page.className = 'report-page';
      const head = document.createElement('div');
      head.className = 'report-page-head';
      head.innerHTML = headHTML;
      const body = document.createElement('div');
      body.className = 'report-page-body';
      if (theadHTML !== null) {
        const tbl = document.createElement('table');
        tbl.className = 'unified-report-table';
        tbl.innerHTML = theadHTML;
        body.appendChild(tbl);
      }
      const foot = document.createElement('div');
      foot.className = 'report-page-foot';
      foot.innerHTML = footHTML;
      page.append(head, body, foot);
      stage.appendChild(page);
      return page;
    };
  
    let page, bodyEl, tableEl;
    const startPage = () => {
      page = makePage();
      bodyEl = page.querySelector('.report-page-body');
      tableEl = bodyEl.querySelector('.unified-report-table');
    };
    startPage();
  
    const overflows = () => {
      const content = bodyEl.lastElementChild;
      if (!content) return false;
      return content.getBoundingClientRect().bottom > bodyEl.getBoundingClientRect().bottom + TOLERANCE_PX;
    };
    const hasContent = () => tableEl ? !!tableEl.querySelector('tbody tr') : !!bodyEl.firstElementChild;
  
    // Fallback for legacy/block reports: keep each block whole.
    const placeBlock = (html) => {
      const holder = document.createElement('div');
      holder.innerHTML = html;
      const node = holder.firstElementChild;
      if (!node) return;
      bodyEl.appendChild(node);
      if (!overflows()) return;
      node.remove();
      if (hasContent()) {
        startPage();
        placeBlock(html);
        return;
      }
      bodyEl.appendChild(node);
      page.classList.add('report-page--tall');
    };
  
    const createTbody = () => {
      const tbody = document.createElement('tbody');
      tbody.className = 'report-test-group';
      tableEl.appendChild(tbody);
      return tbody;
    };
  
    // Only used when one single test section is taller than a full page.
    // The section banner is repeated on each continued page so no page starts
    // with context-free result rows.
    const splitSection = (group) => {
      const rows = (group.head ? [group.head] : []).concat(group.rows);
      let tbody = createTbody();
      for (const rowHTML of rows) {
        tbody.insertAdjacentHTML('beforeend', rowHTML);
        if (!overflows()) continue;
        tbody.lastElementChild.remove();
        if (hasContent()) {
          startPage();
          tbody = createTbody();
          if (group.head) {
            tbody.insertAdjacentHTML('beforeend', group.head);
            if (overflows()) {
              tbody.lastElementChild.remove();
              page.classList.add('report-page--tall');
            }
          }
        }
        tbody.insertAdjacentHTML('beforeend', rowHTML);
        if (overflows()) page.classList.add('report-page--tall');
      }
    };
  
    const placeSection = (group) => {
      const tbody = createTbody();
      tbody.innerHTML = group.head + group.rows.join('');
      if (!overflows()) return;
      tbody.remove();
      if (hasContent()) {
        startPage();
        placeSection(group);
        return;
      }
      splitSection(group);
    };
  
    const placeEnding = () => {
      if (!endingEls.length) return;
      const block = document.createElement('div');
      block.className = 'report-ending-block';
      block.innerHTML = endingEls.map(el => el.outerHTML).join('');
      bodyEl.appendChild(block);
      if (!overflows()) return;
      block.remove();
      if (hasContent()) {
        startPage();
        placeEnding();
        return;
      }
      endingEls.forEach(el => placeBlock(el.outerHTML));
    };
  
    groups.forEach(placeSection);
    if (!groups.length) {
      [...container.children].forEach(el => {
        if (el === header || el === patientInfo || el === footer || endingEls.includes(el)) return;
        if (el.tagName === 'TABLE') return;
        placeBlock(el.outerHTML);
      });
    }
    placeEnding();
  
    const pages = [...stage.querySelectorAll('.report-page')];
  
    // A page that only carries the disclaimer does not need the table header row.
    pages.forEach(p => {
      const tbl = p.querySelector('.unified-report-table');
      if (tbl && !tbl.querySelector('tbody tr')) tbl.remove();
    });
  
    pages.forEach((p, i) => setPageNumber(p.querySelector('.report-page-foot'), i + 1, pages.length));
  
    container.innerHTML = '';
    pages.forEach(p => container.appendChild(p));
    container.classList.add('report-paginated');
    stage.remove();
    fitReportPreview(container);
  }
  
  if (typeof window !== 'undefined') {
    let fitTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => {
        const el = document.getElementById('reportOutput');
        if (el) fitReportPreview(el);
      }, 150);
    });
  }

  /* ===== Module: assets/js/services/history-service.js ===== */
  /* Extracted from index.html L1141-1269, L2042-2094, L2409-2569.
   * Split notes: inventory part delegates to inventory-state; filter/stats to search/stats services.
   * Depends on ui/form-ui for view helpers (one-way: services->ui, ui never imports services). */
  
  // Fixed checkbox map (v2 §6 bugfix): legacy `test${Cap}` produced testCbc/testEsr (broken).
  const TEST_CHECKBOX_MAP = {
    cbc: 'testCBC', esr: 'testESR', typhi: 'testTyphi', dengue: 'testDengue',
    malaria: 'testMalaria', widal: 'testWidal', bloodGroup: 'testBloodGroup',
    bilirubin: 'testBilirubin', crp: 'testCRP'
  };
  
  // L1141
  function saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, existingId = null) {
    let history = loadHistoryData();
    let globalSerial = getGlobalSerial();
    const patientId = document.getElementById('patientId').value;
    const collectionDate = document.getElementById('collectionDate').value;
    const receivedDate = document.getElementById('receivedDate').value;
    const reportedDate = document.getElementById('reportedDate').value;
    const referredBy = document.getElementById('referredBy').value || 'Not specified';
    const patientPhone = document.getElementById('patientPhone') ? document.getElementById('patientPhone').value.trim() : '';
    const patientCity = document.getElementById('patientCity') ? document.getElementById('patientCity').value.trim() : '';
    const fastingStatus = document.getElementById('fastingStatus') ? document.getElementById('fastingStatus').value.trim() : '';
    const relationType = document.getElementById('relationType') ? document.getElementById('relationType').value : 'S/O';
    const rawGuardian = document.getElementById('guardianName') ? document.getElementById('guardianName').value.trim() : '';
    const guardianName = (rawGuardian === '[object Object]') ? '' : rawGuardian;
    const existingReportIndex = existingId ? history.findIndex(item => String(item.id) === String(existingId)) : -1;
    const previousTests = existingReportIndex !== -1 ? history[existingReportIndex].tests : null;
    const previousTube = existingReportIndex !== -1 ? history[existingReportIndex].tubeUsed : null;
    if (existingReportIndex === -1) { decrementTube(tubeUsed); decrementKits(tests); }
    else {
      if (previousTube !== tubeUsed) { incrementTube(previousTube); decrementTube(tubeUsed); }
      if (previousTests) adjustKitsForEdit(previousTests, tests);
    }
    let testParameters = {};
    if (tests.cbc) {
      testParameters.cbc = {
        hemoglobin: formatPointValue(document.getElementById('hemoglobin').value),
        tlc: document.getElementById('tlc').value,
        neutrophils: formatPointValue(document.getElementById('neutrophils').value),
        lymphocytes: formatPointValue(document.getElementById('lymphocytes').value),
        mid: formatPointValue(document.getElementById('mid').value),
        absoluteNeutrophils: document.getElementById('absoluteNeutrophils').value,
        absoluteLymphocytes: document.getElementById('absoluteLymphocytes').value,
        absoluteMid: document.getElementById('absoluteMid').value,
        rbcCount: formatPointValue(document.getElementById('rbcCount').value),
        pcv: formatPointValue(document.getElementById('pcv').value),
        mcv: formatPointValue(document.getElementById('mcv').value),
        mch: formatPointValue(document.getElementById('mch').value),
        mchc: formatPointValue(document.getElementById('mchc').value),
        platelet: formatPlateletValue(document.getElementById('platelet').value)
      };
    }
    if (tests.esr) testParameters.esr = { esr: document.getElementById('esr').value };
    if (tests.typhi) testParameters.typhi = { typhiResult: document.getElementById('typhiResult').value, typhiSubtype: document.getElementById('typhiSubtype').value };
    if (tests.dengue) testParameters.dengue = { dengueResult: document.getElementById('dengueResult').value, dengueSubtype: document.getElementById('dengueSubtype')?.value || 'NS1' };
    if (tests.malaria) testParameters.malaria = { malariaResult: document.getElementById('malariaResult').value, malariaSubtype: document.getElementById('malariaSubtype').value };
    if (tests.widal) testParameters.widal = { oAntigen: document.getElementById('oAntigen').value, hAntigen: document.getElementById('hAntigen').value, ahAntigen: document.getElementById('ahAntigen').value, bhAntigen: document.getElementById('bhAntigen').value };
    if (tests.bloodGroup) testParameters.bloodGroup = { bloodGroup: document.getElementById('bloodGroup').value };
    if (tests.bilirubin) testParameters.bilirubin = { totalBilirubin: document.getElementById('totalBilirubin').value, directBilirubin: document.getElementById('directBilirubin').value, indirectBilirubin: document.getElementById('indirectBilirubin').value };
    if (tests.crp) testParameters.crp = { crp: document.getElementById('crp').value };
    const historyItem = {
      serial: existingReportIndex === -1 ? ++globalSerial : history[existingReportIndex].serial,
      id: existingReportIndex === -1 ? Date.now() : existingId,
      patientName, patientAge, patientGender, patientId, collectionDate, receivedDate, reportedDate, referredBy,
      patientPhone, patientCity, fastingStatus, relationType, guardianName,
      testCost: testCost || 'Not specified', paymentMode, tubeUsed, reportHTML, tests, testParameters,
      timestamp: new Date().toLocaleString(),
      _synced: false
    };
    if (existingReportIndex === -1) { history.unshift(historyItem); setGlobalSerial(globalSerial); }
    else history[existingReportIndex] = historyItem;
    if (history.length > 10000) history = history.slice(0, 10000);
    saveHistoryData(history);
    syncReportToCloud(historyItem);
    console.log('Total reports in history:', history.length);
    return historyItem;
  }
  
  // L2042
  function loadHistory(filters = null) {
    const currentFilters = getCurrentFilters();
    if (filters) setCurrentFilters(filters);
    const merged = getCurrentFilters();
    const history = loadHistoryData();
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    const filteredHistory = applyAdvancedFilters(history, merged);
    const searchStats = calculateSearchStatistics(filteredHistory, merged);
    updateSearchSummary(filteredHistory.length, history.length, searchStats);
    if (filteredHistory.length === 0) { historyList.innerHTML = '<p class="no-results">No reports found matching your criteria</p>'; return; }
    historyList.innerHTML = '';
    filteredHistory.forEach(item => {
      const testCount = item.tests && typeof item.tests === 'object' ? Object.values(item.tests).filter(test => test === true).length : 0;
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <div class="history-item-main">
          <div class="history-item-header">
            <span class="history-serial-badge">#${escapeHtml(item.serial)}</span>
            <span class="history-patient-name">${escapeHtml(item.patientName)}</span>
            <span class="history-patient-demographics">(${escapeHtml(item.patientAge)}, ${escapeHtml(item.patientGender)})</span>
          </div>
          <div class="history-item-sub">
            <span class="history-pill">🆔 ${escapeHtml(item.patientId)}</span>
            <span class="history-pill">📅 ${escapeHtml(item.reportedDate)}</span>
            <span class="history-pill">🧪 Tests: ${testCount}</span>
            ${item.testCost && item.testCost !== 'Not specified' ? `<span class="history-cost-pill">💰 ₹${escapeHtml(item.testCost)} <small>(${escapeHtml(item.paymentMode || 'Cash')})</small></span>` : ''}
            ${item.tubeUsed ? `<span class="history-pill">🩸 ${escapeHtml(item.tubeUsed)} Tube</span>` : ''}
          </div>
        </div>
        <div class="history-item-actions">
          <button class="view-invoice" data-id="${escapeHtml(item.id)}" title="Generate / View Invoice">Invoice</button>
          ${item.testCost && item.testCost !== 'Not specified' ? `<button class="edit-cost" data-id="${escapeHtml(item.id)}" title="Edit Cost">Edit Cost</button>` : ''}
          <button class="edit-report" data-id="${escapeHtml(item.id)}" title="Edit Report">Edit Report</button>
          <button class="delete-report" data-id="${escapeHtml(item.id)}" title="Delete Report">Delete</button>
        </div>`;
      historyItem.addEventListener('click', function (e) {
        if (!e.target.classList.contains('edit-cost') && !e.target.classList.contains('delete-report') && !e.target.classList.contains('edit-report') && !e.target.classList.contains('view-invoice')) {
          if (!document.getElementById('reportOutput')) {
            window.location.href = `create-report.html?previewId=${item.id}`;
          } else {
            showReport(item);
          }
        }
      });
      historyList.appendChild(historyItem);
    });
    addHistoryItemEventListeners();
  }
  
  // Password modal close kept for Escape handler (modal removed in multi-page split)
  function closeHistoryPasswordModal() {
    const modal = document.getElementById('historyPasswordModal');
    const input = document.getElementById('historyPasswordInput');
    const error = document.getElementById('historyPasswordError');
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
    if (error) error.style.display = 'none';
  }
  
  // L2420
  function addHistoryItemEventListeners() {
    document.querySelectorAll('.view-invoice').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        window.open(`invoice.html?id=${this.dataset.id}`, '_blank');
      });
    });
    document.querySelectorAll('.edit-cost').forEach(btn => {
      btn.addEventListener('click', function (e) { e.stopPropagation(); editReportCost(this.dataset.id); });
    });
    document.querySelectorAll('.edit-report').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!document.getElementById('patientName')) {
          window.location.href = `create-report.html?editId=${this.dataset.id}`;
        } else {
          loadReportForEditing(parseInt(this.dataset.id));
        }
      });
    });
    document.querySelectorAll('.delete-report').forEach(btn => {
      btn.addEventListener('click', function (e) { e.stopPropagation(); deleteReport(this.dataset.id); });
    });
  }
  
  // L2445
  function editReportCost(id) {
    const newCost = prompt('Enter new cost in rupees:', '');
    if (newCost !== null && !isNaN(parseFloat(newCost)) && newCost.trim() !== '') {
      let history = loadHistoryData();
      const strId = String(id);
      const index = history.findIndex(item => String(item.id) === strId);
      if (index !== -1) {
        const formattedCost = parseFloat(newCost).toFixed(2);
        history[index].testCost = formattedCost;
        if (history[index].reportHTML) {
          history[index].reportHTML = history[index].reportHTML.replace(
            /(<strong>(?:Test Cost|Cost|Amount|Total Amount):<\/strong>\s*(?:₹|Rs\.?)?\s*)([0-9.]+)/i,
            `$1${formattedCost}`
          );
        }
        history[index]._synced = false;
        saveHistoryData(history);
        syncReportToCloud(history[index]);
        loadHistory(); updateTodayTotal(); updateTodayReportCount(); updateTestStats();
      }
    } else if (newCost !== null) alert('Please enter a valid number for the cost.');
  }
  
  // L2463 — with checkbox map fix
  function loadReportForEditing(id) {
    const history = loadHistoryData();
    const strId = String(id);
    const item = history.find(item => String(item.id) === strId);
    if (!item) return;
    let nameToLoad = item.patientName || '';
    const titles = ['Mr.', 'Mrs.', 'Miss', 'Master', 'Baby', 'B/O'];
    const matchingTitle = titles.find(t => nameToLoad.startsWith(t + ' '));
    if (matchingTitle) { document.getElementById('patientTitle').value = matchingTitle; nameToLoad = nameToLoad.substring(matchingTitle.length + 1).trim(); }
    
    let guardianPart = '';
    let relationPart = 'S/O';
    const guardianMatch = nameToLoad.match(/\s*\((S\/O|W\/O|D\/O|C\/O)(?:\s+([^)]*))?\)/i);
    if (guardianMatch) {
      relationPart = guardianMatch[1].toUpperCase();
      guardianPart = (guardianMatch[2] || '').trim();
      if (guardianPart === '[object Object]') guardianPart = '';
      nameToLoad = nameToLoad.replace(guardianMatch[0], '').trim();
    }
    if (document.getElementById('relationType')) {
      const rawRelation = (item.relationType && typeof item.relationType === 'string') ? item.relationType.trim() : '';
      document.getElementById('relationType').value = rawRelation || relationPart || 'S/O';
    }
    if (document.getElementById('guardianName')) {
      let rawGuardian = (item.guardianName && typeof item.guardianName === 'string') ? item.guardianName.trim() : '';
      if (rawGuardian === '[object Object]') rawGuardian = '';
      document.getElementById('guardianName').value = rawGuardian || guardianPart || '';
    }
    document.getElementById('patientName').value = nameToLoad;
    if (document.getElementById('patientPhone')) document.getElementById('patientPhone').value = item.patientPhone || '';
    if (document.getElementById('patientCity')) document.getElementById('patientCity').value = item.patientCity || '';
    if (document.getElementById('fastingStatus')) document.getElementById('fastingStatus').value = item.fastingStatus || '';
    const ageStr = (item.patientAge || '').toString().trim();
    const ageUnitMatch = ageStr.match(/(Yrs|Months|Days)/i);
    if (ageUnitMatch) {
      const m = ageUnitMatch[0].toLowerCase();
      document.getElementById('patientAgeUnit').value = m.startsWith('month') ? 'Months' : m.startsWith('day') ? 'Days' : 'Yrs';
      document.getElementById('patientAge').value = ageStr.replace(/(Yrs|Months|Days)/i, '').trim();
    } else { document.getElementById('patientAge').value = ageStr; document.getElementById('patientAgeUnit').value = 'Yrs'; }
    document.getElementById('patientGender').value = item.patientGender;
    document.getElementById('patientId').value = item.patientId;
    document.getElementById('collectionDate').value = item.collectionDate;
    document.getElementById('receivedDate').value = item.receivedDate || item.collectionDate;
    document.getElementById('reportedDate').value = item.reportedDate;
    document.getElementById('referredBy').value = item.referredBy && item.referredBy !== 'Not specified' ? item.referredBy : 'SELF';
    document.getElementById('testCost').value = item.testCost !== 'Not specified' ? item.testCost : '';
    document.getElementById('paymentCash').checked = item.paymentMode === 'Cash';
    document.getElementById('paymentOnline').checked = item.paymentMode === 'Online';
    document.getElementById('tubePurple').checked = item.tubeUsed === 'Purple';
    document.getElementById('tubeRed').checked = item.tubeUsed === 'Red';
    for (const test in item.tests) {
      const checkboxId = TEST_CHECKBOX_MAP[test] || `test${test.charAt(0).toUpperCase() + test.slice(1)}`;
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) checkbox.checked = item.tests[test];
    }
    toggleTestInputs(); updateSuggestedCost();
    if (item.testParameters) {
      for (const test in item.testParameters) {
        for (const param in item.testParameters[test]) {
          const input = document.getElementById(param);
          if (input) input.value = item.testParameters[test][param] || '';
        }
      }
      toggleTestInputs();
    }
    if (item.tests && item.tests.cbc) {
      formatCBCDecimalInputs();
      calculateCBCParameters();
    }
    const histModal = document.getElementById('historyModal');
    if (histModal) histModal.style.display = 'none';
    const reportOut = document.getElementById('reportOutput');
    if (reportOut) reportOut.style.display = 'none';
    const patInfo = document.querySelector('.patient-info');
    if (patInfo) patInfo.style.display = 'grid';
    const testSel = document.querySelector('.test-selection');
    if (testSel) testSel.style.display = 'block';
    const testInp = document.querySelector('.test-inputs');
    if (testInp) testInp.style.display = 'block';
    const costSec = document.querySelector('.cost-section');
    if (costSec) costSec.style.display = 'flex';
    const testStats = document.querySelector('.test-stats');
    if (testStats) testStats.style.display = 'block';
    const printRep = document.getElementById('printReport');
    if (printRep) printRep.classList.remove('enabled');
    const savePdf = document.getElementById('savePDF');
    if (savePdf) savePdf.classList.remove('enabled');
    const editRep = document.getElementById('editReport');
    if (editRep) editRep.classList.remove('enabled');
    toggleGenerateUpdateButton(true, id);
    setFormButtonMode(true);
    validatePatientId();
  }
  
  // L2543
  function deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    const strId = String(id);
    addTombstone(strId);
    let history = loadHistoryData();
    const itemIndex = history.findIndex(item => String(item.id) === strId);
    if (itemIndex !== -1) {
      const item = history[itemIndex];
      if (item.tubeUsed) incrementTube(item.tubeUsed);
      if (item.tests) incrementKits(item.tests);
    }
    history = history.filter(item => String(item.id) !== strId);
    saveHistoryData(history);
    deleteReportFromCloud(strId);
    loadHistory(); updateTodayTotal(); updateTodayReportCount(); updateTestStats();
  }

  /* ===== Module: assets/js/services/report-actions.js ===== */
  function readFormTests() {
    return {
      cbc: document.getElementById('testCBC').checked, esr: document.getElementById('testESR').checked,
      typhi: document.getElementById('testTyphi').checked, dengue: document.getElementById('testDengue').checked,
      malaria: document.getElementById('testMalaria').checked, widal: document.getElementById('testWidal').checked,
      bloodGroup: document.getElementById('testBloodGroup').checked, bilirubin: document.getElementById('testBilirubin').checked,
      crp: document.getElementById('testCRP').checked
    };
  }
  function readPatient() {
    const patientTitle = document.getElementById('patientTitle') ? document.getElementById('patientTitle').value : '';
    const rawName = document.getElementById('patientName').value.trim();
    let patientName = (patientTitle && !rawName.toLowerCase().startsWith(patientTitle.toLowerCase())) ? `${patientTitle} ${rawName}` : rawName;
    const relationType = document.getElementById('relationType') ? document.getElementById('relationType').value : 'S/O';
    const rawGuardian = document.getElementById('guardianName') ? document.getElementById('guardianName').value.trim() : '';
    const guardianName = (rawGuardian === '[object Object]') ? '' : rawGuardian;
    const ageVal = document.getElementById('patientAge').value.trim();
    const ageUnit = document.getElementById('patientAgeUnit') ? document.getElementById('patientAgeUnit').value : 'Yrs';
    return { patientTitle, rawName, patientName, relationType, guardianName, ageVal, ageUnit, patientAge: ageVal ? `${ageVal} ${ageUnit}` : '', patientGender: document.getElementById('patientGender').value };
  }
  function showGeneratedReport(reportHTML) {
    document.getElementById('reportOutput').innerHTML = reportHTML;
    document.getElementById('reportOutput').style.display = 'block';
    document.querySelector('.test-inputs').style.display = 'none';
    document.querySelector('.patient-info').style.display = 'none';
    document.querySelector('.test-selection').style.display = 'none';
    document.querySelector('.cost-section').style.display = 'none';
    const testStats = document.querySelector('.test-stats');
    if (testStats) testStats.style.display = 'none';
    paginateReport(document.getElementById('reportOutput'));
    setPreviewButtonMode();
  }
  
  // L1500
  function generateReport() {
    if (!validatePatientId()) {
      if (!confirm('This Patient ID already exists! Are you sure you want to create a duplicate report?')) return;
    }
    const { rawName, patientName, ageVal, patientAge, patientGender } = readPatient();
    const paymentCash = document.getElementById('paymentCash').checked;
    const paymentOnline = document.getElementById('paymentOnline').checked;
    const tubePurple = document.getElementById('tubePurple').checked;
    if (!rawName || !ageVal || !patientGender) { alert('Please fill in all required patient information fields.'); return; }
    if (!paymentCash && !paymentOnline) { alert('Please select a payment mode (Cash or Online).'); return; }
    const paymentMode = paymentCash ? 'Cash' : 'Online';
    const tubeUsed = tubePurple ? 'Purple' : 'Red';
    const tests = readFormTests();
    if (!Object.values(tests).includes(true)) { alert('Please select at least one test.'); return; }
    if (tests.cbc) {
      formatCBCDecimalInputs();
      calculateCBCParameters();
    }
    const duplicateCheck = checkDuplicatePatient(patientName, patientAge, patientGender, tests);
    if (duplicateCheck && duplicateCheck.isDuplicate) {
      const confirmed = confirm(`DUPLICATE PATIENT WARNING!\n\nPatient: ${patientName} (${patientAge}, ${patientGender})\n${duplicateCheck.message}\n\nExisting Report: #${duplicateCheck.existingReport.serial} from ${formatDisplayDate(duplicateCheck.existingReport.reportedDate)}\n\nAre you sure you want to generate the same tests again?`);
      if (!confirmed) return;
    }
    const testCost = document.getElementById('testCost').value;
    const reportHTML = createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed);
    const savedItem = saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, null);
    if (savedItem && savedItem.id) {
      setLastGeneratedReportId(savedItem.id);
    }
    updateTodayTotal(); updateTodayReportCount(); updateTestStats();
    showGeneratedReport(reportHTML);
  }
  
  // L1596
  function updateReport() {
    const { currentEditingId } = getAppState();
    if (!currentEditingId) return;
    const { rawName, patientName, ageVal, patientAge, patientGender } = readPatient();
    const paymentCash = document.getElementById('paymentCash').checked;
    const paymentOnline = document.getElementById('paymentOnline').checked;
    const tubePurple = document.getElementById('tubePurple').checked;
    if (!rawName || !ageVal || !patientGender) { alert('Please fill in all required patient information fields.'); return; }
    if (!paymentCash && !paymentOnline) { alert('Please select a payment mode (Cash or Online).'); return; }
    const paymentMode = paymentCash ? 'Cash' : 'Online';
    const tubeUsed = tubePurple ? 'Purple' : 'Red';
    const tests = readFormTests();
    if (!Object.values(tests).includes(true)) { alert('Please select at least one test.'); return; }
    if (tests.cbc) {
      formatCBCDecimalInputs();
      calculateCBCParameters();
    }
    const testCost = document.getElementById('testCost').value;
    const reportHTML = createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed);
    saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, currentEditingId);
    setLastGeneratedReportId(currentEditingId);
    updateTodayTotal(); updateTodayReportCount(); updateTestStats();
    toggleGenerateUpdateButton(false);
    showGeneratedReport(reportHTML);
  }

  /* ===== Module: assets/js/services/inventory-service.js ===== */
  /* Extracted from index.html L2900-2932 — refactored to clean UI modals. */
  
  function openInventoryPasswordModal() {
    const modal = document.getElementById('inventoryPasswordModal');
    const input = document.getElementById('inventoryPasswordInput');
    const error = document.getElementById('inventoryPasswordError');
    if (modal) {
      modal.style.display = 'flex';
      if (error) error.style.display = 'none';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
    }
  }
  
  function closeInventoryPasswordModal() {
    const modal = document.getElementById('inventoryPasswordModal');
    const input = document.getElementById('inventoryPasswordInput');
    const error = document.getElementById('inventoryPasswordError');
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
    if (error) error.style.display = 'none';
  }
  
  function submitInventoryPassword() {
    const input = document.getElementById('inventoryPasswordInput');
    const error = document.getElementById('inventoryPasswordError');
    if (input && input.value === INVENTORYUPDATE_PASSWORD) {
      closeInventoryPasswordModal();
      openUpdateInventoryModal();
    } else {
      if (error) error.style.display = 'block';
      if (input) {
        input.focus();
        input.select();
      }
    }
  }
  
  function openUpdateInventoryModal() {
    const modal = document.getElementById('updateInventoryModal');
    const error = document.getElementById('inventoryEditError');
    const tubeCounts = getTubeCounts();
    const kitCounts = getKitCounts();
  
    const purpleInput = document.getElementById('invPurpleTubes');
    const redInput = document.getElementById('invRedTubes');
    const typhoidInput = document.getElementById('invTyphoidKits');
    const malariaInput = document.getElementById('invMalariaKits');
    const dengueInput = document.getElementById('invDengueKits');
  
    if (purpleInput) purpleInput.value = tubeCounts.purple;
    if (redInput) redInput.value = tubeCounts.red;
    if (typhoidInput) typhoidInput.value = kitCounts.typhoid;
    if (malariaInput) malariaInput.value = kitCounts.malaria;
    if (dengueInput) dengueInput.value = kitCounts.dengue;
  
    if (error) error.style.display = 'none';
    if (modal) {
      modal.style.display = 'flex';
      if (purpleInput) setTimeout(() => purpleInput.focus(), 50);
    }
  }
  
  function closeUpdateInventoryModal() {
    const modal = document.getElementById('updateInventoryModal');
    const error = document.getElementById('inventoryEditError');
    if (modal) modal.style.display = 'none';
    if (error) error.style.display = 'none';
  }
  
  function saveInventoryChanges() {
    const error = document.getElementById('inventoryEditError');
    const purpleVal = parseInt(document.getElementById('invPurpleTubes')?.value);
    const redVal = parseInt(document.getElementById('invRedTubes')?.value);
    const typhoidVal = parseInt(document.getElementById('invTyphoidKits')?.value);
    const malariaVal = parseInt(document.getElementById('invMalariaKits')?.value);
    const dengueVal = parseInt(document.getElementById('invDengueKits')?.value);
  
    if (isNaN(purpleVal) || purpleVal < 0 ||
        isNaN(redVal) || redVal < 0 ||
        isNaN(typhoidVal) || typhoidVal < 0 ||
        isNaN(malariaVal) || malariaVal < 0 ||
        isNaN(dengueVal) || dengueVal < 0) {
      if (error) {
        error.textContent = 'Please enter valid positive numbers for all inventory quantities.';
        error.style.display = 'block';
      }
      return;
    }
  
    // Online-only authoritative recount: never queue stale absolute numbers.
    if (getSupabaseClient() && typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (error) {
        error.textContent = 'Offline: reconnect to update stock (not saved).';
        error.style.display = 'block';
      }
      return;
    }
  
    setTubeCounts(purpleVal, redVal);
    setKitCounts(typhoidVal, malariaVal, dengueVal);
    pushCloudInventory().catch(e => console.warn('Inventory push error:', e));
  
    const statsModal = document.getElementById('statisticsModal');
    if (statsModal && statsModal.style.display === 'block') {
      renderStatistics();
    }
  
    closeUpdateInventoryModal();
  }
  
  function updateTubeInventoryWithPassword() {
    openInventoryPasswordModal();
  }

  /* ===== Module: assets/js/services/idle-service.js ===== */
  /**
   * assets/js/services/idle-service.js
   *
   * Inactivity Detection & Operational Privacy Lock Service.
   * - Monitors user movement (mouse, keyboard, touch, scroll) across all application pages.
   * - If inactive for 5 minutes (300,000 ms) on any non-dashboard page, redirects to dashboard.html with screen lock.
   * - In dashboard.html, displays full-screen privacy blur over the entire screen until user moves/types/touches.
   * - On interaction, triggers an immediate hard refresh (cache-busting reload) while keeping the 4 collection cards blurred until clicked.
   */
  
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const IDLE_LOCK_STORAGE_KEY = 'shc_idle_locked';
  const COLLECTION_BLUR_KEY = 'shc_collection_blurred';
  
  let idleTimer = null;
  let isFullBlurActive = false;
  
  function isDashboardPage() {
    return !!document.getElementById('dashboardOverview');
  }
  
  function blurCollectionCards() {
    const cards = document.querySelectorAll('.dashboard-cards-grid .dash-card');
    cards.forEach(card => card.classList.add('cards-privacy-blurred'));
  }
  
  function unblurCollectionCards() {
    const cards = document.querySelectorAll('.dashboard-cards-grid .dash-card');
    cards.forEach(card => card.classList.remove('cards-privacy-blurred'));
    try {
      sessionStorage.removeItem(COLLECTION_BLUR_KEY);
    } catch (e) {}
  }
  
  function showScreenPrivacyOverlay() {
    if (document.getElementById('screenPrivacyOverlay')) return;
    isFullBlurActive = true;
    blurCollectionCards();
  
    // Directly apply full-screen blur class to body
    document.body.classList.add('screen-idle-locked');
  
    const overlay = document.createElement('div');
    overlay.id = 'screenPrivacyOverlay';
    overlay.className = 'screen-privacy-overlay';
    overlay.setAttribute('role', 'alert');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <div class="screen-privacy-card">
        <div class="privacy-lock-icon">🔒</div>
        <h3>Screen Inactivity Privacy Lock</h3>
        <p>Laboratory counter privacy engaged due to 5 minutes of inactivity.</p>
        <div class="privacy-hint">Move mouse, press any key, or touch screen to resume</div>
      </div>
    `;
    document.body.appendChild(overlay);
  
    let startX = null;
    let startY = null;
  
    const onMouseMove = (e) => {
      if (startX === null || startY === null) {
        startX = e.clientX;
        startY = e.clientY;
        return;
      }
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 15) {
        dismissFullscreenBlur();
      }
    };
  
    const dismissFullscreenBlur = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', dismissFullscreenBlur);
      window.removeEventListener('touchstart', dismissFullscreenBlur);
      window.removeEventListener('click', dismissFullscreenBlur);
  
      // Persist collection privacy blur across the hard refresh
      try {
        sessionStorage.setItem(COLLECTION_BLUR_KEY, 'true');
        sessionStorage.removeItem(IDLE_LOCK_STORAGE_KEY);
      } catch (e) {}
  
      // Immediate hard refresh (cache-busting reload)
      window.location.replace('dashboard.html?_t=' + Date.now());
    };
  
    // Attach dismiss listeners after slight delay to ignore synthetic initial events
    setTimeout(() => {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('keydown', dismissFullscreenBlur, { passive: true, once: true });
      window.addEventListener('touchstart', dismissFullscreenBlur, { passive: true, once: true });
      window.addEventListener('click', dismissFullscreenBlur, { passive: true, once: true });
    }, 400);
  }
  
  function handleInactivityTimeout() {
    if (isDashboardPage()) {
      showScreenPrivacyOverlay();
    } else {
      try {
        sessionStorage.setItem(IDLE_LOCK_STORAGE_KEY, 'true');
      } catch (e) {}
      window.location.href = 'dashboard.html?idle_lock=true';
    }
  }
  
  function resetInactivityTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(handleInactivityTimeout, INACTIVITY_TIMEOUT_MS);
  }
  
  function initInactivityWatcher() {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'input'];
    events.forEach(eventName => {
      window.addEventListener(eventName, () => {
        if (!isFullBlurActive) {
          resetInactivityTimer();
        }
      }, { passive: true });
    });
  
    resetInactivityTimer();
  
    // If on Dashboard, check if we arrived via idle lock or reload with cards privacy
    if (isDashboardPage()) {
      let wasIdle = false;
      let keepCardsBlurred = false;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        wasIdle = urlParams.get('idle_lock') === 'true' || sessionStorage.getItem(IDLE_LOCK_STORAGE_KEY) === 'true';
        keepCardsBlurred = sessionStorage.getItem(COLLECTION_BLUR_KEY) === 'true';
      } catch (e) {}
  
      if (wasIdle) {
        showScreenPrivacyOverlay();
      } else if (keepCardsBlurred) {
        blurCollectionCards();
      }
  
      // Attach click listener to collection cards to unblur them when clicked
      const cards = document.querySelectorAll('.dashboard-cards-grid .dash-card');
      cards.forEach(card => {
        card.addEventListener('click', function () {
          unblurCollectionCards();
        });
      });
    }
  }

  /* ===== Module: assets/js/ui/form-ui.js ===== */
  // L962
  function computePatientTitle({ ageVal, ageUnit = 'Yrs', gender = '' } = {}) {
    const hasValidAge = typeof ageVal === 'number' && !isNaN(ageVal) && ageVal >= 0;
  
    if (!hasValidAge) {
      if (gender === 'Male') return 'Mr.';
      if (gender === 'Female') return 'Miss';
      return null;
    }
  
    if (ageUnit === 'Days' || ageUnit === 'Months' || (ageUnit === 'Yrs' && ageVal < 1)) {
      return 'Baby';
    }
  
    if (ageUnit === 'Yrs') {
      if (ageVal <= 12) {
        if (gender === 'Male') return 'Master';
        if (gender === 'Female') return ageVal < 2 ? 'Baby' : 'Miss';
      } else if (ageVal >= 13 && ageVal <= 17) {
        if (gender === 'Male') return 'Mr.';
        if (gender === 'Female') return 'Miss';
      } else if (ageVal >= 18) {
        if (gender === 'Male') return 'Mr.';
        if (gender === 'Female') return 'Mrs.';
      }
    }
  
    return null;
  }
  
  function autoUpdatePatientTitle() {
    const titleSelect = document.getElementById('patientTitle');
    if (!titleSelect) return;
  
    const genderEl = document.getElementById('patientGender');
    const gender = genderEl ? genderEl.value : '';
  
    const ageInputEl = document.getElementById('patientAge');
    const ageInput = ageInputEl ? ageInputEl.value.trim() : '';
    const ageVal = parseFloat(ageInput);
  
    const ageUnitEl = document.getElementById('patientAgeUnit');
    const ageUnit = ageUnitEl ? ageUnitEl.value : 'Yrs';
  
    const newTitle = computePatientTitle({ ageVal, ageUnit, gender });
    if (newTitle) {
      titleSelect.value = newTitle;
    }
  }
  
  // L988
  function setSectionVisibility(id, visible, showDisplay = 'block') {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('is-hidden', !visible);
    el.style.display = visible ? showDisplay : 'none';
  }
  function toggleTestInputs() {
    setSectionVisibility('cbcInputs', document.getElementById('testCBC').checked);
    setSectionVisibility('esrInputs', document.getElementById('testESR').checked);
    setSectionVisibility('typhiInputs', document.getElementById('testTyphi').checked);
    setSectionVisibility('dengueInputs', document.getElementById('testDengue').checked);
    setSectionVisibility('malariaInputs', document.getElementById('testMalaria').checked);
    setSectionVisibility('widalInputs', document.getElementById('testWidal').checked);
    setSectionVisibility('bloodGroupInputs', document.getElementById('testBloodGroup').checked);
    setSectionVisibility('bilirubinInputs', document.getElementById('testBilirubin').checked);
    setSectionVisibility('crpInputs', document.getElementById('testCRP').checked);
    const isTyphiPositive = document.getElementById('typhiResult').value === 'Positive';
    setSectionVisibility('typhiSubtypeContainer', (document.getElementById('testTyphi').checked && isTyphiPositive));
    const isDenguePositive = document.getElementById('dengueResult')?.value === 'Positive';
    setSectionVisibility('dengueSubtypeContainer', (document.getElementById('testDengue').checked && isDenguePositive));
    const isMalariaPositive = document.getElementById('malariaResult').value === 'Positive';
    setSectionVisibility('malariaSubtypeContainer', (document.getElementById('testMalaria').checked && isMalariaPositive));
  }
  
  function setPreviewButtonMode() {
    document.body.classList.add('report-preview-active');
    const generateBtn = document.getElementById('generateReport');
    const updateBtn = document.getElementById('updateReport');
    const editBtn = document.getElementById('editReport');
    const printBtn = document.getElementById('printReport');
    const savePdfBtn = document.getElementById('savePDF');
    const newBtn = document.getElementById('newReport');
    const viewHistoryBtn = document.getElementById('viewHistory');
    const statisticsBtn = document.getElementById('statisticsBtn');
  
    if (generateBtn) generateBtn.style.display = 'none';
    if (updateBtn) { updateBtn.classList.add('is-hidden'); updateBtn.style.display = 'none'; }
    if (editBtn) {
      editBtn.classList.remove('is-hidden');
      editBtn.style.display = 'inline-block';
      editBtn.classList.add('enabled');
    }
    if (printBtn) {
      printBtn.classList.remove('is-hidden');
      printBtn.style.display = 'inline-block';
      printBtn.classList.add('enabled');
    }
    if (savePdfBtn) {
      savePdfBtn.classList.remove('is-hidden');
      savePdfBtn.style.display = 'inline-block';
      savePdfBtn.classList.add('enabled');
    }
    if (newBtn) newBtn.style.display = 'inline-block';
    if (viewHistoryBtn) viewHistoryBtn.style.display = 'none';
    if (statisticsBtn) statisticsBtn.style.display = 'none';
  }
  
  function setFormButtonMode(isEditMode = false) {
    document.body.classList.remove('report-preview-active');
    const generateBtn = document.getElementById('generateReport');
    const updateBtn = document.getElementById('updateReport');
    const editBtn = document.getElementById('editReport');
    const printBtn = document.getElementById('printReport');
    const savePdfBtn = document.getElementById('savePDF');
    const newBtn = document.getElementById('newReport');
    const viewHistoryBtn = document.getElementById('viewHistory');
    const statisticsBtn = document.getElementById('statisticsBtn');
  
    if (isEditMode) {
      if (generateBtn) generateBtn.style.display = 'none';
      if (updateBtn) { updateBtn.classList.remove('is-hidden'); updateBtn.style.display = 'inline-block'; }
    } else {
      if (generateBtn) generateBtn.style.display = 'inline-block';
      if (updateBtn) { updateBtn.classList.add('is-hidden'); updateBtn.style.display = 'none'; }
    }
  
    if (editBtn) {
      editBtn.classList.add('is-hidden');
      editBtn.style.display = 'none';
      editBtn.classList.remove('enabled');
    }
    if (printBtn) {
      printBtn.classList.add('is-hidden');
      printBtn.style.display = 'none';
      printBtn.classList.remove('enabled');
    }
    if (savePdfBtn) {
      savePdfBtn.classList.add('is-hidden');
      savePdfBtn.style.display = 'none';
      savePdfBtn.classList.remove('enabled');
    }
    if (newBtn) newBtn.style.display = 'inline-block';
    if (viewHistoryBtn) viewHistoryBtn.style.display = 'none';
    if (statisticsBtn) statisticsBtn.style.display = 'none';
  }
  
  // L2269 — moved from history/report to ui (v2 cycle-break delta, behaviour identical)
  function showReport(item) {
    if (item && item.id) {
      setCurrentPreviewHistoryId(item.id);
    }
    const reportOut = document.getElementById('reportOutput');
    if (reportOut) {
      reportOut.innerHTML = item.reportHTML;
      reportOut.style.display = 'block';
    }
    const testInp = document.querySelector('.test-inputs');
    if (testInp) testInp.style.display = 'none';
    const patInfo = document.querySelector('.patient-info');
    if (patInfo) patInfo.style.display = 'none';
    const testSel = document.querySelector('.test-selection');
    if (testSel) testSel.style.display = 'none';
    const costSec = document.querySelector('.cost-section');
    if (costSec) costSec.style.display = 'none';
    const testStats = document.querySelector('.test-stats');
    if (testStats) testStats.style.display = 'none';
    paginateReport(reportOut);
    setPreviewButtonMode();
    const histModal = document.getElementById('historyModal');
    if (histModal) histModal.style.display = 'none';
  }
  
  function hideReportShowForm(isEditMode = false) {
    document.getElementById('reportOutput').style.display = 'none';
    document.querySelector('.test-inputs').style.display = 'block';
    document.querySelector('.patient-info').style.display = 'grid';
    document.querySelector('.test-selection').style.display = 'block';
    document.querySelector('.cost-section').style.display = 'flex';
    const testStats = document.querySelector('.test-stats');
    if (testStats) testStats.style.display = 'block';
    setFormButtonMode(isEditMode);
  }
  
  function bindMutualExclusivity() {
    const cashCheckbox = document.getElementById('paymentCash');
    const onlineCheckbox = document.getElementById('paymentOnline');
    cashCheckbox.addEventListener('change', function () { if (this.checked) onlineCheckbox.checked = false; });
    onlineCheckbox.addEventListener('change', function () { if (this.checked) cashCheckbox.checked = false; });
    const purpleTubeCheckbox = document.getElementById('tubePurple');
    const redTubeCheckbox = document.getElementById('tubeRed');
    purpleTubeCheckbox.addEventListener('change', function () { if (this.checked) redTubeCheckbox.checked = false; });
    redTubeCheckbox.addEventListener('change', function () { if (this.checked) purpleTubeCheckbox.checked = false; });
  }
  
  function bindTestCheckboxes() {
    document.querySelectorAll('.test-option input').forEach(checkbox => {
      checkbox.addEventListener('change', function () { toggleTestInputs(); updateSuggestedCost(); });
    });
    document.getElementById('typhiResult').addEventListener('change', toggleTestInputs);
    document.getElementById('dengueResult')?.addEventListener('change', toggleTestInputs);
    document.getElementById('malariaResult').addEventListener('change', toggleTestInputs);
  }

  /* ===== Module: assets/js/services/invoice-service.js ===== */
  /* ==========================================================================
     SHAMS HEALTH CARE - INVOICE SERVICE & INTERACTION HANDLER
     --------------------------------------------------------------------------
     ARCHITECTURE NOTE (B13):
     Invoices are ephemeral, stateless views rendered on-the-fly from underlying
     lab report records (loaded via loadHistoryData()). Line-item customizations
     and temporary adjustments are not persisted to cloud storage.
     ========================================================================== */
  
  
  const INVOICE_TEST_CATALOG = {
    cbc: { name: 'Complete Blood Count (CBC / Hemogram)', sample: 'EDTA Whole Blood', rate: PRICES.cbc },
    esr: { name: 'Erythrocyte Sedimentation Rate (ESR)', sample: 'EDTA Whole Blood', rate: PRICES.esr },
    typhi: { name: 'Typhoid (Typhi-dot) Rapid Antibody Test', sample: 'Serum / Whole Blood', rate: PRICES.typhi },
    dengue: { name: 'Dengue NS1 Antigen & IgG/IgM Antibodies', sample: 'Serum / Whole Blood', rate: PRICES.dengue },
    malaria: { name: 'Malaria Antigen Rapid Test (Pv / Pf)', sample: 'Whole Blood', rate: PRICES.malaria },
    widal: { name: 'Widal Slide Agglutination Test (S. Typhi)', sample: 'Serum', rate: PRICES.widal },
    bloodGroup: { name: 'ABO & Rh Blood Grouping', sample: 'Whole Blood', rate: PRICES.bloodGroup },
    bilirubin: { name: 'Serum Bilirubin Profile (Total, Direct, Indirect)', sample: 'Serum', rate: PRICES.bilirubin },
    crp: { name: 'C-Reactive Protein (CRP) Quantitative', sample: 'Serum', rate: PRICES.crp }
  };
  
  function numberToIndianWords(num) {
    const n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return 'Zero Rupees Only';
  
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
    function convertTwoDigits(v) {
      if (v < 20) return units[v];
      const unit = v % 10;
      return tens[Math.floor(v / 10)] + (unit ? ' ' + units[unit] : '');
    }
  
    function convertThreeDigits(v) {
      let str = '';
      const hundred = Math.floor(v / 100);
      const rem = v % 100;
      if (hundred > 0) str += units[hundred] + ' Hundred';
      if (rem > 0) {
        if (str) str += ' and ';
        str += convertTwoDigits(rem);
      }
      return str;
    }
  
    let words = '';
    const crore = Math.floor(n / 10000000);
    let rem = n % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;
    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;
  
    if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
    if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
    if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
    if (rem > 0) words += convertThreeDigits(rem);
  
    return words.trim() + ' Rupees Only';
  }
  
  let activeReport = null;
  
  function initInvoicePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
  
    const printBtn = document.getElementById('btnPrintInvoice');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  
    const resetBtn = document.getElementById('btnResetInvoice');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (activeReport && confirm('Reset all invoice edits to original report details?')) {
          renderInvoice(activeReport);
        }
      });
    }
  
    const addBtn = document.getElementById('btnAddItem');
    if (addBtn) {
      addBtn.addEventListener('click', () => addInvoiceRow());
    }
  
    if (!reportId) {
      showInvoiceEmptyState('No Report Selected', 'Please navigate to Report History and click the "Invoice" button on a specific report.');
      return;
    }
  
    const history = loadHistoryData();
    const report = history.find(item => String(item.id) === String(reportId));
  
    if (!report) {
      showInvoiceEmptyState('Report Not Found', `Unable to find report #${reportId} in local or synchronized records.`);
      return;
    }
  
    activeReport = report;
    bindInvoiceTableEvents();
    renderInvoice(report);
  }
  
  function renderInvoice(report) {
    const invoiceContainer = document.getElementById('invoiceSheet');
    const emptyState = document.getElementById('invoiceEmptyState');
    if (emptyState) emptyState.style.display = 'none';
    if (invoiceContainer) invoiceContainer.style.display = 'block';
  
    // Invoice Meta
    const year = new Date().getFullYear();
    const invNumberElem = document.getElementById('invNumber');
    if (invNumberElem) invNumberElem.innerText = `INV-${year}-${String(report.serial || '001').padStart(4, '0')}`;
  
    const invDateElem = document.getElementById('invDate');
    if (invDateElem) invDateElem.innerText = report.reportedDate || report.collectionDate || new Date().toISOString().split('T')[0];
  
    const invSerialElem = document.getElementById('invSerial');
    if (invSerialElem) invSerialElem.innerText = `#${report.serial || 'N/A'}`;
  
    const invPaymentModeElem = document.getElementById('invPaymentMode');
    if (invPaymentModeElem) invPaymentModeElem.innerText = report.paymentMode || 'Cash';
  
    const invPaymentStatusElem = document.getElementById('invPaymentStatus');
    if (invPaymentStatusElem) invPaymentStatusElem.innerText = 'PAID';
  
    // Patient Demographics
    const invPatientNameElem = document.getElementById('invPatientName');
    if (invPatientNameElem) invPatientNameElem.innerText = report.patientName || 'Not specified';
  
    const invPatientIdElem = document.getElementById('invPatientId');
    if (invPatientIdElem) invPatientIdElem.innerText = report.patientId || 'N/A';
  
    const ageGenderStr = [report.patientAge, report.patientGender].filter(Boolean).join(' / ') || 'N/A';
    const invAgeGenderElem = document.getElementById('invAgeGender');
    if (invAgeGenderElem) invAgeGenderElem.innerText = ageGenderStr;
  
    const invPhoneElem = document.getElementById('invPhone');
    if (invPhoneElem) invPhoneElem.innerText = report.patientPhone || 'N/A';
  
    const invCityElem = document.getElementById('invCity');
    if (invCityElem) invCityElem.innerText = report.patientCity || 'N/A';
  
    const invReferredByElem = document.getElementById('invReferredBy');
    if (invReferredByElem) invReferredByElem.innerText = report.referredBy || 'Self';
  
    const invCollectionDateElem = document.getElementById('invCollectionDate');
    if (invCollectionDateElem) invCollectionDateElem.innerText = report.collectionDate || report.reportedDate || 'N/A';
  
    // Build items from report.tests
    const tbody = document.getElementById('invTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      const selectedTests = [];
  
      if (report.tests && typeof report.tests === 'object') {
        Object.keys(report.tests).forEach(testKey => {
          if (report.tests[testKey] === true && INVOICE_TEST_CATALOG[testKey]) {
            selectedTests.push(INVOICE_TEST_CATALOG[testKey]);
          }
        });
      }
  
      if (selectedTests.length === 0) {
        const fallbackCost = parseFloat(report.testCost) || 0;
        selectedTests.push({
          name: 'Diagnostic Clinical Investigation',
          sample: 'Blood / Serum',
          rate: fallbackCost
        });
      }
  
      let subtotal = 0;
      selectedTests.forEach((t, idx) => {
        subtotal += t.rate;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="td-num">${idx + 1}</td>
          <td><span contenteditable="true" class="editable-field td-desc">${t.name}</span></td>
          <td><span contenteditable="true" class="editable-field td-sample">${t.sample}</span></td>
          <td class="td-rate"><span contenteditable="true" class="editable-field td-rate-val">${t.rate}</span></td>
          <td class="td-amount"><span contenteditable="true" class="editable-field td-amount-val">${t.rate}</span></td>
          <td class="td-action no-print"><button type="button" class="item-delete-btn" title="Delete row">✕</button></td>
        `;
        tbody.appendChild(tr);
      });
  
      const netCost = report.testCost && report.testCost !== 'Not specified' ? (parseFloat(report.testCost) || subtotal) : subtotal;
      const discount = Math.max(0, subtotal - netCost);
  
      updateInvoiceTotals(subtotal, discount, 0);
    }
  }
  
  let _invoiceEventsBound = false;
  
  function bindInvoiceTableEvents() {
    if (_invoiceEventsBound) return;
    const tbody = document.getElementById('invTableBody');
    if (!tbody) return;
    _invoiceEventsBound = true;
  
    // Handle amount and rate editing
    tbody.addEventListener('input', function (e) {
      if (e.target.classList.contains('td-amount-val') || e.target.classList.contains('td-rate-val')) {
        recalculateInvoiceFromTable();
      }
    });
  
    // Handle delete button click
    tbody.addEventListener('click', function (e) {
      if (e.target.classList.contains('item-delete-btn')) {
        const row = e.target.closest('tr');
        if (row) {
          row.remove();
          reindexInvoiceRows();
          recalculateInvoiceFromTable();
        }
      }
    });
  
    // Handle manual discount editing
    const discountElem = document.getElementById('invDiscount');
    if (discountElem) {
      discountElem.oninput = () => {
        recalculateInvoiceFromTable();
      };
    }
  
    // Handle manual tax editing
    const taxElem = document.getElementById('invTax');
    if (taxElem) {
      taxElem.oninput = () => {
        recalculateInvoiceFromTable();
      };
    }
  
    // Handle manual net total editing
    const netElem = document.getElementById('invNetTotal');
    if (netElem) {
      netElem.oninput = () => {
        const net = parseFloat(netElem.innerText.replace(/[^0-9.-]/g, '')) || 0;
        const wordsElem = document.getElementById('invAmountInWords');
        if (wordsElem) wordsElem.innerText = numberToIndianWords(net);
        const paidElem = document.getElementById('invPaidAmount');
        if (paidElem) paidElem.innerText = `₹${net.toFixed(0)}`;
      };
    }
  }
  
  function addInvoiceRow() {
    const tbody = document.getElementById('invTableBody');
    if (!tbody) return;
  
    const rowCount = tbody.querySelectorAll('tr').length;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-num">${rowCount + 1}</td>
      <td><span contenteditable="true" class="editable-field td-desc">Additional Diagnostic / Sample Charge</span></td>
      <td><span contenteditable="true" class="editable-field td-sample">Blood / Serum</span></td>
      <td class="td-rate"><span contenteditable="true" class="editable-field td-rate-val">100</span></td>
      <td class="td-amount"><span contenteditable="true" class="editable-field td-amount-val">100</span></td>
      <td class="td-action no-print"><button type="button" class="item-delete-btn" title="Delete row">✕</button></td>
    `;
    tbody.appendChild(tr);
    recalculateInvoiceFromTable();
  }
  
  function reindexInvoiceRows() {
    const rows = document.querySelectorAll('#invTableBody tr');
    rows.forEach((row, i) => {
      const numCell = row.querySelector('.td-num');
      if (numCell) numCell.innerText = i + 1;
    });
  }
  
  function getInvoiceTableSubtotal() {
    let subtotal = 0;
    const amountCells = document.querySelectorAll('#invTableBody .td-amount-val');
    amountCells.forEach(cell => {
      const val = parseFloat(cell.innerText.replace(/[^0-9.-]/g, '')) || 0;
      subtotal += val;
    });
    return subtotal;
  }
  
  function recalculateInvoiceFromTable() {
    const subtotal = getInvoiceTableSubtotal();
    const discountElem = document.getElementById('invDiscount');
    const discount = discountElem ? (parseFloat(discountElem.innerText.replace(/[^0-9.-]/g, '')) || 0) : 0;
    const taxElem = document.getElementById('invTax');
    const tax = taxElem ? (parseFloat(taxElem.innerText.replace(/[^0-9.-]/g, '')) || 0) : 0;
  
    updateInvoiceTotals(subtotal, discount, tax);
  }
  
  function updateInvoiceTotals(subtotal, discount, tax = 0) {
    const taxable = Math.max(0, subtotal - discount);
    const net = taxable + tax;
  
    const subtotalElem = document.getElementById('invSubtotal');
    if (subtotalElem) subtotalElem.innerText = `₹${subtotal.toFixed(0)}`;
  
    const discountElem = document.getElementById('invDiscount');
    if (discountElem && !discountElem.matches(':focus')) {
      discountElem.innerText = discount > 0 ? `- ₹${discount.toFixed(0)}` : '₹0';
    }
  
    const taxableElem = document.getElementById('invTaxable');
    if (taxableElem) taxableElem.innerText = `₹${taxable.toFixed(0)}`;
  
    const taxElem = document.getElementById('invTax');
    if (taxElem && !taxElem.matches(':focus')) {
      taxElem.innerText = tax > 0 ? `₹${tax.toFixed(0)}` : '₹0';
    }
  
    const netElem = document.getElementById('invNetTotal');
    if (netElem) netElem.innerText = `₹${net.toFixed(0)}`;
  
    const paidElem = document.getElementById('invPaidAmount');
    if (paidElem) paidElem.innerText = `₹${net.toFixed(0)}`;
  
    const balanceElem = document.getElementById('invBalanceDue');
    if (balanceElem) balanceElem.innerText = '₹0';
  
    const wordsElem = document.getElementById('invAmountInWords');
    if (wordsElem) wordsElem.innerText = numberToIndianWords(net);
  }
  
  function showInvoiceEmptyState(title, message) {
    const sheet = document.getElementById('invoiceSheet');
    if (sheet) sheet.style.display = 'none';
  
    const emptyState = document.getElementById('invoiceEmptyState');
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 40px auto;">
          <div style="font-size: 48px; margin-bottom: 16px;">🧾</div>
          <h3 style="color: #0f172a; margin-bottom: 8px; font-size: 20px;">${title}</h3>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">${message}</p>
          <a href="history.html" class="invoice-btn invoice-btn-primary" style="display: inline-flex;">
            📂 Open Report History
          </a>
        </div>
      `;
    }
  }

  /* ===== Module: assets/js/app.js ===== */
  /* App entrypoint — decomposed DOMContentLoaded from index.html.
   * Wires all modules. Compiled into assets/js/bundle.js for zero-build execution.
   * Cycle-free: app.js is the only file allowed to import services + ui together. */
  
  function initDates() {
    const today = getTodayDate();
    document.getElementById('collectionDate').value = today;
    document.getElementById('receivedDate').value = today;
    document.getElementById('reportedDate').value = today;
    document.getElementById('referredBy').value = 'SELF';
  }
  
  function initPatientId() {
    let forceFresh = false;
    try {
      if (sessionStorage.getItem('shc_fresh_report_request') === 'true') {
        forceFresh = true;
        sessionStorage.removeItem('shc_fresh_report_request');
        sessionStorage.removeItem(SESSION_KEYS.CURRENT_PATIENT_ID);
      }
    } catch (e) {}
  
    let patientId = sessionStorage.getItem(SESSION_KEYS.CURRENT_PATIENT_ID);
    if (!patientId || forceFresh || isPatientIdExists(patientId)) {
      patientId = generatePatientId();
      sessionStorage.setItem(SESSION_KEYS.CURRENT_PATIENT_ID, patientId);
    }
    document.getElementById('patientId').value = patientId;
    document.getElementById('patientId').addEventListener('input', () => validatePatientId());
  }
  
  function bindNavigationPatientId() {
    const dashBtn = document.getElementById('dashBtnNewReport');
    if (dashBtn) {
      dashBtn.addEventListener('click', function () {
        try {
          sessionStorage.setItem('shc_fresh_report_request', 'true');
          sessionStorage.removeItem(SESSION_KEYS.CURRENT_PATIENT_ID);
        } catch (e) {}
      });
    }
  
    const navCreate = document.getElementById('navCreateReport');
    if (navCreate) {
      navCreate.addEventListener('click', function (e) {
        if (document.getElementById('generateReport')) {
          e.preventDefault();
          handleNewReport();
        } else {
          try {
            sessionStorage.setItem('shc_fresh_report_request', 'true');
            sessionStorage.removeItem(SESSION_KEYS.CURRENT_PATIENT_ID);
          } catch (e) {}
        }
      });
    }
  }
  
  function initInventory() {
    try {
      localStorage.removeItem('shc_inventory_initialized');
      localStorage.removeItem('shc_tubes_initialized');
    } catch (e) {}
    if (!localStorage.getItem(STORAGE_KEYS.GLOBAL_SERIAL)) localStorage.setItem(STORAGE_KEYS.GLOBAL_SERIAL, '0');
  }
  
  function refreshDashboard() {
    toggleTestInputs();
    updateSuggestedCost();
    updateTodayTotal();
    updateTodayReportCount();
    updateTestStats();
  }
  
  function bindCalculatorInputs() {
    // Replaces inline oninput="calculateCBCParameters()" / "calculateIndirectBilirubin()" / "autoUpdatePatientTitle()"
    ['hemoglobin','tlc','neutrophils','lymphocytes','mid','rbcCount','mcv','pcv'].forEach(id => {
      document.getElementById(id).addEventListener('input', calculateCBCParameters);
    });
    CBC_DECIMAL_FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const applyFormat = () => {
          if (el.value !== '') {
            el.value = formatPointValue(el.value);
            calculateCBCParameters();
          }
        };
        el.addEventListener('blur', applyFormat);
        el.addEventListener('change', applyFormat);
      }
    });
    const plateletEl = document.getElementById('platelet');
    if (plateletEl) {
      const applyPlateletFormat = () => {
        if (plateletEl.value !== '') {
          plateletEl.value = formatPlateletValue(plateletEl.value);
        }
      };
      plateletEl.addEventListener('blur', applyPlateletFormat);
      plateletEl.addEventListener('change', applyPlateletFormat);
    }
    ['totalBilirubin','directBilirubin'].forEach(id => {
      document.getElementById(id).addEventListener('input', calculateIndirectBilirubin);
    });
    const ageEl = document.getElementById('patientAge');
    if (ageEl) ageEl.addEventListener('input', autoUpdatePatientTitle);
    const ageUnitEl = document.getElementById('patientAgeUnit');
    if (ageUnitEl) ageUnitEl.addEventListener('change', autoUpdatePatientTitle);
    const genderEl = document.getElementById('patientGender');
    if (genderEl) genderEl.addEventListener('change', autoUpdatePatientTitle);
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleCollection);
  }
  
  function bindReportButtons() {
    document.getElementById('generateReport').addEventListener('click', generateReport);
    document.getElementById('updateReport').addEventListener('click', updateReport);
    document.getElementById('printReport').addEventListener('click', function () {
      if (this.classList.contains('enabled')) window.print();
    });
    document.getElementById('savePDF').addEventListener('click', function () {
      if (this.classList.contains('enabled')) saveAsPDF();
    });
    document.getElementById('editReport').addEventListener('click', function () {
      if (this.classList.contains('enabled')) {
        const previewHistoryId = getCurrentPreviewHistoryId();
        if (previewHistoryId) {
          loadReportForEditing(previewHistoryId);
          setCurrentPreviewHistoryId(null);
        } else {
          document.getElementById('reportOutput').style.display = 'none';
          document.querySelector('.test-inputs').style.display = 'block';
          document.querySelector('.patient-info').style.display = 'grid';
          document.querySelector('.test-selection').style.display = 'block';
          document.querySelector('.cost-section').style.display = 'flex';
          const testStats = document.querySelector('.test-stats');
          if (testStats) testStats.style.display = 'block';
          const lastGenId = getLastGeneratedReportId();
          if (lastGenId) {
            toggleGenerateUpdateButton(true, lastGenId);
            setFormButtonMode(true);
          } else {
            setFormButtonMode(false);
          }
        }
      }
    });
    document.getElementById('newReport').addEventListener('click', handleNewReport);
  }
  
  function handleNewReport() {
    const { isEditing } = getAppState();
    if (isEditing) {
      if (!confirm('You are currently editing a report. Creating a new report will discard your changes. Continue?')) return;
    }
    setLastGeneratedReportId(null);
    setCurrentPreviewHistoryId(null);
    sessionStorage.removeItem(SESSION_KEYS.CURRENT_PATIENT_ID);
    document.getElementById('patientTitle').value = 'Mr.';
    document.getElementById('patientName').value = '';
    if (document.getElementById('relationType')) document.getElementById('relationType').value = 'S/O';
    if (document.getElementById('guardianName')) document.getElementById('guardianName').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientAgeUnit').value = 'Yrs';
    document.getElementById('patientGender').value = '';
    if (document.getElementById('patientPhone')) document.getElementById('patientPhone').value = '';
    if (document.getElementById('patientCity')) document.getElementById('patientCity').value = '';
    document.getElementById('referredBy').value = 'SELF';
    if (document.getElementById('fastingStatus')) document.getElementById('fastingStatus').value = '';
    document.getElementById('testCost').value = '';
    document.getElementById('paymentCash').checked = false;
    document.getElementById('paymentOnline').checked = false;
    document.getElementById('tubePurple').checked = true;
    document.getElementById('tubeRed').checked = false;
    const newPatientId = generatePatientId();
    sessionStorage.setItem(SESSION_KEYS.CURRENT_PATIENT_ID, newPatientId);
    document.getElementById('patientId').value = newPatientId;
    const today = getTodayDate();
    document.getElementById('collectionDate').value = today;
    document.getElementById('receivedDate').value = today;
    document.getElementById('reportedDate').value = today;
    document.querySelectorAll('.test-option input').forEach(checkbox => {
      checkbox.checked = checkbox.id === 'testCBC' || checkbox.id === 'testTyphi' || checkbox.id === 'testMalaria';
    });
    toggleTestInputs();
    updateSuggestedCost();
    document.querySelectorAll('.test-inputs input, .test-inputs select').forEach(input => {
      if (input.type !== 'checkbox') input.value = '';
    });
    document.getElementById('reportOutput').style.display = 'none';
    const dash = document.getElementById('dashboardOverview');
    if (dash) dash.style.display = 'none';
    const navDash = document.getElementById('navDashboard');
    const navCreate = document.getElementById('navCreateReport');
    if (navDash) navDash.classList.remove('active');
    if (navCreate) navCreate.classList.add('active');
    document.querySelector('.patient-info').style.display = 'grid';
    document.querySelector('.test-selection').style.display = 'block';
    document.querySelector('.test-inputs').style.display = 'block';
    document.querySelector('.cost-section').style.display = 'flex';
    const testStats = document.querySelector('.test-stats');
    if (testStats) testStats.style.display = 'block';
    toggleGenerateUpdateButton(false);
    setFormButtonMode(false);
    validatePatientId();
    updateTodayReportCount();
    updateTestStats();
  }
  
  
  
  function bindModals() {
    const viewHistoryBtn = document.getElementById('viewHistory');
    if (viewHistoryBtn) {
      viewHistoryBtn.addEventListener('click', function () {
        window.location.href = 'history.html';
      });
    }
    const statisticsBtn = document.getElementById('statisticsBtn');
    if (statisticsBtn) {
      statisticsBtn.addEventListener('click', function () {
        window.location.href = 'statistics.html';
      });
    }
    const updateTubeInvBtn = document.getElementById('updateTubeInventory');
    if (updateTubeInvBtn) {
      updateTubeInvBtn.addEventListener('click', updateTubeInventoryWithPassword);
    }
    const advancedSearchBtn = document.getElementById('advancedSearchBtn');
    if (advancedSearchBtn) {
      advancedSearchBtn.addEventListener('click', showAdvancedSearch);
    }
    const applyAdvancedSearchBtn = document.getElementById('applyAdvancedSearch');
    if (applyAdvancedSearchBtn) {
      applyAdvancedSearchBtn.addEventListener('click', applyAdvancedSearch);
    }
    const resetAdvancedSearchBtn = document.getElementById('resetAdvancedSearch');
    if (resetAdvancedSearchBtn) {
      resetAdvancedSearchBtn.addEventListener('click', resetAdvancedSearch);
    }
    const closeAdvancedSearchBtn = document.getElementById('closeAdvancedSearch');
    if (closeAdvancedSearchBtn) {
      closeAdvancedSearchBtn.addEventListener('click', closeAdvancedSearch);
    }
    const closeAdvancedSearchX = document.querySelector('.close-advanced-search');
    if (closeAdvancedSearchX) {
      closeAdvancedSearchX.addEventListener('click', closeAdvancedSearch);
    }
    const closeHistoryBtn = document.querySelector('.close-history');
    if (closeHistoryBtn && !closeHistoryBtn.hasAttribute('href')) {
      closeHistoryBtn.addEventListener('click', function () {
        const modal = document.getElementById('historyModal');
        if (modal) modal.style.display = 'none';
      });
    }
    const closeStatisticsBtn = document.querySelector('.close-statistics');
    if (closeStatisticsBtn && !closeStatisticsBtn.hasAttribute('href')) {
      closeStatisticsBtn.addEventListener('click', function () {
        const modal = document.getElementById('statisticsModal');
        if (modal) modal.style.display = 'none';
      });
    }
  
    // Collection Password Modal bindings
    const collectionPassForm = document.getElementById('collectionPasswordForm');
    if (collectionPassForm) {
      collectionPassForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitCollectionPassword();
      });
    }
    const cancelCollectionPassBtn = document.getElementById('cancelCollectionPassword');
    if (cancelCollectionPassBtn) {
      cancelCollectionPassBtn.addEventListener('click', closeCollectionPasswordModal);
    }
    const closeCollectionPassBtn = document.getElementById('closeCollectionPassword');
    if (closeCollectionPassBtn) {
      closeCollectionPassBtn.addEventListener('click', closeCollectionPasswordModal);
    }
  
    // History + Statistics password forms were removed in multi-page split
    // (no #historyPasswordForm / #statisticsPasswordForm in live HTML).
    // Inventory Password Modal bindings
    const invPassForm = document.getElementById('inventoryPasswordForm');
    if (invPassForm) {
      invPassForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitInventoryPassword();
      });
    }
    const cancelInvPassBtn = document.getElementById('cancelInventoryPassword');
    if (cancelInvPassBtn) {
      cancelInvPassBtn.addEventListener('click', closeInventoryPasswordModal);
    }
    const closeInvPassBtn = document.getElementById('closeInventoryPassword');
    if (closeInvPassBtn) {
      closeInvPassBtn.addEventListener('click', closeInventoryPasswordModal);
    }
  
    // Update Inventory Quantities Form bindings
    const updateInvForm = document.getElementById('updateInventoryForm');
    if (updateInvForm) {
      updateInvForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveInventoryChanges();
        if (document.getElementById('statisticsContent')) {
          renderStatistics();
        }
      });
    }
    const cancelUpdateInvBtn = document.getElementById('cancelUpdateInventory');
    if (cancelUpdateInvBtn) {
      cancelUpdateInvBtn.addEventListener('click', closeUpdateInventoryModal);
    }
    const closeUpdateInvBtn = document.getElementById('closeUpdateInventory');
    if (closeUpdateInvBtn) {
      closeUpdateInvBtn.addEventListener('click', closeUpdateInventoryModal);
    }
  
    window.addEventListener('click', function (event) {
      if (event.target === document.getElementById('advancedSearchModal')) closeAdvancedSearch();
      if (event.target === document.getElementById('collectionPasswordModal')) closeCollectionPasswordModal();
      if (event.target === document.getElementById('inventoryPasswordModal')) closeInventoryPasswordModal();
      if (event.target === document.getElementById('updateInventoryModal')) closeUpdateInventoryModal();
    });
  
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeCollectionPasswordModal();
        closeHistoryPasswordModal();
        closeStatisticsPasswordModal();
        closeInventoryPasswordModal();
        closeUpdateInventoryModal();
      }
    });
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('headerLogoutBtn')) {
      initInactivityWatcher();
      bindNavigationPatientId();
    }
  
    // 1. History Page
    if (document.getElementById('historyList') && !document.getElementById('generateReport')) {
      setLoadHistoryHook(loadHistory);
      loadHistory();
      setupSearchFunctionality();
      setupQuickFilters();
      bindModals();
      updateTodayReportCount();
      syncReportsFromCloud();
      initRealtimeSync();
      return;
    }
  
    // 2. Statistics Page
    if (document.getElementById('statisticsContent') && !document.getElementById('generateReport')) {
      renderStatistics();
      bindModals();
      updateTodayReportCount();
      syncReportsFromCloud();
      initRealtimeSync();
      return;
    }
  
    // 3. Invoice Page (Stateless on-the-fly view derived from lab reports)
    if (document.getElementById('invoiceSheet') && !document.getElementById('generateReport')) {
      initInvoicePage();
      bindModals();
      updateTodayReportCount();
      return;
    }
  
    // 4. Dashboard Page (dashboard.html)
    if (document.getElementById('dashboardOverview') && !document.getElementById('generateReport')) {
      const dateEl = document.getElementById('dashTodayDate');
      if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
      }
      updateTodayTotal();
      updateTodayReportCount();
      updateTestStats();
      bindModals();
      syncReportsFromCloud();
      initRealtimeSync();
      return;
    }
  
    // 5. Landing Page (index.html) - exit early if no generator present
    if (!document.getElementById('generateReport')) {
      return;
    }
  
    // 6. Main Report Generator Page (create-report.html)
    setLoadHistoryHook(loadHistory);
    initDates();
    initPatientId();
    initInventory();
    refreshDashboard();
    bindMutualExclusivity();
    bindTestCheckboxes();
    bindCalculatorInputs();
    bindReportButtons();
    setFormButtonMode(false);
    bindModals();
    setupSearchFunctionality();
    syncReportsFromCloud();
    initRealtimeSync();
  
    // Check query params if redirected from history page or dashboard tab
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');
    const previewId = urlParams.get('previewId');
    const tab = urlParams.get('tab');
    if (editId) {
      loadReportForEditing(String(editId));
    } else if (previewId) {
      const history = loadHistoryData();
      const item = history.find(h => String(h.id) === String(previewId));
      if (item) {
        showReport(item);
      }
    } else if (tab === 'dashboard') {
      window.location.href = 'dashboard.html';
    }
  });

})();
