/* Extracted from index.html L1673-2013 (createReportHTML) — reference ranges single source of truth.
 * Parity with reference/index.legacy.html. Fixes v1 gap: ranges were buried in template. */

export const TEST_TYPES = ['cbc','esr','typhi','dengue','malaria','widal','bloodGroup','bilirubin','crp'];

// index.html L1707-1725
export const CBC_PARAMS = [
  { id: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', maleRef: '13.5-17.5', femaleRef: '12.0-15.0' },
  { id: 'tlc', name: 'Total Leucocyte Count', unit: 'cells/cumm', ref: '4000-11000' },
  { id: 'neutrophils', name: 'Neutrophils', unit: '%', ref: '40-75' },
  { id: 'lymphocytes', name: 'Lymphocytes', unit: '%', ref: '20-40' },
  { id: 'mid', name: 'Mid', unit: '%', ref: '3-9' },
  { id: 'absoluteNeutrophils', name: 'Absolute Neutrophils', unit: 'cells/cumm', ref: '2000-7000' },
  { id: 'absoluteLymphocytes', name: 'Absolute Lymphocytes', unit: 'cells/cumm', ref: '1000-3500' },
  { id: 'absoluteMid', name: 'Absolute Mid', unit: 'cells/cumm', ref: '200-800' },
  { id: 'rbcCount', name: 'RBC Count', unit: 'million/cumm', maleRef: '4.5-5.5', femaleRef: '4.0-5.0' },
  { id: 'pcv', name: 'PCV', unit: '%', maleRef: '40-50', femaleRef: '40-50' },
  { id: 'mcv', name: 'MCV', unit: 'fL', ref: '80-100' },
  { id: 'mch', name: 'MCH', unit: 'pg', ref: '27-32' },
  { id: 'mchc', name: 'MCHC', unit: 'g/dL', ref: '31.5-36' },
  { id: 'platelet', name: 'Platelet Count', unit: 'lakhs/cumm', ref: '1.50-4.50' }
];

// index.html L1800-1805
export const WIDAL_PARAMS = [
  { id: 'oAntigen', name: 'O Antigen' },
  { id: 'hAntigen', name: 'H Antigen' },
  { id: 'ahAntigen', name: 'AH Antigen' },
  { id: 'bhAntigen', name: 'BH Antigen' }
];
export const WIDAL_CUTOFF = '< 1:80';
export function isWidalPositive(value) {
  if (!value) return false;
  const str = String(value).trim();
  const positiveTitres = ['1:160', '1:320', '1:640', '1:1280'];
  return positiveTitres.some(titre => {
    const regex = new RegExp(`(^|[^0-9])${titre.replace(':', '\\:')}([^0-9]|$)`);
    return regex.test(str);
  });
}

export const ESR_REF = { unit: 'mm/hr', max: 20, display: '0-20' };

export const BILIRUBIN_REF = {
  total: { display: '0.3-1.2', max: 1.2 },
  direct: { display: '0.1-0.3', max: 0.3 },
  indirect: { display: '0.2-0.8', max: 0.8 }
};

// index.html L1917-1935 CRP tiers
export function crpTier(numValue) {
  if (typeof numValue !== 'number' || Number.isNaN(numValue)) {
    return { statusClass: '', refRange: '<10 (Normal)' };
  }
  if (numValue < 10) return { statusClass: 'normal', refRange: '<10 (Normal)' };
  if (numValue < 20) return { statusClass: 'elevated', refRange: '10-20 (Elevated)' };
  if (numValue <= 50) return { statusClass: 'high', refRange: '20-50 (High)' };
  return { statusClass: 'veryhigh', refRange: '>50 (Very High)' };
}

export function refRangeFor(param, patientGender) {
  if (!param) return '';
  if (param.ref) return param.ref;
  const g = String(patientGender || '').trim().toLowerCase();
  if (g === 'male' || g === 'm') return param.maleRef || '';
  if (g === 'female' || g === 'f') return param.femaleRef || '';
  if (param.maleRef && param.femaleRef) {
    const min = param.femaleRef.split('-')[0];
    const max = param.maleRef.split('-')[1];
    return `${min}-${max}`;
  }
  return param.maleRef || param.femaleRef || '';
}

export function isAbnormalByRange(value, rangeStr) {
  if (!rangeStr || value === '' || value === null || value === undefined) return false;
  const v = parseFloat(value);
  if (Number.isNaN(v)) return false;
  const [min, max] = rangeStr.split('-').map(Number);
  if (Number.isNaN(min) || Number.isNaN(max)) return false;
  return v < min || v > max;
}
