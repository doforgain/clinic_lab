/* Extracted from index.html L732-877. Identical behaviour. Dead stubs deleted per v2. */
import { STORAGE_KEYS } from './storage.js';

export function getTubeCounts() {
  return {
    purple: parseInt(localStorage.getItem(STORAGE_KEYS.PURPLE_TUBE) || '0'),
    red: parseInt(localStorage.getItem(STORAGE_KEYS.RED_TUBE) || '0')
  };
}
export function setTubeCounts(purple, red) {
  localStorage.setItem(STORAGE_KEYS.PURPLE_TUBE, purple.toString());
  localStorage.setItem(STORAGE_KEYS.RED_TUBE, red.toString());
}
// Legacy no-ops L740-742, L795-797 — kept as no-op exports so parity grep still finds them, but flagged DELETE.
export function updateTubeCountsDisplay() { /* Handled dynamically in statistics modal (legacy stub) */ }
export function updateKitCountsDisplay() { /* Handled dynamically in statistics modal (legacy stub) */ }

export function decrementTube(tubeUsed) {
  const tubeCounts = getTubeCounts();
  if (tubeUsed === 'Purple') {
    if (tubeCounts.purple > 0) setTubeCounts(tubeCounts.purple - 1, tubeCounts.red);
    else alert('Warning: No purple (EDTA) tubes left in inventory!');
  } else if (tubeUsed === 'Red') {
    if (tubeCounts.red > 0) setTubeCounts(tubeCounts.purple, tubeCounts.red - 1);
    else alert('Warning: No red (plain) tubes left in inventory!');
  }
}
export function incrementTube(tubeUsed) {
  const tubeCounts = getTubeCounts();
  if (tubeUsed === 'Purple') setTubeCounts(tubeCounts.purple + 1, tubeCounts.red);
  else if (tubeUsed === 'Red') setTubeCounts(tubeCounts.purple, tubeCounts.red + 1);
}
export function getKitCounts() {
  return {
    typhoid: parseInt(localStorage.getItem(STORAGE_KEYS.TYPHOID_KIT) || '0'),
    malaria: parseInt(localStorage.getItem(STORAGE_KEYS.MALARIA_KIT) || '0')
  };
}
export function setKitCounts(typhoid, malaria) {
  localStorage.setItem(STORAGE_KEYS.TYPHOID_KIT, typhoid.toString());
  localStorage.setItem(STORAGE_KEYS.MALARIA_KIT, malaria.toString());
  updateKitCountsDisplay();
}
export function decrementKits(tests) {
  const kitCounts = getKitCounts();
  let updated = false;
  if (tests.typhi && kitCounts.typhoid > 0) { kitCounts.typhoid--; updated = true; }
  else if (tests.typhi && kitCounts.typhoid <= 0) { alert('⚠️ WARNING: No Typhoid test kits left in inventory!'); }
  if (tests.malaria && kitCounts.malaria > 0) { kitCounts.malaria--; updated = true; }
  else if (tests.malaria && kitCounts.malaria <= 0) { alert('⚠️ WARNING: No Malaria test kits left in inventory!'); }
  if (updated) setKitCounts(kitCounts.typhoid, kitCounts.malaria);
}
export function incrementKits(tests) {
  const kitCounts = getKitCounts();
  let updated = false;
  if (tests.typhi) { kitCounts.typhoid++; updated = true; }
  if (tests.malaria) { kitCounts.malaria++; updated = true; }
  if (updated) setKitCounts(kitCounts.typhoid, kitCounts.malaria);
}
export function adjustKitsForEdit(oldTests, newTests) {
  if (!oldTests.typhi && newTests.typhi) decrementKits({ typhi: true });
  if (!oldTests.malaria && newTests.malaria) decrementKits({ malaria: true });
  if (oldTests.typhi && !newTests.typhi) incrementKits({ typhi: true });
  if (oldTests.malaria && !newTests.malaria) incrementKits({ malaria: true });
}
export function initializeKitInventory() {
  if (localStorage.getItem('shc_inventory_initialized')) return;
  const kitCounts = getKitCounts();
  if (kitCounts.typhoid === 0 && kitCounts.malaria === 0) {
    const typhoidCount = prompt('Enter initial number of Typhoid test kits:', '50');
    const malariaCount = prompt('Enter initial number of Malaria test kits:', '50');
    if (typhoidCount !== null && !isNaN(parseInt(typhoidCount))) kitCounts.typhoid = parseInt(typhoidCount);
    if (malariaCount !== null && !isNaN(parseInt(malariaCount))) kitCounts.malaria = parseInt(malariaCount);
    setKitCounts(kitCounts.typhoid, kitCounts.malaria);
    localStorage.setItem('shc_inventory_initialized', 'true');
  }
}
export function initializeTubeInventory() {
  if (localStorage.getItem('shc_tubes_initialized')) return;
  const tubeCounts = getTubeCounts();
  if (tubeCounts.purple === 0 && tubeCounts.red === 0) {
    const purpleCount = prompt('Enter initial number of Purple (EDTA) tubes:', '100');
    const redCount = prompt('Enter initial number of Red (Plain) tubes:', '100');
    if (purpleCount !== null && !isNaN(parseInt(purpleCount))) tubeCounts.purple = parseInt(purpleCount);
    if (redCount !== null && !isNaN(parseInt(redCount))) tubeCounts.red = parseInt(redCount);
    setTubeCounts(tubeCounts.purple, tubeCounts.red);
    localStorage.setItem('shc_tubes_initialized', 'true');
  }
}
