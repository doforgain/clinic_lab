/* Extracted from index.html L898-959. Pure cores + legacy DOM wrappers (identical behaviour). */



// DOM wrapper L898-904
export function calculateIndirectBilirubin() {
  const total = parseFloat(document.getElementById('totalBilirubin').value) || 0;
  const direct = parseFloat(document.getElementById('directBilirubin').value) || 0;
  const indirect = total - direct;
  document.getElementById('indirectBilirubin').value = indirect >= 0 ? indirect.toFixed(2) : '';
}

// Pure cores for CBC
export const CBC_DECIMAL_FIELD_IDS = [
  'hemoglobin',
  'neutrophils',
  'lymphocytes',
  'mid',
  'rbcCount',
  'mcv',
  'pcv',
  'mch',
  'mchc'
];

export function formatPointValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '') return '';
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  if (!str.includes('.')) {
    return num.toFixed(1);
  }
  if (str.endsWith('.')) {
    return str + '0';
  }
  return str;
}

export function formatPlateletValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '') return '';
  const num = parseFloat(str);
  if (isNaN(num)) return str;

  // If user already wrote decimal value (e.g. 1.45, 0.83, 2.5), leave it as is
  if (str.includes('.')) {
    if (str.endsWith('.')) return str + '0';
    return str;
  }

  // If user entered without decimal (e.g. 5000 -> 0.05, 145 -> 1.45, 83 -> 0.83, 250 -> 2.50)
  if (num >= 1000) {
    return (num / 100000).toFixed(2);
  } else if (num >= 10) {
    return (num / 100).toFixed(2);
  } else if (num > 0) {
    return num.toFixed(2);
  }
  return str;
}

export function formatCBCDecimalInputs() {
  CBC_DECIMAL_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value !== '') {
      el.value = formatPointValue(el.value);
    }
  });
  const plateletEl = document.getElementById('platelet');
  if (plateletEl && plateletEl.value !== '') {
    plateletEl.value = formatPlateletValue(plateletEl.value);
  }
}



// DOM wrapper L907-959 — byte-behaviour identical to legacy
export function calculateCBCParameters() {
  const hemoglobin = parseFloat(document.getElementById('hemoglobin').value) || 0;
  const tlc = parseFloat(document.getElementById('tlc').value) || 0;
  const neutrophils = parseFloat(document.getElementById('neutrophils').value) || 0;
  const lymphocytes = parseFloat(document.getElementById('lymphocytes').value) || 0;
  const mid = parseFloat(document.getElementById('mid').value) || 0;
  const rbcCount = parseFloat(document.getElementById('rbcCount').value) || 0;
  const mcv = parseFloat(document.getElementById('mcv').value) || 0;
  let pcv = parseFloat(document.getElementById('pcv').value) || 0;

  if (tlc > 0) {
    document.getElementById('absoluteNeutrophils').value = neutrophils > 0 ? Math.round((tlc * neutrophils) / 100) : '';
    document.getElementById('absoluteLymphocytes').value = lymphocytes > 0 ? Math.round((tlc * lymphocytes) / 100) : '';
    document.getElementById('absoluteMid').value = mid > 0 ? Math.round((tlc * mid) / 100) : '';
  }
  if (rbcCount > 0 && mcv > 0) {
    pcv = (rbcCount * mcv) / 10;
    document.getElementById('pcv').value = pcv.toFixed(1);
  }
  if (hemoglobin > 0 && rbcCount > 0) {
    document.getElementById('mch').value = ((hemoglobin / rbcCount) * 10).toFixed(1);
  } else {
    document.getElementById('mch').value = '';
  }
  if (hemoglobin > 0 && pcv > 0) {
    document.getElementById('mchc').value = ((hemoglobin / pcv) * 100).toFixed(1);
  } else {
    document.getElementById('mchc').value = '';
  }
}
