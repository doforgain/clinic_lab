/* Centralises localStorage keys observed in index.html (parity, no behaviour change). */

export const STORAGE_KEYS = {
  HISTORY: 'labReportsHistory',
  GLOBAL_SERIAL: 'globalHistorySerial',
  PURPLE_TUBE: 'purpleTubeCount',
  RED_TUBE: 'redTubeCount',
  TYPHOID_KIT: 'typhoidKitCount',
  MALARIA_KIT: 'malariaKitCount'
};
export const SESSION_KEYS = { CURRENT_PATIENT_ID: 'currentPatientId' };

export function loadHistoryData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
  } catch (e) {
    console.error('storage load failed', e);
    return [];
  }
}
export function saveHistoryData(history) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}
export function getGlobalSerial() {
  return parseInt(localStorage.getItem(STORAGE_KEYS.GLOBAL_SERIAL) || '0');
}
export function setGlobalSerial(n) {
  localStorage.setItem(STORAGE_KEYS.GLOBAL_SERIAL, String(n));
}
