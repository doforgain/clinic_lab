/* App entrypoint — decomposed DOMContentLoaded from index.html L1291-1498.
 * Wires all modules. Behaviour identical to legacy. Load via <script type="module">.
 * Cycle-free: app.js is the only file allowed to import services + ui together. */
import { getTodayDate } from './utils/date-helpers.js';
import { generatePatientId, validatePatientId } from './utils/patient-id.js';
import { getAppState, toggleGenerateUpdateButton } from './state/app-state.js';
import { STORAGE_KEYS, SESSION_KEYS } from './state/storage.js';
import { getTubeCounts, setTubeCounts, initializeKitInventory, updateTubeCountsDisplay, updateKitCountsDisplay } from './state/inventory-state.js';
import { calculateCBCParameters, calculateIndirectBilirubin } from './calculators/cbc-calculator.js';
import { updateTodayTotal, toggleCollection } from './calculators/cost-calculator.js';
import { updateSuggestedCost } from './config/pricing-config.js';
import { HISTORY_PASSWORD } from './config/auth-config.js';
import { autoUpdatePatientTitle, toggleTestInputs, bindMutualExclusivity, bindTestCheckboxes } from './ui/form-ui.js';
import { generateReport, updateReport } from './services/report-actions.js';
import { saveAsPDF } from './services/pdf-service.js';
import { showHistory } from './services/history-service.js';
import { showAdvancedSearch, applyAdvancedSearch, resetAdvancedSearch, closeAdvancedSearch, setupSearchFunctionality, setLoadHistoryHook } from './services/search-service.js';
import { loadHistory } from './services/history-service.js';
import { updateTestStats, updateTodayReportCount, showStatistics } from './services/stats-service.js';
import { updateTubeInventoryWithPassword } from './services/inventory-service.js';

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
  document.getElementById('viewHistory').addEventListener('click', function () {
    const password = prompt('Please enter the password to view report history:');
    if (password === HISTORY_PASSWORD) showHistory();
    else if (password !== null) alert('Incorrect password. Please try again.');
  });
  document.getElementById('statisticsBtn').addEventListener('click', showStatistics);
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
  window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('historyModal')) document.getElementById('historyModal').style.display = 'none';
    if (event.target === document.getElementById('statisticsModal')) document.getElementById('statisticsModal').style.display = 'none';
    if (event.target === document.getElementById('advancedSearchModal')) closeAdvancedSearch();
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
