/* NEW in v2 — owns globals from index.html L571-572 + L2028-2039.
 * Breaks report-actions <-> history cycle by owning toggleGenerateUpdateButton (was L880-895). */

const appState = {
  isEditing: false,
  currentEditingId: null,
  lastGeneratedReportId: null,
  currentPreviewHistoryId: null,
  currentFilters: {
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    testType: '',
    paymentMode: '',
    minCost: '',
    maxCost: '',
    gender: '',
    ageFrom: '',
    ageTo: ''
  }
};

export function getAppState() { return appState; }
export function setEditing(isEditMode, reportId = null) {
  appState.isEditing = !!isEditMode;
  appState.currentEditingId = reportId;
}
export function setLastGeneratedReportId(id) {
  appState.lastGeneratedReportId = id;
}
export function getLastGeneratedReportId() {
  return appState.lastGeneratedReportId;
}
export function setCurrentPreviewHistoryId(id) {
  appState.currentPreviewHistoryId = id;
}
export function getCurrentPreviewHistoryId() {
  return appState.currentPreviewHistoryId;
}
export function getCurrentFilters() { return appState.currentFilters; }
export function setCurrentFilters(patch) {
  Object.assign(appState.currentFilters, patch);
}
export function resetCurrentFilters() {
  appState.currentFilters = {
    searchTerm: '', dateFrom: '', dateTo: '', testType: '', paymentMode: '',
    minCost: '', maxCost: '', gender: '', ageFrom: '', ageTo: ''
  };
}

// Moved from report-builder (v2 delta to break cycle): L880-895 identical behaviour
export function toggleGenerateUpdateButton(isEditMode = false, reportId = null) {
  const generateBtn = document.getElementById('generateReport');
  const updateBtn = document.getElementById('updateReport');
  const isPreview = document.body.classList.contains('report-preview-active') ||
    (document.getElementById('reportOutput') && document.getElementById('reportOutput').style.display === 'block');

  if (isEditMode) {
    if (generateBtn) generateBtn.style.display = 'none';
    if (updateBtn) updateBtn.style.display = isPreview ? 'none' : 'block';
    setEditing(true, reportId);
  } else {
    if (generateBtn) generateBtn.style.display = isPreview ? 'none' : 'block';
    if (updateBtn) updateBtn.style.display = 'none';
    setEditing(false, null);
  }
}
