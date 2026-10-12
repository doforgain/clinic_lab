/* Extracted from index.html L1008-1056 (updateSuggestedCost). Pure + DOM wrapper split. */

export const PRICES = {
  cbc: 200,
  esr: 100,
  typhi: 100,
  dengue: 400,
  malaria: 100,
  widal: 100,
  bloodGroup: 100,
  bilirubin: 200,
  crp: 250
};

// Cumulative combo pricing: applies combo discount for fever packages and adds any extra panels (Bilirubin, CRP, Dengue, etc.)
export function computeSuggestedCost(t) {
  if (!t || typeof t !== 'object') return 0;
  const cbc = !!t.cbc;
  const esr = !!t.esr;
  const typhi = !!t.typhi;
  const dengue = !!t.dengue;
  const malaria = !!t.malaria;
  const widal = !!t.widal;
  const bloodGroup = !!t.bloodGroup;
  const bilirubin = !!t.bilirubin;
  const crp = !!t.crp;

  let comboBase = 0;
  const covered = { cbc: false, typhi: false, malaria: false, widal: false };

  // Combo 1 & 2: CBC + Malaria + Typhoid (Typhi or Widal) -> ₹300 bundle
  if (cbc && (typhi || widal) && malaria) {
    comboBase = 300;
    covered.cbc = true;
    covered.malaria = true;
    if (typhi) covered.typhi = true;
    else covered.widal = true;
  }
  // Combo 3, 4, 5: CBC + one of (Typhi, Widal, Malaria) -> ₹250 bundle
  else if (cbc && (typhi || widal || malaria)) {
    comboBase = 250;
    covered.cbc = true;
    if (typhi) covered.typhi = true;
    else if (widal) covered.widal = true;
    else if (malaria) covered.malaria = true;
  }

  let total = comboBase;
  if (!covered.cbc && cbc) total += PRICES.cbc;
  if (!covered.typhi && typhi) total += PRICES.typhi;
  if (!covered.malaria && malaria) total += PRICES.malaria;
  if (!covered.widal && widal) total += PRICES.widal;
  if (esr) total += PRICES.esr;
  if (dengue) total += PRICES.dengue;
  if (bloodGroup) total += PRICES.bloodGroup;
  if (bilirubin) total += PRICES.bilirubin;
  if (crp) total += PRICES.crp;

  return total;
}

// DOM wrapper — updates suggested cost in UI
export function updateSuggestedCost() {
  const t = {
    cbc: document.getElementById('testCBC') ? document.getElementById('testCBC').checked : false,
    esr: document.getElementById('testESR') ? document.getElementById('testESR').checked : false,
    typhi: document.getElementById('testTyphi') ? document.getElementById('testTyphi').checked : false,
    dengue: document.getElementById('testDengue') ? document.getElementById('testDengue').checked : false,
    malaria: document.getElementById('testMalaria') ? document.getElementById('testMalaria').checked : false,
    widal: document.getElementById('testWidal') ? document.getElementById('testWidal').checked : false,
    bloodGroup: document.getElementById('testBloodGroup') ? document.getElementById('testBloodGroup').checked : false,
    bilirubin: document.getElementById('testBilirubin') ? document.getElementById('testBilirubin').checked : false,
    crp: document.getElementById('testCRP') ? document.getElementById('testCRP').checked : false
  };
  const costEl = document.getElementById('testCost');
  if (costEl) costEl.value = computeSuggestedCost(t);
}
