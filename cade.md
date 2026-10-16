# CADE — Cleanup Audit: Duplicates, Dead-Code, Unnecessary Code

> Method: `ponytail` (full) + `ponytail-review` + `karpathy-guidelines`, AUDIT & SAFE CLEANUP BLUEPRINT.
> Scope: `assets/js/` source modules, `assets/css/`, `*.html`, `scripts/`.
> Excluded: `assets/js/bundle.js` (generated IIFE), `reference/index.legacy.html` (immutable baseline per AGENTS.md §5).
> Date: 2026-10-16 | Repo: `doforgain/clinic_lab` | Verification: `scripts/test-clinical.js` (131 assertions)
> Amendment: 2026-10-16 — Verified against live code. 7 corrections applied (see ⚠️). Do not apply original wording blindly.

---

## 1. Duplicates — Two Sources of Truth (Merge Without Breaking UI/Metadata)

| # | Location A | Location B | What | Safe Action & Verification Guard |
|---|---|---|---|---|
| **D1** | `assets/js/config/pricing-config.js:3 PRICES` | `assets/js/services/invoice-service.js:12 INVOICE_TEST_CATALOG` | Same test rates (cbc:200, esr:100, etc.) | **DO NOT delete `INVOICE_TEST_CATALOG`** (it contains essential invoice metadata: `name`, `sample` type). **Consolidate rate only**: import `PRICES` in `invoice-service.js` and set `rate: PRICES[key]`. |
| **D2** | `assets/js/calculators/cost-calculator.js:57-97` | `services/history-service.js:143-180`, `services/stats-service.js:124-160`, `services/inventory-service.js:6-42` | Password-modal open/close/submit x4 | **DO NOT create shared helper (YAGNI)**: `#historyPasswordModal`, `#statisticsPasswordModal`, and `#collectionPasswordModal` do NOT exist in the DOM (orphaned by multi-page split). **Delete the 3 dead modal functions**; keep only active `#inventoryPasswordModal`. ⚠️ Verified: stats open fn is at `:124`, not `:147`. |
| **D3** | `calculators/cost-calculator.js:9-17 sumWhere` | `services/stats-service.js:29`, `:178` | Same collection-sum guard `testCost !== 'Not specified' && !isNaN(parseFloat)` | Extract one safe `sumCollection(records)` helper or reuse `sumWhere`. |
| **D4** | `services/stats-service.js:8-12 getTodayReportCount` | `stats-service.js:40-62 getMonthlyTestStats`, `:162-188 renderStatistics` | Same `loadHistoryData().filter(reportedDate === today)` loop x3 | Consolidate date filtering through a single helper. |
| **D5** | `state/app-state.js:52 toggleGenerateUpdateButton` | `ui/form-ui.js:51 setPreviewButtonMode`, `:76 setFormButtonMode` | Button show/hide toggles | Merge into `form-ui.js`. **Guard**: Must preserve `setEditing(isEditMode, reportId)` state mutation from `app-state.js`. |
| **D6** | `ui/form-ui.js:108 showReport`, `:132 hideReportShowForm` | `services/report-actions.js:31 showGeneratedReport`, `services/history-service.js:305-324`, `app.js:109-124` | Same form/preview DOM visibility toggling | Standardize all callers to `showReport` and `hideReportShowForm` in `form-ui.js`. Prune duplicate manual DOM hides. |
| **D7** | `index.html:580-582 STAFF_USERNAME/PASSWORD/SESSION_KEY` | `config/auth-config.js:12-14` | Plain constants copy in landing `<script>` | **Keep intentional inline copy** as documented in `index.html:577-579` for `file:///` standalone login execution without module imports. |
| **D8** | Session-gate script x5 | `create-report.html:9-18`, `dashboard.html:9-18`, `history.html:9-18`, `statistics.html:9-18`, `invoice.html:9-18` | Synchronous `<head>` session gate | Keep inline in HTML `<head>` to prevent flash of unauthenticated content on `file:///`. |
| **D9** | `services/search-service.js:223 export { calculateSearchStatistics }` | `services/stats-service.js:15` | Re-export with zero consumers | **Delete re-export line** in `search-service.js`. All callers import directly from `stats-service.js`. |
| **D10** | `config/auth-config.js:21-23 VIEW_PASSWORD, UPDATE_PASSWORD` | Aliases for `HISTORY_PASSWORD`, `INVENTORYUPDATE_PASSWORD` | Unused alias exports | **Delete alias exports** (`VIEW_PASSWORD`, `UPDATE_PASSWORD`). |

---

## 2. Unused / Dead JS Exports & Privatisations

> Evidence verified via grep across `*.html` and `assets/js/*.js` (excluding `bundle.js`, `reference/`, and `cade.md`).

- 🛑 **DO NOT DELETE**: `assets/js/state/storage.js:327 unsubscribeRealtime` (def at `:327`, body `:330-331`) — **Required by `scripts/test-clinical.js:478-481` (Suite 11, Test B17)** to verify Realtime teardown and prevent memory leaks.
- 🛑 **DO NOT REMOVE FROM `supabase-config.js`**: `getCloudAuthSession`, `signInCloudStaff`, `signOutCloudStaff` — **Required by `scripts/test-clinical.js:544-551` (Suite 12, Test B01)**. Only remove the redundant re-export line in `assets/js/state/storage.js:4`.
- `assets/js/utils/dom-helpers.js:2 $`, `:3 $$` — Only `escapeHtml` is imported. `delete:` unused `$` and `$$`.
- `assets/js/config/auth-config.js:22 VIEW_PASSWORD`, `:23 UPDATE_PASSWORD` — Zero imports. `delete:`.
- `assets/js/config/auth-config.js:17 HISTORY_PASSWORD`, `:18 INVENTORY_PASSWORD` — ⚠️ **CORRECTION: NOT zero-import.** `HISTORY_PASSWORD` is used in `history-service.js:15,170`; `INVENTORY_PASSWORD` in `stats-service.js:4,150`. They are auth for *dead modals* (no live DOM targets). `delete:` ONLY together with the dead modal fns in D2. Do NOT delete standalone. (Keep `COLLECTION_PASSWORD` and `INVENTORYUPDATE_PASSWORD`).
- `assets/js/config/test-constants.js:43 OTHER_TESTS` — Only imported in `report-builder.js:2` but never used in body. `delete:` export and import.
- `assets/js/state/inventory-state.js:15 updateTubeCountsDisplay`, `:16 updateKitCountsDisplay` — Explicit legacy no-op stubs (`/* flagged DELETE */`). ⚠️ **CORRECTION: actively called** in `app.js:53-54`, `inventory-service.js:94-95`, `inventory-state.js:42`. `delete:` stubs ONLY with call-site cleanup in the same commit.
- `assets/js/services/invoice-service.js:23 TEST_CATALOG`, `:337-339 bindTableEvents, recalculateFromTable, updateTotals` — Dead alias re-exports. `delete:`.
- `assets/js/services/history-service.js:5 STORAGE_KEYS` import — Unused in module body. `delete:` from import list.
- `assets/js/state/storage.js:4 re-export getCloudAuthSession, signInCloudStaff, signOutCloudStaff` — Zero imports from `storage.js`. `delete:` redundant re-export only (keep exports in `supabase-config.js`).
- `assets/js/ui/form-ui.js:51 setPreviewButtonMode` — Imported in `app.js:13` but never called in `app.js`. `delete:` dead import.
- **Convert to Private (remove `export`) — ⚠️ AUDIT-ONLY, DO NOT APPLY BLINDLY**: verified internal-only today, but un-exporting breaks any external/test import and `test-clinical.js` string checks. Apply only per-function after grep:
  - `state/app-state.js:24 setEditing` (only internal to `app-state.js`)
  - `state/storage.js:115 updateCloudStatusBadge` (only internal to `storage.js`)
  - `utils/patient-id.js:21 isPatientIdExists` (only internal to `patient-id.js`)
  - `services/duplicate-service.js:5 areTestsIdentical` (only internal to `duplicate-service.js`)
  - `services/stats-service.js:8 getTodayReportCount`, `:40 getMonthlyTestStats`, `:99 hideZeroTodayTests` (only internal)
  - `services/search-service.js:19 collectAdvancedFilters`, `:135 getActiveFilters`, `:152 removeFilter`, `:194 setActiveQuickFilter` (only internal)
  - `services/history-service.js:19 TEST_CHECKBOX_MAP` (only internal)
  - `calculators/cost-calculator.js:20 getTodayTotal`, `:25 getTodayCashTotal`, `:30 getTodayOnlineTotal` (only internal)

---

## 3. `app.js` Orchestrator Issues

- 🎯 **Critical Bug Fix (Bundle-Masked Reference Error)**:
  - `app.js:433 showReport(item)` is called when loading via `?previewId=`, but `showReport` is **never imported** in `app.js`. Works in concatenated `bundle.js`, but throws `ReferenceError` under native ES modules.
  - **Fix**: Add `showReport` to `import { ... } from './ui/form-ui.js'`.
- **Remove Dead Imports from `app.js`**:
  - `HISTORY_PASSWORD` (`app.js:12`) — TRUE dead (no body use).
  - `setPreviewButtonMode` (`app.js:13`) — TRUE dead in `app.js` (live in `report-actions.js:40`, `form-ui.js:127`).
  - ⚠️ **CORRECTION — split, do not bulk-delete:** `showHistory`, `openHistoryPasswordModal` (`app.js:16`) and `showStatistics`, `openStatisticsPasswordModal` (`app.js:19`) are TRUE dead. BUT `closeHistoryPasswordModal`, `submitHistoryPassword` (`app.js:265,270,274,336,345`) and `closeStatisticsPasswordModal`, `submitStatisticsPassword` (`app.js:282,287,291,337,346`) are still referenced by null-guarded listeners. Delete fns + listeners + imports atomically, or keep.
  - `openInventoryPasswordModal`, `openUpdateInventoryModal` (`app.js:20`)
  - ⚠️ **KEEP in `app.js:20`**: `closeInventoryPasswordModal`, `submitInventoryPassword`, `closeUpdateInventoryModal`, `saveInventoryChanges`, and `updateTubeInventoryWithPassword` — these are actively wired to DOM events in `app.js:294-329`!
- **Prune Dead Modal Event Listeners in `app.js`**:
  - Lines 243-292 (`#collectionPasswordForm`, `#historyPasswordForm`, `#statisticsPasswordForm` submit/cancel handlers): none of these elements exist in live HTML.
  - Window click listeners in lines 332-337 (`#historyModal`, `#statisticsModal`, `#collectionPasswordModal`, `#historyPasswordModal`, `#statisticsPasswordModal`).
- **Merge Duplicate Import**:
  - `app.js:16` and `app.js:18` both import from `./services/history-service.js`. Merge into a single `import { ... }` line.

---

## 4. Dead CSS (Defined, Zero Live References — Only in `reference/`)

- `assets/css/components/cost-inventory.css:15,28,33 .today-total`, `:41 .today-total-amount`, `:48 .today-total-amount1`, `:55 .today-total-amount2`, `:62 .today-total p`, `:96 .total-row`, `:103 .total-item`:
  - Live `create-report.html:400-435` does not contain `.today-total` (migrated to modern cards on `dashboard.html`).
  - `delete:` dead selector blocks (~60 lines).
- `assets/css/responsive.css:20 .total-row`:
  - Orphaned selector in live group `.cost-row, .total-row {flex-direction:column}`. ⚠️ Prune only `.total-row,` from selector — do NOT delete whole block (`.cost-row` is live in `create-report.html:403`).
- `assets/css/components/inventory.css:19,28 .tube-inventory`, `:33 .tube-counts`, `:38 .tube-count`, `:62 .kit-counts`, `:69,78,84 .kit-count`, `:45,57 .update-tube-btn`:
  - Only present in `reference/index.legacy.html`. Live pages use `.tube-options` and `.dash-btn`. `delete:` dead selectors (~70 lines). ⚠️ Keep `:2-17` `.tube-options/.tube-option` (live in `create-report.html:420`).
- **Keep**:
  - `components/test-selector.css` and `components/buttons.css` (active in `create-report.html` and UI components).
  - `.doctor-signature-img` screen and print media pair (active in `report-builder.js`).

---

## 5. Dead HTML & Live Bug Exposure

- 🐛 **Active Bug Discovery — Dashboard Collection Refresh Failure**:
  - In `assets/js/state/storage.js:286`:
    ```javascript
    if (document.getElementById('todayTotal') && typeof updateTodayTotal === 'function') updateTodayTotal();
    ```
  - `#todayTotal` only existed in legacy HTML. On `dashboard.html`, the elements are `#dashTodayTotal`, `#dashTodayCash`, `#dashTodayOnline`.
  - **Bug**: Cloud sync currently fails to refresh the dashboard metrics after sync.
  - **Fix**: Update guard to `if ((document.getElementById('dashTodayTotal') || document.getElementById('todayTotal')) && typeof updateTodayTotal === 'function') updateTodayTotal();`.
- **NOT orphaned — `index.html:519-573` (`#signupModal`)**:
  - ⚠️ **CORRECTION:** has live trigger `<button id="landingSignupBtn">` (`index.html:33`) + `openSignupModal()` wiring (`:646-651,674-675,683-686,695`). It is a reachable-but-intentionally-inactive private-preview stub with ~165 lines of CSS in `components/landing.css:927-1094`.
  - Do NOT delete without also removing nav button + JS wiring. Leave as-is, or remove atomically if single-clinic scope is final.
- **Inline Style Cleanup**:
  - ⚠️ **CORRECTION — narrow scope:** `create-report.html` already uses `.is-hidden` exclusively (zero `display:none`). Only remainder is `history.html:109` `#searchSummary` (toggled in `search-service.js:91`). Do NOT blanket-convert `invoice.html:96`, `index.html:486,520` modals where JS intentionally toggles `display:flex/none` — would break modal flex display.

---

## 6. `scripts/` Hygiene & Test Suite Integrity

- `scripts/build-bundle.js:53`:
  - `transformModule(content, relativePath)` defines `relativePath` but never uses it. Drop unused parameter.
- `scripts/test-clinical.js:49-59`:
  - Destructured imports `formatPointValue`, `ESR_REF`, `BILIRUBIN_REF`, `PRICES` are unused in assertion bodies. Prune unused destructuring.
- `scripts/test-clinical.js:439`:
  - ⚠️ **DO NOT CHANGE — original suggestion was wrong.** Test asserts dashed *string* IDs (`/^\d{13}-[a-z0-9]{5}$/`). Commit `7738d97` BigInt handling is a separate path in `storage.js` (`Number(strId)` cast for Supabase `bigint` column, dashed IDs fall through as strings). Updating the comment to "BigInt/numeric" would misdescribe the test.

---

## 7. Keep — Explicitly Protected Against Deletion

- `reference/index.legacy.html` — Immutable baseline per AGENTS.md §5.
- `assets/js/state/storage.js:327 unsubscribeRealtime` (body `:330-331`) — Explicitly tested in `test-clinical.js:480`.
- `assets/js/config/supabase-config.js` (`getCloudAuthSession`, `signInCloudStaff`, `signOutCloudStaff`) — Explicitly tested in `test-clinical.js:544-551`.
- `assets/js/services/invoice-service.js:12 INVOICE_TEST_CATALOG` metadata (`name`, `sample`) — Required for invoice table rendering.
- `assets/images/signature.png` & `signature.svg` — Live authorized doctor signature with fallback.
- `create-report.html:513` html2pdf CDN — Fallback for PDF generation (tested in `test-clinical.js:356`).
- Clinical reference parameters: `CBC_PARAMS`, `WIDAL_CUTOFF`, `BILIRUBIN_REF` — Diagnostic core.

---

## 8. Safe 4-Phase Execution Roadmap

1. **Phase 1 — Low-Risk Pruning (NOT zero-risk, verify each)**:
   - Prune dead exports (`$`, `$$`, `VIEW_PASSWORD`, `UPDATE_PASSWORD`, `OTHER_TESTS`, alias re-exports). ⚠️ Exclude `HISTORY_PASSWORD` / `INVENTORY_PASSWORD` (still imported — see §2 correction).
   - Delete dead CSS selector blocks in `cost-inventory.css` and `inventory.css`. ⚠️ Keep `.tube-options` (`inventory.css:2-17`); prune only `.total-row` from `responsive.css:19-23`.
   - Remove unused `relativePath` parameter in `scripts/build-bundle.js`.
2. **Phase 2 — Bug Fixes & Orchestrator Hygiene**:
   - Add missing `import { showReport }` in `app.js:13`.
   - Merge duplicate `history-service.js` imports in `app.js`.
   - Fix `#dashTodayTotal` cloud sync update guard in `storage.js:286`.
   - Delete orphaned modal functions in `history-service.js`, `stats-service.js`, and `cost-calculator.js` + their PINs + listeners atomically.
   - Prune orphaned modal form event listeners (`collectionPasswordForm`, `historyPasswordForm`, `statisticsPasswordForm`) in `app.js:243-292`. ⚠️ `close/submit*` handlers are still referenced — remove fns + listeners + imports in one commit.
3. **Phase 3 — Metadata & Pricing Consolidation**:
   - Link `INVOICE_TEST_CATALOG[key].rate = PRICES[key]` to establish single source of truth without breaking invoice data.
   - Delete no-op stubs `updateTubeCountsDisplay` / `updateKitCountsDisplay` ONLY with call-site cleanup (`app.js:53-54`, `inventory-service.js:94-95`).
   - Convert internal helpers to private ONLY per-function after grep — do NOT bulk un-export.
4. **Phase 4 — Compilation & Verification Gate**:
   - Run bundle compiler: `node scripts/build-bundle.js`
   - Run bundle parity check: `node scripts/build-bundle.js --check`
   - Run clinical safety test harness: `node scripts/test-clinical.js` (Must pass 131/131 assertions).
   - Verify screen & print preview in browser (`file:///` and HTTP).

---

## 9. Net Score & Impact

- **Estimated Net Reduction**: `-320 to -420 lines` of dead code, obsolete CSS, and legacy modal baggage.
- **Safety**: ⚠️ NOT 100% test-compatible if applied verbatim — 7 corrections above are required to avoid runtime regressions (§2, §3, §5, §6). With corrections: zero broken assertions expected.
- **Status**: Audit verified with amendments. Ready for safe surgical execution.
