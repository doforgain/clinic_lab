# Implementation Report — reorganised-v2.md Phase-wise (index.html preserved)

> `index.html` SHA256 `31B9368AE1CEBF6FC62CDCF95FBB7E7B05E64F2818F4E0F556FC59A8617E4205` — unchanged from Phase 0. Length 178180 / 4473 lines.
> Reference copy: `reference/index.legacy.html` identical hash.
> New app: `index.new.html` (26698 bytes) + `assets/` — legacy never overwritten.

## Phase 0 — Freeze ✅
- `reference/index.legacy.html` created, hash identical to `index.html`.
- No branch/commit made (read-only verification).

## Phase 1 — CSS ✅
- 12 modules + `variables.css` + `style.css` aggregator.
- Concatenated modules (in import order) == legacy inner CSS byte-for-byte: `parity True 35248/35248`.
- Import order matches legacy cascade. Deltas vs v1: added `components/buttons.css` (L3201-3304) and split tube/kit `components/inventory.css` (L3675-3761) + `responsive.css` / `notifications.css` separation; `variables.css` new tokens unused (parity first).

## Phase 2 — Config/Utils/Calculators ✅
- `config/test-constants.js`, `pricing-config.js`, `auth-config.js`
- `utils/date-helpers.js`, `patient-id.js`, `dom-helpers.js`
- `calculators/cbc-calculator.js`, `cost-calculator.js`
- Pure cores added (`computeSuggestedCost`, `calcIndirectBilirubin`, `absoluteCount`, `pcvFromRbcMcv`, etc.) with legacy DOM wrappers unchanged.

## Phase 3 — State/Services ✅
- `state/app-state.js` (owns isEditing/currentEditingId/currentFilters + toggleGenerateUpdateButton moved here to break cycle)
- `state/storage.js` (STORAGE_KEYS), `state/inventory-state.js` (tubes/kits, stubs kept as no-ops)
- `services/duplicate-service.js`, `report-builder.js` (uses test-constants), `pdf-service.js`, `stats-service.js`, `search-service.js` (hook `setLoadHistoryHook` breaks search<->history cycle), `history-service.js` (TEST_CHECKBOX_MAP fix), `report-actions.js`, `inventory-service.js`
- `ui/form-ui.js` (autoUpdatePatientTitle, toggleTestInputs, showReport moved here for DAG)

## Phase 4 — Shell + App ✅
- `index.new.html`: from legacy L1-556, fixed `css/style.css` → `assets/css/style.css`, stripped 12 inline `oninput/onchange/onclick`, removed inline `<script>/<style>`, added `html2pdf CDN + <script type="module" src="assets/js/app.js">`.
- IDs: 116/116 preserved, 0 missing/extra.
- `assets/js/app.js`: decomposed L1291-1498 into initDates/initPatientId/initInventory/refreshDashboard/bind* + handleNewReport. All bindings present.

## Phase 5 — Parity QA ✅
- Legacy functions 63/63 found in new code, 0 missing. 40 extra helpers (pure/testability/init) — intentional.
- `node --check`: 0 fails across 21 JS files.
- Imports: 0 missing.
- HTML: no inline handlers, no inline style/script, module present.
- Storage keys: all 7 preserved (`labReportsHistory`, `globalHistorySerial`, `purpleTubeCount`, `redTubeCount`, `typhoidKitCount`, `malariaKitCount`, `currentPatientId`).
- Functional smoke (node ESM):
  `{"combo1":300,"combo3":250,"single_cbc":200,"cbc_crp":450,"absN":3600,"pcv":40,"mch":30,"mchc":33.3,"indirect":0.8,"crp_normal":"normal","crp_vhigh":"veryhigh","widal_pos":true,"widal_neg":false,"ident_true":true,"ident_false":false}` — all match legacy logic.

## Manual QA still required (browser, side-by-side legacy vs new)
Use checklist in reorganised-v2.md §9 with same localStorage: Generate, CBC auto-calc, Bilirubin, duplicate warns, Update, Delete (tube/kit restore), Edit Cost, History search + 9 advanced filters + quick filters, Stats modal, Collection blur gate, Print/PDF, New Report, Title auto-update.

## Known deltas / fixes applied (do not backport to index.html)
1. Checkbox map fixed (`TEST_CHECKBOX_MAP`) — legacy `testCbc/testEsr` broken.
2. Combo pricing documented bug (bilirubin/crp ignored) — preserved legacy, pure `computeSuggestedCost(t, true)` available for fix.
3. Passwords consolidated Exports + `VIEW_PASSWORD` alias (values unchanged).
4. Dead stubs `updateTubeCountsDisplay/updateKitCountsDisplay` kept as no-ops for grep parity.
5. `backup-service.js` NOT created (no source in legacy) — future feature.

## How to run new version
- Serve folder (ES modules need http): `npx serve .` then open `/index.new.html`.
- Keep `/index.html` open in second tab for comparison. Both read same localStorage.
- Promote only after manual QA: rename `index.html` → `index.legacy-backup.html`, `index.new.html` → `index.html`.
