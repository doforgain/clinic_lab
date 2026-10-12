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
  const { todayCounts } = getMonthlyTestStats();
  if (document.getElementById('todayCBC')) {
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

  // Sync Dashboard Overview test chip counts
  const dashMap = {
    dashCBC: todayCounts.cbc,
    dashESR: todayCounts.esr,
    dashTyphoid: todayCounts.typhi,
    dashDengue: todayCounts.dengue,
    dashMalaria: todayCounts.malaria,
    dashWidal: todayCounts.widal,
    dashBloodGroup: todayCounts.bloodGroup,
    dashBilirubin: todayCounts.bilirubin,
    dashCRP: todayCounts.crp
  };
  Object.keys(dashMap).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.innerText = dashMap[k];
  });
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
    const formatted = reportCount.toString().padStart(2, '0');
    displayElement.innerText = formatted;
    const parent = displayElement.closest('.header-test-counter');
    if (parent) parent.title = `Today's Reports Generated: ${formatted}`;
  }
  const dashTodayTests = document.getElementById('dashTodayTests');
  if (dashTodayTests) {
    dashTodayTests.innerText = reportCount.toString();
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
      <!-- Monthly Financial KPI Summary Cards -->
      <div class="stats-kpi-grid">
        <div class="dash-card total">
          <div class="dash-card-icon">💰</div>
          <div class="dash-card-info">
            <div class="dash-label">${currentMonthName} Total Collection</div>
            <div class="dash-val">₹${monthlyCollection.toFixed(2)}</div>
          </div>
        </div>
        <div class="dash-card cash">
          <div class="dash-card-icon">💵</div>
          <div class="dash-card-info">
            <div class="dash-label">Cash Collection</div>
            <div class="dash-val">₹${monthlyCash.toFixed(2)}</div>
          </div>
        </div>
        <div class="dash-card online">
          <div class="dash-card-icon">📱</div>
          <div class="dash-card-info">
            <div class="dash-label">Online Payments</div>
            <div class="dash-val">₹${monthlyOnline.toFixed(2)}</div>
          </div>
        </div>
        <div class="dash-card tests">
          <div class="dash-card-icon">📋</div>
          <div class="dash-card-info">
            <div class="dash-label">Total Reports (${currentMonthName})</div>
            <div class="dash-val">${monthlyReports}</div>
          </div>
        </div>
      </div>

      <!-- Analytics Breakdown Panels -->
      <div class="stats-panels-grid">
        <div class="stats-panel-card">
          <div class="stats-panel-header">
            <h4><span>🧪</span> Diagnostic Tests Breakdown (${currentMonthName} ${currentYear})</h4>
          </div>
          <div class="dashboard-chips-grid stats-chips-grid">
            <div class="test-chip"><span>CBC:</span> <span class="chip-count">${testCounts.cbc}</span></div>
            <div class="test-chip"><span>ESR:</span> <span class="chip-count">${testCounts.esr}</span></div>
            <div class="test-chip"><span>Typhoid:</span> <span class="chip-count">${testCounts.typhi}</span></div>
            <div class="test-chip"><span>Dengue:</span> <span class="chip-count">${testCounts.dengue}</span></div>
            <div class="test-chip"><span>Malaria:</span> <span class="chip-count">${testCounts.malaria}</span></div>
            <div class="test-chip"><span>Widal:</span> <span class="chip-count">${testCounts.widal}</span></div>
            <div class="test-chip"><span>Blood Group:</span> <span class="chip-count">${testCounts.bloodGroup}</span></div>
            <div class="test-chip"><span>Bilirubin:</span> <span class="chip-count">${testCounts.bilirubin}</span></div>
            <div class="test-chip"><span>CRP:</span> <span class="chip-count">${testCounts.crp}</span></div>
          </div>
        </div>

        <div class="stats-panel-card">
          <div class="stats-panel-header">
            <h4><span>📦</span> Tube Consumption & Remaining Stock</h4>
          </div>
          <div class="stats-inventory-grid">
            <div class="inv-stat-item">
              <span class="inv-stat-label">🟣 Purple Tubes Used</span>
              <span class="inv-stat-val usage">${purpleTubeUsage}</span>
            </div>
            <div class="inv-stat-item">
              <span class="inv-stat-label">🟣 Purple Tubes In Stock</span>
              <span class="inv-stat-val stock">${tubeCounts.purple}</span>
            </div>
            <div class="inv-stat-item">
              <span class="inv-stat-label">🔴 Red Tubes Used</span>
              <span class="inv-stat-val usage">${redTubeUsage}</span>
            </div>
            <div class="inv-stat-item">
              <span class="inv-stat-label">🔴 Red Tubes In Stock</span>
              <span class="inv-stat-val stock">${tubeCounts.red}</span>
            </div>
            <div class="inv-stat-item">
              <span class="inv-stat-label">🧪 Typhoid Test Kits</span>
              <span class="inv-stat-val stock">${kitCounts.typhoid}</span>
            </div>
            <div class="inv-stat-item">
              <span class="inv-stat-label">🦟 Malaria Test Kits</span>
              <span class="inv-stat-val stock">${kitCounts.malaria}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  const statsModal = document.getElementById('statisticsModal');
  if (statsModal) statsModal.style.display = 'block';
}

// L2723 — open password modal
export function showStatistics() {
  openStatisticsPasswordModal();
}

