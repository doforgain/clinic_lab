/* NEW in v2 — owns globals from index.html L571-572 + L2028-2039.
 * Breaks report-actions <-> history cycle by owning toggleGenerateUpdateButton (was L880-895). */

const appState = {
  isEditing: false,
  currentEditingId: null,
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
  if (isEditMode) {
    generateBtn.style.display = 'none';
    updateBtn.style.display = 'block';
    setEditing(true, reportId);
  } else {
    generateBtn.style.display = 'block';
    updateBtn.style.display = 'none';
    setEditing(false, null);
  }
}
