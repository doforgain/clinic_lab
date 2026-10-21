import { updateSuggestedCost } from '../config/pricing-config.js';
import { setCurrentPreviewHistoryId } from '../state/app-state.js';

// L962
export function computePatientTitle({ ageVal, ageUnit = 'Yrs', gender = '' } = {}) {
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

export function autoUpdatePatientTitle() {
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
export function toggleTestInputs() {
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

export function setPreviewButtonMode() {
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

export function setFormButtonMode(isEditMode = false) {
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
export function showReport(item) {
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
  setPreviewButtonMode();
  const histModal = document.getElementById('historyModal');
  if (histModal) histModal.style.display = 'none';
}

export function hideReportShowForm(isEditMode = false) {
  document.getElementById('reportOutput').style.display = 'none';
  document.querySelector('.test-inputs').style.display = 'block';
  document.querySelector('.patient-info').style.display = 'grid';
  document.querySelector('.test-selection').style.display = 'block';
  document.querySelector('.cost-section').style.display = 'flex';
  const testStats = document.querySelector('.test-stats');
  if (testStats) testStats.style.display = 'block';
  setFormButtonMode(isEditMode);
}

export function bindMutualExclusivity() {
  const cashCheckbox = document.getElementById('paymentCash');
  const onlineCheckbox = document.getElementById('paymentOnline');
  cashCheckbox.addEventListener('change', function () { if (this.checked) onlineCheckbox.checked = false; });
  onlineCheckbox.addEventListener('change', function () { if (this.checked) cashCheckbox.checked = false; });
  const purpleTubeCheckbox = document.getElementById('tubePurple');
  const redTubeCheckbox = document.getElementById('tubeRed');
  purpleTubeCheckbox.addEventListener('change', function () { if (this.checked) redTubeCheckbox.checked = false; });
  redTubeCheckbox.addEventListener('change', function () { if (this.checked) purpleTubeCheckbox.checked = false; });
}

export function bindTestCheckboxes() {
  document.querySelectorAll('.test-option input').forEach(checkbox => {
    checkbox.addEventListener('change', function () { toggleTestInputs(); updateSuggestedCost(); });
  });
  document.getElementById('typhiResult').addEventListener('change', toggleTestInputs);
  document.getElementById('dengueResult')?.addEventListener('change', toggleTestInputs);
  document.getElementById('malariaResult').addEventListener('change', toggleTestInputs);
}
