/* Extracted from index.html L725-729, L2571-2932. */
import { getTodayDate, getCurrentMonthName, formatDisplayDate } from '../utils/date-helpers.js';
import { getTubeCounts, getKitCounts } from '../state/inventory-state.js';
import { INVENTORY_PASSWORD } from '../config/auth-config.js';

// L725
export function getTodayReportCount() {
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  const today = getTodayDate();
  return history.filter(item => item.reportedDate === today && item.tests && typeof item.tests === 'object').length;
}

// L2571
export function calculateSearchStatistics(filteredHistory, filters) {
  try {
    const stats = {
      totalReports: filteredHistory.length, totalTests: 0,
      testBreakdown: { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 },
      totalCollection: 0, paymentBreakdown: { Cash: 0, Online: 0 },
      dateRange: filters.dateFrom && filters.dateTo ? `${formatDisplayDate(filters.dateFrom)} to ${formatDisplayDate(filters.dateTo)}` : 'All dates'
    };
    filteredHistory.forEach(item => {
      if (item.tests && typeof item.tests === 'object') {
        Object.keys(item.tests).forEach(test => {
          if (item.tests[test]) { stats.totalTests++; if (stats.testBreakdown[test] !== undefined) stats.testBreakdown[test]++; }
        });
      }
      if (item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) stats.totalCollection += parseFloat(item.testCost);
      if (item.paymentMode && stats.paymentBreakdown[item.paymentMode] !== undefined) stats.paymentBreakdown[item.paymentMode]++;
    });
    return stats;
  } catch (error) {
    console.error('Error calculating search statistics:', error);
    return { totalReports: 0, totalTests: 0, testBreakdown: {}, totalCollection: 0, paymentBreakdown: {}, dateRange: 'Error calculating statistics' };
  }
}

// L2636
export function getMonthlyTestStats() {
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  let totalTests = 0, totalReports = 0;
  const testCounts = { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 };
  const todayCounts = { ...testCounts };
  const today = getTodayDate();
  history.forEach(item => {
    if (item.tests && typeof item.tests === 'object') {
      const reportYear = parseInt(item.reportedDate.split('-')[0]);
      const reportMonth = parseInt(item.reportedDate.split('-')[1]);
      if (reportYear === currentYear && reportMonth === currentMonth) {
        totalReports++;
        for (const test in item.tests) {
          if (item.tests[test]) { totalTests++; testCounts[test]++; if (item.reportedDate === today) todayCounts[test]++; }
        }
      }
    }
  });
  return { totalTests, totalReports, testCounts, todayCounts };
}

// L2679
export function updateTestStats() {
  if (!document.getElementById('todayCBC')) return;
  const { todayCounts } = getMonthlyTestStats();
  document.getElementById('todayCBC').innerText = `CBC: ${todayCounts.cbc}`;
  document.getElementById('todayESR').innerText = `ESR: ${todayCounts.esr}`;
  document.getElementById('todayTyphoid').innerText = `Typhoid: ${todayCounts.typhi}`;
  document.getElementById('todayDengue').innerText = `Dengue: ${todayCounts.dengue}`;
  document.getElementById('todayMalaria').innerText = `Malaria: ${todayCounts.malaria}`;
  document.getElementById('todayWidal').innerText = `Widal: ${todayCounts.widal}`;
  document.getElementById('todayBloodGroup').innerText = `Blood Group: ${todayCounts.bloodGroup}`;
  document.getElementById('todayBilirubin').innerText = `Bilirubin: ${todayCounts.bilirubin}`;
  document.getElementById('todayCRP').innerText = `CRP: ${todayCounts.crp}`;
  hideZeroTodayTests();
}

// L2695
export function hideZeroTodayTests() {
  const ids = ['todayCBC','todayESR','todayTyphoid','todayDengue','todayMalaria','todayWidal','todayBloodGroup','todayBilirubin','todayCRP'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { const count = parseInt(el.innerText.split(':')[1].trim()); el.style.display = count > 0 ? '' : 'none'; }
  });
}

// L2710
export function updateTodayReportCount() {
  const reportCount = getTodayReportCount();
  const displayElement = document.getElementById('todayTestCount');
  if (displayElement) {
    displayElement.innerText = reportCount.toString().padStart(2, '0');
    displayElement.style.display = 'none';
    setTimeout(() => { displayElement.style.display = 'flex'; }, 0);
  }
}

// Password modal controls for Statistics
export function openStatisticsPasswordModal() {
  const modal = document.getElementById('statisticsPasswordModal');
  const input = document.getElementById('statisticsPasswordInput');
  const error = document.getElementById('statisticsPasswordError');
  if (modal) {
    modal.style.display = 'flex';
    if (error) error.style.display = 'none';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
  }
}

export function closeStatisticsPasswordModal() {
  const modal = document.getElementById('statisticsPasswordModal');
  const input = document.getElementById('statisticsPasswordInput');
  const error = document.getElementById('statisticsPasswordError');
  if (modal) modal.style.display = 'none';
  if (input) input.value = '';
  if (error) error.style.display = 'none';
}

export function submitStatisticsPassword() {
  const input = document.getElementById('statisticsPasswordInput');
  const error = document.getElementById('statisticsPasswordError');
  if (input && input.value === INVENTORY_PASSWORD) {
    closeStatisticsPasswordModal();
    renderStatistics();
  } else {
    if (error) error.style.display = 'block';
    if (input) {
      input.focus();
      input.select();
    }
  }
}

export function renderStatistics() {
  updateTestStats();
  const history = JSON.parse(localStorage.getItem('labReportsHistory')) || [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthName = getCurrentMonthName();
  let monthlyCollection = 0, monthlyCash = 0, monthlyOnline = 0, monthlyReports = 0;
  const testCounts = { cbc: 0, esr: 0, typhi: 0, dengue: 0, malaria: 0, widal: 0, bloodGroup: 0, bilirubin: 0, crp: 0 };
  let purpleTubeUsage = 0, redTubeUsage = 0;
  history.forEach(item => {
    if (item.tests && typeof item.tests === 'object') {
      const reportYear = parseInt(item.reportedDate.split('-')[0]);
      const reportMonth = parseInt(item.reportedDate.split('-')[1]);
      if (reportYear === currentYear && reportMonth === currentMonth) {
        monthlyReports++;
        if (item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
          monthlyCollection += parseFloat(item.testCost);
          if (item.paymentMode === 'Cash') monthlyCash += parseFloat(item.testCost);
          else if (item.paymentMode === 'Online') monthlyOnline += parseFloat(item.testCost);
        }
        for (const test in item.tests) { if (item.tests[test] && testCounts[test] !== undefined) testCounts[test]++; }
        if (item.tubeUsed === 'Purple') purpleTubeUsage++;
        else if (item.tubeUsed === 'Red') redTubeUsage++;
      }
    }
  });
  const tubeCounts = getTubeCounts();
  const kitCounts = getKitCounts();
  const statContent = document.getElementById('statisticsContent');
  if (statContent) {
    statContent.innerHTML = `
    <div class="stats-summary"><h3>${currentMonthName} ${currentYear} Collection Summary</h3>
    <table class="stats-table"><tr><th>Total Collection</th><td>₹${monthlyCollection.toFixed(2)}</td></tr>
    <tr><th>Cash Collection</th><td>₹${monthlyCash.toFixed(2)}</td></tr>
    <tr><th>Online Collection</th><td>₹${monthlyOnline.toFixed(2)}</td></tr>
    <tr><th>Total Reports</th><td>${monthlyReports}</td></tr></table></div>
    <div class="stats-summary"><h3>Test Statistics for ${currentMonthName}</h3>
    <table class="stats-table">
    <tr><th>CBC Tests</th><td>${testCounts.cbc}</td></tr><tr><th>ESR Tests</th><td>${testCounts.esr}</td></tr>
    <tr><th>Typhoid Tests</th><td>${testCounts.typhi}</td></tr><tr><th>Dengue Tests</th><td>${testCounts.dengue}</td></tr>
    <tr><th>Malaria Tests</th><td>${testCounts.malaria}</td></tr><tr><th>Widal Tests</th><td>${testCounts.widal}</td></tr>
    <tr><th>Blood Group Tests</th><td>${testCounts.bloodGroup}</td></tr><tr><th>Bilirubin Tests</th><td>${testCounts.bilirubin}</td></tr>
    <tr><th>CRP Tests</th><td>${testCounts.crp}</td></tr></table></div>
    <div class="stats-summary"><h3>Tube Usage and Inventory</h3>
    <table class="stats-table"><tr><th>Purple Tubes Used This Month</th><td>${purpleTubeUsage}</td></tr>
    <tr><th>Red Tubes Used This Month</th><td>${redTubeUsage}</td></tr>
    <tr><th>Purple Tubes Remaining</th><td>${tubeCounts.purple}</td></tr>
    <tr><th>Red Tubes Remaining</th><td>${tubeCounts.red}</td></tr>
    <tr><th>Typhoid Kits Remaining</th><td>${kitCounts.typhoid}</td></tr>
    <tr><th>Malaria Kits Remaining</th><td>${kitCounts.malaria}</td></tr></table></div>`;
  }
  const statsModal = document.getElementById('statisticsModal');
  if (statsModal) statsModal.style.display = 'block';
}

// L2723 — open password modal
export function showStatistics() {
  openStatisticsPasswordModal();
}

