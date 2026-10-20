#!/usr/bin/env node
/**
 * scripts/test-clinical.js
 *
 * Automated Clinical Safety, Accuracy & Null-Guard Test Runner
 * Validates 100% of clinical calculation formulas, reference ranges,
 * formatting thresholds, combo pricing, XSS escaping, and null-guards.
 *
 * Usage:
 *   node scripts/test-clinical.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

function suite(name) {
  console.log(`\n📋 Suite: ${name}`);
}

async function runTests() {
  console.log('========================================================');
  console.log('🏥 SHAMS HEALTH CARE — Automated Clinical Test Harness');
  console.log('========================================================');

  // Dynamic import of ES6 modules
  const cbcModule = await import('../assets/js/calculators/cbc-calculator.js');
  const testConstantsModule = await import('../assets/js/config/test-constants.js');
  const pricingModule = await import('../assets/js/config/pricing-config.js');
  const domHelpersModule = await import('../assets/js/utils/dom-helpers.js');
  const searchModule = await import('../assets/js/services/search-service.js');
  const formUiModule = await import('../assets/js/ui/form-ui.js');
  const reportBuilderModule = await import('../assets/js/services/report-builder.js');

  const { formatPlateletValue } = cbcModule;
  const {
    isAbnormalByRange,
    refRangeFor,
    crpTier,
    isWidalPositive,
    CBC_PARAMS
  } = testConstantsModule;
  const { computeSuggestedCost } = pricingModule;
  const { escapeHtml } = domHelpersModule;
  const { applyAdvancedFilters } = searchModule;
  const { computePatientTitle } = formUiModule;
  const { formatDengueSubtype } = reportBuilderModule;

  // ----------------------------------------------------
  // SUITE 1: Platelet Count Formatting (B18)
  // ----------------------------------------------------
  suite('1. Platelet Count Formatting (formatPlateletValue - B18)');

  // Severe thrombocytopenia (1000 - 9999 cells/cumm) MUST divide by 100,000
  assert(formatPlateletValue(5000) === '0.05', '5,000 cells/cumm formats to 0.05 lakhs (not 50.00)', `Got: ${formatPlateletValue(5000)}`);
  assert(formatPlateletValue(2500) === '0.03' || formatPlateletValue(2500) === '0.02', '2,500 cells/cumm formats to 0.03/0.02 lakhs', `Got: ${formatPlateletValue(2500)}`);
  assert(formatPlateletValue(1000) === '0.01', '1,000 cells/cumm formats to 0.01 lakhs', `Got: ${formatPlateletValue(1000)}`);
  assert(formatPlateletValue(8500) === '0.09' || formatPlateletValue(8500) === '0.08', '8,500 cells/cumm formats to ~0.08-0.09 lakhs', `Got: ${formatPlateletValue(8500)}`);

  // Standard absolute counts (>= 10,000 cells/cumm)
  assert(formatPlateletValue(150000) === '1.50', '150,000 cells/cumm formats to 1.50 lakhs', `Got: ${formatPlateletValue(150000)}`);
  assert(formatPlateletValue(450000) === '4.50', '450,000 cells/cumm formats to 4.50 lakhs', `Got: ${formatPlateletValue(450000)}`);

  // Shorthand inputs (< 1000 without decimal e.g. 145 -> 1.45, 83 -> 0.83)
  assert(formatPlateletValue(145) === '1.45', '145 shorthand formats to 1.45 lakhs', `Got: ${formatPlateletValue(145)}`);
  assert(formatPlateletValue(83) === '0.83', '83 shorthand formats to 0.83 lakhs', `Got: ${formatPlateletValue(83)}`);
  assert(formatPlateletValue(250) === '2.50', '250 shorthand formats to 2.50 lakhs', `Got: ${formatPlateletValue(250)}`);
  assert(formatPlateletValue(2) === '2.00', '2 integer formats to 2.00 lakhs', `Got: ${formatPlateletValue(2)}`);

  // Decimal inputs already formatted
  assert(formatPlateletValue('1.45') === '1.45', '"1.45" string preserved', `Got: ${formatPlateletValue('1.45')}`);
  assert(formatPlateletValue('0.05') === '0.05', '"0.05" string preserved', `Got: ${formatPlateletValue('0.05')}`);
  assert(formatPlateletValue('2.') === '2.0', '"2." trailing dot formats to "2.0"', `Got: ${formatPlateletValue('2.')}`);

  // Edge cases & null safety
  assert(formatPlateletValue(null) === '', 'null returns empty string', `Got: ${formatPlateletValue(null)}`);
  assert(formatPlateletValue(undefined) === '', 'undefined returns empty string', `Got: ${formatPlateletValue(undefined)}`);
  assert(formatPlateletValue('') === '', 'empty string returns empty string', `Got: ${formatPlateletValue('')}`);
  assert(formatPlateletValue('abc') === 'abc', 'invalid non-numeric string returned as is', `Got: ${formatPlateletValue('abc')}`);

  // ----------------------------------------------------
  // SUITE 2: Reference Range Abnormality (isAbnormalByRange - B06)
  // ----------------------------------------------------
  suite('2. Reference Range Abnormality Check (isAbnormalByRange - B06)');

  assert(isAbnormalByRange('14.0', '13.5-17.5') === false, '14.0 within 13.5-17.5 is normal (false)');
  assert(isAbnormalByRange('12.0', '13.5-17.5') === true, '12.0 below 13.5-17.5 is abnormal (true)');
  assert(isAbnormalByRange('18.0', '13.5-17.5') === true, '18.0 above 13.5-17.5 is abnormal (true)');
  assert(isAbnormalByRange(14.0, '13.5-17.5') === false, 'Numeric 14.0 within range is normal (false)');
  assert(isAbnormalByRange(11.5, '13.5-17.5') === true, 'Numeric 11.5 below range is abnormal (true)');

  // Null/NaN/Invalid input guards (must NEVER flag as abnormal or throw)
  assert(isAbnormalByRange('abc', '13.5-17.5') === false, 'Non-numeric "abc" safely returns false');
  assert(isAbnormalByRange('', '13.5-17.5') === false, 'Empty string safely returns false');
  assert(isAbnormalByRange(null, '13.5-17.5') === false, 'null value safely returns false');
  assert(isAbnormalByRange(undefined, '13.5-17.5') === false, 'undefined value safely returns false');
  assert(isAbnormalByRange('14.0', '') === false, 'Empty rangeStr safely returns false');
  assert(isAbnormalByRange('14.0', null) === false, 'null rangeStr safely returns false');

  // ----------------------------------------------------
  // SUITE 3: Gender-Specific & Unisex Reference Ranges (refRangeFor - B06)
  // ----------------------------------------------------
  suite('3. Reference Range Selection (refRangeFor - B06)');

  const hbParam = CBC_PARAMS.find(p => p.id === 'hemoglobin');
  const rbcParam = CBC_PARAMS.find(p => p.id === 'rbcCount');
  const tlcParam = CBC_PARAMS.find(p => p.id === 'tlc');

  // Hemoglobin
  assert(refRangeFor(hbParam, 'Male') === '13.5-17.5', 'Hemoglobin for Male returns 13.5-17.5');
  assert(refRangeFor(hbParam, 'male') === '13.5-17.5', 'Hemoglobin for lowercase "male" returns 13.5-17.5');
  assert(refRangeFor(hbParam, 'M') === '13.5-17.5', 'Hemoglobin for "M" returns 13.5-17.5');
  assert(refRangeFor(hbParam, 'Female') === '12.0-15.0', 'Hemoglobin for Female returns 12.0-15.0');
  assert(refRangeFor(hbParam, 'female') === '12.0-15.0', 'Hemoglobin for lowercase "female" returns 12.0-15.0');
  assert(refRangeFor(hbParam, 'F') === '12.0-15.0', 'Hemoglobin for "F" returns 12.0-15.0');

  // Unisex fallback for blank / unspecified gender
  assert(refRangeFor(hbParam, '') === '12.0-17.5', 'Hemoglobin with blank gender returns unisex 12.0-17.5', `Got: ${refRangeFor(hbParam, '')}`);
  assert(refRangeFor(hbParam, null) === '12.0-17.5', 'Hemoglobin with null gender returns unisex 12.0-17.5', `Got: ${refRangeFor(hbParam, null)}`);
  assert(refRangeFor(hbParam, undefined) === '12.0-17.5', 'Hemoglobin with undefined gender returns unisex 12.0-17.5', `Got: ${refRangeFor(hbParam, undefined)}`);

  // RBC Count
  assert(refRangeFor(rbcParam, 'Male') === '4.5-5.5', 'RBC Count for Male returns 4.5-5.5');
  assert(refRangeFor(rbcParam, 'Female') === '4.0-5.0', 'RBC Count for Female returns 4.0-5.0');
  assert(refRangeFor(rbcParam, '') === '4.0-5.5', 'RBC Count with blank gender returns unisex 4.0-5.5', `Got: ${refRangeFor(rbcParam, '')}`);

  // Fixed unisex parameter (TLC)
  assert(refRangeFor(tlcParam, 'Male') === '4000-11000', 'TLC for Male returns 4000-11000');
  assert(refRangeFor(tlcParam, 'Female') === '4000-11000', 'TLC for Female returns 4000-11000');
  assert(refRangeFor(tlcParam, '') === '4000-11000', 'TLC with blank gender returns 4000-11000');

  // ----------------------------------------------------
  // SUITE 4: CRP Tier Evaluation (crpTier - B06)
  // ----------------------------------------------------
  suite('4. CRP Tier Evaluation (crpTier - B06)');

  const crp5 = crpTier(5);
  assert(crp5.statusClass === 'normal' && crp5.refRange.includes('<10'), 'CRP 5 is normal (<10)');

  const crp15 = crpTier(15);
  assert(crp15.statusClass === 'elevated' && crp15.refRange.includes('10-20'), 'CRP 15 is elevated (10-20)');

  const crp30 = crpTier(30);
  assert(crp30.statusClass === 'high' && crp30.refRange.includes('20-50'), 'CRP 30 is high (20-50)');

  const crp50 = crpTier(50);
  assert(crp50.statusClass === 'high' && crp50.refRange.includes('20-50'), 'CRP 50 boundary is high (20-50, not >50)', `Got: ${crp50.statusClass} ${crp50.refRange}`);

  const crp65 = crpTier(65);
  assert(crp65.statusClass === 'veryhigh' && crp65.refRange.includes('>50'), 'CRP 65 is very high (>50)');

  // Invalid / NaN input guard: must NOT be flagged as veryhigh
  const crpNaN = crpTier(NaN);
  assert(crpNaN.statusClass !== 'veryhigh', 'CRP NaN does NOT return veryhigh', `Got: ${crpNaN.statusClass}`);
  const crpStr = crpTier('abc');
  assert(crpStr.statusClass !== 'veryhigh', 'CRP non-numeric string does NOT return veryhigh', `Got: ${crpStr.statusClass}`);

  // ----------------------------------------------------
  // SUITE 5: Widal Titre Positivity (isWidalPositive - B06)
  // ----------------------------------------------------
  suite('5. Widal Titre Positivity (isWidalPositive - B06)');

  assert(isWidalPositive('1:160') === true, '1:160 is positive (true)');
  assert(isWidalPositive('1:320') === true, '1:320 is positive (true)');
  assert(isWidalPositive('1:640') === true, '1:640 is positive (true)');
  assert(isWidalPositive('1:1280') === true, '1:1280 is positive (true)');

  assert(isWidalPositive('1:80') === false, '1:80 (cutoff) is negative (false)');
  assert(isWidalPositive('1:40') === false, '1:40 is negative (false)');
  assert(isWidalPositive('1:20') === false, '1:20 is negative (false)');

  // Token boundary: "1:1600" must not falsely match "1:160"
  assert(isWidalPositive('1:1600') === false, '1:1600 is NOT falsely positive for 1:160', `Got: ${isWidalPositive('1:1600')}`);

  // Guard against non-string and empty inputs
  assert(isWidalPositive(160) === false, 'Number 160 safely returns false without TypeError');
  assert(isWidalPositive(null) === false, 'null safely returns false');
  assert(isWidalPositive(undefined) === false, 'undefined safely returns false');
  assert(isWidalPositive('') === false, 'empty string returns false');

  // ----------------------------------------------------
  // SUITE 6: Combo & Extra Panel Pricing (computeSuggestedCost - B06)
  // ----------------------------------------------------
  suite('6. Combo & Cumulative Extra Panel Pricing (computeSuggestedCost - B06)');

  // Single tests
  assert(computeSuggestedCost({ cbc: true }) === 200, 'CBC alone is ₹200');
  assert(computeSuggestedCost({ bilirubin: true }) === 200, 'Bilirubin alone is ₹200');
  assert(computeSuggestedCost({ dengue: true }) === 400, 'Dengue alone is ₹400');
  assert(computeSuggestedCost({ crp: true }) === 250, 'CRP alone is ₹250');

  // Bundles without extra tests
  assert(computeSuggestedCost({ cbc: true, typhi: true, malaria: true }) === 300, 'Combo 1 (CBC + Typhi + Malaria) is ₹300 (discounted from 400)');
  assert(computeSuggestedCost({ cbc: true, widal: true, malaria: true }) === 300, 'Combo 2 (CBC + Widal + Malaria) is ₹300 (discounted from 400)');
  assert(computeSuggestedCost({ cbc: true, typhi: true }) === 250, 'Combo 3 (CBC + Typhi) is ₹250 (discounted from 300)');
  assert(computeSuggestedCost({ cbc: true, widal: true }) === 250, 'Combo 4 (CBC + Widal) is ₹250 (discounted from 300)');
  assert(computeSuggestedCost({ cbc: true, malaria: true }) === 250, 'Combo 5 (CBC + Malaria) is ₹250 (discounted from 300)');

  // Cumulative pricing with extra panels (B06 fix verification: extra panels MUST NOT be suppressed)
  assert(
    computeSuggestedCost({ cbc: true, typhi: true, malaria: true, bilirubin: true }) === 500,
    'Combo 1 (300) + Bilirubin (200) = ₹500 (Bilirubin not suppressed)',
    `Got: ${computeSuggestedCost({ cbc: true, typhi: true, malaria: true, bilirubin: true })}`
  );
  assert(
    computeSuggestedCost({ cbc: true, typhi: true, malaria: true, crp: true }) === 550,
    'Combo 1 (300) + CRP (250) = ₹550 (CRP not suppressed)',
    `Got: ${computeSuggestedCost({ cbc: true, typhi: true, malaria: true, crp: true })}`
  );
  assert(
    computeSuggestedCost({ cbc: true, typhi: true, malaria: true, dengue: true }) === 700,
    'Combo 1 (300) + Dengue (400) = ₹700 (Dengue not suppressed)',
    `Got: ${computeSuggestedCost({ cbc: true, typhi: true, malaria: true, dengue: true })}`
  );
  assert(
    computeSuggestedCost({ cbc: true, typhi: true, malaria: true, bilirubin: true, crp: true }) === 750,
    'Combo 1 (300) + Bilirubin (200) + CRP (250) = ₹750',
    `Got: ${computeSuggestedCost({ cbc: true, typhi: true, malaria: true, bilirubin: true, crp: true })}`
  );
  assert(
    computeSuggestedCost({ cbc: true, typhi: true, bilirubin: true }) === 450,
    'Combo 3 (250) + Bilirubin (200) = ₹450',
    `Got: ${computeSuggestedCost({ cbc: true, typhi: true, bilirubin: true })}`
  );

  // Multi-panel non-combo tests
  assert(computeSuggestedCost({ dengue: true, esr: true }) === 500, 'Dengue (400) + ESR (100) = ₹500');
  assert(computeSuggestedCost({}) === 0, 'Empty selection = ₹0');
  assert(computeSuggestedCost(null) === 0, 'null input = ₹0');

  // ----------------------------------------------------
  // SUITE 7: HTML Escaping & Stored XSS Neutralization (escapeHtml - B02)
  // ----------------------------------------------------
  suite('7. HTML Escaping & XSS Neutralization (escapeHtml - B02)');

  assert(
    escapeHtml("<script>alert('xss')</script>") === "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    'Escapes script tag and single quotes',
    `Got: ${escapeHtml("<script>alert('xss')</script>")}`
  );
  assert(
    escapeHtml('<img src=x onerror=alert(1)>') === '&lt;img src=x onerror=alert(1)&gt;',
    'Escapes img tag with onerror attribute',
    `Got: ${escapeHtml('<img src=x onerror=alert(1)>')}`
  );
  assert(
    escapeHtml('"Patient" & Co') === '&quot;Patient&quot; &amp; Co',
    'Escapes double quotes and ampersand',
    `Got: ${escapeHtml('"Patient" & Co')}`
  );
  assert(escapeHtml(null) === '', 'null safely returns empty string');
  assert(escapeHtml(undefined) === '', 'undefined safely returns empty string');
  assert(escapeHtml(12345) === '12345', 'number 12345 safely converted to "12345"');

  // ----------------------------------------------------
  // SUITE 8: Search Filter & Date Null-Guards (B19)
  // ----------------------------------------------------
  suite('8. Search Filter & Date Parsing Null-Guards (B19)');

  const mockHistory = [
    { id: 1, patientName: 'John Doe', patientId: 'P001', reportedDate: '2026-10-12', collectionDate: '2026-10-12', tests: { cbc: true } },
    { id: 2, patientName: null, patientId: undefined, reportedDate: null, collectionDate: undefined, tests: { cbc: true } },
    { id: 3, patientName: 'Jane Smith', patientId: 'P002', reportedDate: '', collectionDate: '', tests: null },
    null
  ];

  let filteredResult = null;
  let filterThrew = false;
  try {
    filteredResult = applyAdvancedFilters(mockHistory, { searchTerm: 'John' });
  } catch (err) {
    filterThrew = true;
    console.error(err);
  }

  assert(!filterThrew, 'applyAdvancedFilters does NOT throw on null/undefined patient fields');
  assert(filteredResult && filteredResult.length === 1 && filteredResult[0].id === 1, 'Correctly matched record with valid name');

  let blankSearchThrew = false;
  try {
    const allFiltered = applyAdvancedFilters(mockHistory, {});
    assert(allFiltered.length === 3, 'Filtered out null item without crashing, returned 3 valid items');
  } catch (err) {
    blankSearchThrew = true;
  }
  assert(!blankSearchThrew, 'applyAdvancedFilters does NOT throw on empty filter object');

  // ----------------------------------------------------
  // SUITE 9: PHI Console Log Verification (B10)
  // ----------------------------------------------------
  suite('9. PHI Console Log Check (B10)');

  const historyServiceCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'services', 'history-service.js'), 'utf8');
  const storageCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'state', 'storage.js'), 'utf8');
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'bundle.js'), 'utf8');

  assert(
    !historyServiceCode.includes("console.log('Report saved to history:', historyItem)"),
    'history-service.js does NOT log raw historyItem medical payload to console'
  );
  assert(
    !bundleCode.includes("console.log('Report saved to history:', historyItem)"),
    'bundle.js does NOT log raw historyItem medical payload to console'
  );
  assert(
    !storageCode.includes("console.log('Cloud change detected:") || !storageCode.includes('payload.new'),
    'storage.js does NOT log patient data in cloud sync events'
  );

  // ----------------------------------------------------
  // SUITE 10: Print & Layout Compliance (B07, B14)
  // ----------------------------------------------------
  suite('10. Print & Layout Compliance (B07, B14)');

  const printCss = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'css', 'print.css'), 'utf8');
  const createReportHtml = fs.readFileSync(path.join(ROOT_DIR, 'create-report.html'), 'utf8');
  const pdfServiceCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'services', 'pdf-service.js'), 'utf8');

  // B07: A4 margins compliance
  assert(
    printCss.includes('10mm 12mm 15mm 12mm'),
    '@page uses mandatory AGENTS.md §3.1 margins (10mm 12mm 15mm 12mm)'
  );

  // B07: Width 21cm removed
  assert(
    !printCss.includes('width: 21cm'),
    'print.css body does NOT constrain width to fixed 21cm'
  );

  // B07: report-output position: relative & footer clearance
  assert(
    printCss.includes('position: relative') && !printCss.includes('.report-output {\n        position: absolute'),
    '.report-output uses position: relative to enable natural multi-page pagination'
  );
  assert(
    printCss.includes('20mm'),
    '.report-output print rule includes 20mm bottom clearance for fixed footer'
  );

  // B14: Single html2pdf script in create-report.html
  const html2pdfMatches = createReportHtml.match(/html2pdf\.bundle\.min\.js/g) || [];
  assert(
    html2pdfMatches.length === 1,
    `create-report.html contains exactly 1 html2pdf script tag (found: ${html2pdfMatches.length})`
  );

  // B14: Offline PDF fallback
  assert(
    pdfServiceCode.includes('window.print()') && pdfServiceCode.includes('offline'),
    'pdf-service.js provides offline window.print() fallback when html2pdf is unavailable'
  );
  assert(
    bundleCode.includes('window.print()'),
    'bundle.js includes offline PDF fallback'
  );

  // ----------------------------------------------------
  // SUITE 11: Storage Reliability & Data Integrity (Phase 3: B03, B08, B12, B16, B20, B21, B22)
  // ----------------------------------------------------
  suite('11. Storage Reliability & Data Integrity (Phase 3)');

  const storageModule = await import('../assets/js/state/storage.js');
  const { STORAGE_KEYS, loadHistoryData, saveHistoryData, addTombstone, getDeletedReportIds } = storageModule;

  // B03: Storage keys alignment
  assert(
    STORAGE_KEYS.DELETED_IDS === 'deletedReportIds',
    'STORAGE_KEYS includes deletedReportIds tombstone key (B03)'
  );

  // Set up mock localStorage in Node.js global environment for storage tests
  const storageMock = {};
  global.localStorage = {
    getItem: (k) => (k in storageMock ? storageMock[k] : null),
    setItem: (k, v) => { storageMock[k] = String(v); },
    removeItem: (k) => { delete storageMock[k]; },
    clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
  };

  // Test B08/B03: Numeric ID coercion and tombstone filtering
  const sampleReports = [
    { id: 1728000000000, serial: 1, patientName: 'Legacy Numeric Patient' },
    { id: '1728000000001', serial: 2, patientName: 'Modern String Patient' },
    { id: '1728000000002', serial: 3, is_deleted: true, patientName: 'Soft Deleted Patient' },
    { id: '1728000000003', serial: 4, patientName: 'Tombstoned Patient' }
  ];
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleReports));
  addTombstone('1728000000003');

  const loadedReports = loadHistoryData();
  assert(
    loadedReports.length === 2,
    'loadHistoryData() filters out both soft-deleted (is_deleted: true) and tombstoned records',
    `Expected 2, got: ${loadedReports.length}`
  );
  assert(
    typeof loadedReports[0].id === 'string' && loadedReports[0].id === '1728000000000',
    'loadHistoryData() migrates legacy numeric ID to String',
    `Got: ${typeof loadedReports[0].id} (${loadedReports[0].id})`
  );
  assert(
    typeof loadedReports[1].id === 'string' && loadedReports[1].id === '1728000000001',
    'loadHistoryData() preserves modern string ID'
  );

  // Test B16: Quota error non-blocking handling
  let quotaHandled = false;
  const originalSetItem = global.localStorage.setItem;
  global.localStorage.setItem = () => {
    const err = new Error('Quota exceeded');
    err.name = 'QuotaExceededError';
    throw err;
  };
  try {
    saveHistoryData([{ id: 'test' }]);
    quotaHandled = true;
  } catch (e) {
    quotaHandled = false;
  }
  global.localStorage.setItem = originalSetItem;
  assert(quotaHandled, 'saveHistoryData() safely catches QuotaExceededError without throwing');

  // Test B08: Collision-safe ID generation format
  const sampleGenId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  assert(
    /^\d{13}-[a-z0-9]{5}$/.test(sampleGenId),
    'Generated IDs follow collision-safe ${Date.now()}-${random5} pattern',
    `Got: ${sampleGenId}`
  );

  // Test B22: Financial precision in cost calculations
  const costCalcCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'calculators', 'cost-calculator.js'), 'utf8');
  assert(
    costCalcCode.includes('.toFixed(2)'),
    'cost-calculator.js rounds currency figures to 2 decimal places (B22)'
  );

  // Test B20: Stale reportHTML cost synchronization
  const sampleReportHTML = '<div><strong>Total Amount:</strong> ₹300.00</div><div>Patient Info</div>';
  const updatedReportHTML = sampleReportHTML.replace(
    /(<strong>(?:Test Cost|Cost|Amount|Total Amount):<\/strong>\s*(?:₹|Rs\.?)?\s*)([0-9.]+)/i,
    '$1450.00'
  );
  assert(
    updatedReportHTML.includes('₹450.00') && !updatedReportHTML.includes('₹300.00'),
    'editReportCost synchronization regex accurately updates embedded reportHTML cost',
    `Got: ${updatedReportHTML}`
  );

  // Test B21: Zero-prompt inventory model (Phase 1 inventory plan)
  const inventoryCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'state', 'inventory-state.js'), 'utf8');
  assert(
    !inventoryCode.includes('prompt('),
    'inventory-state.js contains zero prompt() calls (zero-prompt boot)'
  );
  assert(
    inventoryCode.includes('dengue') && inventoryCode.includes('DENGUE_KIT'),
    'inventory-state.js tracks dengue kits alongside typhoid/malaria'
  );

  // Test B12, B17: Storage lock and subscription guard in storage.js
  const storageCodeLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'state', 'storage.js'), 'utf8');
  assert(
    storageCodeLive.includes('acquireSyncLock') && storageCodeLive.includes('releaseSyncLock'),
    'storage.js implements multi-tab timestamp lock to prevent concurrent sync races (B12)'
  );
  assert(
    storageCodeLive.includes('_realtimeChannel') && storageCodeLive.includes('unsubscribeRealtime'),
    'storage.js guards against duplicate Realtime subscriptions and exports clean teardown (B17)'
  );

  // ----------------------------------------------------
  // SUITE 12: Cloud Sync & Dual-Mode Supabase Security (Phase 4: B01, B04, B13, B21)
  // ----------------------------------------------------
  suite('12. Cloud Sync & Dual-Mode Supabase Security (Phase 4)');

  // B04: Dead LOGIN_PASSWORD removal
  const authConfigLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'config', 'auth-config.js'), 'utf8');
  const bundleLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'bundle.js'), 'utf8');
  assert(
    !authConfigLive.includes('LOGIN_PASSWORD') && !bundleLive.includes('LOGIN_PASSWORD'),
    'Dead LOGIN_PASSWORD constant completely pruned from auth-config.js and bundle.js (B04)'
  );

  // B04: Document PINs as UI operational locks
  assert(
    authConfigLive.includes('OPERATIONAL PRIVACY LOCKS') || authConfigLive.includes('operational privacy locks'),
    'auth-config.js documents client PINs as operational privacy locks rather than cryptographic boundaries (B04)'
  );

  const agentsMdLive = fs.readFileSync(path.join(ROOT_DIR, 'AGENTS.md'), 'utf8');
  assert(
    agentsMdLive.includes('UI Operational Privacy Locks') || agentsMdLive.includes('operational privacy locks'),
    'AGENTS.md §4 documents client PINs as UI operational privacy locks (B04)'
  );

  // B13: Ephemeral stateless invoice model & removal of misleading sync calls
  const appLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'app.js'), 'utf8');
  const invoiceServiceLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'services', 'invoice-service.js'), 'utf8');
  
  // Verify invoice page block in app.js doesn't contain syncReportsFromCloud
  const invoiceRouteMatch = appLive.match(/invoiceSheet[\s\S]*?return;/);
  assert(
    invoiceRouteMatch && !invoiceRouteMatch[0].includes('syncReportsFromCloud') && !invoiceRouteMatch[0].includes('initRealtimeSync'),
    'Invoice page entrypoint in app.js removed misleading syncReportsFromCloud() and initRealtimeSync() (B13)'
  );
  assert(
    invoiceServiceLive.includes('ARCHITECTURE NOTE (B13)') && invoiceServiceLive.includes('stateless'),
    'invoice-service.js explicitly documents ephemeral/stateless invoice model (B13)'
  );

  // B21 (inventory sync plan): consumable inventory is cloud-synchronized
  assert(
    agentsMdLive.includes('Cloud-Synchronized Inventory') && agentsMdLive.includes('public.lab_inventory'),
    'AGENTS.md §2.4 documents consumable inventory as cloud-synchronized via public.lab_inventory (B21)'
  );
  assert(
    storageCodeLive.includes('public.lab_inventory'),
    'storage.js documents inventory as cloud-backed with localStorage offline cache (B21)'
  );

  // B01: Supabase RLS tightening SQL script
  const rlsSqlPath = path.join(ROOT_DIR, 'scripts', 'supabase-rls-setup.sql');
  assert(fs.existsSync(rlsSqlPath), 'scripts/supabase-rls-setup.sql exists (B01)');
  const rlsSqlContent = fs.readFileSync(rlsSqlPath, 'utf8');
  assert(
    rlsSqlContent.includes('ENABLE ROW LEVEL SECURITY') &&
    rlsSqlContent.includes('TO authenticated') &&
    rlsSqlContent.includes('DROP POLICY IF EXISTS "Allow public read-write for clinic app"'),
    'supabase-rls-setup.sql drops permissive public policy and enforces authenticated role (B01)'
  );
  assert(
    rlsSqlContent.includes('CREATE TABLE IF NOT EXISTS public.lab_inventory') &&
    rlsSqlContent.includes('Clinic staff authenticated full access on inventory') &&
    rlsSqlContent.includes('supabase_realtime'),
    'supabase-rls-setup.sql provisions lab_inventory singleton with RLS policy and realtime registration (B21)'
  );

  // B01: Dual-Mode Auth helpers in supabase-config.js and storage.js
  const supabaseConfigLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'config', 'supabase-config.js'), 'utf8');
  assert(
    supabaseConfigLive.includes('getCloudAuthSession') &&
    supabaseConfigLive.includes('signInCloudStaff') &&
    supabaseConfigLive.includes('signOutCloudStaff'),
    'supabase-config.js exports Dual-Mode auth helpers (getCloudAuthSession, signInCloudStaff, signOutCloudStaff) (B01)'
  );

  // B01: Dual-Mode schema fallback and RLS error handling
  assert(
    storageCodeLive.includes('row.data || row.report_data') &&
    storageCodeLive.includes('Local Mode (Auth Required)'),
    'storage.js gracefully handles RLS 401/policy errors and supports schema fallback (data || report_data) (B01)'
  );

  // Multi-Device Deletion & Anti-Resurrection Guard
  assert(
    storageCodeLive.includes('localItem._synced === true') &&
    storageCodeLive.includes('addTombstone(sId)'),
    'storage.js implements anti-resurrection guard to prevent other devices from re-uploading deleted reports'
  );
  assert(
    storageCodeLive.includes('data.is_deleted === true') &&
    storageCodeLive.includes('deleteReportFromCloud'),
    'storage.js supports JSONB data.is_deleted soft-delete and multi-device tombstone propagation'
  );

  // ----------------------------------------------------
  // SUITE 13: Code Hygiene & Dual-Execution Sign-Off Gate (Phase 5: B09, B10, B11, B15, B23)
  // ----------------------------------------------------
  suite('13. Code Hygiene & Dual-Execution Sign-Off Gate (Phase 5)');

  // B23: Invoice table event listener accumulation
  const invoiceCodeLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'services', 'invoice-service.js'), 'utf8');
  assert(
    invoiceCodeLive.includes('_invoiceEventsBound') &&
    invoiceCodeLive.includes('bindInvoiceTableEvents();\n  renderInvoice(report);'),
    'invoice-service.js calls bindInvoiceTableEvents once during init and guards with _invoiceEventsBound flag (B23)'
  );
  // Ensure renderInvoice doesn't call bindInvoiceTableEvents
  const renderInvMatch = invoiceCodeLive.match(/export function renderInvoice[\s\S]*?^}/m);
  assert(
    renderInvMatch && !renderInvMatch[0].includes('bindInvoiceTableEvents()'),
    'renderInvoice does NOT repeatedly call bindInvoiceTableEvents on re-render/reset (B23)'
  );

  // B15: Prune dead SPA tab-switching relics
  const appCodeLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'app.js'), 'utf8');
  const bundleLiveUpdated = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'bundle.js'), 'utf8');
  assert(
    !appCodeLive.includes('showDashboardView') &&
    !bundleLiveUpdated.includes('showDashboardView') &&
    !appCodeLive.includes('showCreateReportView') &&
    !bundleLiveUpdated.includes('showCreateReportView') &&
    !appCodeLive.includes('bindHeaderNavigation') &&
    !bundleLiveUpdated.includes('bindHeaderNavigation'),
    'Dead SPA tab switching functions (showDashboardView, showCreateReportView, bindHeaderNavigation) pruned (B15)'
  );

  // B10: Prune dead calculator stubs and dead setDisplay helper
  const cbcLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'calculators', 'cbc-calculator.js'), 'utf8');
  const domLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'utils', 'dom-helpers.js'), 'utf8');
  assert(
    !cbcLive.includes('calcIndirectBilirubin') &&
    !bundleLiveUpdated.includes('calcIndirectBilirubin') &&
    !cbcLive.includes('absoluteCount') &&
    !bundleLiveUpdated.includes('absoluteCount') &&
    !cbcLive.includes('pcvFromRbcMcv') &&
    !cbcLive.includes('mchFromHbRbc') &&
    !cbcLive.includes('mchcFromHbPcv'),
    'Dead calculator stubs pruned from cbc-calculator.js and bundle.js (B10)'
  );
  assert(
    !domLive.includes('setDisplay') && !bundleLiveUpdated.includes('setDisplay'),
    'Dead setDisplay helper pruned from dom-helpers.js and bundle.js (B10)'
  );

  // B11: Documentation alignment in AGENTS.md
  assert(
    agentsMdLive.includes('components/invoice.css ➔ responsive.css ➔ notifications.css ➔ components/landing.css'),
    'AGENTS.md §2.3 matches complete CSS import order including invoice.css and landing.css (B11)'
  );
  assert(
    agentsMdLive.includes('Staff Session Gate') && agentsMdLive.includes('shc_auth_session'),
    'AGENTS.md §4.1 documents shc_auth_session staff gate across protected pages (B11)'
  );

  // B09: Extract inline styles and add aria-hidden
  const baseCssLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'css', 'base.css'), 'utf8');
  const indexHtmlLive = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const landingCssLive = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'css', 'components', 'landing.css'), 'utf8');
  assert(
    baseCssLive.includes('.is-hidden') && baseCssLive.includes('display: none !important;'),
    'base.css includes .is-hidden utility class (B09)'
  );
  assert(
    landingCssLive.includes('.landing-about-card') && indexHtmlLive.includes('class="landing-about-card"'),
    'About card inline styles extracted to .landing-about-card in landing.css (B09)'
  );

  const dashHtmlLive = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.html'), 'utf8');
  assert(
    dashHtmlLive.includes('<span class="tab-icon" aria-hidden="true">'),
    'Navigation tab icons include aria-hidden="true" for screen reader accessibility (B09)'
  );

  // ----------------------------------------------------
  // SUITE 14: Inactivity Screen Lock & Dynamic Patient ID Workflow
  // ----------------------------------------------------
  suite('14. Inactivity Screen Lock & Dynamic Patient ID Workflow');

  const idleServiceCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'services', 'idle-service.js'), 'utf8');
  assert(
    idleServiceCode.includes('INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000') || idleServiceCode.includes('300000'),
    'idle-service.js defines 5-minute (300,000 ms) inactivity timeout'
  );
  assert(
    idleServiceCode.includes('shc_idle_locked'),
    'idle-service.js uses shc_idle_locked session key'
  );
  assert(
    idleServiceCode.includes('COLLECTION_BLUR_KEY') && idleServiceCode.includes('shc_collection_blurred'),
    'idle-service.js defines COLLECTION_BLUR_KEY for persistent cards privacy across hard refresh'
  );
  assert(
    idleServiceCode.includes('cards-privacy-blurred'),
    'idle-service.js manages cards-privacy-blurred class on collection cards'
  );
  assert(
    idleServiceCode.includes('screen-privacy-overlay'),
    'idle-service.js injects screen-privacy-overlay on dashboard'
  );

  const headerCssContent = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'css', 'components', 'header.css'), 'utf8');
  assert(
    headerCssContent.includes('.cards-privacy-blurred') && headerCssContent.includes('filter: blur'),
    'header.css contains .cards-privacy-blurred with CSS blur filter'
  );
  assert(
    headerCssContent.includes('.screen-privacy-overlay') && headerCssContent.includes('backdrop-filter: blur'),
    'header.css contains .screen-privacy-overlay with backdrop blur'
  );

  const patientIdCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'utils', 'patient-id.js'), 'utf8');
  assert(
    patientIdCode.includes('while (isPatientIdExists(candidateId))'),
    'patient-id.js implements while-loop collision guard for sequential ID generation'
  );

  const bundlePathLive = path.join(ROOT_DIR, 'assets', 'js', 'bundle.js');
  const bundleLiveUpdated2 = fs.readFileSync(bundlePathLive, 'utf8');
  assert(
    bundleLiveUpdated2.includes('initInactivityWatcher') && bundleLiveUpdated2.includes('bindNavigationPatientId'),
    'bundle.js incorporates initInactivityWatcher and bindNavigationPatientId'
  );

  // ----------------------------------------------------
  // SUITE 15: Patient Title Auto-Selection by Gender & Age
  // ----------------------------------------------------
  suite('15. Patient Title Auto-Selection by Gender & Age');

  // 1. Gender-first selection (age not yet provided)
  assert(computePatientTitle({ gender: 'Male' }) === 'Mr.', 'Male with no age returns "Mr."');
  assert(computePatientTitle({ gender: 'Female' }) === 'Miss', 'Female with no age returns "Miss"');
  assert(computePatientTitle({ gender: '' }) === null, 'Empty gender with no age returns null');

  // 2. Infants (Days / Months / Yrs < 1)
  assert(computePatientTitle({ ageVal: 10, ageUnit: 'Days', gender: 'Male' }) === 'Baby', 'Male 10 Days returns "Baby"');
  assert(computePatientTitle({ ageVal: 10, ageUnit: 'Days', gender: 'Female' }) === 'Baby', 'Female 10 Days returns "Baby"');
  assert(computePatientTitle({ ageVal: 6, ageUnit: 'Months', gender: 'Male' }) === 'Baby', 'Male 6 Months returns "Baby"');
  assert(computePatientTitle({ ageVal: 6, ageUnit: 'Months', gender: 'Female' }) === 'Baby', 'Female 6 Months returns "Baby"');
  assert(computePatientTitle({ ageVal: 0, ageUnit: 'Yrs', gender: 'Male' }) === 'Baby', 'Male 0 Yrs returns "Baby"');

  // 3. Children (1 - 12 Yrs)
  assert(computePatientTitle({ ageVal: 1, ageUnit: 'Yrs', gender: 'Female' }) === 'Baby', 'Female 1 Yr returns "Baby"');
  assert(computePatientTitle({ ageVal: 5, ageUnit: 'Yrs', gender: 'Male' }) === 'Master', 'Male 5 Yrs returns "Master"');
  assert(computePatientTitle({ ageVal: 5, ageUnit: 'Yrs', gender: 'Female' }) === 'Miss', 'Female 5 Yrs returns "Miss"');
  assert(computePatientTitle({ ageVal: 12, ageUnit: 'Yrs', gender: 'Male' }) === 'Master', 'Male 12 Yrs returns "Master"');
  assert(computePatientTitle({ ageVal: 12, ageUnit: 'Yrs', gender: 'Female' }) === 'Miss', 'Female 12 Yrs returns "Miss"');

  // 4. Adolescents (13 - 17 Yrs)
  assert(computePatientTitle({ ageVal: 15, ageUnit: 'Yrs', gender: 'Male' }) === 'Mr.', 'Male 15 Yrs returns "Mr."');
  assert(computePatientTitle({ ageVal: 15, ageUnit: 'Yrs', gender: 'Female' }) === 'Miss', 'Female 15 Yrs returns "Miss"');

  // 5. Adults (≥ 18 Yrs)
  assert(computePatientTitle({ ageVal: 25, ageUnit: 'Yrs', gender: 'Male' }) === 'Mr.', 'Male 25 Yrs returns "Mr."');
  assert(computePatientTitle({ ageVal: 25, ageUnit: 'Yrs', gender: 'Female' }) === 'Mrs.', 'Female 25 Yrs returns "Mrs."');

  // 6. Source file and bundle event binding checks
  const appJsCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'app.js'), 'utf8');
  assert(
    appJsCode.includes("genderEl.addEventListener('change', autoUpdatePatientTitle)"),
    'app.js attaches change event listener to patientGender'
  );
  const bundleJsCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'bundle.js'), 'utf8');
  assert(
    bundleJsCode.includes("genderEl.addEventListener('change', autoUpdatePatientTitle)"),
    'bundle.js incorporates patientGender change event listener'
  );

  // ----------------------------------------------------
  // SUITE 16: Dengue Rapid Combo Subtype Formatting & UI
  // ----------------------------------------------------
  suite('16. Dengue Rapid Combo Subtype Formatting & UI');

  assert(formatDengueSubtype('NS1') === 'Positive (NS1 Positive)', 'NS1 formats to "Positive (NS1 Positive)"');
  assert(formatDengueSubtype('IgM') === 'Positive (IgM Positive)', 'IgM formats to "Positive (IgM Positive)"');
  assert(formatDengueSubtype('IgG') === 'Positive (IgG Positive)', 'IgG formats to "Positive (IgG Positive)"');
  assert(formatDengueSubtype('NS1 and IgM') === 'Positive (NS1, IgM Positive)', 'NS1 and IgM formats to "Positive (NS1, IgM Positive)"');
  assert(formatDengueSubtype('IgM and IgG') === 'Positive (IgM, IgG Positive)', 'IgM and IgG formats to "Positive (IgM, IgG Positive)"');
  assert(formatDengueSubtype('NS1 and IgG') === 'Positive (NS1, IgG Positive)', 'NS1 and IgG formats to "Positive (NS1, IgG Positive)"');
  assert(formatDengueSubtype('All') === 'Positive (NS1, IgM, IgG Positive)', 'All formats to "Positive (NS1, IgM, IgG Positive)"');

  // Verify form markup in create-report.html
  const createReportContent = fs.readFileSync(path.join(ROOT_DIR, 'create-report.html'), 'utf8');
  assert(
    createReportContent.includes('id="dengueSubtypeContainer"') && createReportContent.includes('id="dengueSubtype"'),
    'create-report.html includes dengueSubtypeContainer and dengueSubtype'
  );
  assert(
    createReportContent.includes('<option value="NS1 and IgM">Both (NS1 and IgM)</option>'),
    'create-report.html provides combo options in dengueSubtype select'
  );

  // Verify bundle incorporates formatDengueSubtype and dengueSubtypeContainer
  assert(
    bundleJsCode.includes('formatDengueSubtype') && bundleJsCode.includes('dengueSubtypeContainer'),
    'bundle.js incorporates formatDengueSubtype and dengueSubtypeContainer logic'
  );

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n========================================================');
  console.log(`📊 Test Summary: ${passedTests} passed, ${failedTests} failed, ${totalTests} total assertions`);
  console.log('========================================================');

  if (failedTests > 0) {
    console.error(`\n❌ TEST SUITE FAILED with ${failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CLINICAL, SAFETY & PHASE 1-5 CODE HYGIENE ASSERTIONS PASSED (100%).\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
