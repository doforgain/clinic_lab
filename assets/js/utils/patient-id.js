import { getAppState } from '../state/app-state.js';
import { loadHistoryData } from '../state/storage.js';

export function generatePatientId() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const currentYear = currentDate.getFullYear();
  const prefix = `${currentMonth}-${currentYear}-`;
  const history = loadHistoryData();
  let maxSerial = 0;
  history.forEach(item => {
    if (item && item.patientId && String(item.patientId).toUpperCase().startsWith(prefix)) {
      const parts = String(item.patientId).split('-');
      if (parts.length >= 3) {
        const serial = parseInt(parts[2], 10);
        if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
      }
    }
  });
  let nextSerial = maxSerial + 1;
  let candidateId = `${prefix}${nextSerial.toString().padStart(4, '0')}`;
  while (isPatientIdExists(candidateId)) {
    nextSerial++;
    candidateId = `${prefix}${nextSerial.toString().padStart(4, '0')}`;
  }
  return candidateId;
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
