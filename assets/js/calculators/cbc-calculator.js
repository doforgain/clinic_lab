/* Extracted from index.html L898-959. Pure cores + legacy DOM wrappers (identical behaviour). */

// Pure: total - direct
export function calcIndirectBilirubin(total, direct) {
  const t = parseFloat(total) || 0;
  const d = parseFloat(direct) || 0;
  const indirect = t - d;
  return indirect >= 0 ? Number(indirect.toFixed(2)) : null;
}

// DOM wrapper L898-904
export function calculateIndirectBilirubin() {
  const total = parseFloat(document.getElementById('totalBilirubin').value) || 0;
  const direct = parseFloat(document.getElementById('directBilirubin').value) || 0;
  const indirect = total - direct;
  document.getElementById('indirectBilirubin').value = indirect >= 0 ? indirect.toFixed(2) : '';
}

// Pure cores for CBC
export function absoluteCount(tlc, pct) {
  if (!(tlc > 0) || !(pct > 0)) return null;
  return Math.round((tlc * pct) / 100);
}
export function pcvFromRbcMcv(rbcCount, mcv) {
  if (rbcCount > 0 && mcv > 0) return Number(((rbcCount * mcv) / 10).toFixed(1));
  return null;
}
export function mchFromHbRbc(hb, rbc) {
  if (hb > 0 && rbc > 0) return Number(((hb / rbc) * 10).toFixed(1));
  return null;
}
export function mchcFromHbPcv(hb, pcv) {
  if (hb > 0 && pcv > 0) return Number(((hb / pcv) * 100).toFixed(1));
  return null;
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
