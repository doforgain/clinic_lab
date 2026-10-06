# Reorganisation Plan: Monolithic `index.html` Decomposition

## 1. Executive Summary & Current State Analysis

The current `index.html` is a **4,473-line monolithic file** combining:
- **HTML Structure (Lines 1–556)**: Patient info form, test selection panels, dynamic test parameter inputs, payment/inventory controls, report preview area, history drawer, advanced search modal, statistics dashboard.
- **JavaScript Application Logic (Lines 557–2933)**: 63 functions across patient ID generation, duplicate checks, CBC & bilirubin calculations, inventory tracking, test pricing, report generation/update, html2pdf rendering, search/filtering, stats computation, and data backup.
- **CSS Styles (Lines 2934–4470)**: 1,536 lines of styles including typography, UI controls, test tables, report printing templates (`@media print`), responsive breakpoints, and modal dialogs.

---

## 2. Target Directory Structure

```text
Lab/
├── index.html                     # Clean semantic HTML structure & modal shells (~350 lines)
├── README.md                      # Project documentation and module architecture
├── reorganised.md                 # Full decomposition and reorganisation plan
│
├── assets/
│   ├── css/
│   │   ├── variables.css          # Color palette, spacing, typography tokens, shadow tokens
│   │   ├── base.css               # Reset, typography, body layout, scrollbars
│   │   ├── components/
│   │   │   ├── patient-form.css   # Patient inputs, selector dropdowns, validation alerts
│   │   │   ├── test-selector.css  # Test checkboxes, subtype toggles, test panels
│   │   │   ├── cost-inventory.css # Price inputs, payment badges, tube/kit inventory cards
│   │   │   ├── report-preview.css # Medical report card layout, lab headers, reference tables
│   │   │   ├── history-search.css # History list, quick filter pills, search bar, active tags
│   │   │   └── statistics.css     # Stats cards, revenue breakdown, charts/tables
│   │   ├── modals.css             # Base modal overlay, advanced search modal, auth dialogs
│   │   ├── print.css              # @media print rules & PDF export styling
│   │   └── style.css              # Main CSS aggregator (@import or clean bundle)
│   │
│   └── js/
│       ├── config/
│       │   ├── test-constants.js  # Test metadata, normal reference ranges, unit specs
│       │   └── pricing-config.js  # Default test costs and calculation multipliers
│       ├── state/
│       │   ├── storage.js         # LocalStorage read/write wrappers & error handling
│       │   └── inventory-state.js # Tube (purple/red) and kit (typhoid/malaria) tracking
│       ├── calculators/
│       │   ├── cbc-calculator.js  # Auto-calculation of PCV, MCV, MCH, MCHC, RDW, Bilirubin
│       │   └── cost-calculator.js # Dynamic test pricing & today totals (Cash vs Online)
│       ├── utils/
│       │   ├── date-helpers.js    # Date formatting, time-ago, month name helpers
│       │   └── patient-id.js      # Patient ID generator & uniqueness validation
│       ├── services/
│       │   ├── report-builder.js  # HTML lab report construction (createReportHTML)
│       │   ├── pdf-service.js     # html2pdf integration, report printing & PDF downloads
│       │   ├── history-service.js # Save, load, edit, update, delete report records
│       │   ├── search-service.js  # Quick filters, multi-criteria advanced filtering
│       │   ├── stats-service.js   # Daily/monthly test counts, revenue aggregations
│       │   └── backup-service.js  # JSON backup export and import restoration
│       └── app.js                 # Event listeners, UI binding, DOM initialization
```

---

## 3. Comprehensive Breakdown & Mapping Matrix

Every single line of code and all 63 functions will be migrated with zero functionality lost:

| Module / Area | Functions & Elements Covered | Source Lines in `index.html` | Target Destination |
| :--- | :--- | :--- | :--- |
| **HTML UI Shell** | Form inputs, Test checkboxes, Action buttons, Preview container, Modals | L1–556 | `index.html` |
| **Design Tokens & Base CSS** | CSS variables, resets, layout container, header, logo | L2934–3100 | `assets/css/variables.css`, `assets/css/base.css` |
| **Component Styles** | Forms, tests, inputs, costs, tubes, badges, modals, stats | L3101–4250 | `assets/css/components/*.css`, `assets/css/modals.css` |
| **Print & PDF Styles** | `@media print`, report table layout, page breaks, print headers | L4251–4470 | `assets/css/print.css` |
| **Constants & Ranges** | Reference values, unit lists, default prices | L558–573, L1675–1900 | `assets/js/config/test-constants.js`, `pricing-config.js` |
| **Date & ID Utilities** | `getTodayDate()`, `getCurrentMonthName()`, `formatTimeDifference()`, `formatDisplayDate()`, `generatePatientId()`, `isPatientIdExists()`, `validatePatientId()`, `checkDuplicatePatient()`, `autoUpdatePatientTitle()` | L574–723, L962–987 | `assets/js/utils/date-helpers.js`, `assets/js/utils/patient-id.js` |
| **Inventory State** | `getTubeCounts()`, `setTubeCounts()`, `decrementTube()`, `incrementTube()`, `getKitCounts()`, `setKitCounts()`, `decrementKits()`, `incrementKits()`, `adjustKitsForEdit()`, `initializeKitInventory()`, `updateTubeInventoryWithPassword()` | L731–879, L2900–2932 | `assets/js/state/inventory-state.js` |
| **Calculators** | `calculateCBCParameters()`, `calculateIndirectBilirubin()`, `updateSuggestedCost()`, `getTodayTotal()`, `getTodayCashTotal()`, `getTodayOnlineTotal()` | L898–961, L1008–1095 | `assets/js/calculators/cbc-calculator.js`, `assets/js/calculators/cost-calculator.js` |
| **Report Generation** | `createReportHTML()`, `generateReport()`, `updateReport()`, `toggleGenerateUpdateButton()`, `showReport()` | L880–897, L1500–2014, L2269–2283 | `assets/js/services/report-builder.js` |
| **PDF & Print** | `saveAsPDF()`, window print actions | L2015–2041 | `assets/js/services/pdf-service.js` |
| **History & Storage** | `saveToHistory()`, `loadHistory()`, `showHistory()`, `addHistoryItemEventListeners()`, `editReportCost()`, `loadReportForEditing()`, `deleteReport()` | L1141–1271, L2042–2096, L2409–2570 | `assets/js/services/history-service.js`, `assets/js/state/storage.js` |
| **Search & Filtering** | `showAdvancedSearch()`, `applyAdvancedSearch()`, `resetAdvancedSearch()`, `closeAdvancedSearch()`, `applyAdvancedFilters()`, `updateSearchSummary()`, `getActiveFilters()`, `removeFilter()`, `setupQuickFilters()`, `setActiveQuickFilter()`, `setupSearchFunctionality()` | L1104–1140, L2097–2268, L2284–2408 | `assets/js/services/search-service.js` |
| **Statistics & Metrics** | `calculateSearchStatistics()`, `getMonthlyTestStats()`, `updateTestStats()`, `hideZeroTodayTests()`, `updateTodayReportCount()`, `showStatistics()` | L724–730, L2571–2899 | `assets/js/services/stats-service.js` |
| **App Lifecycle & Events** | `DOMContentLoaded` initialization, test input toggling (`toggleTestInputs`), dynamic subtype visibility, form reset | L988–1007, L1272–1499, L2930–2933 | `assets/js/app.js` |

---

## 4. Phased Implementation Roadmap

1. **Phase 1: Stylesheet Extraction & Design System**
   - Create `assets/css/` directory hierarchy.
   - Extract design variables, typography, component rules, modals, and print media queries into separate modular `.css` files.
   - Link `assets/css/style.css` in `index.html` and verify identical visual styling.

2. **Phase 2: Configuration & Utility Modules**
   - Extract test metadata, normal ranges, and pricing constants to `config/`.
   - Extract date formatters, ID generators, and CBC calculation formulas into pure, unit-testable modules.

3. **Phase 3: State & Core Services Extraction**
   - Implement storage, inventory state, report builder, search filters, and statistics calculation services.
   - Ensure backward compatibility with existing `localStorage` keys (`patientHistory`, `todayTubeCount`, `kitInventory`, etc.).

4. **Phase 4: HTML Cleanup & App Entrypoint**
   - Clean up `index.html` by removing inline script & style blocks.
   - Wire up `assets/js/app.js` with ES module imports or clean namespace orchestration.
   - Verify every user action: Report Generation, PDF Download, Editing, Duplicate Detection, History Search, Statistics, and Inventory Updates.
