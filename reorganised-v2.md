# Reorganisation Plan v2: Monolithic `index.html` Decomposition (Corrected)

> **Preservation guarantee:** `index.html` (4473 lines) is FROZEN as reference. Do NOT delete / overwrite it.
> Work in parallel: `reference/index.legacy.html` = copy of current `index.html`, new app in `index.html` clean OR in `app/` folder.
> This v2 fixes gaps in `reorganised.md` v1. v1 is kept for history, not deleted.

## 1. Verified Current State (ground truth, not estimates)

```
index.html total: 4473 lines
HTML  : L1-556    (547 lines + head)
  - head: L1-10 (html2pdf CDN L8, broken css link L9: css/style.css)
  - patient form L23-80, test selection L82-122, test inputs L124-337,
    cost/inventory L339-395, buttons L397-406, stats L408-424,
    reportOutput L426, historyModal L429-459, statisticsModal L461-470,
    advancedSearchModal L472-555
JS    : L557-2933  (2377 lines, 63x function declarations verified)
  - script open L557, close L2933
CSS   : L2934-4470 (1537 lines in <style>), close tags L4471-4473
  - base/layout L2936-3045, test-selection L3046-3094, cost-section L3095-3200,
    buttons L3201-3304, report L3305-3388, historyModal L3389-3507,
    test-stats L3508-3637, tube/kit L3675-3761, statisticsModal L3762-3821,
    advanced-search L3822-4016, search-summary/filter-tags L4017-4426,
    print L4064-4118, responsive 768px L4120-4181 / 480px L4183-4206,
    search-statistics/error-notifications L4209-4470
```

Inline handlers to remove (12x): `oninput=calculateCBCParameters()` x7 (hemoglobin,tlc,neutrophils,lymphocytes,mid,rbcCount,mcv,pcv),
`oninput=calculateIndirectBilirubin()` x2, `oninput/onchange=autoUpdatePatientTitle()` x3, `onclick=toggleCollection()` x1.

LocalStorage keys (must preserve): `labReportsHistory`, `globalHistorySerial`, `purpleTubeCount`, `redTubeCount`, `typhoidKitCount`, `malariaKitCount`, plus `sessionStorage: currentPatientId`.

Passwords (v1 missed): L559 `INVENTORYUPDATE_PASSWORD='9211'`, L562 `HISTORY_PASSWORD='admin1'`, L565 `INVENTORY_PASSWORD='admin1'`, L568 `COLLECTION_PASSWORD='admin1'`. Last 3 are duplicates.

Globals (v1 missed): L571 `isEditing`, L572 `currentEditingId`, L2028-2039 `currentFilters`, L1143 `globalSerial` (local inside saveToHistory).

## 2. What Was Wrong / Missing in v1 (`reorganised.md`)

1. **Path bug:** v1 target `assets/css/style.css` but `index.html:9` loads `css/style.css`. Must fix link, decide bundler vs @import.
2. **Phantom module:** `services/backup-service.js` has no source - no export/import in index.html. Mark FUTURE, don't migrate.
3. **No auth module:** 4 password consts + 4 `prompt()` gates (`toggleCollection:1272`, `viewHistory:1453`, `showStatistics:2723`, `updateTubeInventoryWithPassword:2900`) unmapped.
4. **No app-state:** `isEditing/currentEditingId/currentFilters` unowned.
5. **Mis-mapped functions:**
   - `toggleCollection:1272` unmapped.
   - `showReport:2269` is history-view, not report-generation.
   - `setupQuickFilters:2284 + setActiveQuickFilter:2346` lumped into Report Generation, belong to search.
   - `updateTubeCountsDisplay:740 + updateKitCountsDisplay:795` are empty stubs -> DELETE, not migrate.
   - `areTestsIdentical:637` is duplicate-logic, not date-helper.
6. **DOMContentLoaded monolith L1291-1498 (~207 lines, 15 responsibilities) glossed as "form reset".** Needs explicit split.
7. **Vague module system:** "ES module OR namespace" - must pick ES modules + `type="module"`.
8. **CSS duplicates ignored:** `.stats-grid:3543 vs 4238`, `.test-stat:3517 vs 4460`.
9. **No parity checklist:** can't prove "all functions reorganised and working" vs preserved index.html.

## 3. Target Structure v2 (corrected)

```text
Lab/
├── index.html                     # PRESERVED REFERENCE - DO NOT DELETE (frozen 4473-line version)
├── reference/
│   └── index.legacy.html          # copy of index.html for diff/parity testing
├── index.new.html                 # new clean shell (~350 lines, no inline JS/CSS) -> rename to index.html only after QA
├── reorganised.md                 # v1 - keep
├── reorganised-v2.md              # this file
├── README.md                      # architecture + how to parity-test vs index.html
│
├── assets/
│   ├── css/
│   │   ├── variables.css          # palette, spacing, typography, shadows (extract L2936-2950 + colors)
│   │   ├── base.css               # reset, body, container, header, logo L2936-3010
│   │   ├── components/
│   │   │   ├── patient-form.css   # .patient-info, .form-group L3008-3045
│   │   │   ├── test-selector.css  # .test-selection/options/inputs/sections L3046-3094
│   │   │   ├── cost-inventory.css # .cost-section, payment/tube/kit L3095-3125 + 3675-3761
│   │   │   ├── report-preview.css # .report-output/header/patient-info/test-section + table L3305-3388
│   │   │   ├── history-search.css # .history-modal/list/item + enhanced-search + quick-filters L3389-3507 + 3976-4016
│   │   │   └── statistics.css     # .test-stats/stats-grid/box + stats-table + search-statistics L3508-3674 + 3799-3820 + 4214-4315
│   │   ├── modals.css             # history/statistics/advanced-search shells L3389-3419 + 3762-3900
│   │   ├── notifications.css      # NEW: .user-notification, .input-error, .filter-tag, .blurred L4316-4454 (v1 missed)
│   │   ├── responsive.css         # NEW split: @media 768px L4120-4181 + 480px L4183-4206 (don't mix with print)
│   │   ├── print.css              # ONLY @media print L4064-4118 + .no-print
│   │   └── style.css              # aggregator via @import in correct order
│   │
│   └── js/
│       ├── config/
│       │   ├── test-constants.js  # CBC params + ref ranges from createReportHTML:1707-1725, ESR 0-20, Widal <1:80, Bilirubin, CRP tiers
│       │   ├── pricing-config.js  # prices{} L1009-1019 + combo rules L1031-1036
│       │   └── auth-config.js     # NEW: 4 passwords consolidated to 2, prompt strings
│       ├── state/
│       │   ├── app-state.js       # NEW: isEditing, currentEditingId, currentFilters, globalSerial
│       │   ├── storage.js         # STORAGE_KEYS const + load/save wrappers + try/catch (from saveToHistory:1141 + all getItem)
│       │   └── inventory-state.js # tubes+kits get/set/inc/dec/adjust/init (see §4)
│       ├── calculators/
│       │   ├── cbc-calculator.js  # calculateCBCParameters:907 + calculateIndirectBilirubin:898 (pure, no DOM)
│       │   └── cost-calculator.js # updateSuggestedCost:1008 + getTodayTotal/Cash/Online:1068-1102 + updateTodayTotal:1059 + toggleCollection:1272
│       ├── utils/
│       │   ├── date-helpers.js    # getTodayDate:575, getCurrentMonthName:584, formatTimeDifference:649, formatDisplayDate:667
│       │   ├── patient-id.js      # generatePatientId:680, isPatientIdExists:702, validatePatientId:711
│       │   └── dom-helpers.js     # NEW: query wrappers to cut 115x getElementById repetition
│       ├── services/
│       │   ├── duplicate-service.js # NEW: checkDuplicatePatient:591 + areTestsIdentical:637 (v1 wrongly in date-helpers)
│       │   ├── report-builder.js  # createReportHTML:1673 ONLY (1700-line template). generateReport:1500 + updateReport:1596 move to report-actions.js OR keep thin wrappers here
│       │   ├── report-actions.js  # NEW: generateReport, updateReport, toggleGenerateUpdateButton:880, showReport:2269
│       │   ├── pdf-service.js     # saveAsPDF:2015 + print enable/disable logic
│       │   ├── history-service.js # saveToHistory:1141 (split: inventory part -> inventory-state, params collect -> report-builder), loadHistory:2042, showHistory:2409, addHistoryItemEventListeners:2420, editReportCost:2445, loadReportForEditing:2463, deleteReport:2543
│       │   ├── search-service.js  # show/apply/reset/closeAdvancedSearch:1104-1139, applyAdvancedFilters:2097, updateSearchSummary:2143, getActiveFilters:2221, removeFilter:2259, setupQuickFilters:2284, setActiveQuickFilter:2346, setupSearchFunctionality:2354
│       │   ├── stats-service.js   # calculateSearchStatistics:2571, getMonthlyTestStats:2636, updateTestStats:2679, hideZeroTodayTests:2695, getTodayReportCount:725, updateTodayReportCount:2710, showStatistics:2723
│       │   └── inventory-service.js # updateTubeInventoryWithPassword:2900 (prompt gate) - thin over inventory-state
│       ├── ui/
│       │   └── form-ui.js         # NEW: toggleTestInputs:988, autoUpdatePatientTitle:962, mutual-exclusivity (cash/online, purple/red), newReport reset, editReport view toggles
│       └── app.js                 # ONLY init: DOMContentLoaded:1291-1498 decomposed into initDates(), initPatientId(), initInventory(), bindEvents()
```

Do NOT create `backup-service.js` now. Add later as feature with `exportBackup()/importBackup()` + file input.

## 4. Function Mapping Matrix v2 (exact lines, 63/63)

| # | Function | Source lines | v1 location | v2 corrected destination | Note |
|---|----------|--------------|-------------|--------------------------|------|
| 1 | getTodayDate | 575-581 | date-helpers | utils/date-helpers.js | keep pure |
| 2 | getCurrentMonthName | 584-588 | date-helpers | utils/date-helpers.js | - |
| 3 | checkDuplicatePatient | 591-634 | patient-id | services/duplicate-service.js | FIX: move out of patient-id |
| 4 | areTestsIdentical | 637-646 | patient-id | services/duplicate-service.js | helper, test all 9 keys |
| 5 | formatTimeDifference | 649-664 | date-helpers | utils/date-helpers.js | - |
| 6 | formatDisplayDate | 667-677 | date-helpers | utils/date-helpers.js | - |
| 7 | generatePatientId | 680-699 | patient-id | utils/patient-id.js | MMM-YYYY-0001 serial scan |
| 8 | isPatientIdExists | 702-708 | patient-id | utils/patient-id.js | add excludeId for edit |
| 9 | validatePatientId | 711-722 | patient-id | utils/patient-id.js + ui/form-ui.js (DOM warn) | split pure vs DOM |
| 10 | getTodayReportCount | 725-729 | stats-service | services/stats-service.js | - |
| 11 | getTubeCounts | 732-737 | inventory-state | state/inventory-state.js | key purpleTubeCount/redTubeCount |
| 12 | updateTubeCountsDisplay | 740-742 | inventory-state | DELETE (empty stub) | dynamic in stats modal |
| 13 | setTubeCounts | 745-749 | inventory-state | state/inventory-state.js | - |
| 14 | decrementTube | 752-767 | inventory-state | state/inventory-state.js | warn if 0 |
| 15 | incrementTube | 770-777 | inventory-state | state/inventory-state.js | - |
| 16 | getKitCounts | 780-785 | inventory-state | state/inventory-state.js | typhoidKitCount/malariaKitCount |
| 17 | setKitCounts | 788-792 | inventory-state | state/inventory-state.js | - |
| 18 | updateKitCountsDisplay | 795-797 | inventory-state | DELETE (empty stub) | - |
| 19 | decrementKits | 800-821 | inventory-state | state/inventory-state.js | warn if 0 |
| 20 | incrementKits | 824-841 | inventory-state | state/inventory-state.js | - |
| 21 | adjustKitsForEdit | 844-859 | inventory-state | state/inventory-state.js | diff old vs new |
| 22 | initializeKitInventory | 862-877 | inventory-state | state/inventory-state.js | prompt() - refactor to modal later |
| 23 | toggleGenerateUpdateButton | 880-895 | report-builder | services/report-actions.js | FIX: not builder, uses app-state |
| 24 | calculateIndirectBilirubin | 898-904 | cbc-calculator | calculators/cbc-calculator.js | make pure(total,direct)->indirect |
| 25 | calculateCBCParameters | 907-959 | cbc-calculator | calculators/cbc-calculator.js | pure calc + DOM thin wrapper |
| 26 | autoUpdatePatientTitle | 962-985 | patient-id | ui/form-ui.js | DOM-only, not ID util |
| 27 | toggleTestInputs | 988-1005 | app.js | ui/form-ui.js | 9 sections + 2 subtype containers |
| 28 | updateSuggestedCost | 1008-1056 | cost-calculator | calculators/cost-calculator.js + config/pricing-config.js | FIX combo bug §6 |
| 29 | updateTodayTotal | 1059-1066 | cost-calculator | calculators/cost-calculator.js | DOM wrapper |
| 30 | getTodayTotal | 1068-1078 | cost-calculator | calculators/cost-calculator.js | - |
| 31 | getTodayCashTotal | 1080-1090 | cost-calculator | calculators/cost-calculator.js | filter paymentMode==Cash |
| 32 | getTodayOnlineTotal | 1092-1102 | cost-calculator | calculators/cost-calculator.js | filter Online |
| 33 | showAdvancedSearch | 1104-1106 | search-service | services/search-service.js | - |
| 34 | applyAdvancedSearch | 1108-1123 | search-service | services/search-service.js | read 9 inputs -> loadHistory |
| 35 | resetAdvancedSearch | 1125-1135 | search-service | services/search-service.js | clear 9 inputs |
| 36 | closeAdvancedSearch | 1137-1139 | search-service | services/search-service.js | - |
| 37 | saveToHistory | 1141-1269 | history+storage | services/history-service.js + state/storage.js + state/inventory-state.js | MUST SPLIT: inventory adjust + params collect + persist |
| 38 | toggleCollection | 1272-1288 | (unmapped in v1) | calculators/cost-calculator.js + config/auth-config.js | password gate COLLECTION_PASSWORD |
| 39 | DOMContentLoaded init | 1291-1498 | app.js | js/app.js (orchestrator only, delegate) | split into init*() §5 |
| 40 | generateReport | 1500-1594 | report-builder | services/report-actions.js | validation + duplicate confirm + save |
| 41 | updateReport | 1596-1671 | report-builder | services/report-actions.js | same, with currentEditingId |
| 42 | createReportHTML | 1673-2013 | report-builder | services/report-builder.js + config/test-constants.js | extract cbcParams, widalParams, CRP tiers |
| 43 | saveAsPDF | 2015-2025 | pdf-service | services/pdf-service.js | html2pdf opt, filename patientId |
| 44 | loadHistory | 2042-2094 | history-service | services/history-service.js | filter + render + stats |
| 45 | applyAdvancedFilters | 2097-2140 | search-service | services/search-service.js | 7 filter dimensions |
| 46 | updateSearchSummary | 2143-2218 | search-service | services/search-service.js | tags + search-statistics HTML |
| 47 | getActiveFilters | 2221-2256 | search-service | services/search-service.js | 10 keys |
| 48 | removeFilter | 2259-2266 | search-service | services/search-service.js | clear key + input |
| 49 | showReport | 2269-2281 | (v1 wrong: report-builder) | services/report-actions.js (or history-service) | view mode hide forms |
| 50 | setupQuickFilters | 2284-2344 | (v1 wrong: report-builder) | services/search-service.js | data-days/test/payment |
| 51 | setActiveQuickFilter | 2346-2351 | search-service | services/search-service.js | .active toggle |
| 52 | setupSearchFunctionality | 2354-2406 | search-service | services/search-service.js | input + clear btn |
| 53 | showHistory | 2409-2417 | history-service | services/history-service.js | + setTimeout setupQuickFilters |
| 54 | addHistoryItemEventListeners | 2420-2443 | history-service | services/history-service.js | edit-cost/edit-report/delete |
| 55 | editReportCost | 2445-2461 | history-service | services/history-service.js | prompt + update totals/stats |
| 56 | loadReportForEditing | 2463-2541 | history-service | services/history-service.js + ui/form-ui.js | FIX checkbox ID bug §6 |
| 57 | deleteReport | 2543-2569 | history-service | services/history-service.js | restore tube+kit |
| 58 | calculateSearchStatistics | 2571-2633 | stats-service | services/stats-service.js | totalReports/Tests/Collection |
| 59 | getMonthlyTestStats | 2636-2676 | stats-service | services/stats-service.js | month filter + todayCounts |
| 60 | updateTestStats | 2679-2692 | stats-service | services/stats-service.js | todayCBC..CRP DOM |
| 61 | hideZeroTodayTests | 2695-2707 | stats-service | services/stats-service.js | display none if 0 |
| 62 | updateTodayReportCount | 2710-2720 | stats-service | services/stats-service.js | badge #todayTestCount |
| 63 | showStatistics | 2723-2897 | stats-service | services/stats-service.js | monthly collection + tube usage + inventory |
| 64 | updateTubeInventoryWithPassword | 2900-2932 | inventory-state | services/inventory-service.js | gate INVENTORYUPDATE_PASSWORD |

Constants L558-573 -> `config/auth-config.js` + `state/app-state.js` (v1 put in test-constants, wrong).

## 5. DOMContentLoaded Decomposition (L1291-1498)

Current does: set dates, patientId session, validate binding, init kits/tubes + prompts, serial init, mutual-exclusivity (cash/online, purple/red), test checkbox -> toggle+cost, typhi/malaria result -> toggle, 12 button/modal bindings, window click outside, setupSearchFunctionality.

v2 `app.js` must only call:
```js
import { initDates, initPatientId } from './ui/form-ui.js';
import { initInventory } from './state/inventory-state.js';
import { bindAllEvents } from './ui/bindings.js'; // NEW file or part of form-ui
document.addEventListener('DOMContentLoaded', ()=>{ initDates(); initPatientId(); initInventory(); bindAllEvents(); refreshDashboard(); });
```
No business logic in listener. All `onclick/oninput` removed from HTML.

## 6. Bugs to Fix During Reorg (don't carry over blindly)

1. **Checkbox reload:** `loadReportForEditing:2508` `test${Cap}` => `testCbc` != `testCBC`. Fix map: `{cbc:'testCBC',esr:'testESR',typhi:'testTyphi',dengue:'testDengue',malaria:'testMalaria',widal:'testWidal',bloodGroup:'testBloodGroup',bilirubin:'testBilirubin',crp:'testCRP'}`.
2. **Combo pricing:** `isCombo1..5:1031-1035` ignore bilirubin/crp/dengue/esr combos. Add `&& !bilirubin && !crp` (and decide dengue). Move to `pricing-config.js` with unit test.
3. **History cap comment vs code:** comment 500, code `slice(0,10000):1260-1262`. Decide 10000, update comment.
4. **Age parse:** `parseInt(item.patientAge)` on `"25 Yrs"` works but fragile. Store `ageValue + ageUnit` separately in future; for now `parseInt` + regex.
5. **Duplicate passwords:** collapse `HISTORY/INVENTORY/COLLECTION='admin1'` to single `VIEW_PASSWORD`, keep `INVENTORYUPDATE_PASSWORD='9211'` separate. Document in auth-config.
6. **CSS path:** change `<link href="css/style.css">` to `<link href="assets/css/style.css">` in new file only; leave legacy untouched.
7. **Dead CSS:** `.tube-inventory`, `.status-header/.sync-status` have no HTML - prune or keep flagged.

## 7. CSS Extraction Order (to avoid visual regression)

1. variables + base first, screenshot legacy vs new.
2. components one by one, keep selector names identical (no rename in this pass).
3. modals + notifications.
4. responsive.css, then print.css last (print test with `window.print()` preview).
5. Deduplicate `.stats-grid/.test-stat` - keep single definition.

## 8. Phased Roadmap v2 (preserving index.html)

- **Phase 0 Freeze:** `git checkout -b refactor/modularize`, `mkdir reference && copy index.html reference/index.legacy.html`, verify app opens via `reference` file. No edits to root `index.html` yet.
- **Phase 1 CSS:** create `assets/css/*` per §3, create `index.new.html` linking `assets/css/style.css`, pixel-compare with legacy.
- **Phase 2 Pure logic:** `config/*`, `utils/date-helpers`, `utils/patient-id`, `calculators/*` as pure functions + manual console tests.
- **Phase 3 Stateful services:** `state/*`, `services/duplicate/history/search/stats/pdf/inventory` with `STORAGE_KEYS` constant. Test with copied localStorage.
- **Phase 4 Shell + wiring:** strip inline handlers in `index.new.html`, implement `ui/form-ui.js` + `app.js` ES modules (`<script type="module" src="assets/js/app.js">`), keep html2pdf as classic script before module.
- **Phase 5 Parity QA:** run checklist §9 side-by-side legacy vs new, same localStorage. Only then `move index.html -> index.legacy-backup.html && move index.new.html -> index.html` (or keep both).

## 9. Parity Checklist (prove "all functions reorganised and working" vs preserved index.html)

Functional (do on both, compare):
- [ ] Generate CBC+Typhi+Malaria default, cost auto 300, tube Purple decrement, kits typhi/malaria decrement
- [ ] CBC auto-calc: TLC 6000 + N 60% => AbsN 3600; RBC+MCV => PCV; Hb/RBC => MCH; Hb/PCV => MCHC
- [ ] Bilirubin: Total-Direct => Indirect readonly
- [ ] Duplicate warn: same name/age/gender+tests within 30min/10 reports blocks with confirm
- [ ] PatientId duplicate warn + confirm path; edit path excludes self via excludeId
- [ ] Update flow: history -> Edit Report -> change cost/tests -> Update Report -> tube/kit adjust
- [ ] Delete restores tube+kit, updates totals/stats
- [ ] Edit Cost prompt updates totals
- [ ] History search text + advanced 9 filters + quick filters (Today/7/30, CBC/Typhi/CRP, Cash/Online) + removeFilter tag + clear
- [ ] Stats modal (password) monthly collection cash/online + test counts + tube usage + remaining
- [ ] Today totals Cash/Online/Total blur gate (password) show/hide
- [ ] Print (only report visible) + Save PDF filename `lab_report_<id>.pdf`
- [ ] New Report resets + new patientId; Edit mode confirm discard
- [ ] Title auto-update: Baby/Master/Miss/Mr/Mrs by age+gender
- [ ] Responsive 768/480 + print A4 margins unchanged

Data:
- [ ] Keys identical, `labReportsHistory` JSON readable by both versions, serial monotonic.

## 10. Recommended Edits to v1 File

Keep `reorganised.md` as-is for history. Apply v2 deltas above if merging: fix total 4473, fix css path, add auth-config/app-state/duplicate-service/ui files, delete backup-service row, correct 5 mis-mapped rows, add §5-§9.

---
*Generated by comparing `reorganised.md` (101 lines) against `index.html` (4473 lines, 63 functions enumerated). No changes made to `index.html`.*
