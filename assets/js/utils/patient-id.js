/* Extracted from index.html L680-722. localStorage access preserved for parity. */
import { getAppState } from '../state/app-state.js';

export function generatePatientId() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const currentYear = currentDate.getFullYear();
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  let maxSerial = 0;
  history.forEach(item => {
    if (item.patientId && item.patientId.startsWith(`${currentMonth}-${currentYear}-`)) {
      const serialStr = item.patientId.split('-')[2];
      const serial = parseInt(serialStr);
      if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
    }
  });
  const nextSerial = maxSerial + 1;
  return `${currentMonth}-${currentYear}-${nextSerial.toString().padStart(4, '0')}`;
}

export function isPatientIdExists(patientId, excludeId = null) {
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  return history.some(item => {
    if (excludeId && item.id === excludeId) return false;
    return item.patientId === patientId;
  });
}

// Legacy DOM wrapper (L711): reads #patientId, toggles #patientIdWarning.
// excludeId defaults to app-state currentEditingId for parity with global.
export function validatePatientId(excludeId = null) {
  const id = excludeId !== null ? excludeId : getAppState().currentEditingId;
  const patientId = document.getElementById('patientId').value;
  const warningElement = document.getElementById('patientIdWarning');
  if (isPatientIdExists(patientId, id)) {
    warningElement.style.display = 'block';
    return false;
  } else {
    warningElement.style.display = 'none';
    return true;
  }
}
