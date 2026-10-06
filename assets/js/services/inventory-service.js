/* Extracted from index.html L2900-2932. */
import { INVENTORYUPDATE_PASSWORD } from '../config/auth-config.js';
import { getTubeCounts, setTubeCounts, getKitCounts, setKitCounts, updateTubeCountsDisplay, updateKitCountsDisplay } from '../state/inventory-state.js';

export function updateTubeInventoryWithPassword() {
  const password = prompt('Please enter the password to update inventory:');
  if (password === INVENTORYUPDATE_PASSWORD) {
    const tubeCounts = getTubeCounts();
    const kitCounts = getKitCounts();
    const purpleCount = prompt('Enter new number of Purple (EDTA) tubes:', tubeCounts.purple);
    const redCount = prompt('Enter new number of Red (Plain) tubes:', tubeCounts.red);
    const typhoidCount = prompt('Enter new number of Typhoid test kits:', kitCounts.typhoid);
    const malariaCount = prompt('Enter new number of Malaria test kits:', kitCounts.malaria);
    if (purpleCount !== null && !isNaN(parseInt(purpleCount))) tubeCounts.purple = parseInt(purpleCount);
    if (redCount !== null && !isNaN(parseInt(redCount))) tubeCounts.red = parseInt(redCount);
    if (typhoidCount !== null && !isNaN(parseInt(typhoidCount))) kitCounts.typhoid = parseInt(typhoidCount);
    if (malariaCount !== null && !isNaN(parseInt(malariaCount))) kitCounts.malaria = parseInt(malariaCount);
    setTubeCounts(tubeCounts.purple, tubeCounts.red);
    setKitCounts(kitCounts.typhoid, kitCounts.malaria);
    updateTubeCountsDisplay(); updateKitCountsDisplay();
    alert('Inventory updated successfully!');
  } else if (password !== null) {
    alert('Incorrect password. Please try again.');
  }
}
