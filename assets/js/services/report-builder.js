/* Extracted from index.html L1673-2013. Template logic identical; ranges via config/test-constants.js */
import { CBC_PARAMS, WIDAL_PARAMS, WIDAL_CUTOFF, ESR_REF, BILIRUBIN_REF, crpTier, refRangeFor, isAbnormalByRange, isWidalPositive } from '../config/test-constants.js';
import { CBC_DECIMAL_FIELD_IDS, formatPointValue, formatPlateletValue } from '../calculators/cbc-calculator.js';
import { formatLabDate } from '../utils/date-helpers.js';
import { escapeHtml } from '../utils/dom-helpers.js';
function formatAlternatingRows(rowsHtml) {
  if (!rowsHtml) return '';
  const sections = rowsHtml.split(/(?=<tr\s+class=["']\s*report-section-row\s*["']>)/);
  return sections.map(section => {
    let rowIndex = 0;
    return section.replace(/<tr(?!\s+class=["']\s*report-section-row\s*["'])([^>]*)>/g, (match, attrs) => {
      rowIndex++;
      if (rowIndex % 2 === 0) {
        if (attrs && attrs.includes('class=')) {
          return `<tr${attrs.replace(/class=(["'])/, 'class=$1alt-row ')}>`;
        }
        return `<tr class="alt-row"${attrs}>`;
      }
      return match;
    });
  }).join('');
}

export function createReportHTML(patientName, patientAge, patientGender, tests, testCost, paymentMode, tubeUsed) {
  const hasWholeBloodTest = !!(tests.cbc || tests.esr || tests.malaria || tests.bloodGroup);
  const hasSerumTest = !!(tests.typhi || tests.dengue || tests.widal || tests.bilirubin || tests.crp);
  let specimenType;
  if (hasWholeBloodTest && hasSerumTest) {
    specimenType = 'EDTA Blood / Serum';
  } else if (hasWholeBloodTest || tubeUsed === 'Purple') {
    specimenType = 'EDTA Whole Blood';
  } else if (hasSerumTest || tubeUsed === 'Red') {
    specimenType = 'Serum / Clotted Blood';
  } else {
    specimenType = 'Whole Blood / Serum';
  }

  const patientId = document.getElementById('patientId') ? document.getElementById('patientId').value : '';
  const rawColl = document.getElementById('collectionDate') ? document.getElementById('collectionDate').value : '';
  const rawRecv = document.getElementById('receivedDate') ? document.getElementById('receivedDate').value : '';
  const rawRep = document.getElementById('reportedDate') ? document.getElementById('reportedDate').value : '';
  const collDate = formatLabDate(rawColl);
  const recvDate = formatLabDate(rawRecv);
  const repDate = formatLabDate(rawRep);
  const referredBy = document.getElementById('referredBy') ? (document.getElementById('referredBy').value.trim() || 'SELF') : 'SELF';
  const patientPhone = document.getElementById('patientPhone') ? document.getElementById('patientPhone').value.trim() : '';
  const patientCity = document.getElementById('patientCity') ? document.getElementById('patientCity').value.trim() : '';
  const fastingStatus = document.getElementById('fastingStatus') ? document.getElementById('fastingStatus').value.trim() : '';

  let cleanPatientName = patientName;
  let relationType = document.getElementById('relationType') ? document.getElementById('relationType').value : 'S/O';
  let guardianName = document.getElementById('guardianName') ? document.getElementById('guardianName').value.trim() : '';

  const guardianMatch = cleanPatientName.match(/\s*\((S\/O|W\/O|D\/O|C\/O)\s+([^)]+)\)/i);
  if (guardianMatch) {
    if (!guardianName) {
      relationType = guardianMatch[1].toUpperCase();
      guardianName = guardianMatch[2].trim();
    }
    cleanPatientName = cleanPatientName.replace(guardianMatch[0], '').trim();
  }

  const ageGenderStr = patientAge && patientGender ? `${patientAge} / ${patientGender}` : (patientAge || patientGender || '');

  let patientInfoHTML = `
      <div><strong>Patient Name:</strong> ${escapeHtml(cleanPatientName)}</div>`;

  if (guardianName) {
    patientInfoHTML += `\n      <div><strong>${escapeHtml(relationType)}:</strong> ${escapeHtml(guardianName)}</div>`;
  }

  patientInfoHTML += `\n      <div><strong>Age / Gender:</strong> ${escapeHtml(ageGenderStr)}</div>
      <div><strong>Patient ID:</strong> ${escapeHtml(patientId)}</div>`;

  if (patientPhone) {
    patientInfoHTML += `\n      <div><strong>Contact:</strong> ${escapeHtml(patientPhone)}</div>`;
  }
  if (patientCity) {
    patientInfoHTML += `\n      <div><strong>City:</strong> ${escapeHtml(patientCity)}</div>`;
  }

  if (collDate) {
    patientInfoHTML += `\n      <div><strong>Collection Date:</strong> ${escapeHtml(collDate)}</div>`;
  }
  if (recvDate) {
    patientInfoHTML += `\n      <div><strong>Received Date:</strong> ${escapeHtml(recvDate)}</div>`;
  }
  if (repDate) {
    patientInfoHTML += `\n      <div><strong>Reported Date:</strong> ${escapeHtml(repDate)}</div>`;
  }
  patientInfoHTML += `\n      <div><strong>Referred By:</strong> ${escapeHtml(referredBy)}</div>`;

  if (fastingStatus) {
    patientInfoHTML += `\n      <div><strong>Fasting Status:</strong> ${escapeHtml(fastingStatus)}</div>`;
  }

  patientInfoHTML += `\n      <div><strong>Specimen:</strong> ${escapeHtml(specimenType)}</div>
      <div class="no-print"><strong>Tube Used:</strong> ${escapeHtml(tubeUsed)}</div>`;

  let reportHTML = `
    <div class="report-header">
      <div class="header-container">
        <svg class="header-svg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"
             viewBox="0 0 29700 6000"
             style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
          <defs>
            <style type="text/css">
              .fil9 {fill:#9D9E9E}
              .fil8 {fill:#21846B}
              .fil0 {fill:#0289C1}
              .fil4 {fill:#233B9F}
              .fil6 {fill:#591C9B}
              .fil7 {fill:#5B7B23}
              .fil1 {fill:#9CDA32}
              .fil2 {fill:#A527A3}
              .fil5 {fill:#EC3813}
              .fil3 {fill:#FEAF0B}
              .fnt2 {font-weight:bold;font-size:590.45px;font-family:'Calibri','Segoe UI',Arial,sans-serif}
              .fnt1 {font-weight:bold;font-size:2357.84px;font-family:'Calibri','Segoe UI',Arial,sans-serif}
              .fnt0 {font-weight:bold;font-size:4346.53px;font-family:'Calibri','Segoe UI',Arial,sans-serif}
            </style>
          </defs>
          <g id="Layer_x0020_1">
            <g id="_2740097163536">
              <path class="fil0" d="M13063 3119l14 -842 835 -2 -1 -1275c-165,-17 -365,-7 -534,-8 -191,-1 -300,35 -311,228 -14,226 -19,843 11,1051 -388,7 -627,-45 -918,150 -183,123 -370,345 -366,699l1270 -1z"/>
              <path class="fil1" d="M14107 3098c59,46 65,27 237,25 88,-1 177,0 266,0 177,0 354,-2 531,-2 356,0 718,6 1072,-1 25,-134 11,-374 11,-520 1,-191 -18,-306 -192,-326 -237,-27 -847,-13 -1099,3l12 821 -838 0z"/>
              <path class="fil2" d="M14938 4141l-838 10 1 1282c176,5 357,2 534,3 194,0 297,-20 310,-222 16,-250 20,-835 -7,-1073z"/>
              <path class="fil3" d="M13063 4145l12 -837c-219,-6 -444,-1 -664,-1 -755,0 -623,-146 -624,528 0,181 18,302 212,319 183,16 898,18 1064,-9z"/>
              <path class="fil2" d="M14938 4141c312,62 713,7 928,-137 162,-109 376,-388 352,-692 -226,-21 -2018,-31 -2116,8 192,-6 683,-29 846,14l-10 807z"/>
              <path class="fil3" d="M13911 4147l-848 -2c20,381 -51,631 150,919 154,219 375,362 699,368l-1 -1285z"/>
              <path class="fil1" d="M14102 2272l831 5c51,-332 18,-680 -132,-909 -131,-199 -410,-394 -701,-367l2 1271z"/>
              <polygon class="fil4" points="13063,3119 13913,3119 13912,2275 13077,2277 "/>
              <polygon class="fil5" points="13063,4145 13911,4147 13903,3308 13075,3308 "/>
              <path class="fil6" d="M14100 4151l838 -10 10 -807c-163,-43 -654,-20 -846,-14l-2 831z"/>
              <polygon class="fil7" points="14107,3098 14945,3098 14933,2277 14102,2272 "/>
            </g>
            <g transform="matrix(0.804033 0 0 1 -11533.7 1478.3)">
              <text x="14850" y="3000" class="fil8 fnt0">SHAMS</text>
            </g>
            <g transform="matrix(0.948662 0 0 1 2698.3 886.328)">
              <text x="14850" y="3000" class="fil8 fnt1">HEALTH CARE</text>
            </g>
            <g transform="matrix(1.1105 0 0 1 4702.27 1416.22)">
              <text x="14850" y="3000" class="fil9 fnt2">YOUR HEALTH, OUR PRIORITY</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
    <div class="report-patient-info">
${patientInfoHTML}
    </div>`;

  let tableRows = '';
  let cbcRows = '';

  // 1. COMPLETE BLOOD COUNT (CBC)
  if (tests.cbc) {
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
        cbcRows += `<tr><td>${escapeHtml(param.name)}</td><td class="${isAbnormal ? 'abnormal' : ''}">${escapeHtml(value)}</td><td>${escapeHtml(param.unit)}</td><td>${escapeHtml(refRange)}</td></tr>`;
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
  let hasEsr = false;
  if (tests.esr) {
    const esrValue = document.getElementById('esr').value || '';
    if (esrValue) {
      hasEsr = true;
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
          <td class="${isAbnormal ? 'abnormal' : ''}">${escapeHtml(esrValue)}</td>
          <td>${ESR_REF.unit}</td>
          <td>${ESR_REF.display}</td>
        </tr>`;
    }
  }

  // 3. SEROLOGY & RAPID CARD TESTS (Malaria, Typhoid, Dengue)
  let hasMalaria = false;
  let hasTyphi = false;
  let hasDengue = false;
  const hasRapidTests = (tests.malaria && (document.getElementById('malariaResult').value || '')) ||
    (tests.typhi && (document.getElementById('typhiResult').value || '')) ||
    (tests.dengue && (document.getElementById('dengueResult').value || ''));

  if (hasRapidTests) {
    let rapidRows = '';
    // Malaria (EDTA Whole Blood)
    if (tests.malaria) {
      const result = document.getElementById('malariaResult').value || '';
      if (result) {
        hasMalaria = true;
        let displayResult = result;
        if (result === 'Positive') {
          const subtype = document.getElementById('malariaSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'Pf and Pv' : subtype})`;
        }
        rapidRows += `<tr><td>Malaria Parasite Antigen (Pv / Pf)</td><td class="${result === 'Positive' ? 'positive' : ''}">${escapeHtml(displayResult)}</td><td>—</td><td>Negative</td></tr>`;
      }
    }
    // Typhoid (Serum)
    if (tests.typhi) {
      const result = document.getElementById('typhiResult').value || '';
      if (result) {
        hasTyphi = true;
        let displayResult = result;
        if (result === 'Positive') {
          const subtype = document.getElementById('typhiSubtype').value;
          displayResult = `Positive (${subtype === 'Both' ? 'IgM and IgG' : subtype})`;
        }
        rapidRows += `<tr><td>Typhoid Rapid (IgM / IgG)</td><td class="${result === 'Positive' ? 'positive' : ''}">${escapeHtml(displayResult)}</td><td>—</td><td>Negative</td></tr>`;
      }
    }
    // Dengue (Serum)
    if (tests.dengue) {
      const result = document.getElementById('dengueResult').value || '';
      if (result) {
        hasDengue = true;
        rapidRows += `<tr><td>Dengue Rapid (NS1 / IgM / IgG)</td><td class="${result === 'Positive' ? 'positive' : ''}">${escapeHtml(result)}</td><td>—</td><td>Negative</td></tr>`;
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
  let widalRows = '';
  if (tests.widal) {
    WIDAL_PARAMS.forEach(param => {
      const value = document.getElementById(param.id).value || '';
      if (value) {
        const isPositive = isWidalPositive(value);
        widalRows += `<tr><td>S. Typhi '${escapeHtml(param.name.replace(' Antigen', ''))}' Antigen</td><td class="${isPositive ? 'positive' : ''}">${escapeHtml(value)}</td><td>Titre</td><td>${WIDAL_CUTOFF.replace('<', '&lt;')}</td></tr>`;
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
  let hasBilirubin = false;
  if (tests.bilirubin) {
    const totalBilirubin = document.getElementById('totalBilirubin').value || '';
    const directBilirubin = document.getElementById('directBilirubin').value || '';
    const indirectBilirubin = document.getElementById('indirectBilirubin').value || '';
    if (totalBilirubin || directBilirubin || indirectBilirubin) {
      hasBilirubin = true;
      let rows = '';
      if (totalBilirubin) rows += `<tr><td>Total Bilirubin</td><td class="${parseFloat(totalBilirubin) > BILIRUBIN_REF.total.max ? 'abnormal' : ''}">${escapeHtml(totalBilirubin)}</td><td>mg/dL</td><td>${BILIRUBIN_REF.total.display}</td></tr>`;
      if (directBilirubin) rows += `<tr><td>Direct Bilirubin</td><td class="${parseFloat(directBilirubin) > BILIRUBIN_REF.direct.max ? 'abnormal' : ''}">${escapeHtml(directBilirubin)}</td><td>mg/dL</td><td>${BILIRUBIN_REF.direct.display}</td></tr>`;
      if (indirectBilirubin) rows += `<tr><td>Indirect Bilirubin</td><td class="${parseFloat(indirectBilirubin) > BILIRUBIN_REF.indirect.max ? 'abnormal' : ''}">${escapeHtml(indirectBilirubin)}</td><td>mg/dL</td><td>${BILIRUBIN_REF.indirect.display}</td></tr>`;
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

  let hasCrp = false;
  if (tests.crp) {
    const crpValue = document.getElementById('crp').value || '';
    if (crpValue) {
      hasCrp = true;
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
          <td class="${tier.statusClass}">${escapeHtml(crpValue)}</td>
          <td>mg/L</td>
          <td>${tier.refRange}</td>
        </tr>`;
    }
  }

  // 6. IMMUNOHEMATOLOGY (BLOOD GROUP)
  let hasBloodGroup = false;
  if (tests.bloodGroup) {
    const bloodGroupValue = document.getElementById('bloodGroup').value || '';
    if (bloodGroupValue) {
      hasBloodGroup = true;
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
          <td style="font-weight: 600;">${escapeHtml(bloodGroupValue)}</td>
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
        ${formatAlternatingRows(tableRows)}
      </tbody>
    </table>`;

  // Dynamically assemble methodology notes only for tests present in current report
  const methodItems = [];
  if (cbcRows) {
    methodItems.push('CBC performed by 3-Part Automated Hematology Analyzer');
  }
  if (hasEsr) {
    methodItems.push('ESR evaluated by Westergren Method');
  }
  if (hasMalaria) {
    methodItems.push('Malaria evaluated by EDTA whole blood ICT Rapid Card');
  }
  const serumRapid = [];
  if (hasTyphi) serumRapid.push('Typhoid');
  if (hasDengue) serumRapid.push('Dengue');
  if (serumRapid.length > 0) {
    methodItems.push(`${serumRapid.join(' and ')} evaluated by serum ICT Rapid Card`);
  }
  if (widalRows) {
    methodItems.push('Widal evaluated by Slide Agglutination Method');
  }
  if (hasBilirubin) {
    methodItems.push('Bilirubin evaluated by Photometric Diazo Method');
  }
  if (hasCrp) {
    methodItems.push('CRP evaluated by Semi-Quantitative Latex / Turbidimetry');
  }
  if (hasBloodGroup) {
    methodItems.push('Blood Group evaluated by Slide Hemagglutination');
  }

  const methodologyText = methodItems.length > 0
    ? methodItems.join('. ') + '.'
    : 'Tests evaluated according to standard validated clinical laboratory methods.';

  // Dynamically assemble test limitations relevant to tests performed
  const limitationItems = [];
  if (hasMalaria || hasTyphi || hasDengue) {
    limitationItems.push('Rapid card tests have biological window periods; negative results do not completely rule out acute early infection');
  }
  if (cbcRows) {
    limitationItems.push('Automated analyzer values are screening counts; confirmatory testing (manual PBS) is advised for marked cytopenias or abnormal cell populations');
  }

  let disclaimerHTML = `
    <div class="end-of-report">*** END OF REPORT ***</div>
    <div class="compact-disclaimer-box">
      <div class="disclaimer-title">IMPORTANT LABORATORY NOTES & CLINICAL DISCLAIMER:</div>
      <p>• <strong>Methodology & Screening:</strong> ${methodologyText}</p>
      <p>• <strong>Clinical Correlation:</strong> All findings are preliminary diagnostic screening aids and must be correlated clinically by the treating physician with patient history and signs. Test results alone do not constitute a standalone medical diagnosis.</p>`;

  if (limitationItems.length > 0) {
    disclaimerHTML += `
      <p>• <strong>Technical Limitations:</strong> ${limitationItems.join('. ')}.</p>`;
  }

  disclaimerHTML += `
      <p>• <strong>Legal Immunity & Specimen:</strong> Samples are not preserved after testing; results reflect specimen condition strictly at the time of processing. Any repeat testing requires fresh sample collection. The laboratory accepts no medical, legal, or financial liability for diagnostic decisions or clinical management based on this report. Not valid for medico-legal or judicial purposes.</p>
    </div>
    
    <div class="report-signatures-compact">
      <div class="sig-column">
        <div class="sig-space">
          <img src="assets/images/signature.png" class="doctor-signature-img" alt="Doctor Signature" onerror="this.onerror=null; this.src='assets/images/signature.svg';">
        </div>
        <div class="sig-title">Dr. Shahid Khan, MBBS</div>
        <div class="sig-sub">Consultant Doctor / Authorized Signatory</div>
      </div>
    </div>
    
    <div class="report-page-footer">
      <div class="footer-content">
        <div class="footer-item">
          <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span><strong>SHAMS HEALTH CARE</strong>, Nuh Road, Tauru</span>
        </div>
        <div class="footer-item">
          <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>Ph: <strong>8901469099</strong></span>
        </div>
        <div class="footer-item">
          <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>Page <strong>1 of 1</strong></span>
        </div>
      </div>
    </div>`;

  reportHTML += disclaimerHTML;

  return reportHTML;
}
