/* Extracted from index.html L591-646. Moved out of patient-id (v1 fix). */
import { TEST_TYPES } from '../config/test-constants.js';
import { formatTimeDifference } from '../utils/date-helpers.js';

export function areTestsIdentical(tests1, tests2) {
  for (const testType of TEST_TYPES) {
    if (tests1[testType] !== tests2[testType]) return false;
  }
  return true;
}

export function checkDuplicatePatient(patientName, patientAge, patientGender, tests) {
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
