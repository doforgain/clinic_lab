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

// Combo rules from L1031-1035. NOTE known bug (v2 §6): original ignores bilirubin/crp/dengue in combo guard.
// Pure function preserves legacy behaviour exactly; fix flagged with includeExtraTests=true.
export function computeSuggestedCost(t, includeExtraTests = false) {
  const cbc = !!t.cbc, esr = !!t.esr, typhi = !!t.typhi, dengue = !!t.dengue,
        malaria = !!t.malaria, widal = !!t.widal, bloodGroup = !!t.bloodGroup;
  const bilirubin = !!t.bilirubin, crp = !!t.crp;

  let extra = false;
  if (includeExtraTests) {
    extra = bilirubin || crp || dengue || esr;
  }
  const isCombo1 = cbc && typhi && malaria && !esr && !dengue && !widal && !bloodGroup;
  const isCombo2 = cbc && widal && malaria && !esr && !typhi && !dengue && !bloodGroup;
  const isCombo3 = cbc && typhi && !malaria && !esr && !widal && !dengue && !bloodGroup;
  const isCombo4 = cbc && widal && !malaria && !esr && !typhi && !dengue && !bloodGroup;
  const isCombo5 = cbc && malaria && !widal && !esr && !typhi && !dengue && !bloodGroup;

  if (!includeExtraTests) {
    if (isCombo1 || isCombo2) return 300;
    if (isCombo3 || isCombo4 || isCombo5) return 250;
  } else {
    if ((isCombo1 || isCombo2) && !bilirubin && !crp) return 300;
    if ((isCombo3 || isCombo4 || isCombo5) && !bilirubin && !crp) return 250;
  }

  let total = 0;
  if (cbc) total += PRICES.cbc;
  if (esr) total += PRICES.esr;
  if (typhi) total += PRICES.typhi;
  if (dengue) total += PRICES.dengue;
  if (malaria) total += PRICES.malaria;
  if (widal) total += PRICES.widal;
  if (bloodGroup) total += PRICES.bloodGroup;
  if (bilirubin) total += PRICES.bilirubin;
  if (crp) total += PRICES.crp;
  void extra;
  return total;
}

// DOM wrapper — identical behaviour to legacy updateSuggestedCost (L1008-1056)
export function updateSuggestedCost() {
  const t = {
    cbc: document.getElementById('testCBC').checked,
    esr: document.getElementById('testESR').checked,
    typhi: document.getElementById('testTyphi').checked,
    dengue: document.getElementById('testDengue').checked,
    malaria: document.getElementById('testMalaria').checked,
    widal: document.getElementById('testWidal').checked,
    bloodGroup: document.getElementById('testBloodGroup').checked,
    bilirubin: document.getElementById('testBilirubin').checked,
    crp: document.getElementById('testCRP').checked
  };
  document.getElementById('testCost').value = computeSuggestedCost(t, false);
}
