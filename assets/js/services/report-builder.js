/* Extracted from index.html L1673-2013. Template logic identical; ranges via config/test-constants.js */
import { CBC_PARAMS, WIDAL_PARAMS, WIDAL_CUTOFF, OTHER_TESTS, ESR_REF, BILIRUBIN_REF, crpTier, refRangeFor, isAbnormalByRange, isWidalPositive } from '../config/test-constants.js';
import { CBC_DECIMAL_FIELD_IDS, formatPointValue, formatPlateletValue } from '../calculators/cbc-calculator.js';

export function createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed) {
  const hasWholeBloodTest = !!(tests.cbc || tests.esr || tests.malaria || tests.bloodGroup);
  const hasSerumTest = !!(tests.typhi || tests.dengue || tests.widal || tests.bilirubin || tests.crp);
  let specimenType;
  if (hasWholeBloodTest && hasSerumTest) {
    specimenType = 'EDTA Whole Blood & Serum';
  } else if (hasWholeBloodTest || tubeUsed === 'Purple') {
    specimenType = 'EDTA Whole Blood';
  } else if (hasSerumTest || tubeUsed === 'Red') {
    specimenType = 'Serum / Clotted Blood';
  } else {
    specimenType = 'Whole Blood / Serum';
  }

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

  let tableRows = '';

  // 1. COMPLETE BLOOD COUNT (CBC)
  if (tests.cbc) {
    let cbcRows = '';
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
        cbcRows += `<tr><td>${param.name}</td><td class="${isAbnormal ? 'abnormal' : ''}">${value}</td><td>${param.unit}</td><td>${refRange}</td></tr>`;
      }
    });
    if (cbcRows) {
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">COMPLETE BLOOD COUNT (CBC)</span>
              <span class="method-badge">Method: 3-Part Automated Cell Counter</span>
            </div>
          </td>
        </tr>
        ${cbcRows}`;
    }
  }

  // 2. HEMATOLOGY (ESR)
  if (tests.esr) {
    const esrValue = document.getElementById('esr').value || '';
    if (esrValue) {
      const isAbnormal = parseFloat(esrValue) > ESR_REF.max;
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">HEMATOLOGY (ESR)</span>
              <span class="method-badge">Method: Westergren Method (1 hr)</span>
            </div>
          </td>
        </tr>
        <tr>
          <td>Erythrocyte Sedimentation Rate (ESR)</td>
          <td class="${isAbnormal ? 'abnormal' : ''}">${esrValue}</td>
          <td>${ESR_REF.unit}</td>
          <td>${ESR_REF.display}</td>
        </tr>`;
    }
  }

  // 3. SEROLOGY & RAPID CARD TESTS (Malaria, Typhoid, Dengue)
  const hasRapidTests = (tests.malaria && (document.getElementById('malariaResult').value || '')) ||
                        (tests.typhi && (document.getElementById('typhiResult').value || '')) ||
                        (tests.dengue && (document.getElementById('dengueResult').value || ''));

  if (hasRapidTests) {
    let rapidRows = '';
    // Malaria (EDTA Whole Blood)
    if (tests.malaria) {
      const result = document.getElementById('malariaResult').value || '';
      if (result) {
        let displayResult = result;
        if (result === 'Positive') {
          const subtype = document.getElementById('malariaSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'Pf and Pv' : subtype})`;
        }
        rapidRows += `<tr><td>Malaria Parasite Antigen (Pv / Pf)</td><td class="${result === 'Positive' ? 'positive' : ''}">${displayResult}</td><td>—</td><td>Negative</td></tr>`;
      }
    }
    // Typhoid (Serum)
    if (tests.typhi) {
      const result = document.getElementById('typhiResult').value || '';
      if (result) {
        let displayResult = result;
        if (result === 'Positive') {
          const subtype = document.getElementById('typhiSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'IgM and IgG' : subtype})`;
        }
        rapidRows += `<tr><td>Typhoid Rapid (IgM / IgG)</td><td class="${result === 'Positive' ? 'positive' : ''}">${displayResult}</td><td>—</td><td>Negative</td></tr>`;
      }
    }
    // Dengue (Serum)
    if (tests.dengue) {
      const result = document.getElementById('dengueResult').value || '';
      if (result) {
        rapidRows += `<tr><td>Dengue Rapid (NS1 / IgM / IgG)</td><td class="${result === 'Positive' ? 'positive' : ''}">${result}</td><td>—</td><td>Negative</td></tr>`;
      }
    }
    if (rapidRows) {
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">SEROLOGY / RAPID CARD TESTS</span>
              <span class="method-badge">Method: Immunochromatographic Rapid Card Assay (ICT)</span>
            </div>
          </td>
        </tr>
        ${rapidRows}`;
    }
  }

  // 4. SEROLOGY (WIDAL TEST)
  if (tests.widal) {
    let widalRows = '';
    WIDAL_PARAMS.forEach(param => {
      const value = document.getElementById(param.id).value || '';
      if (value) {
        const isPositive = isWidalPositive(value);
        widalRows += `<tr><td>S. Typhi '${param.name.replace(' Antigen', '')}' Antigen</td><td class="${isPositive ? 'positive' : ''}">${value}</td><td>Titre</td><td>${WIDAL_CUTOFF.replace('<', '&lt;')}</td></tr>`;
      }
    });
    if (widalRows) {
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">SEROLOGY (WIDAL TEST)</span>
              <span class="method-badge">Method: Slide Agglutination Method</span>
            </div>
          </td>
        </tr>
        ${widalRows}`;
    }
  }

  // 5. BIOCHEMISTRY (BILIRUBIN & CRP)
  if (tests.bilirubin) {
    const totalBilirubin = document.getElementById('totalBilirubin').value || '';
    const directBilirubin = document.getElementById('directBilirubin').value || '';
    const indirectBilirubin = document.getElementById('indirectBilirubin').value || '';
    if (totalBilirubin || directBilirubin || indirectBilirubin) {
      let rows = '';
      if (totalBilirubin) rows += `<tr><td>Total Bilirubin</td><td class="${parseFloat(totalBilirubin) > BILIRUBIN_REF.total.max ? 'abnormal' : ''}">${totalBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.total.display}</td></tr>`;
      if (directBilirubin) rows += `<tr><td>Direct Bilirubin</td><td class="${parseFloat(directBilirubin) > BILIRUBIN_REF.direct.max ? 'abnormal' : ''}">${directBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.direct.display}</td></tr>`;
      if (indirectBilirubin) rows += `<tr><td>Indirect Bilirubin</td><td class="${parseFloat(indirectBilirubin) > BILIRUBIN_REF.indirect.max ? 'abnormal' : ''}">${indirectBilirubin}</td><td>mg/dL</td><td>${BILIRUBIN_REF.indirect.display}</td></tr>`;
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">BIOCHEMISTRY (BILIRUBIN)</span>
              <span class="method-badge">Method: Photometric (Diazo Method)</span>
            </div>
          </td>
        </tr>
        ${rows}`;
    }
  }

  if (tests.crp) {
    const crpValue = document.getElementById('crp').value || '';
    if (crpValue) {
      const tier = crpTier(parseFloat(crpValue));
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">BIOCHEMISTRY (CRP)</span>
              <span class="method-badge">Method: Semi-Quantitative Latex / Turbidimetry</span>
            </div>
          </td>
        </tr>
        <tr>
          <td>C-Reactive Protein (CRP)</td>
          <td class="${tier.statusClass}">${crpValue}</td>
          <td>mg/L</td>
          <td>${tier.refRange}</td>
        </tr>`;
    }
  }

  // 6. IMMUNOHEMATOLOGY (BLOOD GROUP)
  if (tests.bloodGroup) {
    const bloodGroupValue = document.getElementById('bloodGroup').value || '';
    if (bloodGroupValue) {
      tableRows += `
        <tr class="report-section-row">
          <td colspan="4">
            <div class="section-banner">
              <span class="section-name">IMMUNOHEMATOLOGY (BLOOD GROUP)</span>
              <span class="method-badge">Method: Slide Hemagglutination</span>
            </div>
          </td>
        </tr>
        <tr>
          <td>ABO & Rh Blood Group</td>
          <td style="font-weight: 600;">${bloodGroupValue}</td>
          <td>—</td>
          <td>—</td>
        </tr>`;
    }
  }

  reportHTML += `
    <table class="unified-report-table">
      <thead>
        <tr>
          <th class="col-investigation">INVESTIGATION</th>
          <th class="col-result">RESULT</th>
          <th class="col-unit">UNIT</th>
          <th class="col-ref">REFERENCE RANGE</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>`;

  reportHTML += `
    <div class="end-of-report">*** END OF REPORT ***</div>
    <div class="compact-disclaimer-box">
      <div class="disclaimer-title">IMPORTANT LABORATORY NOTES & CLINICAL DISCLAIMER:</div>
      <p>• <strong>Methodology & Screening:</strong> CBC performed by 3-Part Automated Hematology Analyzer. Malaria evaluated by EDTA whole blood ICT Rapid Card. Typhoid and Dengue evaluated by serum ICT Rapid Card. ESR evaluated by Westergren Method.</p>
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
