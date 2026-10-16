/* Extracted from index.html L732-877. Identical behaviour. Dead stubs deleted per v2. */
import { STORAGE_KEYS, pushCloudInventory, queueInventoryDeltas } from './storage.js';
import { getSupabaseClient } from '../config/supabase-config.js';

/* Originating-device write-through (Inventory Plan Phase 3): every local
 * consumption/restock mutation pushes to cloud when online, or queues a
 * relative delta when offline. Remote devices never call these — they apply
 * realtime broadcasts via handleRemoteInventoryUpdate. */
let _writeThroughTimer = null;
let _pendingDeltas = {};

function writeThroughInventory(delta) {
  try {
    if (!getSupabaseClient()) return; // pure local mode, nothing to sync
    if (delta && typeof delta === 'object') {
      Object.keys(delta).forEach(k => {
        _pendingDeltas[k] = (_pendingDeltas[k] || 0) + (parseInt(delta[k]) || 0);
      });
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (delta) queueInventoryDeltas(delta);
      return;
    }
    // Coalesce rapid mutations (e.g. decrementTube followed immediately by decrementKits)
    if (_writeThroughTimer) clearTimeout(_writeThroughTimer);
    _writeThroughTimer = setTimeout(() => {
      _writeThroughTimer = null;
      const batchedDelta = { ..._pendingDeltas };
      _pendingDeltas = {};
      pushCloudInventory().then(ok => {
        if (!ok && Object.keys(batchedDelta).length > 0) queueInventoryDeltas(batchedDelta);
      }).catch(() => {
        try { if (Object.keys(batchedDelta).length > 0) queueInventoryDeltas(batchedDelta); } catch (e) {}
      });
    }, 50);
  } catch (e) {}
}

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

export function decrementTube(tubeUsed) {
  const tubeCounts = getTubeCounts();
  if (tubeUsed === 'Purple') {
    if (tubeCounts.purple > 0) { setTubeCounts(tubeCounts.purple - 1, tubeCounts.red); writeThroughInventory({ purple: -1 }); }
    else alert('Warning: No purple (EDTA) tubes left in inventory!');
  } else if (tubeUsed === 'Red') {
    if (tubeCounts.red > 0) { setTubeCounts(tubeCounts.purple, tubeCounts.red - 1); writeThroughInventory({ red: -1 }); }
    else alert('Warning: No red (plain) tubes left in inventory!');
  }
}
export function incrementTube(tubeUsed) {
  const tubeCounts = getTubeCounts();
  if (tubeUsed === 'Purple') { setTubeCounts(tubeCounts.purple + 1, tubeCounts.red); writeThroughInventory({ purple: 1 }); }
  else if (tubeUsed === 'Red') { setTubeCounts(tubeCounts.purple, tubeCounts.red + 1); writeThroughInventory({ red: 1 }); }
}
export function getKitCounts() {
  return {
    typhoid: parseInt(localStorage.getItem(STORAGE_KEYS.TYPHOID_KIT) || '0'),
    malaria: parseInt(localStorage.getItem(STORAGE_KEYS.MALARIA_KIT) || '0'),
    dengue: parseInt(localStorage.getItem(STORAGE_KEYS.DENGUE_KIT) || '0')
  };
}
export function setKitCounts(typhoid, malaria, dengue = getKitCounts().dengue) {
  localStorage.setItem(STORAGE_KEYS.TYPHOID_KIT, typhoid.toString());
  localStorage.setItem(STORAGE_KEYS.MALARIA_KIT, malaria.toString());
  localStorage.setItem(STORAGE_KEYS.DENGUE_KIT, dengue.toString());
}
export function decrementKits(tests) {
  const kitCounts = getKitCounts();
  let updated = false;
  const delta = {};
  if (tests.typhi) {
    if (kitCounts.typhoid > 0) { kitCounts.typhoid--; updated = true; delta.typhoid = -1; }
    else alert('⚠️ WARNING: No Typhoid test kits left in inventory!');
  }
  if (tests.malaria) {
    if (kitCounts.malaria > 0) { kitCounts.malaria--; updated = true; delta.malaria = -1; }
    else alert('⚠️ WARNING: No Malaria test kits left in inventory!');
  }
  if (tests.dengue) {
    if (kitCounts.dengue > 0) { kitCounts.dengue--; updated = true; delta.dengue = -1; }
    else alert('⚠️ WARNING: No Dengue test kits left in inventory!');
  }
  if (updated) { setKitCounts(kitCounts.typhoid, kitCounts.malaria, kitCounts.dengue); writeThroughInventory(delta); }
}
export function incrementKits(tests) {
  const kitCounts = getKitCounts();
  let updated = false;
  const delta = {};
  if (tests.typhi) { kitCounts.typhoid++; updated = true; delta.typhoid = 1; }
  if (tests.malaria) { kitCounts.malaria++; updated = true; delta.malaria = 1; }
  if (tests.dengue) { kitCounts.dengue++; updated = true; delta.dengue = 1; }
  if (updated) { setKitCounts(kitCounts.typhoid, kitCounts.malaria, kitCounts.dengue); writeThroughInventory(delta); }
}
export function adjustKitsForEdit(oldTests, newTests) {
  if (!oldTests.typhi && newTests.typhi) decrementKits({ typhi: true });
  if (!oldTests.malaria && newTests.malaria) decrementKits({ malaria: true });
  if (!oldTests.dengue && newTests.dengue) decrementKits({ dengue: true });
  if (oldTests.typhi && !newTests.typhi) incrementKits({ typhi: true });
  if (oldTests.malaria && !newTests.malaria) incrementKits({ malaria: true });
  if (oldTests.dengue && !newTests.dengue) incrementKits({ dengue: true });
}
