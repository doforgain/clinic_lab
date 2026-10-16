/* App entrypoint — decomposed DOMContentLoaded from index.html.
 * Wires all modules. Compiled into assets/js/bundle.js for zero-build execution.
 * Cycle-free: app.js is the only file allowed to import services + ui together. */
import { getTodayDate } from './utils/date-helpers.js';
import { generatePatientId, validatePatientId, isPatientIdExists } from './utils/patient-id.js';
import { getAppState, toggleGenerateUpdateButton, getLastGeneratedReportId, setLastGeneratedReportId, getCurrentPreviewHistoryId, setCurrentPreviewHistoryId } from './state/app-state.js';
import { STORAGE_KEYS, SESSION_KEYS, loadHistoryData, syncReportsFromCloud, initRealtimeSync } from './state/storage.js';
import { calculateCBCParameters, calculateIndirectBilirubin, CBC_DECIMAL_FIELD_IDS, formatPointValue, formatPlateletValue } from './calculators/cbc-calculator.js';
import { updateTodayTotal, toggleCollection, submitCollectionPassword, closeCollectionPasswordModal } from './calculators/cost-calculator.js';
import { updateSuggestedCost } from './config/pricing-config.js';
import { autoUpdatePatientTitle, toggleTestInputs, bindMutualExclusivity, bindTestCheckboxes, setFormButtonMode, showReport } from './ui/form-ui.js';
import { generateReport, updateReport } from './services/report-actions.js';
import { saveAsPDF } from './services/pdf-service.js';
import { closeHistoryPasswordModal, loadReportForEditing, loadHistory } from './services/history-service.js';
import { showAdvancedSearch, applyAdvancedSearch, resetAdvancedSearch, closeAdvancedSearch, setupSearchFunctionality, setupQuickFilters, setLoadHistoryHook } from './services/search-service.js';
import { updateTestStats, updateTodayReportCount, renderStatistics, closeStatisticsPasswordModal } from './services/stats-service.js';
import { updateTubeInventoryWithPassword, closeInventoryPasswordModal, submitInventoryPassword, closeUpdateInventoryModal, saveInventoryChanges } from './services/inventory-service.js';
import { initInvoicePage } from './services/invoice-service.js';
import { initInactivityWatcher } from './services/idle-service.js';

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
