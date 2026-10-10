/* Extracted from index.html L1673-2013. Template logic identical; ranges via config/test-constants.js */
import { CBC_PARAMS, WIDAL_PARAMS, WIDAL_CUTOFF, OTHER_TESTS, ESR_REF, BILIRUBIN_REF, crpTier, refRangeFor, isAbnormalByRange, isWidalPositive } from '../config/test-constants.js';
import { CBC_DECIMAL_FIELD_IDS, formatPointValue, formatPlateletValue } from '../calculators/cbc-calculator.js';

export function createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed) {
  const specimenType = tubeUsed === 'Purple' ? 'EDTA Whole Blood' : (tubeUsed === 'Red' ? 'Serum / Clotted Blood' : 'Whole Blood / Serum');
  let reportHTML = `
    <div class="report-header"><h2>-</h2></div>
    <div class="report-patient-info">
      <div><strong>Patient Name:</strong> ${patientName}</div>
      <div><strong>Age:</strong> ${patientAge}</div>
      <div><strong>Gender:</strong> ${patientGender}</div>
      <div><strong>Patient ID:</strong> ${document.getElementById('patientId').value}</div>
      <div><strong>Collection Date:</strong> ${document.getElementById('collectionDate').value}</div>
      <div><strong>Received Date:</strong> ${document.getElementById('receivedDate').value}</div>
      <div><strong>Reported Date:</strong> ${document.getElementById('reportedDate').value}</div>
      <div><strong>Referred By:</strong> ${document.getElementById('referredBy').value.trim() || 'SELF'}</div>
      <div><strong>Specimen:</strong> ${specimenType}</div>
      <div class="no-print"><strong>Payment Mode:</strong> ${paymentMode}</div>
      <div class="no-print"><strong>Tube Used:</strong> ${tubeUsed}</div>
    </div>`;

  if (tests.cbc) {
    let rows = '';
    CBC_PARAMS.forEach(param => {
      let value = document.getElementById(param.id).value || '';
      if (value) {
        if (param.id === 'platelet') {
          value = formatPlateletValue(value);
        } else if (CBC_DECIMAL_FIELD_IDS.includes(param.id)) {
          value = formatPointValue(value);
        }
        const refRange = refRangeFor(param, patientGender);
        const isAbnormal = isAbnormalByRange(value, refRange);
        rows += `<tr><td>${param.name}</td><td class="${isAbnormal ? 'abnormal' : ''}">${value}</td><td>${param.unit}</td><td>${refRange}</td></tr>`;
      }
    });
    reportHTML += `<div class="report-test-section"><h3><span>COMPLETE BLOOD COUNT</span><span class="method-badge">Method: 3-Part Automated Cell Counter</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  if (tests.esr) {
    const esrValue = document.getElementById('esr').value || '';
    if (esrValue) {
      const isAbnormal = parseFloat(esrValue) > ESR_REF.max;
      reportHTML += `<div class="report-test-section"><h3><span>HEMATOLOGY (ESR)</span><span class="method-badge">Method: Westergren Method (1 hr)</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody><tr><td>ESR</td><td class="${isAbnormal ? 'abnormal' : ''}">${esrValue}</td><td>${ESR_REF.unit}</td><td>${ESR_REF.display}</td></tr></tbody></table></div>`;
    }
  }

  if (tests.widal) {
    let rows = '';
    WIDAL_PARAMS.forEach(param => {
      const value = document.getElementById(param.id).value || '';
      if (value) {
        const isPositive = isWidalPositive(value);
        rows += `<tr><td>${param.name}</td><td class="${isPositive ? 'positive' : ''}">${value}</td><td>${WIDAL_CUTOFF.replace('<', '&lt;')}</td></tr>`;
      }
    });
    // Note: legacy used '&lt; 1:80' literal; WIDAL_CUTOFF '< 1:80' escaped here preserves rendering.
    reportHTML += `<div class="report-test-section"><h3><span>SEROLOGY (WIDAL)</span><span class="method-badge">Method: Slide Agglutination Method</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>REFERENCE RANGE</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  if (tests.bloodGroup) {
    const bloodGroupValue = document.getElementById('bloodGroup').value || '';
    if (bloodGroupValue) {
      reportHTML += `<div class="report-test-section"><h3><span>BLOOD GROUP</span><span class="method-badge">Method: Slide Hemagglutination</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th></tr></thead><tbody><tr><td>Blood Group</td><td>${bloodGroupValue}</td></tr></tbody></table></div>`;
    }
  }

  if (tests.bilirubin) {
    const totalBilirubin = document.getElementById('totalBilirubin').value || '';
    const directBilirubin = document.getElementById('directBilirubin').value || '';
    const indirectBilirubin = document.getElementById('indirectBilirubin').value || '';
    if (totalBilirubin || directBilirubin || indirectBilirubin) {
      let rows = '';
      if (totalBilirubin) rows += `<tr><td>Total Bilirubin</td><td class="${parseFloat(totalBilirubin) > BILIRUBIN_REF.total.max ? 'abnormal' : ''}">${totalBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.total.display}</td></tr>`;
      if (directBilirubin) rows += `<tr><td>Direct Bilirubin</td><td class="${parseFloat(directBilirubin) > BILIRUBIN_REF.direct.max ? 'abnormal' : ''}">${directBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.direct.display}</td></tr>`;
      if (indirectBilirubin) rows += `<tr><td>Indirect Bilirubin</td><td class="${parseFloat(indirectBilirubin) > BILIRUBIN_REF.indirect.max ? 'abnormal' : ''}">${indirectBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.indirect.display}</td></tr>`;
      reportHTML += `<div class="report-test-section"><h3><span>BIOCHEMISTRY (BILIRUBIN)</span><span class="method-badge">Method: Photometric (Diazo Method)</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }

  if (tests.crp) {
    const crpValue = document.getElementById('crp').value || '';
    if (crpValue) {
      const tier = crpTier(parseFloat(crpValue));
      reportHTML += `<div class="report-test-section"><h3><span>CRP TEST</span><span class="method-badge">Method: Semi-Quantitative Latex / Turbidimetry</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th></tr></thead><tbody><tr><td>CRP</td><td class="${tier.statusClass}">${crpValue}</td><td>mg/L</td><td>${tier.refRange}</td></tr></tbody></table></div>`;
    }
  }

  let otherTestsHTML = '';
  OTHER_TESTS.forEach(test => {
    if (tests[test.id]) {
      const result = document.getElementById(test.resultId).value || '';
      let displayResult = result;
      if (result === 'Positive') {
        if (test.id === 'typhi') {
          const subtype = document.getElementById('typhiSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'IgM and IgG' : subtype})`;
        } else if (test.id === 'malaria') {
          const subtype = document.getElementById('malariaSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'Pf and Pv' : subtype})`;
        }
      }
      otherTestsHTML += `<tr><td>${test.name}</td><td class="${result === 'Positive' ? 'positive' : ''}">${displayResult}</td></tr>`;
    }
  });
  if (otherTestsHTML) {
    reportHTML += `<div class="report-test-section"><h3><span>RAPID SEROLOGICAL TESTS</span><span class="method-badge">Method: Immunochromatographic Rapid Card Assay (ICT)</span></h3><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th></tr></thead><tbody>${otherTestsHTML}</tbody></table></div>`;
  }

  reportHTML += `
    <div class="end-of-report">*** END OF REPORT ***</div>
    <div class="compact-disclaimer-box">
      <div class="disclaimer-title">IMPORTANT LABORATORY NOTES & CLINICAL DISCLAIMER:</div>
      <p>• <strong>Methodology & Screening:</strong> CBC performed by 3-Part Automated Hematology Analyzer. Typhoid, Malaria, and Dengue evaluated by qualitative Immunochromatographic (ICT) Rapid Diagnostic Card Kits. ESR evaluated by Westergren Method.</p>
      <p>• <strong>Clinical Correlation:</strong> All findings are diagnostic screening aids and must be correlated clinically by the treating physician with patient signs and history. Test results alone do not constitute a standalone medical diagnosis.</p>
      <p>• <strong>Test Limitations:</strong> Rapid card tests have biological window periods; negative results do not completely rule out acute early infection. For CBC, a manual Peripheral Smear (PBS) is recommended in cases of marked cytopenias or abnormal cell populations.</p>
      <p>• <strong>Legal Protection:</strong> Results relate strictly to the received biological specimen. Not valid for medico-legal or judicial purposes.</p>
    </div>
    
    <div class="report-signatures-compact">
      <div class="sig-column center">
        <span class="verify-badge">✓ Electronically Verified</span>
      </div>
      <div class="sig-column">
        <div class="sig-space"></div>
        <div class="sig-title">Consultant Pathologist / Doctor</div>
        <div class="sig-sub">Authorized Signatory</div>
      </div>
    </div>`;

  return reportHTML;
}
