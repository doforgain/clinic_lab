/* Extracted from index.html L1141-1269, L2042-2094, L2409-2569.
 * Split notes: inventory part delegates to inventory-state; filter/stats to search/stats services.
 * Depends on ui/form-ui for view helpers (one-way: services->ui, ui never imports services). */
import { getCurrentFilters, setCurrentFilters, toggleGenerateUpdateButton } from '../state/app-state.js';
import { STORAGE_KEYS, loadHistoryData, saveHistoryData, getGlobalSerial, setGlobalSerial } from '../state/storage.js';
import { decrementTube, incrementTube, decrementKits, incrementKits, adjustKitsForEdit } from '../state/inventory-state.js';
import { applyAdvancedFilters, updateSearchSummary } from './search-service.js';
import { calculateSearchStatistics } from './stats-service.js';
import { updateTodayTotal } from '../calculators/cost-calculator.js';
import { updateTodayReportCount, updateTestStats } from './stats-service.js';
import { validatePatientId } from '../utils/patient-id.js';
import { updateSuggestedCost } from '../config/pricing-config.js';
import { toggleTestInputs, showReport } from '../ui/form-ui.js';
import { formatPointValue, formatPlateletValue, formatCBCDecimalInputs, calculateCBCParameters } from '../calculators/cbc-calculator.js';
import { HISTORY_PASSWORD } from '../config/auth-config.js';

// Fixed checkbox map (v2 §6 bugfix): legacy `test${Cap}` produced testCbc/testEsr (broken).
export const TEST_CHECKBOX_MAP = {
  cbc: 'testCBC', esr: 'testESR', typhi: 'testTyphi', dengue: 'testDengue',
  malaria: 'testMalaria', widal: 'testWidal', bloodGroup: 'testBloodGroup',
  bilirubin: 'testBilirubin', crp: 'testCRP'
};

// L1141
export function saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, existingId = null) {
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
export function loadHistory(filters = null) {
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
export function openHistoryPasswordModal() {
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

export function closeHistoryPasswordModal() {
  const modal = document.getElementById('historyPasswordModal');
  const input = document.getElementById('historyPasswordInput');
  const error = document.getElementById('historyPasswordError');
  if (modal) modal.style.display = 'none';
  if (input) input.value = '';
  if (error) error.style.display = 'none';
}

export function submitHistoryPassword() {
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
export function showHistory() {
  loadHistory();
  document.getElementById('historyModal').style.display = 'block';
  setTimeout(() => { import('./search-service.js').then(m => m.setupQuickFilters()); }, 100);
}

// L2420
export function addHistoryItemEventListeners() {
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
export function editReportCost(id) {
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
export function loadReportForEditing(id) {
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
export function deleteReport(id) {
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
