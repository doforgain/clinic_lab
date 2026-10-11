/* Extracted from index.html L1104-1139, L2097-2406. No import of history-service (cycle broken via hook). */
import { getCurrentFilters, setCurrentFilters } from '../state/app-state.js';
import { formatDisplayDate } from '../utils/date-helpers.js';
import { calculateSearchStatistics } from './stats-service.js';

// Hook set by app.js to break search<->history import cycle (behaviour identical to legacy direct call)
let loadHistoryHook = null;
export function setLoadHistoryHook(fn) { loadHistoryHook = fn; }
function callLoadHistory(filters) {
  if (loadHistoryHook) loadHistoryHook(filters);
}

// L1104
export function showAdvancedSearch() {
  document.getElementById('advancedSearchModal').style.display = 'block';
}
// Collects 9 inputs (pure part of L1108)
export function collectAdvancedFilters() {
  return {
    dateFrom: document.getElementById('searchDateFrom').value,
    dateTo: document.getElementById('searchDateTo').value,
    testType: document.getElementById('searchTestType').value,
    paymentMode: document.getElementById('searchPaymentMode').value,
    minCost: document.getElementById('searchMinCost').value,
    maxCost: document.getElementById('searchMaxCost').value,
    gender: document.getElementById('searchGender').value,
    ageFrom: document.getElementById('searchAgeFrom').value,
    ageTo: document.getElementById('searchAgeTo').value
  };
}
// L1108
export function applyAdvancedSearch() {
  const filters = collectAdvancedFilters();
  callLoadHistory(filters);
  document.getElementById('advancedSearchModal').style.display = 'none';
}
// L1125
export function resetAdvancedSearch() {
  ['searchDateFrom','searchDateTo','searchTestType','searchPaymentMode','searchMinCost','searchMaxCost','searchGender','searchAgeFrom','searchAgeTo'].forEach(id => { document.getElementById(id).value = ''; });
}
// L1137
export function closeAdvancedSearch() {
  document.getElementById('advancedSearchModal').style.display = 'none';
}

// L2097
export function applyAdvancedFilters(history, filters) {
  return history.filter(item => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchLower) ||
        item.patientId.toLowerCase().includes(searchLower) ||
        (item.referredBy && item.referredBy.toLowerCase().includes(searchLower)) ||
        item.collectionDate.includes(filters.searchTerm) ||
        item.reportedDate.includes(filters.searchTerm);
      if (!matchesSearch) return false;
    }
    if (filters.dateFrom && item.reportedDate < filters.dateFrom) return false;
    if (filters.dateTo && item.reportedDate > filters.dateTo) return false;
    if (filters.testType && (!item.tests || !item.tests[filters.testType])) return false;
    if (filters.paymentMode && item.paymentMode !== filters.paymentMode) return false;
    if (filters.minCost && item.testCost && item.testCost !== 'Not specified') {
      if (parseFloat(item.testCost) < parseFloat(filters.minCost)) return false;
    }
    if (filters.maxCost && item.testCost && item.testCost !== 'Not specified') {
      if (parseFloat(item.testCost) > parseFloat(filters.maxCost)) return false;
    }
    if (filters.gender && item.patientGender !== filters.gender) return false;
    if (filters.ageFrom && parseInt(item.patientAge) < parseInt(filters.ageFrom)) return false;
    if (filters.ageTo && parseInt(item.patientAge) > parseInt(filters.ageTo)) return false;
    return true;
  });
}

// L2143 — needs calculateSearchStatistics + getActiveFilters (same module below)
export function updateSearchSummary(filteredCount, totalCount, searchStats) {
  try {
    const summaryElement = document.getElementById('searchSummary');
    const activeFiltersElement = document.getElementById('activeFilters');
    if (!summaryElement || !activeFiltersElement) return;
    const activeFilters = getActiveFilters();
    if (activeFilters.length > 0 || filteredCount < totalCount) {
      summaryElement.style.display = 'block';
      activeFiltersElement.innerHTML = '';
      activeFilters.forEach(filter => {
        const filterTag = document.createElement('span');
        filterTag.className = 'filter-tag';
        filterTag.innerHTML = `${filter.label}: ${filter.value}<span class="remove-filter" data-filter="${filter.key}">&times;</span>`;
        activeFiltersElement.appendChild(filterTag);
      });
      const statsHTML = `
        <div class="search-statistics"><h4>Search Results Summary</h4>
        <div class="stats-overview">
          <div class="stat-main"><span class="stat-number">${searchStats.totalReports}</span><span class="stat-label">Total Reports</span></div>
          <div class="stat-main"><span class="stat-number">${searchStats.totalTests}</span><span class="stat-label">Total Tests</span></div>
          <div class="stat-main"><span class="stat-number">₹${searchStats.totalCollection.toFixed(2)}</span><span class="stat-label">Total Collection</span></div>
        </div>
        <div class="test-breakdown"><h5>Test Breakdown:</h5><div class="test-stats-list">
          ${searchStats.testBreakdown.cbc > 0 ? `<div class="test-stat"><span>CBC:</span> <strong>${searchStats.testBreakdown.cbc}</strong></div>` : ''}
          ${searchStats.testBreakdown.esr > 0 ? `<div class="test-stat"><span>ESR:</span> <strong>${searchStats.testBreakdown.esr}</strong></div>` : ''}
          ${searchStats.testBreakdown.typhi > 0 ? `<div class="test-stat"><span>Typhoid:</span> <strong>${searchStats.testBreakdown.typhi}</strong></div>` : ''}
          ${searchStats.testBreakdown.dengue > 0 ? `<div class="test-stat"><span>Dengue:</span> <strong>${searchStats.testBreakdown.dengue}</strong></div>` : ''}
          ${searchStats.testBreakdown.malaria > 0 ? `<div class="test-stat"><span>Malaria:</span> <strong>${searchStats.testBreakdown.malaria}</strong></div>` : ''}
          ${searchStats.testBreakdown.widal > 0 ? `<div class="test-stat"><span>Widal:</span> <strong>${searchStats.testBreakdown.widal}</strong></div>` : ''}
          ${searchStats.testBreakdown.bloodGroup > 0 ? `<div class="test-stat"><span>Blood Group:</span> <strong>${searchStats.testBreakdown.bloodGroup}</strong></div>` : ''}
          ${searchStats.testBreakdown.bilirubin > 0 ? `<div class="test-stat"><span>Bilirubin:</span> <strong>${searchStats.testBreakdown.bilirubin}</strong></div>` : ''}
          ${searchStats.testBreakdown.crp > 0 ? `<div class="test-stat"><span>CRP:</span> <strong>${searchStats.testBreakdown.crp}</strong></div>` : ''}
        </div></div></div>`;
      const statsElement = document.createElement('div');
      statsElement.innerHTML = statsHTML;
      activeFiltersElement.appendChild(statsElement);
      document.querySelectorAll('.remove-filter').forEach(btn => {
        btn.addEventListener('click', function (e) { e.stopPropagation(); removeFilter(this.dataset.filter); });
      });
    } else {
      summaryElement.style.display = 'none';
    }
  } catch (error) { console.error('Error updating search summary:', error); }
}

// L2221
export function getActiveFilters() {
  const currentFilters = getCurrentFilters();
  const activeFilters = [];
  if (currentFilters.searchTerm) activeFilters.push({ key: 'searchTerm', label: 'Search', value: currentFilters.searchTerm });
  if (currentFilters.dateFrom) activeFilters.push({ key: 'dateFrom', label: 'From Date', value: formatDisplayDate(currentFilters.dateFrom) });
  if (currentFilters.dateTo) activeFilters.push({ key: 'dateTo', label: 'To Date', value: formatDisplayDate(currentFilters.dateTo) });
  if (currentFilters.testType) activeFilters.push({ key: 'testType', label: 'Test Type', value: currentFilters.testType });
  if (currentFilters.paymentMode) activeFilters.push({ key: 'paymentMode', label: 'Payment', value: currentFilters.paymentMode });
  if (currentFilters.minCost) activeFilters.push({ key: 'minCost', label: 'Min Cost', value: `₹${currentFilters.minCost}` });
  if (currentFilters.maxCost) activeFilters.push({ key: 'maxCost', label: 'Max Cost', value: `₹${currentFilters.maxCost}` });
  if (currentFilters.gender) activeFilters.push({ key: 'gender', label: 'Gender', value: currentFilters.gender });
  if (currentFilters.ageFrom) activeFilters.push({ key: 'ageFrom', label: 'Min Age', value: currentFilters.ageFrom });
  if (currentFilters.ageTo) activeFilters.push({ key: 'ageTo', label: 'Max Age', value: currentFilters.ageTo });
  return activeFilters;
}

// L2259
export function removeFilter(filterKey) {
  setCurrentFilters({ [filterKey]: '' });
  callLoadHistory();
  const inputField = document.getElementById(`search${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`);
  if (inputField) inputField.value = '';
}

// L2284
export function setupQuickFilters() {
  const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
  quickFilterButtons.forEach(btn => { btn.replaceWith(btn.cloneNode(true)); });
  document.querySelectorAll('.quick-filter-btn[data-days]').forEach(btn => {
    btn.addEventListener('click', function () {
      const days = parseInt(this.dataset.days);
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days + 1);
      const filters = { dateFrom: startDate.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0], searchTerm: '' };
      setCurrentFilters(filters);
      callLoadHistory(filters);
      setActiveQuickFilter(this);
    });
  });
  document.querySelectorAll('.quick-filter-btn[data-test]').forEach(btn => {
    btn.addEventListener('click', function () {
      const filters = { testType: this.dataset.test, searchTerm: '' };
      setCurrentFilters(filters);
      callLoadHistory(filters);
      setActiveQuickFilter(this);
    });
  });
  document.querySelectorAll('.quick-filter-btn[data-payment]').forEach(btn => {
    btn.addEventListener('click', function () {
      const filters = { paymentMode: this.dataset.payment, searchTerm: '' };
      setCurrentFilters(filters);
      callLoadHistory(filters);
      setActiveQuickFilter(this);
    });
  });
}

// L2346
export function setActiveQuickFilter(activeBtn) {
  document.querySelectorAll('.quick-filter-btn').forEach(btn => { btn.classList.remove('active'); });
  activeBtn.classList.add('active');
}

// L2354
export function setupSearchFunctionality() {
  const searchInput = document.getElementById('searchHistory');
  const clearSearchBtn = document.getElementById('clearSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const filters = { searchTerm: this.value.trim(), dateFrom: '', dateTo: '', testType: '', paymentMode: '', minCost: '', maxCost: '', gender: '', ageFrom: '', ageTo: '' };
      document.querySelectorAll('.quick-filter-btn').forEach(btn => { btn.classList.remove('active'); });
      callLoadHistory(filters);
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function () {
      if (document.getElementById('searchHistory')) document.getElementById('searchHistory').value = '';
      setCurrentFilters({ searchTerm: '', dateFrom: '', dateTo: '', testType: '', paymentMode: '', minCost: '', maxCost: '', gender: '', ageFrom: '', ageTo: '' });
      // need full reset object merge: clear all
      const cf = getCurrentFilters();
      Object.keys(cf).forEach(k => cf[k] = '');
      callLoadHistory();
      document.querySelectorAll('.quick-filter-btn').forEach(btn => { btn.classList.remove('active'); });
    });
  }
}

export { calculateSearchStatistics };
