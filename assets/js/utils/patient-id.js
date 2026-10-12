import { getAppState } from '../state/app-state.js';
import { loadHistoryData } from '../state/storage.js';

export function generatePatientId() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const currentYear = currentDate.getFullYear();
  const history = loadHistoryData();
  let maxSerial = 0;
  history.forEach(item => {
    if (item && item.patientId && item.patientId.startsWith(`${currentMonth}-${currentYear}-`)) {
      const serialStr = item.patientId.split('-')[2];
      const serial = parseInt(serialStr);
      if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
    }
  });
  const nextSerial = maxSerial + 1;
  return `${currentMonth}-${currentYear}-${nextSerial.toString().padStart(4, '0')}`;
}

export function isPatientIdExists(patientId, excludeId = null) {
  const history = loadHistoryData();
  return history.some(item => {
    if (!item) return false;
    if (excludeId && String(item.id) === String(excludeId)) return false;
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
    warningElement.classList.remove('is-hidden');
    warningElement.style.display = 'block';
    return false;
  } else {
    warningElement.classList.add('is-hidden');
    warningElement.style.display = 'none';
    return true;
  }
}
