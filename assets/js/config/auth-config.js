/* NEW in v2 — consolidates index.html L559,562,565,568 password consts (v1 missed).
 * Legacy values preserved for parity. Recommendation: collapse 3x 'admin1' to single VIEW_PASSWORD. */

export const INVENTORYUPDATE_PASSWORD = '9211';
export const HISTORY_PASSWORD = 'admin1';
export const INVENTORY_PASSWORD = 'admin1';
export const COLLECTION_PASSWORD = 'admin1';

// Recommended consolidated aliases (use in new code, keep legacy exports for compat)
export const VIEW_PASSWORD = HISTORY_PASSWORD; // history + stats + collection gates
export const UPDATE_PASSWORD = INVENTORYUPDATE_PASSWORD;
