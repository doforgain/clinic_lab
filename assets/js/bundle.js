/**
 * SHAMS HEALTH CARE - Lab Report Generator
 * Universal Bundle (Supports both file:/// local execution & HTTP servers)
 * Generated from modular architecture in assets/js/
 */
(function () {
  'use strict';


  /* ===== Module: assets/js/config/auth-config.js ===== */
  /* NEW in v2 — consolidates index.html L559,562,565,568 password consts (v1 missed).
   * Legacy values preserved for parity. Recommendation: collapse 3x 'admin1' to single VIEW_PASSWORD. */
  const INVENTORYUPDATE_PASSWORD = '9211';
  const HISTORY_PASSWORD = 'admin1';
  const INVENTORY_PASSWORD = 'admin1';
  const COLLECTION_PASSWORD = 'admin1';
  // Recommended consolidated aliases (use in new code, keep legacy exports for compat)
  const VIEW_PASSWORD = HISTORY_PASSWORD; // history + stats + collection gates
  const UPDATE_PASSWORD = INVENTORYUPDATE_PASSWORD;

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
  return value.includes('1:160') || value.includes('1:320') || value.includes('1:640') || value.includes('1:1280');
  }
  // index.html L1962-1966
  const OTHER_TESTS = [
  { id: 'typhi', name: 'Typhoid', resultId: 'typhiResult' },
  { id: 'dengue', name: 'Dengue', resultId: 'dengueResult' },
  { id: 'malaria', name: 'Malaria Parasite', resultId: 'malariaResult' }
  ];
  const ESR_REF = { unit: 'mm/hr', max: 20, display: '0-20' };
  const BILIRUBIN_REF = {
  total: { display: '0.3-1.2', max: 1.2 },
  direct: { display: '0.1-0.3', max: 0.3 },
  indirect: { display: '0.2-0.8', max: 0.8 }
  };
  // index.html L1917-1935 CRP tiers
  function crpTier(numValue) {
  if (numValue < 10) return { statusClass: 'normal', refRange: '<10 (Normal)' };
  if (numValue < 20) return { statusClass: 'elevated', refRange: '10-20 (Elevated)' };
  if (numValue < 50) return { statusClass: 'high', refRange: '20-50 (High)' };
  return { statusClass: 'veryhigh', refRange: '>50 (Very High)' };
  }
  function refRangeFor(param, patientGender) {
  if (param.ref) return param.ref;
  return patientGender === 'Male' ? param.maleRef : param.femaleRef;
  }
  function isAbnormalByRange(value, rangeStr) {
  const [min, max] = rangeStr.split('-').map(Number);
  const v = parseFloat(value);
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
  // Combo rules from L1031-1035. NOTE known bug (v2 §6): original ignores bilirubin/crp/dengue in combo guard.
  // Pure function preserves legacy behaviour exactly; fix flagged with includeExtraTests=true.
  function computeSuggestedCost(t, includeExtraTests = false) {
  const cbc = !!t.cbc, esr = !!t.esr, typhi = !!t.typhi, dengue = !!t.dengue,
        malaria = !!t.malaria, widal = !!t.widal, bloodGroup = !!t.bloodGroup;
  const bilirubin = !!t.bilirubin, crp = !!t.crp;
  let extra = false;
  if (includeExtraTests) {
    extra = bilirubin || crp || dengue || esr;
  }
  const isCombo1 = cbc && typhi && malaria && !esr && !dengue && !widal && !bloodGroup;
  const isCombo2 = cbc && widal && malaria && !esr && !typhi && !dengue && !bloodGroup;
  const isCombo3 = cbc && typhi && !malaria && !esr && !widal && !dengue && !bloodGroup;
  const isCombo4 = cbc && widal && !malaria && !esr && !typhi && !dengue && !bloodGroup;
  const isCombo5 = cbc && malaria && !widal && !esr && !typhi && !dengue && !bloodGroup;
  if (!includeExtraTests) {
    if (isCombo1 || isCombo2) return 300;
    if (isCombo3 || isCombo4 || isCombo5) return 250;
  } else {
    if ((isCombo1 || isCombo2) && !bilirubin && !crp) return 300;
    if ((isCombo3 || isCombo4 || isCombo5) && !bilirubin && !crp) return 250;
  }
  let total = 0;
  if (cbc) total += PRICES.cbc;
  if (esr) total += PRICES.esr;
  if (typhi) total += PRICES.typhi;
  if (dengue) total += PRICES.dengue;
  if (malaria) total += PRICES.malaria;
  if (widal) total += PRICES.widal;
  if (bloodGroup) total += PRICES.bloodGroup;
  if (bilirubin) total += PRICES.bilirubin;
  if (crp) total += PRICES.crp;
  void extra;
  return total;
  }
  // DOM wrapper — identical behaviour to legacy updateSuggestedCost (L1008-1056)
  function updateSuggestedCost() {
  const t = {
    cbc: document.getElementById('testCBC').checked,
    esr: document.getElementById('testESR').checked,
    typhi: document.getElementById('testTyphi').checked,
    dengue: document.getElementById('testDengue').checked,
    malaria: document.getElementById('testMalaria').checked,
    widal: document.getElementById('testWidal').checked,
    bloodGroup: document.getElementById('testBloodGroup').checked,
    bilirubin: document.getElementById('testBilirubin').checked,
    crp: document.getElementById('testCRP').checked
  };
  document.getElementById('testCost').value = computeSuggestedCost(t, false);
  }

  /* ===== Module: assets/js/state/storage.js ===== */
  /* Centralises localStorage keys observed in index.html (parity, no behaviour change). */
  const STORAGE_KEYS = {
  HISTORY: 'labReportsHistory',
  GLOBAL_SERIAL: 'globalHistorySerial',
  PURPLE_TUBE: 'purpleTubeCount',
  RED_TUBE: 'redTubeCount',
  TYPHOID_KIT: 'typhoidKitCount',
  MALARIA_KIT: 'malariaKitCount'
  };
  const SESSION_KEYS = { CURRENT_PATIENT_ID: 'currentPatientId' };
  function loadHistoryData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
  } catch (e) {
    console.error('storage load failed', e);
    return [];
  }
  }
  function saveHistoryData(history) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }
  function getGlobalSerial() {
  return parseInt(localStorage.getItem(STORAGE_KEYS.GLOBAL_SERIAL) || '0');
  }
  function setGlobalSerial(n) {
  localStorage.setItem(STORAGE_KEYS.GLOBAL_SERIAL, String(n));
  }

  /* ===== Module: assets/js/state/app-state.js ===== */
  /* NEW in v2 — owns globals from index.html L571-572 + L2028-2039.
   * Breaks report-actions <-> history cycle by owning toggleGenerateUpdateButton (was L880-895). */
  const appState = {
  isEditing: false,
  currentEditingId: null,
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
  if (isEditMode) {
    generateBtn.style.display = 'none';
    updateBtn.style.display = 'block';
    setEditing(true, reportId);
  } else {
    generateBtn.style.display = 'block';
    updateBtn.style.display = 'none';
    setEditing(false, null);
  }
  }

  /* ===== Module: assets/js/state/inventory-state.js ===== */
  /* Extracted from index.html L732-877. Identical behaviour. Dead stubs deleted per v2. */
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
  // Legacy no-ops L740-742, L795-797 — kept as no-op exports so parity grep still finds them, but flagged DELETE.
  function updateTubeCountsDisplay() { /* Handled dynamically in statistics modal (legacy stub) */ }
  function updateKitCountsDisplay() { /* Handled dynamically in statistics modal (legacy stub) */ }
  function decrementTube(tubeUsed) {
  const tubeCounts = getTubeCounts();
  if (tubeUsed === 'Purple') {
    if (tubeCounts.purple > 0) setTubeCounts(tubeCounts.purple - 1, tubeCounts.red);
    else alert('Warning: No purple (EDTA) tubes left in inventory!');
  } else if (tubeUsed === 'Red') {
    if (tubeCounts.red > 0) setTubeCounts(tubeCounts.purple, tubeCounts.red - 1);
    else alert('Warning: No red (plain) tubes left in inventory!');
  }
  }
  function incrementTube(tubeUsed) {
  const tubeCounts = getTubeCounts();
  if (tubeUsed === 'Purple') setTubeCounts(tubeCounts.purple + 1, tubeCounts.red);
  else if (tubeUsed === 'Red') setTubeCounts(tubeCounts.purple, tubeCounts.red + 1);
  }
  function getKitCounts() {
  return {
    typhoid: parseInt(localStorage.getItem(STORAGE_KEYS.TYPHOID_KIT) || '0'),
    malaria: parseInt(localStorage.getItem(STORAGE_KEYS.MALARIA_KIT) || '0')
  };
  }
  function setKitCounts(typhoid, malaria) {
  localStorage.setItem(STORAGE_KEYS.TYPHOID_KIT, typhoid.toString());
  localStorage.setItem(STORAGE_KEYS.MALARIA_KIT, malaria.toString());
  updateKitCountsDisplay();
  }
  function decrementKits(tests) {
  const kitCounts = getKitCounts();
  let updated = false;
  if (tests.typhi && kitCounts.typhoid > 0) { kitCounts.typhoid--; updated = true; }
  else if (tests.typhi && kitCounts.typhoid <= 0) { alert('⚠️ WARNING: No Typhoid test kits left in inventory!'); }
  if (tests.malaria && kitCounts.malaria > 0) { kitCounts.malaria--; updated = true; }
  else if (tests.malaria && kitCounts.malaria <= 0) { alert('⚠️ WARNING: No Malaria test kits left in inventory!'); }
  if (updated) setKitCounts(kitCounts.typhoid, kitCounts.malaria);
  }
  function incrementKits(tests) {
  const kitCounts = getKitCounts();
  let updated = false;
  if (tests.typhi) { kitCounts.typhoid++; updated = true; }
  if (tests.malaria) { kitCounts.malaria++; updated = true; }
  if (updated) setKitCounts(kitCounts.typhoid, kitCounts.malaria);
  }
  function adjustKitsForEdit(oldTests, newTests) {
  if (!oldTests.typhi && newTests.typhi) decrementKits({ typhi: true });
  if (!oldTests.malaria && newTests.malaria) decrementKits({ malaria: true });
  if (oldTests.typhi && !newTests.typhi) incrementKits({ typhi: true });
  if (oldTests.malaria && !newTests.malaria) incrementKits({ malaria: true });
  }
  function initializeKitInventory() {
  const kitCounts = getKitCounts();
  if (kitCounts.typhoid === 0 && kitCounts.malaria === 0) {
    const typhoidCount = prompt('Enter initial number of Typhoid test kits:', '50');
    const malariaCount = prompt('Enter initial number of Malaria test kits:', '50');
    if (typhoidCount !== null && !isNaN(parseInt(typhoidCount))) kitCounts.typhoid = parseInt(typhoidCount);
    if (malariaCount !== null && !isNaN(parseInt(malariaCount))) kitCounts.malaria = parseInt(malariaCount);
    setKitCounts(kitCounts.typhoid, kitCounts.malaria);
  }
  }
  function initializeTubeInventory() {
  const tubeCounts = getTubeCounts();
  if (tubeCounts.purple === 0 && tubeCounts.red === 0) {
    const purpleCount = prompt('Enter initial number of Purple (EDTA) tubes:', '100');
    const redCount = prompt('Enter initial number of Red (Plain) tubes:', '100');
    if (purpleCount !== null && !isNaN(parseInt(purpleCount))) tubeCounts.purple = parseInt(purpleCount);
    if (redCount !== null && !isNaN(parseInt(redCount))) tubeCounts.red = parseInt(redCount);
    setTubeCounts(tubeCounts.purple, tubeCounts.red);
  }
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

  /* ===== Module: assets/js/utils/patient-id.js ===== */
  /* Extracted from index.html L680-722. localStorage access preserved for parity. */
  function generatePatientId() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const currentYear = currentDate.getFullYear();
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  let maxSerial = 0;
  history.forEach(item => {
    if (item.patientId && item.patientId.startsWith(`${currentMonth}-${currentYear}-`)) {
      const serialStr = item.patientId.split('-')[2];
      const serial = parseInt(serialStr);
      if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
    }
  });
  const nextSerial = maxSerial + 1;
  return `${currentMonth}-${currentYear}-${nextSerial.toString().padStart(4, '0')}`;
  }
  function isPatientIdExists(patientId, excludeId = null) {
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  return history.some(item => {
    if (excludeId && item.id === excludeId) return false;
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
    warningElement.style.display = 'block';
    return false;
  } else {
    warningElement.style.display = 'none';
    return true;
  }
  }

  /* ===== Module: assets/js/utils/dom-helpers.js ===== */
  /* NEW in v2 — cuts 115x getElementById repetition. No behaviour change. */
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function setDisplay(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
  }

  /* ===== Module: assets/js/calculators/cbc-calculator.js ===== */
  /* Extracted from index.html L898-959. Pure cores + legacy DOM wrappers (identical behaviour). */
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

    // If user typed without decimal (e.g. 145 -> 1.45, 83 -> 0.83, 250 -> 2.50)
    if (num >= 10000) {
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

  // Pure: total - direct
  function calcIndirectBilirubin(total, direct) {
  const t = parseFloat(total) || 0;
  const d = parseFloat(direct) || 0;
  const indirect = t - d;
  return indirect >= 0 ? Number(indirect.toFixed(2)) : null;
  }
  // DOM wrapper L898-904
  function calculateIndirectBilirubin() {
  const total = parseFloat(document.getElementById('totalBilirubin').value) || 0;
  const direct = parseFloat(document.getElementById('directBilirubin').value) || 0;
  const indirect = total - direct;
  document.getElementById('indirectBilirubin').value = indirect >= 0 ? indirect.toFixed(2) : '';
  }
  // Pure cores for CBC
  function absoluteCount(tlc, pct) {
  if (!(tlc > 0) || !(pct > 0)) return null;
  return Math.round((tlc * pct) / 100);
  }
  function pcvFromRbcMcv(rbcCount, mcv) {
  if (rbcCount > 0 && mcv > 0) return Number(((rbcCount * mcv) / 10).toFixed(1));
  return null;
  }
  function mchFromHbRbc(hb, rbc) {
  if (hb > 0 && rbc > 0) return Number(((hb / rbc) * 10).toFixed(1));
  return null;
  }
  function mchcFromHbPcv(hb, pcv) {
  if (hb > 0 && pcv > 0) return Number(((hb / pcv) * 100).toFixed(1));
  return null;
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
  /* Extracted from index.html L1059-1102 + L1272-1288. Totals + collection gate. */
  function readHistory() {
  return JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  }
  function sumWhere(pred) {
  let total = 0;
  readHistory().forEach(item => {
    if (pred(item) && item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
      total += parseFloat(item.testCost);
    }
  });
  return total;
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
  document.getElementById('todayTotal').innerText = `₹${getTodayTotal()}`;
  document.getElementById('todayCashTotal').innerText = `₹${getTodayCashTotal()}`;
  document.getElementById('todayOnlineTotal').innerText = `₹${getTodayOnlineTotal()}`;
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
  /* Extracted from index.html L591-646. Moved out of patient-id (v1 fix). */
  function areTestsIdentical(tests1, tests2) {
  for (const testType of TEST_TYPES) {
    if (tests1[testType] !== tests2[testType]) return false;
  }
  return true;
  }
  function checkDuplicatePatient(patientName, patientAge, patientGender, tests) {
  try {
    const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const recentReports = history
      .filter(item => {
        const reportTime = new Date(item.timestamp || item.reportedDate);
        return (
          item.patientName.toLowerCase() === patientName.toLowerCase() &&
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
  function saveAsPDF() {
  const element = document.getElementById('reportOutput');
  const opt = {
    margin: 10,
    filename: `lab_report_${document.getElementById('patientId').value}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
  }

  /* ===== Module: assets/js/services/stats-service.js ===== */
  /* Extracted from index.html L725-729, L2571-2932. */
  // L725
  function getTodayReportCount() {
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  const today = getTodayDate();
  return history.filter(item => item.reportedDate === today && item.tests && typeof item.tests === 'object').length;
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
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  let totalTests = 0, totalReports = 0;
  const testCounts = { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 };
  const todayCounts = { ...testCounts };
  const today = getTodayDate();
  history.forEach(item => {
    if (item.tests && typeof item.tests === 'object') {
      const reportYear = parseInt(item.reportedDate.split('-')[0]);
      const reportMonth = parseInt(item.reportedDate.split('-')[1]);
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
    displayElement.innerText = reportCount.toString().padStart(2, '0');
    displayElement.style.display = 'none';
    setTimeout(() => { displayElement.style.display = 'flex'; }, 0);
  }
  }
  // Password modal controls for Statistics
  function openStatisticsPasswordModal() {
    const modal = document.getElementById('statisticsPasswordModal');
    const input = document.getElementById('statisticsPasswordInput');
    const error = document.getElementById('statisticsPasswordError');
    if (modal) {
      modal.style.display = 'flex';
      if (error) error.style.display = 'none';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
    }
  }

  function closeStatisticsPasswordModal() {
    const modal = document.getElementById('statisticsPasswordModal');
    const input = document.getElementById('statisticsPasswordInput');
    const error = document.getElementById('statisticsPasswordError');
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
    if (error) error.style.display = 'none';
  }

  function submitStatisticsPassword() {
    const input = document.getElementById('statisticsPasswordInput');
    const error = document.getElementById('statisticsPasswordError');
    if (input && input.value === INVENTORY_PASSWORD) {
      closeStatisticsPasswordModal();
      renderStatistics();
    } else {
      if (error) error.style.display = 'block';
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  function renderStatistics() {
    updateTestStats();
    const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthName = getCurrentMonthName();
    let monthlyCollection = 0, monthlyCash = 0, monthlyOnline = 0, monthlyReports = 0;
    const testCounts = { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 };
    let purpleTubeUsage = 0, redTubeUsage = 0;
    history.forEach(item => {
      if (item.tests && typeof item.tests === 'object') {
        const reportYear = parseInt(item.reportedDate.split('-')[0]);
        const reportMonth = parseInt(item.reportedDate.split('-')[1]);
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
    document.getElementById('statisticsContent').innerHTML = `
      <div class="stats-summary"><h3>${currentMonthName} ${currentYear} Collection Summary</h3>
      <table class="stats-table"><tr><th>Total Collection</th><td>₹${monthlyCollection.toFixed(2)}</td></tr>
      <tr><th>Cash Collection</th><td>₹${monthlyCash.toFixed(2)}</td></tr>
      <tr><th>Online Collection</th><td>₹${monthlyOnline.toFixed(2)}</td></tr>
      <tr><th>Total Reports</th><td>${monthlyReports}</td></tr></table></div>
      <div class="stats-summary"><h3>Test Statistics for ${currentMonthName}</h3>
      <table class="stats-table">
      <tr><th>CBC Tests</th><td>${testCounts.cbc}</td></tr><tr><th>ESR Tests</th><td>${testCounts.esr}</td></tr>
      <tr><th>Typhoid Tests</th><td>${testCounts.typhi}</td></tr><tr><th>Dengue Tests</th><td>${testCounts.dengue}</td></tr>
      <tr><th>Malaria Tests</th><td>${testCounts.malaria}</td></tr><tr><th>Widal Tests</th><td>${testCounts.widal}</td></tr>
      <tr><th>Blood Group Tests</th><td>${testCounts.bloodGroup}</td></tr><tr><th>Bilirubin Tests</th><td>${testCounts.bilirubin}</td></tr>
      <tr><th>CRP Tests</th><td>${testCounts.crp}</td></tr></table></div>
      <div class="stats-summary"><h3>Tube Usage and Inventory</h3>
      <table class="stats-table"><tr><th>Purple Tubes Used This Month</th><td>${purpleTubeUsage}</td></tr>
      <tr><th>Red Tubes Used This Month</th><td>${redTubeUsage}</td></tr>
      <tr><th>Purple Tubes Remaining</th><td>${tubeCounts.purple}</td></tr>
      <tr><th>Red Tubes Remaining</th><td>${tubeCounts.red}</td></tr>
      <tr><th>Typhoid Kits Remaining</th><td>${kitCounts.typhoid}</td></tr>
      <tr><th>Malaria Kits Remaining</th><td>${kitCounts.malaria}</td></tr></table></div>`;
    document.getElementById('statisticsModal').style.display = 'block';
  }

  // L2723 — open password modal
  function showStatistics() {
    openStatisticsPasswordModal();
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
  return history.filter(item => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchLower) ||
        item.patientId.toLowerCase().includes(searchLower) ||
        (item.referredBy && item.referredBy.toLowerCase().includes(searchLower)) ||
        item.collectionDate.includes(filters.searchTerm) ||
        item.reportedDate.includes(filters.searchTerm);
      if (!matchesSearch) return false;
    }
    if (filters.dateFrom && item.reportedDate < filters.dateFrom) return false;
    if (filters.dateTo && item.reportedDate > filters.dateTo) return false;
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
    const activeFilters = getActiveFilters();
    if (activeFilters.length > 0 || filteredCount < totalCount) {
      summaryElement.style.display = 'block';
      activeFiltersElement.innerHTML = '';
      activeFilters.forEach(filter => {
        const filterTag = document.createElement('span');
        filterTag.className = 'filter-tag';
        filterTag.innerHTML = `${filter.label}: ${filter.value}<span class="remove-filter" data-filter="${filter.key}">&times;</span>`;
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
  function createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed) {
  let reportHTML = `
    <div class="report-header"><h2>-</h2></div>
    <div class="report-patient-info">
      <div><strong>Patient Name:</strong> ${patientName}</div>
      <div><strong>Age:</strong> ${patientAge}</div>
      <div><strong>Gender:</strong> ${patientGender}</div>
      <div><strong>Patient ID:</strong> ${document.getElementById('patientId').value}</div>
      <div><strong>Collection Date:</strong> ${document.getElementById('collectionDate').value}</div>
      <div><strong>Received Date:</strong> ${document.getElementById('receivedDate').value}</div>
      <div><strong>Reported Date:</strong> ${document.getElementById('reportedDate').value}</div>
      <div><strong>Referred By:</strong> ${document.getElementById('referredBy').value.trim() || 'SELF'}</div>
      <div class="no-print"><strong>Payment Mode:</strong> ${paymentMode}</div>
      <div class="no-print"><strong>Tube Used:</strong> ${tubeUsed}</div>
    </div>`;
  if (tests.cbc) {
    let rows = '';
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
        rows += `<tr><td>${param.name}</td><td class="${isAbnormal ? 'abnormal' : ''}">${value}</td><td>${param.unit}</td><td>${refRange}</td></tr>`;
      }
    });
    reportHTML += `<div class="report-test-section"><h3>COMPLETE BLOOD COUNT</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (tests.esr) {
    const esrValue = document.getElementById('esr').value || '';
    if (esrValue) {
      const isAbnormal = parseFloat(esrValue) > ESR_REF.max;
      reportHTML += `<div class="report-test-section"><h3>HEMATOLOGY</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody><tr><td>ESR</td><td class="${isAbnormal ? 'abnormal' : ''}">${esrValue}</td><td>${ESR_REF.unit}</td><td>${ESR_REF.display}</td></tr></tbody></table></div>`;
    }
  }
  if (tests.widal) {
    let rows = '';
    WIDAL_PARAMS.forEach(param => {
      const value = document.getElementById(param.id).value || '';
      if (value) {
        const isPositive = isWidalPositive(value);
        rows += `<tr><td>${param.name}</td><td class="${isPositive ? 'positive' : ''}">${value}</td><td>${WIDAL_CUTOFF.replace('<', '&lt;')}</td></tr>`;
      }
    });
    // Note: legacy used '&lt; 1:80' literal; WIDAL_CUTOFF '< 1:80' escaped here preserves rendering.
    reportHTML += `<div class="report-test-section"><h3>SEROLOGY</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>REFERENCE RANGE</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (tests.bloodGroup) {
    const bloodGroupValue = document.getElementById('bloodGroup').value || '';
    if (bloodGroupValue) {
      reportHTML += `<div class="report-test-section"><h3>BLOOD GROUP</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th></tr></thead><tbody><tr><td>Blood Group</td><td>${bloodGroupValue}</td></tr></tbody></table></div>`;
    }
  }
  if (tests.bilirubin) {
    const totalBilirubin = document.getElementById('totalBilirubin').value || '';
    const directBilirubin = document.getElementById('directBilirubin').value || '';
    const indirectBilirubin = document.getElementById('indirectBilirubin').value || '';
    if (totalBilirubin || directBilirubin || indirectBilirubin) {
      let rows = '';
      if (totalBilirubin) rows += `<tr><td>Total Bilirubin</td><td class="${parseFloat(totalBilirubin) > BILIRUBIN_REF.total.max ? 'abnormal' : ''}">${totalBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.total.display}</td></tr>`;
      if (directBilirubin) rows += `<tr><td>Direct Bilirubin</td><td class="${parseFloat(directBilirubin) > BILIRUBIN_REF.direct.max ? 'abnormal' : ''}">${directBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.direct.display}</td></tr>`;
      if (indirectBilirubin) rows += `<tr><td>Indirect Bilirubin</td><td class="${parseFloat(indirectBilirubin) > BILIRUBIN_REF.indirect.max ? 'abnormal' : ''}">${indirectBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.indirect.display}</td></tr>`;
      reportHTML += `<div class="report-test-section"><h3>BIOCHEMISTRY</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }
  if (tests.crp) {
    const crpValue = document.getElementById('crp').value || '';
    if (crpValue) {
      const tier = crpTier(parseFloat(crpValue));
      reportHTML += `<div class="report-test-section"><h3>CRP Test</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody><tr><td>CRP</td><td class="${tier.statusClass}">${crpValue}</td><td>mg/L</td><td>${tier.refRange}</td></tr></tbody></table></div>`;
    }
  }
  let otherTestsHTML = '';
  OTHER_TESTS.forEach(test => {
    if (tests[test.id]) {
      const result = document.getElementById(test.resultId).value || '';
      let displayResult = result;
      if (result === 'Positive') {
        if (test.id === 'typhi') {
          const subtype = document.getElementById('typhiSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'IgM and IgG' : subtype})`;
        } else if (test.id === 'malaria') {
          const subtype = document.getElementById('malariaSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'Pf and Pv' : subtype})`;
        }
      }
      otherTestsHTML += `<tr><td>${test.name}</td><td class="${result === 'Positive' ? 'positive' : ''}">${displayResult}</td></tr>`;
    }
  });
  if (otherTestsHTML) {
    reportHTML += `<div class="report-test-section"><h3>OTHER TESTS</h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th></tr></thead><tbody>${otherTestsHTML}</tbody></table></div>`;
  }
  return reportHTML;
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
  const existingReportIndex = history.findIndex(item => item.id === existingId);
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
  if (tests.dengue) testParameters.dengue = { dengueResult: document.getElementById('dengueResult').value };
  if (tests.malaria) testParameters.malaria = { malariaResult: document.getElementById('malariaResult').value, malariaSubtype: document.getElementById('malariaSubtype').value };
  if (tests.widal) testParameters.widal = { oAntigen: document.getElementById('oAntigen').value, hAntigen: document.getElementById('hAntigen').value, ahAntigen: document.getElementById('ahAntigen').value, bhAntigen: document.getElementById('bhAntigen').value };
  if (tests.bloodGroup) testParameters.bloodGroup = { bloodGroup: document.getElementById('bloodGroup').value };
  if (tests.bilirubin) testParameters.bilirubin = { totalBilirubin: document.getElementById('totalBilirubin').value, directBilirubin: document.getElementById('directBilirubin').value, indirectBilirubin: document.getElementById('indirectBilirubin').value };
  if (tests.crp) testParameters.crp = { crp: document.getElementById('crp').value };
  const historyItem = {
    serial: existingReportIndex === -1 ? ++globalSerial : history[existingReportIndex].serial,
    id: existingReportIndex === -1 ? Date.now() : existingId,
    patientName, patientAge, patientGender, patientId, collectionDate, receivedDate, reportedDate, referredBy,
    testCost: testCost || 'Not specified', paymentMode, tubeUsed, reportHTML, tests, testParameters,
    timestamp: new Date().toLocaleString()
  };
  if (existingReportIndex === -1) { history.unshift(historyItem); setGlobalSerial(globalSerial); }
  else history[existingReportIndex] = historyItem;
  if (history.length > 10000) history = history.slice(0, 10000);
  saveHistoryData(history);
  console.log('Report saved to history:', historyItem);
  console.log('Total reports in history:', history.length);
  }
  // L2042
  function loadHistory(filters = null) {
  const currentFilters = getCurrentFilters();
  if (filters) setCurrentFilters(filters);
  const merged = getCurrentFilters();
  const history = loadHistoryData();
  const historyList = document.getElementById('historyList');
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
      <div style="flex: 1;"><strong>#${item.serial} - ${item.patientName}</strong> (${item.patientAge}, ${item.patientGender}) -
      ${item.patientId} - ${item.reportedDate} - Tests: ${testCount}
      ${item.testCost && item.testCost !== 'Not specified' ? `<span class="history-cost">₹${item.testCost} (${item.paymentMode})</span>` : ''}
      ${item.tubeUsed ? `<span style="margin-left: 10px; font-size: 12px; color: #666;">Tube: ${item.tubeUsed}</span>` : ''}</div>
      <div>${item.testCost && item.testCost !== 'Not specified' ? `<button class="edit-cost" data-id="${item.id}">Edit Cost</button>` : ''}
      <button class="edit-report" data-id="${item.id}">Edit Report</button>
      <button class="delete-report" data-id="${item.id}">Delete</button></div>`;
    historyItem.addEventListener('click', function (e) {
      if (!e.target.classList.contains('edit-cost') && !e.target.classList.contains('delete-report') && !e.target.classList.contains('edit-report')) showReport(item);
    });
    historyList.appendChild(historyItem);
  });
  addHistoryItemEventListeners();
  }
  // Password modal controls for Report History
  function openHistoryPasswordModal() {
    const modal = document.getElementById('historyPasswordModal');
    const input = document.getElementById('historyPasswordInput');
    const error = document.getElementById('historyPasswordError');
    if (modal) {
      modal.style.display = 'flex';
      if (error) error.style.display = 'none';
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
    }
  }

  function closeHistoryPasswordModal() {
    const modal = document.getElementById('historyPasswordModal');
    const input = document.getElementById('historyPasswordInput');
    const error = document.getElementById('historyPasswordError');
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
    if (error) error.style.display = 'none';
  }

  function submitHistoryPassword() {
    const input = document.getElementById('historyPasswordInput');
    const error = document.getElementById('historyPasswordError');
    if (input && input.value === HISTORY_PASSWORD) {
      closeHistoryPasswordModal();
      showHistory();
    } else {
      if (error) error.style.display = 'block';
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  // L2409
  function showHistory() {
    loadHistory();
    document.getElementById('historyModal').style.display = 'block';
    setTimeout(() => { import('./search-service.js').then(m => m.setupQuickFilters()); }, 100);
  }
  // L2420
  function addHistoryItemEventListeners() {
  document.querySelectorAll('.edit-cost').forEach(btn => {
    btn.addEventListener('click', function (e) { e.stopPropagation(); editReportCost(this.dataset.id); });
  });
  document.querySelectorAll('.edit-report').forEach(btn => {
    btn.addEventListener('click', function (e) { e.stopPropagation(); loadReportForEditing(parseInt(this.dataset.id)); });
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
    const index = history.findIndex(item => item.id === parseInt(id));
    if (index !== -1) {
      history[index].testCost = newCost;
      saveHistoryData(history);
      loadHistory(); updateTodayTotal(); updateTodayReportCount(); updateTestStats();
    }
  } else if (newCost !== null) alert('Please enter a valid number for the cost.');
  }
  // L2463 — with checkbox map fix
  function loadReportForEditing(id) {
  const history = loadHistoryData();
  const item = history.find(item => item.id === id);
  if (!item) return;
  let nameToLoad = item.patientName || '';
  const titles = ['Mr.', 'Mrs.', 'Miss', 'Master', 'Baby', 'B/O'];
  const matchingTitle = titles.find(t => nameToLoad.startsWith(t + ' '));
  if (matchingTitle) { document.getElementById('patientTitle').value = matchingTitle; nameToLoad = nameToLoad.substring(matchingTitle.length + 1).trim(); }
  document.getElementById('patientName').value = nameToLoad;
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
  }
  if (item.tests && item.tests.cbc) {
    formatCBCDecimalInputs();
    calculateCBCParameters();
  }
  document.getElementById('historyModal').style.display = 'none';
  document.getElementById('reportOutput').style.display = 'none';
  document.querySelector('.patient-info').style.display = 'grid';
  document.querySelector('.test-selection').style.display = 'block';
  document.querySelector('.test-inputs').style.display = 'block';
  document.querySelector('.cost-section').style.display = 'flex';
  document.querySelector('.test-stats').style.display = 'block';
  document.getElementById('printReport').classList.remove('enabled');
  document.getElementById('savePDF').classList.remove('enabled');
  document.getElementById('editReport').classList.remove('enabled');
  toggleGenerateUpdateButton(true, id);
  validatePatientId();
  }
  // L2543
  function deleteReport(id) {
  if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
  let history = loadHistoryData();
  const itemIndex = history.findIndex(item => item.id === parseInt(id));
  if (itemIndex !== -1) {
    const item = history[itemIndex];
    if (item.tubeUsed) incrementTube(item.tubeUsed);
    if (item.tests) incrementKits(item.tests);
    history = history.filter(item => item.id !== parseInt(id));
    saveHistoryData(history);
    loadHistory(); updateTodayTotal(); updateTodayReportCount(); updateTestStats();
  }
  }

  /* ===== Module: assets/js/services/report-actions.js ===== */
  /* Extracted from index.html L1500-1671. Thin orchestration over builder/history/duplicate/cost/stats. */
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
  const patientName = (patientTitle && !rawName.toLowerCase().startsWith(patientTitle.toLowerCase())) ? `${patientTitle} ${rawName}` : rawName;
  const ageVal = document.getElementById('patientAge').value.trim();
  const ageUnit = document.getElementById('patientAgeUnit') ? document.getElementById('patientAgeUnit').value : 'Yrs';
  return { patientTitle, rawName, patientName, ageVal, ageUnit, patientAge: ageVal ? `${ageVal} ${ageUnit}` : '', patientGender: document.getElementById('patientGender').value };
  }
  function showGeneratedReport(reportHTML) {
  document.getElementById('reportOutput').innerHTML = reportHTML;
  document.getElementById('reportOutput').style.display = 'block';
  document.querySelector('.test-inputs').style.display = 'none';
  document.querySelector('.patient-info').style.display = 'none';
  document.querySelector('.test-selection').style.display = 'none';
  document.querySelector('.cost-section').style.display = 'none';
  document.querySelector('.test-stats').style.display = 'none';
  document.getElementById('printReport').classList.add('enabled');
  document.getElementById('savePDF').classList.add('enabled');
  document.getElementById('editReport').classList.add('enabled');
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
  showGeneratedReport(reportHTML);
  saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, null);
  updateTodayTotal(); updateTodayReportCount(); updateTestStats();
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
  showGeneratedReport(reportHTML);
  saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, currentEditingId);
  updateTodayTotal(); updateTodayReportCount(); updateTestStats();
  toggleGenerateUpdateButton(false);
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

    if (purpleInput) purpleInput.value = tubeCounts.purple;
    if (redInput) redInput.value = tubeCounts.red;
    if (typhoidInput) typhoidInput.value = kitCounts.typhoid;
    if (malariaInput) malariaInput.value = kitCounts.malaria;

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

    if (isNaN(purpleVal) || purpleVal < 0 ||
        isNaN(redVal) || redVal < 0 ||
        isNaN(typhoidVal) || typhoidVal < 0 ||
        isNaN(malariaVal) || malariaVal < 0) {
      if (error) {
        error.textContent = 'Please enter valid positive numbers for all inventory quantities.';
        error.style.display = 'block';
      }
      return;
    }

    setTubeCounts(purpleVal, redVal);
    setKitCounts(typhoidVal, malariaVal);
    updateTubeCountsDisplay();
    updateKitCountsDisplay();

    const statsModal = document.getElementById('statisticsModal');
    if (statsModal && statsModal.style.display === 'block') {
      renderStatistics();
    }

    closeUpdateInventoryModal();
  }

  function updateTubeInventoryWithPassword() {
    openInventoryPasswordModal();
  }

  /* ===== Module: assets/js/ui/form-ui.js ===== */
  /* UI helpers: index.html L962-1005 + L2269-2281 (showReport moved here to break history<->report cycle).
   * No imports from services/ (one-way DAG: services->ui forbidden in reverse). */
  // L962
  function autoUpdatePatientTitle() {
  const ageInput = document.getElementById('patientAge').value.trim();
  const ageVal = parseFloat(ageInput);
  const ageUnit = document.getElementById('patientAgeUnit').value;
  const gender = document.getElementById('patientGender').value;
  const titleSelect = document.getElementById('patientTitle');
  if (isNaN(ageVal) || ageVal < 0) return;
  if (ageUnit === 'Days' || ageUnit === 'Months' || (ageUnit === 'Yrs' && ageVal < 1)) {
    titleSelect.value = 'Baby';
  } else if (ageUnit === 'Yrs') {
    if (ageVal <= 12) {
      if (gender === 'Male') titleSelect.value = 'Master';
      else if (gender === 'Female') titleSelect.value = 'Baby';
    } else if (ageVal >= 13 && ageVal <= 17) {
      if (gender === 'Male') titleSelect.value = 'Mr.';
      else if (gender === 'Female') titleSelect.value = 'Miss';
    } else if (ageVal >= 18) {
      if (gender === 'Male') titleSelect.value = 'Mr.';
      else if (gender === 'Female') titleSelect.value = 'Mrs.';
    }
  }
  }
  // L988
  function toggleTestInputs() {
  document.getElementById('cbcInputs').style.display = document.getElementById('testCBC').checked ? 'block' : 'none';
  document.getElementById('esrInputs').style.display = document.getElementById('testESR').checked ? 'block' : 'none';
  document.getElementById('typhiInputs').style.display = document.getElementById('testTyphi').checked ? 'block' : 'none';
  document.getElementById('dengueInputs').style.display = document.getElementById('testDengue').checked ? 'block' : 'none';
  document.getElementById('malariaInputs').style.display = document.getElementById('testMalaria').checked ? 'block' : 'none';
  document.getElementById('widalInputs').style.display = document.getElementById('testWidal').checked ? 'block' : 'none';
  document.getElementById('bloodGroupInputs').style.display = document.getElementById('testBloodGroup').checked ? 'block' : 'none';
  document.getElementById('bilirubinInputs').style.display = document.getElementById('testBilirubin').checked ? 'block' : 'none';
  document.getElementById('crpInputs').style.display = document.getElementById('testCRP').checked ? 'block' : 'none';
  const isTyphiPositive = document.getElementById('typhiResult').value === 'Positive';
  document.getElementById('typhiSubtypeContainer').style.display = (document.getElementById('testTyphi').checked && isTyphiPositive) ? 'block' : 'none';
  const isMalariaPositive = document.getElementById('malariaResult').value === 'Positive';
  document.getElementById('malariaSubtypeContainer').style.display = (document.getElementById('testMalaria').checked && isMalariaPositive) ? 'block' : 'none';
  }
  // L2269 — moved from history/report to ui (v2 cycle-break delta, behaviour identical)
  function showReport(item) {
  document.getElementById('reportOutput').innerHTML = item.reportHTML;
  document.getElementById('reportOutput').style.display = 'block';
  document.querySelector('.test-inputs').style.display = 'none';
  document.querySelector('.patient-info').style.display = 'none';
  document.querySelector('.test-selection').style.display = 'none';
  document.querySelector('.cost-section').style.display = 'none';
  document.querySelector('.test-stats').style.display = 'none';
  document.getElementById('printReport').classList.add('enabled');
  document.getElementById('savePDF').classList.add('enabled');
  document.getElementById('editReport').classList.add('enabled');
  document.getElementById('historyModal').style.display = 'none';
  }
  function hideReportShowForm() {
  document.getElementById('reportOutput').style.display = 'none';
  document.querySelector('.test-inputs').style.display = 'block';
  document.querySelector('.patient-info').style.display = 'grid';
  document.querySelector('.test-selection').style.display = 'block';
  document.querySelector('.cost-section').style.display = 'flex';
  document.querySelector('.test-stats').style.display = 'block';
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
  document.getElementById('malariaResult').addEventListener('change', toggleTestInputs);
  }

  /* ===== Module: assets/js/app.js ===== */
  /* App entrypoint — decomposed DOMContentLoaded from index.html L1291-1498.
   * Wires all modules. Behaviour identical to legacy. Load via <script type="module">.
   * Cycle-free: app.js is the only file allowed to import services + ui together. */
  function initDates() {
  const today = getTodayDate();
  document.getElementById('collectionDate').value = today;
  document.getElementById('receivedDate').value = today;
  document.getElementById('reportedDate').value = today;
  document.getElementById('referredBy').value = 'SELF';
  }
  function initPatientId() {
  let patientId = sessionStorage.getItem(SESSION_KEYS.CURRENT_PATIENT_ID);
  if (!patientId) {
    patientId = generatePatientId();
    sessionStorage.setItem(SESSION_KEYS.CURRENT_PATIENT_ID, patientId);
  }
  document.getElementById('patientId').value = patientId;
  document.getElementById('patientId').addEventListener('input', () => validatePatientId());
  }
  function initInventory() {
  initializeKitInventory();
  const tubeCounts = getTubeCounts();
  if (tubeCounts.purple === 0 && tubeCounts.red === 0) {
    const purpleCount = prompt('Enter initial number of Purple (EDTA) tubes:', '100');
    const redCount = prompt('Enter initial number of Red (Plain) tubes:', '100');
    if (purpleCount !== null && !isNaN(parseInt(purpleCount))) tubeCounts.purple = parseInt(purpleCount);
    if (redCount !== null && !isNaN(parseInt(redCount))) tubeCounts.red = parseInt(redCount);
    setTubeCounts(tubeCounts.purple, tubeCounts.red);
  }
  if (!localStorage.getItem(STORAGE_KEYS.GLOBAL_SERIAL)) localStorage.setItem(STORAGE_KEYS.GLOBAL_SERIAL, '0');
  }
  function refreshDashboard() {
  toggleTestInputs();
  updateSuggestedCost();
  updateTodayTotal();
  updateTodayReportCount();
  updateTestStats();
  updateTubeCountsDisplay();
  updateKitCountsDisplay();
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
  document.getElementById('patientAge').addEventListener('input', autoUpdatePatientTitle);
  document.getElementById('patientAgeUnit').addEventListener('change', autoUpdatePatientTitle);
  document.getElementById('patientGender').addEventListener('change', autoUpdatePatientTitle);
  document.getElementById('toggleBtn').addEventListener('click', toggleCollection);
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
      document.getElementById('reportOutput').style.display = 'none';
      document.querySelector('.test-inputs').style.display = 'block';
      document.querySelector('.patient-info').style.display = 'grid';
      document.querySelector('.test-selection').style.display = 'block';
      document.querySelector('.cost-section').style.display = 'flex';
      document.querySelector('.test-stats').style.display = 'block';
      this.classList.remove('enabled');
      document.getElementById('printReport').classList.remove('enabled');
      document.getElementById('savePDF').classList.remove('enabled');
    }
  });
  document.getElementById('newReport').addEventListener('click', handleNewReport);
  }
  function handleNewReport() {
  const { isEditing } = getAppState();
  if (isEditing) {
    if (!confirm('You are currently editing a report. Creating a new report will discard your changes. Continue?')) return;
  }
  sessionStorage.removeItem(SESSION_KEYS.CURRENT_PATIENT_ID);
  document.getElementById('patientTitle').value = 'Mr.';
  document.getElementById('patientName').value = '';
  document.getElementById('patientAge').value = '';
  document.getElementById('patientAgeUnit').value = 'Yrs';
  document.getElementById('patientGender').value = '';
  document.getElementById('referredBy').value = 'SELF';
  document.getElementById('testCost').value = '';
  document.getElementById('paymentCash').checked = true;
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
  document.querySelector('.patient-info').style.display = 'grid';
  document.querySelector('.test-selection').style.display = 'block';
  document.querySelector('.test-inputs').style.display = 'block';
  document.querySelector('.cost-section').style.display = 'flex';
  document.querySelector('.test-stats').style.display = 'block';
  document.getElementById('printReport').classList.remove('enabled');
  document.getElementById('savePDF').classList.remove('enabled');
  document.getElementById('editReport').classList.remove('enabled');
  toggleGenerateUpdateButton(false);
  validatePatientId();
  updateTodayReportCount();
  updateTestStats();
  }
  function bindModals() {
    document.getElementById('viewHistory').addEventListener('click', openHistoryPasswordModal);
    document.getElementById('statisticsBtn').addEventListener('click', openStatisticsPasswordModal);
    document.getElementById('updateTubeInventory').addEventListener('click', updateTubeInventoryWithPassword);
    document.getElementById('advancedSearchBtn').addEventListener('click', showAdvancedSearch);
    document.getElementById('applyAdvancedSearch').addEventListener('click', applyAdvancedSearch);
    document.getElementById('resetAdvancedSearch').addEventListener('click', resetAdvancedSearch);
    document.getElementById('closeAdvancedSearch').addEventListener('click', closeAdvancedSearch);
    document.querySelector('.close-advanced-search').addEventListener('click', closeAdvancedSearch);
    document.querySelector('.close-history').addEventListener('click', function () {
      document.getElementById('historyModal').style.display = 'none';
    });
    document.querySelector('.close-statistics').addEventListener('click', function () {
      document.getElementById('statisticsModal').style.display = 'none';
    });

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

    // History Password Modal bindings
    const historyPassForm = document.getElementById('historyPasswordForm');
    if (historyPassForm) {
      historyPassForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitHistoryPassword();
      });
    }
    const cancelHistoryPassBtn = document.getElementById('cancelHistoryPassword');
    if (cancelHistoryPassBtn) {
      cancelHistoryPassBtn.addEventListener('click', closeHistoryPasswordModal);
    }
    const closeHistoryPassBtn = document.getElementById('closeHistoryPassword');
    if (closeHistoryPassBtn) {
      closeHistoryPassBtn.addEventListener('click', closeHistoryPasswordModal);
    }

    // Statistics Password Modal bindings
    const statsPassForm = document.getElementById('statisticsPasswordForm');
    if (statsPassForm) {
      statsPassForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitStatisticsPassword();
      });
    }
    const cancelStatsPassBtn = document.getElementById('cancelStatisticsPassword');
    if (cancelStatsPassBtn) {
      cancelStatsPassBtn.addEventListener('click', closeStatisticsPasswordModal);
    }
    const closeStatsPassBtn = document.getElementById('closeStatisticsPassword');
    if (closeStatsPassBtn) {
      closeStatsPassBtn.addEventListener('click', closeStatisticsPasswordModal);
    }

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
      if (event.target === document.getElementById('historyModal')) document.getElementById('historyModal').style.display = 'none';
      if (event.target === document.getElementById('statisticsModal')) document.getElementById('statisticsModal').style.display = 'none';
      if (event.target === document.getElementById('advancedSearchModal')) closeAdvancedSearch();
      if (event.target === document.getElementById('collectionPasswordModal')) closeCollectionPasswordModal();
      if (event.target === document.getElementById('historyPasswordModal')) closeHistoryPasswordModal();
      if (event.target === document.getElementById('statisticsPasswordModal')) closeStatisticsPasswordModal();
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
  setLoadHistoryHook(loadHistory); // breaks search<->history cycle, preserves behaviour
  initDates();
  initPatientId();
  initInventory();
  refreshDashboard();
  bindMutualExclusivity();
  bindTestCheckboxes();
  bindCalculatorInputs();
  bindReportButtons();
  bindModals();
  setupSearchFunctionality();
  });

})();
