/* Extracted from index.html L1141-1269, L2042-2094, L2409-2569.
 * Split notes: inventory part delegates to inventory-state; filter/stats to search/stats services.
 * Depends on ui/form-ui for view helpers (one-way: services->ui, ui never imports services). */
import { getCurrentFilters, setCurrentFilters, toggleGenerateUpdateButton } from '../state/app-state.js';
import { loadHistoryData, saveHistoryData, getGlobalSerial, setGlobalSerial, syncReportToCloud, deleteReportFromCloud, addTombstone } from '../state/storage.js';
import { decrementTube, incrementTube, decrementKits, incrementKits, adjustKitsForEdit } from '../state/inventory-state.js';
import { applyAdvancedFilters, updateSearchSummary } from './search-service.js';
import { calculateSearchStatistics } from './stats-service.js';
import { updateTodayTotal } from '../calculators/cost-calculator.js';
import { updateTodayReportCount, updateTestStats } from './stats-service.js';
import { validatePatientId } from '../utils/patient-id.js';
import { updateSuggestedCost } from '../config/pricing-config.js';
import { toggleTestInputs, showReport, setFormButtonMode } from '../ui/form-ui.js';
import { formatPointValue, formatPlateletValue, formatCBCDecimalInputs, calculateCBCParameters } from '../calculators/cbc-calculator.js';
import { escapeHtml } from '../utils/dom-helpers.js';

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
  const patientPhone = document.getElementById('patientPhone') ? document.getElementById('patientPhone').value.trim() : '';
  const patientCity = document.getElementById('patientCity') ? document.getElementById('patientCity').value.trim() : '';
  const fastingStatus = document.getElementById('fastingStatus') ? document.getElementById('fastingStatus').value.trim() : '';
  const relationType = document.getElementById('relationType') ? document.getElementById('relationType').value : 'S/O';
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
export function loadHistory(filters = null) {
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
export function closeHistoryPasswordModal() {
  const modal = document.getElementById('historyPasswordModal');
  const input = document.getElementById('historyPasswordInput');
  const error = document.getElementById('historyPasswordError');
  if (modal) modal.style.display = 'none';
  if (input) input.value = '';
  if (error) error.style.display = 'none';
}

// L2420
export function addHistoryItemEventListeners() {
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
export function editReportCost(id) {
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
export function loadReportForEditing(id) {
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
  const guardianMatch = nameToLoad.match(/\s*\((S\/O|W\/O|D\/O|C\/O)\s+([^)]+)\)/i);
  if (guardianMatch) {
    relationPart = guardianMatch[1].toUpperCase();
    guardianPart = guardianMatch[2].trim();
    nameToLoad = nameToLoad.replace(guardianMatch[0], '').trim();
  }
  if (document.getElementById('relationType')) {
    document.getElementById('relationType').value = item.relationType || relationPart;
  }
  if (document.getElementById('guardianName')) {
    document.getElementById('guardianName').value = item.guardianName || guardianPart;
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
export function deleteReport(id) {
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
