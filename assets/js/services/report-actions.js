import { getAppState, toggleGenerateUpdateButton, setLastGeneratedReportId } from '../state/app-state.js';
import { setPreviewButtonMode } from '../ui/form-ui.js';
import { createReportHTML } from './report-builder.js';
import { paginateReport } from './report-paginator.js';
import { saveToHistory } from './history-service.js';
import { checkDuplicatePatient } from './duplicate-service.js';
import { formatDisplayDate } from '../utils/date-helpers.js';
import { validatePatientId } from '../utils/patient-id.js';
import { updateTodayTotal } from '../calculators/cost-calculator.js';
import { updateTodayReportCount, updateTestStats } from './stats-service.js';
import { formatCBCDecimalInputs, calculateCBCParameters } from '../calculators/cbc-calculator.js';

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
export function generateReport() {
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
export function updateReport() {
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

export { toggleGenerateUpdateButton };
