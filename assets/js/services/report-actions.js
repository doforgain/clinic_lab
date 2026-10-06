/* Extracted from index.html L1500-1671. Thin orchestration over builder/history/duplicate/cost/stats. */
import { getAppState, toggleGenerateUpdateButton } from '../state/app-state.js';
import { createReportHTML } from './report-builder.js';
import { saveToHistory } from './history-service.js';
import { checkDuplicatePatient } from './duplicate-service.js';
import { formatDisplayDate } from '../utils/date-helpers.js';
import { validatePatientId } from '../utils/patient-id.js';
import { updateTodayTotal } from '../calculators/cost-calculator.js';
import { updateTodayReportCount, updateTestStats } from './stats-service.js';

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
  const testCost = document.getElementById('testCost').value;
  const reportHTML = createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed);
  showGeneratedReport(reportHTML);
  saveToHistory(patientName, patientAge, patientGender, reportHTML, testCost, tests, paymentMode, tubeUsed, currentEditingId);
  updateTodayTotal(); updateTodayReportCount(); updateTestStats();
  toggleGenerateUpdateButton(false);
}

export { toggleGenerateUpdateButton };
