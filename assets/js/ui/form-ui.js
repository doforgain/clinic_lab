/* UI helpers: index.html L962-1005 + L2269-2281 (showReport moved here to break history<->report cycle).
 * No imports from services/ (one-way DAG: services->ui forbidden in reverse). */
import { updateSuggestedCost } from '../config/pricing-config.js';

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

// L2269 — moved from history/report to ui (v2 cycle-break delta, behaviour identical)
export function showReport(item) {
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

export function hideReportShowForm() {
  document.getElementById('reportOutput').style.display = 'none';
  document.querySelector('.test-inputs').style.display = 'block';
  document.querySelector('.patient-info').style.display = 'grid';
  document.querySelector('.test-selection').style.display = 'block';
  document.querySelector('.cost-section').style.display = 'flex';
  document.querySelector('.test-stats').style.display = 'block';
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
