import { updateSuggestedCost } from '../config/pricing-config.js';
import { setCurrentPreviewHistoryId } from '../state/app-state.js';

// L962
export function autoUpdatePatientTitle() {
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
export function toggleTestInputs() {
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
  if (updateBtn) updateBtn.style.display = 'none';
  if (editBtn) {
    editBtn.style.display = 'inline-block';
    editBtn.classList.add('enabled');
  }
  if (printBtn) printBtn.classList.add('enabled');
  if (savePdfBtn) savePdfBtn.classList.add('enabled');
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
    if (updateBtn) updateBtn.style.display = 'inline-block';
  } else {
    if (generateBtn) generateBtn.style.display = 'inline-block';
    if (updateBtn) updateBtn.style.display = 'none';
  }

  if (editBtn) {
    editBtn.style.display = 'none';
    editBtn.classList.remove('enabled');
  }
  if (printBtn) printBtn.classList.remove('enabled');
  if (savePdfBtn) savePdfBtn.classList.remove('enabled');
  if (newBtn) newBtn.style.display = 'inline-block';
  if (viewHistoryBtn) viewHistoryBtn.style.display = 'inline-block';
  if (statisticsBtn) statisticsBtn.style.display = 'inline-block';
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
  document.querySelector('.test-stats').style.display = 'block';
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
  document.getElementById('malariaResult').addEventListener('change', toggleTestInputs);
}
