# Bug Report — Shams Health Care Lab System

> Repo: `doforgain/clinic_lab` — Zero-Build Vanilla HTML/CSS/JS + Supabase  
> Date: 2026-10-12 (updated: 2026-10-12)  
> Scope: `assets/js/*` (modules + `bundle.js`), `assets/css/*`, `*.html`, `AGENTS.md` vs code, `README.md` vs code  
> Method: manual source review + cross-file diff (modules vs bundle), verified file:line evidence  
> Runtime: **`bundle.js` is the sole runtime** — source modules are reference-only (see B05)

## Methodology

- All bugs cross-verified against live codebase files (not just line-number assumptions).
- `grep` searches confirmed presence/absence of patterns (`is_deleted`, `deletedReportIds`, `clinicInvoices`, `app.js`, `@page` in invoice.css).
- Distinction drawn between **bundle.js** (live runtime) and **source modules** (reference-only, not loaded by any HTML page).
- Severity levels: **Critical** = data breach / patient safety / data loss. **Major** = functional breakage / data corruption risk. **Minor** = code hygiene / standards drift.

---

## Severity Summary

| ID | Title | Severity | Verified |
|----|-------|----------|----------|
| B01 | Supabase anon key exposed + open RLS (public PHI read/write) | Critical | ✅ |
| B02 | Stored XSS via `innerHTML` with patient data (persisted to Supabase & localStorage) | Critical | ✅ |
| B03 | Tombstone sync documented but not implemented — deletes resurrect, offline writes lost | Critical | ✅ (corrected) |
| B04 | Client-only auth, hardcoded PINs/passwords + forgeable session flag | Critical | ✅ (corrected) |
| B05 | `bundle.js` vs source modules drift + dead `app.js` entrypoint (all 3 cloud sync write hooks missing in source) | Critical | ✅ (expanded) |
| B06 | Clinical range logic bugs (`isAbnormalByRange`, `refRangeFor`, `crpTier`, `isWidalPositive`, combo pricing) | Major | ✅ |
| B07 | Print `@page` margins, `width: 21cm` clip, `position: absolute` page-break lock, & fixed footer collision | Major | ✅ (expanded) |
| B08 | `localStorage` fragility, key drift, serial/ID collisions, unbounded growth | Major | ✅ |
| B09 | CSS inline styles, responsive gaps, accessibility gaps, doc drift | Minor | ✅ (corrected) |
| B10 | PHI in console logs + dead code/duplicated logic | Minor | ✅ |
| B11 | Docs vs code contradictions (auth gates, keys, service list, CSS chain) | Minor | ✅ |
| B12 | Multi-tab Supabase Realtime race condition & local storage clobbering | Major | ✅ |
| B13 | Invoice system ephemeral — zero persistence, zero cloud sync | Major | ✅ (corrected) |
| B14 | Duplicate script loads & offline PDF export vulnerability (`html2pdf` CDN dependency) | Minor | ✅ |
| B15 | Dead single-page app (SPA) tab switching relics post-multipage migration | Minor | ✅ |
| B16 | `saveHistoryData` unguarded — `QuotaExceededError` crashes app | Major | ✅ |
| B17 | Realtime channel never unsubscribed — connection leak risk | Minor | ✅ |
| B18 | Platelet count severe distortion in `formatPlateletValue()` (critical thrombocytopenia turned to extreme high) | Critical | ✅ (new) |
| B19 | Uncaught `TypeError` in date parsing & search (`split` / `toLowerCase` on null/undefined) | Major | ✅ (new) |
| B20 | `editReportCost` updates metadata but leaves rendered `reportHTML` stale | Major | ✅ (new) |
| B21 | Consumable inventory zero-stock infinite `prompt()` blocking loop & zero cloud sync | Major | ✅ (new) |
| B22 | Floating-point precision rounding glitches in daily collection totals | Minor | ✅ (new) |
| B23 | Invoice page event listener accumulation memory leak on re-render | Minor | ✅ (new) |

---

## B01 — Supabase anon key exposed + open RLS [Critical]

**Location:**
- `assets/js/config/supabase-config.js:1-4`
- `assets/js/bundle.js:183-186`
- `README.md:222-240` (schema + RLS policy)
- `assets/js/state/storage.js:52-86,102-105,159-164`

**Evidence:**
```js
// assets/js/config/supabase-config.js:1-4
url: 'https://ufiquhjvlcqvfamdhxin.supabase.co',
anonKey: 'sb_publishable_UJnX0-JZIlGfKMpwT2Q5_Q_tiTzL6Yd'
```
```sql
-- README.md:232-240
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for clinic app"
    ON public.lab_reports FOR ALL USING (true) WITH CHECK (true);
```
```js
// assets/js/state/storage.js:52-86
const client = getSupabaseClient(); // anon client directly, never signs in
await client.from('lab_reports').upsert({...});
```

**Deep dive:**
1. Anon key exposure is standard for Supabase by design. The fatal combination is open RLS with `USING(true) WITH CHECK(true)` without user authentication.
2. Schema drift: Code upserts `{id, serial, patient_id, patient_name, reported_date, data}` (`storage.js:56-63`), while `README.md:222-230` documents `{id TEXT, patient_id, patient_name, created_at, updated_at, report_data JSONB, is_deleted BOOLEAN}`. Pull does `select('data')` (`storage.js:104`) and ignores `is_deleted`.
3. Supabase Realtime `.channel('public:lab_reports').on('postgres_changes', ...)` (`storage.js:159-164`) broadcasts patient record changes over unauthenticated WebSockets to anyone holding the publishable key.

**Reproduction:**
1. Open DevTools → copy Supabase URL and anon key from `supabase-config.js`.
2. From curl or Postman: `curl -H "apikey: <anonKey>" "https://ufiquhjvlcqvfamdhxin.supabase.co/rest/v1/lab_reports?select=*"`
3. Observe complete unauthenticated patient database dump. `POST`, `PATCH`, and `DELETE` requests succeed identically.

**Impact:** Complete PHI breach, unauthorized report tampering, silent data corruption due to schema column mismatches.

**Fix (Architecture-Aware for Offline / Zero-Build Clinics):**
- Implement a **Dual-Mode Security Model**:
  - *Local Mode*: Local report creation, printing, and localStorage operations remain functional offline on `file:///` without requiring external login.
  - *Cloud Sync Mode*: Restrict Supabase table RLS to require valid authenticated credentials (e.g., Supabase Auth session or a clinic-specific bearer token).
- Align database columns between code and schema (`data` vs `report_data`, add `is_deleted` filter on queries).
- Rotate the exposed anon key after updating RLS policies in the Supabase Dashboard.

---

## B02 — Stored XSS via `innerHTML` with patient data [Critical]

**Location (sources + sinks):**
- Sources: `assets/js/services/report-builder.js:64-98,169,204,231,244,253,276,302-304,335,359`
- Sinks: `assets/js/ui/form-ui.js:106` (`reportOut.innerHTML = item.reportHTML`), `assets/js/services/report-actions.js:32` (same)
- Secondary sinks: `assets/js/services/history-service.js:107-127`, `assets/js/services/search-service.js:89,92-111`, `assets/js/state/storage.js:44-45`

**Evidence:**
```js
// report-builder.js:64-98 — raw interpolation without escaping
`${cleanPatientName}, ${guardianName}, ${ageGenderStr}, ${patientId}, ${patientPhone}, ${patientCity}, ${referredBy}`

// history-service.js:107-127
`${item.patientName}, ${item.patientAge}, ... ${item.testCost}, ${item.paymentMode}`

// search-service.js:89 (Reflected XSS)
`${filter.label}: ${filter.value}` // filter.value contains raw searchTerm

// Direct Sinks:
reportOut.innerHTML = item.reportHTML; // form-ui.js:106, report-actions.js:32
```

**Deep dive:**
1. Patient inputs are directly interpolated into HTML strings. Because `reportHTML` is stored in `localStorage` (`labReportsHistory`) and Supabase JSONB (`data`), an injected payload persists across reloads and syncs to other clinic workstations.
2. Zero input sanitization or output escaping exists in the codebase (no native `escapeHtml`, no DOMPurify, no `textContent` usage for dynamic patient fields).
3. Reflected XSS exists in search: `search-service.js:89` injects raw `searchTerm` into filter badge HTML.

**Reproduction:**
1. Create a report with Patient Name: `<img src=x onerror=alert(document.domain)>`.
2. Click Preview or Save to History. The script executes immediately.
3. If cloud sync is active, opening History on another clinic device triggers the script remotely (Stored XSS).

**Impact:** Session hijacking (`shc_auth_session` theft), patient data exfiltration, UI defacement.

**Fix:**
- Add a tiny, zero-dependency `escapeHtml()` utility to `assets/js/utils/dom-helpers.js` and `assets/js/bundle.js`:
  ```javascript
  export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  ```
- Escape every patient and test input field inside `report-builder.js` and `history-service.js`.
- Escape `filter.value` in `search-service.js:89`.

---

## B03 — Tombstone sync documented but not implemented [Critical]

**Location:**
- Docs: `AGENTS.md:69` (`is_deleted: true` + `deletedReportIds`), `README.md:229` (`is_deleted BOOLEAN`)
- Code: `assets/js/services/history-service.js:319-331`, `assets/js/state/storage.js:74-86,88,99,116-136,146,159-164`

**Evidence:**
```js
// history-service.js:319-331 — local deletion only (source module)
historyData = historyData.filter(item => item.id !== id);
saveHistoryData(historyData); // Source module never calls deleteReportFromCloud!

// bundle.js:2150-2163 — RUNTIME deletion (bundle DOES call cloud delete)
history = history.filter(item => item.id !== parseInt(id));
saveHistoryData(history);
deleteReportFromCloud(id); // ← Called here, but missing from source module (B05 drift!)

// storage.js:74-86 — hard-delete with integer overflow bug
export async function deleteReportFromCloud(id) {
  await client.from('lab_reports').delete().eq('id', parseInt(id));
}

// storage.js:116-131 — pull clobbers local deletions
cloudReports = data.map(row => row.data).filter(Boolean);
localStorage.setItem(HISTORY, JSON.stringify(cloudReports)); // Deleted records resurrected!
```

> **Correction from original report**: `deleteReportFromCloud` is NOT orphaned — `bundle.js:2160` calls it. However, the **source module** `history-service.js:319-331` is missing this call (a B05 drift bug). The tombstone and resurrection issues remain fully valid.

**Deep dive:**
1. **Missing Tombstones**: Neither `is_deleted: true` nor `deletedReportIds` exists anywhere in `assets/js/`. The claim in `AGENTS.md §2.4` is aspirational documentation.
2. **Postgres Overflow & Type Coercion Bug**: In `deleteReportFromCloud`, `.eq('id', parseInt(id))` attempts to cast `Date.now()` (~`1740000000000`) into a 32-bit integer. PostgreSQL `INTEGER` max is `2,147,483,647`, causing integer overflow. Furthermore, if `id` is `TEXT` (as documented in `README.md:223`), querying with an integer literal fails PostgREST type matching.
3. **Record Resurrection**: When a report is deleted locally, `deleteReportFromCloud` hard-deletes it from Supabase. But if the Supabase delete fails (overflow, network error), the next `syncReportsFromCloud` fetches all rows (including the un-deleted record) and writes them back to `localStorage`, resurrecting the deleted report.
4. **Offline Write Clobbering**: In `storage.js:124`, `localReports.filter(r => r && r._synced === false)` is intended to protect un-synced offline records, but `saveHistoryData` never sets `_synced = false`, so offline additions are wiped when cloud sync runs.

**Reproduction:**
1. Device A: Create a report → Report syncs to Supabase.
2. Device A: Delete the report from History. The report disappears locally.
3. Device A: If cloud delete failed (integer overflow), refresh page or trigger cloud sync → The deleted report reappears in History.

**Impact:** Deleted medical records cannot stay deleted; multi-device data desynchronization; offline records lost.

**Fix:**
- Implement tombstone soft-deletes:
  - When deleting, set `is_deleted = true`, save tombstone in localStorage `deletedReportIds`.
  - Upsert `{ id: String(id), is_deleted: true }` to Supabase.
  - In `syncReportsFromCloud`, filter `.eq('is_deleted', false)` and prune locally known tombstones.
- Standardize `id` as `String` / `TEXT` everywhere (drop `parseInt(id)`).
- Flag unsynced local records with `_synced: false` on save, and clear flag upon successful cloud upsert.

---

## B04 — Client-only auth, hardcoded secrets + forgeable session [Critical]

**Location:**
- `assets/js/config/auth-config.js:4-16`
- `assets/js/bundle.js:13-25`
- `index.html:577-580,625-632`
- Gated pages: `dashboard.html:10`, `create-report.html:11`, `history.html:10`, `statistics.html:10`, `invoice.html:10`

**Evidence:**
```js
// assets/js/config/auth-config.js:4-16
export const STAFF_USERNAME = 'staff124';
export const STAFF_PASSWORD = 'admin124';
export const LOGIN_PASSWORD = '9211';
export const COLLECTION_PASSWORD = 'admin1';
export const INVENTORYUPDATE_PASSWORD = '9211';

// index.html:625-632
if (u === STAFF_USERNAME && p === STAFF_PASSWORD) {
    sessionStorage.setItem('shc_auth_session', JSON.stringify({ user: STAFF_USERNAME, role: 'staff', loginAt: Date.now() }));
    window.location.href = 'dashboard.html';
}

// Protected pages:
if (!sessionStorage.getItem('shc_auth_session')) {
    window.location.href = 'index.html?auth_required=true';
}
```

**Deep dive:**
1. **Client-Side Obfuscation Only**: All passwords and PINs are hardcoded in client JavaScript. Anyone inspecting page source or opening DevTools can see them immediately.
2. **Forgeable Session**: The gate only checks `if (!sessionStorage.getItem('shc_auth_session'))`. Running `sessionStorage.setItem('shc_auth_session', '1')` in the DevTools console unlocks all gated pages without a login.
3. **Architectural Realism (`file:///` vs Server)**:
   - In a zero-build client app running offline on `file:///`, true cryptographic server-side auth cannot exist without a backend or internet access.
   - For offline single-workstation clinic use, client PINs provide an **operational privacy layer** to prevent patients and walk-ins from viewing records over the counter.
   - However, claiming this is secure authentication in docs creates a false sense of security.
4. **Unused Primary Credential**: `LOGIN_PASSWORD` (`'9211'`) in `auth-config.js:8` has no external imports or reads in the codebase. `VIEW_PASSWORD` and `UPDATE_PASSWORD` at lines 15-16 are consolidation aliases (pointing to `HISTORY_PASSWORD` and `INVENTORYUPDATE_PASSWORD` respectively) — they were created intentionally for future use but currently have zero consumers outside the file itself.

**Reproduction:**
1. Open `history.html` in a browser. It redirects to `index.html`.
2. Open DevTools Console on `index.html` → execute `sessionStorage.setItem('shc_auth_session', 'true')`.
3. Navigate directly to `history.html` or `dashboard.html`. All protected views and patient records load immediately.

**Impact:** False assumption of PHI security; trivial bypass by anyone with physical browser access.

**Fix:**
- Clearly document in `AGENTS.md` and `README.md` that client-side PINs are **UI operational locks**, not server security boundaries.
- Deduplicate credentials: Remove inline `STAFF_*` re-definitions in `index.html:577-578` and import from `auth-config.js`. Remove dead `LOGIN_PASSWORD` constant. Keep `VIEW_PASSWORD`/`UPDATE_PASSWORD` aliases only if actively migrating call sites; otherwise remove.
- For multi-user or hosted cloud deployments, gate remote Supabase operations through Supabase Auth users.

---

## B05 — Bundle vs modules drift + dead `app.js` entrypoint [Critical regression risk]

**Location:**
- `assets/js/bundle.js` (3,334 lines IIFE)
- `assets/js/app.js:1-496` (outdated modular entrypoint)
- `assets/js/services/history-service.js:84-88,216-227,319-331` vs `bundle.js:1920,2056,2160`
- `assets/js/state/storage.js:89,138-140` vs `bundle.js:317-324,3240-3331`
- `assets/js/services/invoice-service.js` vs `bundle.js:2923-3230`

**Evidence:**
- `app.js` only handles 4 page branches and completely lacks the invoice page and dashboard initialization routines. `bundle.js:3240-3331` handles 6 branches (`history`, `statistics`, `invoice`, `dashboard`, `index`, and `create-report`).
- Source `storage.js:89` defines `syncReportsFromCloud(callbacks = {}, retryCount = 0)` with dynamic callbacks, while `bundle.js` hardcodes callback executions (`loadHistory()`, `updateTodayReportCount()`).
- Source functions in `invoice-service.js` (`recalculateFromTable`, `reindexRows`) were renamed in `bundle.js` (`recalculateInvoiceFromTable`, `reindexInvoiceRows`).
- Grepping `<script>` tags across all HTML files reveals zero references to `app.js`. Every page loads `assets/js/bundle.js`.
- **Critical Cloud Sync Drift (All 3 Write Hooks Missing in Source)**:
  1. **Create Report**: `bundle.js:1920` calls `syncReportToCloud(historyItem)`, but source `history-service.js:84` does NOT import or call `syncReportToCloud`.
  2. **Edit Cost**: `bundle.js:2056` calls `syncReportToCloud(history[index])`, but source `history-service.js:223` omits this completely.
  3. **Delete Report**: `bundle.js:2160` calls `deleteReportFromCloud(id)`, but source `history-service.js:329` omits this call.

**Impact:** If a developer rebuilds `bundle.js` from the ES6 source modules, **all Supabase cloud synchronization for create, update, and delete silently dies**. In addition, developers editing modular files under `assets/js/` find their changes have zero effect on the running application unless they also manually patch `bundle.js`.

**Fix:**
- Back-port all 3 cloud sync calls from `bundle.js` into `history-service.js`:
  - `syncReportToCloud(historyItem)` into `saveToHistory()` (`history-service.js:85`)
  - `syncReportToCloud(history[index])` into `editReportCost()` (`history-service.js:223`)
  - `deleteReportFromCloud(id)` into `deleteReport()` (`history-service.js:329`)
- Add a lightweight bundling script (`scripts/build-bundle.js` runnable via native `node scripts/build-bundle.js`), OR formally deprecate `app.js` in `AGENTS.md §2.2` and document `bundle.js` as the canonical edited file.

---

## B06 — Clinical range logic bugs [Major]

**Location:**
- `assets/js/config/test-constants.js:32-69`
- `assets/js/bundle.js:55-86`
- Callers: `assets/js/services/report-builder.js:160-168,192,302-304,323`

**Evidence:**
```js
// test-constants.js:65-69
export function isAbnormalByRange(value, rangeStr) {
  const [min, max] = rangeStr.split('-').map(Number);
  const v = parseFloat(value);
  return v < min || v > max;
}

// test-constants.js:60-63
export function refRangeFor(param, patientGender) {
  if (param.ref) return param.ref;
  return patientGender === 'Male' ? param.maleRef : param.femaleRef;
}

// test-constants.js:53-58
export function crpTier(numValue) {
  if (numValue < 10) return { statusClass: 'normal', refRange: '<10 (Normal)' };
  if (numValue < 20) return { statusClass: 'elevated', refRange: '10-20 (Elevated)' };
  if (numValue < 50) return { statusClass: 'high', refRange: '20-50 (High)' };
  return { statusClass: 'veryhigh', refRange: '>50 (Very High)' };
}

// test-constants.js:32-35
export function isWidalPositive(value) {
  if (!value) return false;
  return value.includes('1:160') || value.includes('1:320') || value.includes('1:640') || value.includes('1:1280');
}
```

**Deep dive per function:**
1. **`isAbnormalByRange`**: When `value` is non-numeric (e.g. `"abc"` or `""`), `parseFloat` yields `NaN`. Both `NaN < min` and `NaN > max` evaluate to `false`, causing invalid data to be flagged as **Normal**. If `rangeStr` is missing or undefined, `.split` throws an unhandled `TypeError`.
2. **`refRangeFor`**: Strict equality check `patientGender === 'Male'`. Any variation (`"male"`, `"M"`, `null`, `undefined`, or empty string) silently falls back to `femaleRef`. An unspecified gender defaults Hemoglobin reference to female (`12.0-15.0`) instead of male (`13.5-17.5`).
3. **`crpTier`**: If `numValue` is `NaN`, all `<` comparisons return `false`, flagging invalid inputs as `>50 (Very High)`. Additionally, exactly `50` returns `>50 (Very High)` despite label saying `>50`.
4. **`isWidalPositive`**: If `value` is passed as a number, `.includes()` throws a `TypeError`. Substring match also falsely matches `"1:1600"` as positive for `"1:160"`.
5. **Pricing Combo Bug**: In `pricing-config.js:26-30`, `computeSuggestedCost(t, false)` ignores `bilirubin`, `crp`, and `dengue` when combo tests are selected, resulting in undercharges on multi-panel bills.

**Reproduction:**
- Type `"abc"` into any CBC field → Result displays without an abnormal flag (falsely marked Normal).
- Leave Gender blank → Hemoglobin reference defaults to female range.
- Type `"abc"` into CRP input → Result displays as `>50 (Very High)`.

**Fix:**
- Guard `isAbnormalByRange` against `NaN`, empty strings, and missing `rangeStr`:
  ```javascript
  export function isAbnormalByRange(value, rangeStr) {
    if (!rangeStr || value === '' || value === null || value === undefined) return false;
    const v = parseFloat(value);
    if (Number.isNaN(v)) return false;
    const [min, max] = rangeStr.split('-').map(Number);
    return v < min || v > max;
  }
  ```
- Case-normalize `patientGender` (`String(patientGender).trim().toLowerCase() === 'male'`) with a unisex/fallback range.
- Guard `crpTier` against `Number.isNaN(numValue)`.
- Guard `isWidalPositive` by converting to string and matching exact titre tokens.

---

## B07 — Print `@page` margins, `width: 21cm` clip, `position: absolute` page-break lock, & fixed footer collision [Major]

**Location:**
- `assets/css/print.css:18-26,33-58,343-362`
- `assets/css/style.css:13-14`
- `AGENTS.md §3.1`

**Evidence:**
```css
/* print.css:33-36 — current */
@page { size: A4; margin: 0.1cm 0.8cm 1.1cm 0.8cm; }

/* AGENTS.md §3.1 — mandatory clinical standard */
@page { size: A4; margin: 10mm 12mm 15mm 12mm; }

/* print.css:38-41 */
body:not(.invoice-page-body) { width: 21cm; min-height: 29.7cm; }

/* print.css:18-26 & 46-58 — duplicated absolute position rules */
.report-output {
    position: absolute;
    left: 0; top: 0; width: 100%;
    padding: 0 4px 10px 4px;
}

/* print.css:344-362 — fixed footer */
.report-page-footer {
    position: fixed;
    bottom: 0; left: 0; right: 0; width: 100%;
    z-index: 9999;
}
```

> **Correction from original report**: The previously reported competing `@page` rule in `assets/css/components/invoice.css:673-676` does **not exist** — grep returned zero `@page` matches in that file. The rule was either already removed or the reference was wrong. The import-order risk (invoice.css after print.css in style.css) remains structurally risky for future additions but is not currently causing an `@page` cascade collision.

**Deep dive:**
1. **Printer Margins Violation**: Top margin of `0.1cm` (1mm) places the clinic header inside standard printer non-printable gripper zones, clipping headers on physical printers.
2. **Horizontal Clipping**: `width: 21cm` sets body width to the full physical paper width, ignoring left/right margins (21cm + 2 × 0.8cm > 21cm), causing right-edge clipping on print.
3. **Multi-Page Pagination Blocked by `position: absolute`**: `.report-output` is styled with `position: absolute`. In Chromium and WebKit print engines, an absolutely-positioned container suppresses natural CSS page fragmentation, clipping or dropping content that extends into a second page.
4. **Fixed Footer Overlap Collision**: `.report-page-footer` is fixed to the bottom of the page (`position: fixed; bottom: 0; z-index: 9999;`), but `.report-output` has only `10px` bottom padding. On multi-panel orders (e.g. CBC + Widal + Bilirubin), the compact disclaimer box and Dr. Shahid Khan's signature block overlap directly on top of the clinic footer text.
5. **Redundant CSS Rule**: `.report-output` is declared twice in `print.css` (lines 18-26 and lines 46-58) with conflicting padding values.

**Fix:**
- Update `print.css:33-36` to match `AGENTS.md §3.1`:
  ```css
  @page {
      size: A4 portrait;
      margin: 10mm 12mm 15mm 12mm;
  }
  ```
- Change `body:not(.invoice-page-body)` in `print.css` from `width: 21cm` to `width: 100%` or `width: auto`.
- Change `.report-output` from `position: absolute` to `position: relative` (or remove `position: absolute`) and deduplicate the rule.
- Increase `.report-output` bottom padding in print media to `20mm` (or add a footer spacer) to prevent disclaimer and signature collisions with the fixed bottom footer.

---

## B08 — Storage fragility, key drift, collisions [Major]

**Location:**
- `assets/js/state/storage.js:4-30`
- `assets/js/utils/patient-id.js:4-27,32-36`
- `assets/js/services/history-service.js:27,74-75,81,83`
- `assets/js/services/duplicate-service.js:14,19-24`

**Evidence:**
```js
// storage.js:14-21 is the only loader with try/catch:
try { return JSON.parse(localStorage.getItem(HISTORY)) || []; } catch(e) { ... }

// All other callers make unguarded JSON.parse calls that crash the page on corrupt data:
JSON.parse(localStorage.getItem('labReportsHistory')) // patient-id.js:8, patient-id.js:22, etc.

// Serial & ID generation:
serial: ++globalSerial; id: Date.now() // history-service.js:74-75
```

**Deep dive:**
1. **Unguarded Parse Calls**: If `localStorage` contains corrupt JSON or quota is exceeded, unguarded `JSON.parse` calls in `patient-id.js`, `duplicate-service.js`, and `cost-calculator.js` throw unhandled syntax errors that break UI rendering.
2. **ID & Serial Collisions**: `Date.now()` collides on rapid double-clicks or across multiple clinic workstations. `globalSerial` is incremented in memory without validating `Number.isFinite`, causing `NaN` propagation if `localStorage` key is altered.
3. **Unbounded Storage**: Reports store full pre-rendered HTML strings (~10KB each) inside `labReportsHistory`. Storing hundreds of reports triggers browser `QuotaExceededError` (typically 5MB limit).
4. **Duplicate Detection Crash**: In `duplicate-service.js:19-24`, calling `item.patientName.toLowerCase()` throws a fatal `TypeError` if `patientName` is `null` or `undefined`.

**Fix:**
- Route all reads through `loadHistoryData()`.
- Wrap all `localStorage.setItem` calls in `try/catch` and gracefully catch `QuotaExceededError` (see also B16).
- Generate IDs using `Date.now() + '-' + Math.random().toString(36).substr(2, 5)`.
- Add null-guards in `duplicate-service.js`.

---

## B09 — CSS/HTML hygiene [Minor]

**Location:**
- `assets/css/style.css:1-17`
- `create-report.html:8,73-312,515-517`
- `index.html:8,74,392-420,486-507`
- `history.html:109`, `invoice.html:96`

**Evidence & Findings:**
1. **Inline Styling**: ~25 inline `style="display: none;"` declarations in `create-report.html` should use the utility class `.is-hidden`. `index.html:402-420` contains a 9-property inline style block on the About card that belongs in `landing.css`.
2. **Accessibility**: Decorative icon and emoji `<span>` tags across navigation bars lack `aria-hidden="true"`.
3. **Responsive Breakpoint Gaps**: Grid layouts in `create-report.html` snap from multi-column to single-column abruptly at 768px with no intermediate tablet rules (769px–992px).
4. **CSS Import Order Documentation Drift**: `assets/css/style.css` imports `invoice.css` and `landing.css` which are not listed in the `AGENTS.md §2.3` documented chain. This is a documentation gap (also tracked in B11), not a functional CSS bug — but it creates risk for future `@page` or cascade conflicts.

**Fix:**
- Extract inline styles into CSS classes (use `.is-hidden` for `display: none`).
- Add `aria-hidden="true"` to decorative icon spans.
- Add tablet breakpoint rules (769px–992px) in `responsive.css`.
- Update `AGENTS.md §2.3` to reflect the actual import chain including `invoice.css` and `landing.css`.

---

## B10 — PHI in console logs + dead code/duplicated logic [Minor]

**Location:**
- Logs: `assets/js/services/history-service.js:85-86`, `assets/js/state/storage.js:18,65,70,82,84`, `assets/js/bundle.js:1921-1922`
- Dead code: `assets/js/config/auth-config.js:8`, `assets/js/calculators/cbc-calculator.js:4,71,84-96`, `assets/js/utils/dom-helpers.js:4`

**Evidence:**
```js
// history-service.js:85-86 — Logs full patient medical record into browser console:
console.log('Report saved to history:', historyItem);
```
- Realtime WebSocket updates log full payloads containing patient names and diagnostics.
- Dead functions: `calcIndirectBilirubin`, `absoluteCount`, `pcvFromRbcMcv`, `mchFromHbRbc`, `mchcFromHbPcv` in `cbc-calculator.js` are never called (DOM event handlers calculate values directly).
- `setDisplay` in `dom-helpers.js:4` is never called.

**Fix:**
- Remove all `console.log` statements outputting patient data and diagnostic payloads.
- Prune dead functions per Karpathy self-cleanup guidelines (`AGENTS.md §1.3`).

---

## B11 — Docs vs code contradictions [Minor]

| Document Claim | Code Reality | Resolution |
| :--- | :--- | :--- |
| `AGENTS.md §4`: History & Stats have Direct/Instant access, PIN None | `history.html:10-11` and `statistics.html:10-11` enforce `shc_auth_session` gate | Document `shc_auth_session` gate in `AGENTS.md` table |
| `AGENTS.md §2.4`: Keys `labReports, tubeCounts, kitInventory, globalSerial` | Actual keys are `labReportsHistory, globalHistorySerial, purpleTubeCount...` | Align `AGENTS.md` keys to `STORAGE_KEYS` in code |
| `AGENTS.md §2.2`: Source modules list omits invoice service | `assets/js/services/invoice-service.js` exists and is bundled | Add `invoice-service.js` to `AGENTS.md §2.2` |
| `AGENTS.md §2.3`: CSS chain omits `invoice.css` and `landing.css` | `style.css` imports both after documented chain | Update `AGENTS.md §2.3` to match actual import order |
| `app.js:2`, `bundle.js:2512`: Headers claim `Load via <script type="module">` | Application uses classic IIFE scripts on all pages | Remove stale `type="module"` header comments |

---

## B12 — Multi-tab Supabase Realtime race condition & local storage clobbering [Major]

**Location:**
- `assets/js/bundle.js:3250,3260,3270,3286,3309`
- `assets/js/state/storage.js:99-136,159-164`

**Evidence:**
```js
// storage.js:159-164 — Realtime subscription:
channel = client.channel('public:lab_reports')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports' }, payload => {
    syncReportsFromCloud();
  })
  .subscribe();

// storage.js:131 — Unconditional overwrite of localStorage:
localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(cloudReports));
```

**Deep dive:**
1. Every open tab (`dashboard.html`, `create-report.html`, `history.html`, `statistics.html`, `invoice.html`) opens an independent Supabase Realtime WebSocket channel.
2. When a report is saved or edited in Tab A, Supabase broadcasts the change. Tab B and Tab C immediately fire `syncReportsFromCloud()`.
3. In `storage.js:131`, `syncReportsFromCloud()` completely replaces `localStorage` with cloud rows. If a user is actively typing or editing in Tab B, any pending local updates are clobbered.
4. If multiple tabs execute `syncReportsFromCloud()` concurrently, `globalSerial` recalculation races across tabs, creating duplicate serials.

**Reproduction:**
1. Open `dashboard.html` in Tab 1 and `create-report.html` in Tab 2.
2. In Tab 2, generate and save a report.
3. Observe Tab 1 and Tab 2 simultaneously receiving the Realtime event and triggering duplicate background syncs, causing race conditions in `localStorage`.

**Fix:**
- Use a BroadcastChannel or a timestamped synchronization lock (`localStorage.getItem('shc_sync_lock')`) so only one active tab communicates with Realtime/Cloud at a time.
- Merge cloud changes with local records by ID and timestamp rather than performing a blind `localStorage.setItem` overwrite.

---

## B13 — Invoice system ephemeral — zero persistence, zero cloud sync [Major]

**Location:**
- `invoice.html:261-262`
- `assets/js/bundle.js:3264-3272`
- `assets/js/services/invoice-service.js:1-345`
- `assets/js/state/storage.js:52-169`

**Evidence:**
```js
// bundle.js:3264-3272 (invoice page DOMContentLoaded):
if (document.getElementById('invoiceSheet') && !document.getElementById('generateReport')) {
  initInvoicePage();
  bindModals();
  updateTodayReportCount();
  syncReportsFromCloud(); // Syncs lab reports only!
  initRealtimeSync();      // Listens to lab reports only!
  return;
}
```

> **Correction from original report**: The `clinicInvoices` localStorage key described in the original bug report **does not exist** anywhere in the codebase. Invoices are **not stored at all** — not in localStorage, not in Supabase. They are ephemeral rendered views generated on-the-fly from lab report data via `loadHistoryData()`. This is actually WORSE than the original description: there is zero persistence of any kind, not even local.

**Deep dive:**
1. `invoice.html` generates invoices transiently from lab report data. There is no invoice-specific storage — no `localStorage` key, no Supabase table.
2. `storage.js` only implements sync for `lab_reports`. The invoice page runs `syncReportsFromCloud()` and `initRealtimeSync()`, which download diagnostic lab reports that are used to populate invoice data on-the-fly.
3. Any invoice customizations (manual line-item edits, discounts, notes) are lost on page refresh.
4. If the underlying lab report is deleted, the invoice data source disappears entirely.

**Impact:** Invoice modifications are instantly lost on refresh; no billing audit trail exists; no cross-device invoice continuity.

**Fix:**
- **Option A (Full)**: Add an `invoices` table to Supabase, implement `syncInvoicesToCloud()` / `syncInvoicesFromCloud()` in `storage.js`, and persist invoice state to a `clinicInvoices` localStorage key.
- **Option B (Minimal)**: Accept invoices as ephemeral views derived from lab reports. Remove the misleading `syncReportsFromCloud()` and `initRealtimeSync()` calls from the invoice page entrypoint (they serve no invoice purpose). Document that invoices are stateless.

---

## B14 — Duplicate script loads & offline PDF export vulnerability [Minor]

**Location:**
- `create-report.html:8,515`
- `assets/js/services/pdf-service.js:1-35`

**Evidence:**
```html
<!-- create-report.html:8 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<!-- create-report.html:515 (Loaded again before </body>) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

**Deep dive:**
1. `create-report.html` loads `html2pdf.bundle.min.js` twice on every page load.
2. The library is fetched from an external CDN (`cdnjs.cloudflare.com`). When running in offline clinic mode via `file:///`, the script fails to load, breaking PDF generation.
3. Native `window.print()` works completely offline, but the primary UI button triggers `downloadPDF()`, which depends entirely on `html2pdf`.

**Fix:**
- Remove the duplicate `<script>` tag at line 8 in `create-report.html`.
- Add an offline fallback in `pdf-service.js`: if `window.html2pdf` is undefined, notify the user and invoke `window.print()` directly.
- Vendor `html2pdf.bundle.min.js` locally in `assets/js/vendor/` to satisfy the `file:///` offline dual-execution requirement.

---

## B15 — Dead SPA tab navigation code post-multipage migration [Minor]

**Location:**
- `assets/js/bundle.js:2706-2741,3313-3330`
- `assets/js/app.js:219-254,480-495`

**Evidence:**
```js
// bundle.js:2730-2736
function bindHeaderNavigation() {
  const navDash = document.getElementById('navDashboard');
  if (navDash && navDash.tagName === 'BUTTON') {
    navDash.addEventListener('click', showDashboardView);
  }
  const navCreate = document.getElementById('navCreateReport');
  if (navCreate && navCreate.tagName === 'BUTTON') {
    navCreate.addEventListener('click', showCreateReportView);
  }
}
```

**Deep dive:**
1. The app was originally a single-page app where tabs were switched via `<button>` elements toggling `.style.display = 'none' / 'grid'` on sections (`patient-info`, `test-selection`, etc.).
2. In recent refactoring, tabs were migrated to distinct HTML pages (`dashboard.html`, `create-report.html`) using standard `<a>` links.
3. Because `navDash.tagName` is now `'A'`, the checks evaluate to `false`, leaving `showCreateReportView()` and `showDashboardView()` unused dead code.
4. URL query param routing (`create-report.html?tab=dashboard`) calls `showDashboardView()` inside `create-report.html` instead of navigating to `dashboard.html`.

**Fix:**
- Remove dead single-page display toggling functions.
- Update query parameter handlers to redirect to the correct standalone pages.

---

## B16 — `saveHistoryData` unguarded — `QuotaExceededError` crashes app [Major] *(NEW)*

**Location:**
- `assets/js/state/storage.js:22-24`
- All callers: `history-service.js:84,223,328`, `bundle.js` equivalents

**Evidence:**
```js
// storage.js:22-24
export function saveHistoryData(history) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}
```

**Deep dive:**
1. `saveHistoryData()` has no `try/catch`. When `localStorage` reaches the browser quota limit (~5MB), `localStorage.setItem` throws a `DOMException: QuotaExceededError`.
2. This crashes the calling function mid-execution. If the crash occurs inside `saveToHistory()` (after serial increment but before return), the global serial is incremented but the report is not saved — causing a serial gap.
3. Reports store full pre-rendered HTML (~10KB each). At ~500 reports, the 5MB limit is hit.
4. Contrast with `loadHistoryData()` which properly has `try/catch` — the asymmetry means reads succeed but writes crash.

**Reproduction:**
1. Accumulate 400+ reports in history.
2. Generate a new report → `saveHistoryData()` throws `QuotaExceededError`, crashing the save flow.
3. The user sees no feedback — the report simply vanishes.

**Fix:**
```javascript
export function saveHistoryData(history) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider clearing old reports.');
      // Optionally trim oldest reports and retry
    }
    throw e; // Re-throw so callers know the save failed
  }
}
```

---

## B17 — Realtime channel never unsubscribed — connection leak risk [Minor] *(NEW)*

**Location:**
- `assets/js/state/storage.js:150-168`

**Evidence:**
```js
// storage.js:150-168
export function initRealtimeSync(callbacks = {}, retryCount = 0) {
  // ...
  client
    .channel('public:lab_reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports' }, () => {
      syncReportsFromCloud(callbacks);
    })
    .subscribe();
  // Channel reference is never stored, no unsubscribe function exported
}
```

**Deep dive:**
1. `initRealtimeSync()` creates a Supabase Realtime channel but never stores the subscription reference.
2. No `unsubscribe()` or `removeChannel()` function exists in the module.
3. In the current multi-page architecture, each page navigation destroys the JS context (full page load), so this doesn't actively leak in normal use.
4. However, if `initRealtimeSync()` were accidentally called multiple times on the same page (e.g., via retry logic or SPA-style modal navigation), duplicate channels would accumulate without cleanup.

**Fix:**
- Store the channel reference in a module-scoped variable.
- Guard against duplicate subscriptions:
```javascript
let _channel = null;
export function initRealtimeSync(callbacks = {}, retryCount = 0) {
  if (_channel) return; // Already subscribed
  const client = getSupabaseClient();
  if (!client) { /* retry logic */ return; }
  _channel = client
    .channel('public:lab_reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports' }, () => {
      syncReportsFromCloud(callbacks);
    })
    .subscribe();
}
```

---

## B18 — Platelet count severe distortion in `formatPlateletValue()` [Critical]

**Location:**
- `assets/js/calculators/cbc-calculator.js:60-68`
- `assets/js/bundle.js:654-662`
- Callers: `bundle.js:1529-1531,1897,2573`

**Evidence:**
```js
// cbc-calculator.js:60-68 and bundle.js:654-662
// If user typed without decimal (e.g. 145 -> 1.45, 83 -> 0.83, 250 -> 2.50)
if (num >= 10000) {
  return (num / 100000).toFixed(2);
} else if (num >= 10) {
  return (num / 100).toFixed(2);
} else if (num > 0) {
  return num.toFixed(2);
}
```

**Deep dive:**
1. **Critical Clinical Misinterpretation**: In haematology, standard adult platelet reference range is `1.50 - 4.50 lakhs/cumm` (150,000 – 450,000 cells/cumm). Lab analyzers output absolute counts.
2. If a patient with severe, life-threatening thrombocytopenia (common in Dengue hemorrhagic fever, ITP, chemotherapy) has a platelet count between `1,000` and `9,999` (e.g. `2,500` or `5,000` cells/cumm):
   - `num >= 10000` evaluates to `false`.
   - The code hits `else if (num >= 10) return (num / 100).toFixed(2);`.
   - An input of `5000` becomes **`50.00` lakhs/cumm** (`5000 / 100 = 50.00`)!
   - An input of `2500` becomes **`25.00` lakhs/cumm**!
3. The report prints `50.00 lakhs/cumm` (flagged as High / thrombocytosis) instead of `0.05 lakhs/cumm` (critical thrombocytopenia). A physician reading this report would believe the patient has excess platelets when they are actually at imminent risk of internal haemorrhage.

**Reproduction:**
1. On `create-report.html`, check CBC.
2. In Platelet Count input, type `5000` (5,000 /cumm) and blur the field.
3. Observe the field automatically transforming into `50.00` lakhs/cumm instead of `0.05` lakhs/cumm.

**Impact:** Direct threat to patient safety; clinical misdiagnosis and failure to administer urgent platelet transfusions.

**Fix:**
- Require 4+ digit numbers (>= 1,000) to divide by 100,000:
  ```javascript
  export function formatPlateletValue(val) {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str === '') return '';
    const num = parseFloat(str);
    if (isNaN(num)) return str;

    if (str.includes('.')) {
      if (str.endsWith('.')) return str + '0';
      return str;
    }

    if (num >= 1000) {
      return (num / 100000).toFixed(2);
    } else if (num >= 10) {
      return (num / 100).toFixed(2);
    } else if (num > 0) {
      return num.toFixed(2);
    }
    return str;
  }
  ```

---

## B19 — Uncaught `TypeError` in date parsing & search on null/undefined [Major]

**Location:**
- `assets/js/services/stats-service.js:49-50,171-172`
- `assets/js/bundle.js:940-941,1057-1058`
- `assets/js/services/search-service.js:52-56`
- `assets/js/bundle.js:1221`

**Evidence:**
```js
// stats-service.js:49-50 & 171-172:
const reportYear = parseInt(item.reportedDate.split('-')[0]);
const reportMonth = parseInt(item.reportedDate.split('-')[1]);

// search-service.js:52-56:
item.patientName.toLowerCase().includes(searchLower) ||
item.patientId.toLowerCase().includes(searchLower) ||
item.collectionDate.includes(filters.searchTerm) ||
item.reportedDate.includes(filters.searchTerm);
```

**Deep dive:**
1. `stats-service.js` unconditionally calls `.split('-')` on `item.reportedDate`. If any report in localStorage or cloud sync has `reportedDate: null`, `undefined`, or `""`, this throws an unhandled `TypeError: Cannot read properties of undefined (reading 'split')`.
2. Because `updateTestStats()` is invoked on page load across all pages (`dashboard.html`, `history.html`, `create-report.html`), a single corrupt or legacy item in history crashes the entire page execution.
3. In `search-service.js:52-56`, calling `.toLowerCase()` on `patientName` or `patientId` and `.includes()` on `collectionDate` or `reportedDate` throws a fatal `TypeError` if any of those properties are null or undefined, completely breaking search filtering.

**Reproduction:**
1. Manually add an entry to `labReportsHistory` with `reportedDate: ""` or missing.
2. Refresh `dashboard.html`.
3. The page fails to initialize with an uncaught `TypeError` in the console; test counters remain at 0.

**Fix:**
- Add null-safe fallbacks:
  ```javascript
  const dateStr = item.reportedDate || '';
  const parts = dateStr.split('-');
  const reportYear = parts.length >= 2 ? parseInt(parts[0]) : NaN;
  const reportMonth = parts.length >= 2 ? parseInt(parts[1]) : NaN;
  ```
- Use safe String conversions in search:
  ```javascript
  const pName = String(item.patientName || '').toLowerCase();
  const pId = String(item.patientId || '').toLowerCase();
  const cDate = String(item.collectionDate || '');
  const rDate = String(item.reportedDate || '');
  ```

---

## B20 — `editReportCost` updates metadata but leaves rendered `reportHTML` stale [Major]

**Location:**
- `assets/js/services/history-service.js:216-227`
- `assets/js/bundle.js:2048-2060`

**Evidence:**
```js
// bundle.js:2048-2060
function editReportCost(id) {
  const newCost = prompt('Enter new cost in rupees:', '');
  if (newCost !== null && !isNaN(parseFloat(newCost)) && newCost.trim() !== '') {
    let history = loadHistoryData();
    const index = history.findIndex(item => item.id === parseInt(id));
    if (index !== -1) {
      history[index].testCost = newCost; // Metadata updated
      saveHistoryData(history);
      syncReportToCloud(history[index]);
      loadHistory(); updateTodayTotal(); updateTodayReportCount(); updateTestStats();
      // Notice: history[index].reportHTML is NEVER updated!
    }
  }
}
```

**Deep dive:**
1. When a user clicks "Edit Cost" in Report History, only the `item.testCost` property is updated.
2. The pre-rendered HTML stored in `item.reportHTML` retains the original cost value generated at creation.
3. If staff or doctor opens Preview, prints the report, or clicks "Save PDF", the rendered document shows the **old price**, contradicting the amount shown in History and Statistics.

**Impact:** Inconsistent billing records; printed receipts/reports handed to patients show conflicting financial figures.

**Fix:**
- When editing report cost, update `item.reportHTML` to reflect the newly updated cost value, or re-render the snippet.

---

## B21 — Consumable inventory zero-stock infinite `prompt()` blocking loop & zero cloud sync [Major]

**Location:**
- `assets/js/state/inventory-state.js:66-85`
- `assets/js/bundle.js:497-511`
- `AGENTS.md §2.4` vs code

**Evidence:**
```js
// inventory-state.js:76-85
export function initializeTubeInventory() {
  const tubeCounts = getTubeCounts();
  if (tubeCounts.purple === 0 && tubeCounts.red === 0) {
    const purpleCount = prompt('Enter initial number of Purple (EDTA) tubes:', '100');
    const redCount = prompt('Enter initial number of Red (Plain) tubes:', '100');
    // ...
  }
}
```

**Deep dive:**
1. **Blocking Prompt Loop**: `initializeTubeInventory()` and `initializeKitInventory()` use `prompt()` dialogs whenever inventory counts equal 0. If a clinic consumes all tubes or kits (count naturally drops to 0), EVERY page load blocks with native browser popups asking for initial inventory quantities.
2. **Missing Cloud Sync**: `AGENTS.md §2.4` explicitly documents `tubeCounts` and `kitInventory` under "Cloud Sync & Persistence". However, in code (`storage.js` and `inventory-state.js`), tube and kit counts are stored ONLY in local `localStorage` keys (`purpleTubeCount`, `redTubeCount`, `typhoidKitCount`, `malariaKitCount`). There is zero Supabase table or synchronization logic for inventory. When multiple clinic devices are used, inventory counts quickly diverge.

**Fix:**
- Replace synchronous `prompt()` initialization with a one-time onboarding check flag (`localStorage.getItem('shc_inventory_initialized')`) so stock reaching 0 does not trigger prompts.
- Implement Supabase cloud sync for consumable inventory OR document inventory as workstation-local in `AGENTS.md`.

---

## B22 — Floating-point precision rounding glitches in daily collection totals [Minor]

**Location:**
- `assets/js/calculators/cost-calculator.js:9-17,36-54`
- `assets/js/bundle.js:745-753,769-786`

**Evidence:**
```js
// cost-calculator.js:9-17
function sumWhere(pred) {
  let total = 0;
  readHistory().forEach(item => {
    if (pred(item) && item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
      total += parseFloat(item.testCost);
    }
  });
  return total;
}

// cost-calculator.js:43
if (totalEl) totalEl.innerText = `₹${total}`; // e.g. ₹300.30000000000006
```

**Deep dive:**
1. Standard IEEE 754 binary floating point addition causes calculations like `200.1 + 100.2` to yield `300.30000000000006`.
2. While `stats-service.js:197` correctly formats monthly financial figures with `.toFixed(2)`, `cost-calculator.js` interpolates raw unrounded numbers directly into the DOM for `todayTotal`, `todayCashTotal`, `todayOnlineTotal`, and all corresponding dashboard overview cards.

**Fix:**
- Format all totals with `Math.round(total)` or `Number(total).toFixed(2)` before displaying in DOM.

---

## B23 — Invoice page event listener accumulation memory leak on re-render [Minor]

**Location:**
- `assets/js/services/invoice-service.js:191,195-245`
- `assets/js/bundle.js:3091,3095-3145`

**Evidence:**
```js
// invoice-service.js:191 & 195-204
export function renderInvoice(report) {
  // ...
  bindTableEvents(); // Called every time invoice renders or resets!
}

export function bindTableEvents() {
  const tbody = document.getElementById('invTableBody');
  tbody.addEventListener('input', function (e) { ... });
  tbody.addEventListener('click', function (e) { ... });
}
```

**Deep dive:**
1. `initInvoicePage()` wires up a Reset button (`#btnResetInvoice`) which triggers `renderInvoice(activeReport)`.
2. `renderInvoice()` unconditionally calls `bindTableEvents()`.
3. `bindTableEvents()` attaches anonymous event listeners to `tbody` without checking if listeners were already attached or removing prior listeners.
4. Each click on Reset adds duplicate event listeners. When an item is deleted or edited, the callback fires multiple times simultaneously.

**Fix:**
- Call `bindTableEvents()` once inside `initInvoicePage()`, rather than repeatedly inside `renderInvoice()`.

---

## Verification Notes

- All line numbers cross-verified against active repository files (`assets/js/bundle.js` at 3,334 lines, `assets/css/print.css` at 397 lines, `index.html` at 706 lines).
- Confirmed zero references to `app.js` across HTML entrypoints (`grep <script *.html`).
- Confirmed absence of tombstone sync (`grep is_deleted|deletedReportIds assets/js/` → zero results).
- Confirmed all three cloud sync write hooks (`saveToHistory`, `editReportCost`, `deleteReport`) call Supabase in `bundle.js:1920,2056,2160`, but are completely missing from `history-service.js`.
- Confirmed `formatPlateletValue` transforms 1,000–9,999 cells into 10–99 lakhs in `bundle.js:655-662` and `cbc-calculator.js:61-68`.
- Confirmed unhandled `reportedDate.split('-')` throws `TypeError` on missing/empty date in `stats-service.js:49,171` and `bundle.js:940,1057`.
- Confirmed `editReportCost` updates `item.testCost` but does not update `item.reportHTML` (`bundle.js:2048-2060`).
- Confirmed `initializeTubeInventory` invokes blocking `prompt()` popups when stock is 0 (`inventory-state.js:76-85`).
- Confirmed zero `@page` rules exist in `assets/css/components/invoice.css` (original B07 claim was false).
- Confirmed `clinicInvoices` localStorage key does not exist anywhere in codebase (original B13 mechanism was wrong).
- Confirmed `VIEW_PASSWORD` and `UPDATE_PASSWORD` are consolidation aliases, not orphaned dead code.
- Verified that all six pages use relative paths (`assets/css/style.css`, `assets/js/bundle.js`), maintaining `file:///` structural compatibility.

---

## Execution Plan — Bulletproof Fix Roadmap

```
Execution Architecture Flow
┌────────────────────────────────────────────────────────┐
│ Step 0: Source Parity & Bundling Foundation            │ ➔ Eliminates the dual-edit trap
├────────────────────────────────────────────────────────┤
│ Phase 1: Clinical Safety & Automated Test Harness      │ ➔ 100% verified via node test runner
├────────────────────────────────────────────────────────┤
│ Phase 2: Print & Layout Compliance                     │ ➔ A4 physical printer & pagination integrity
├────────────────────────────────────────────────────────┤
│ Phase 3: Storage Reliability & Backward Migration      │ ➔ Tombstones, Quota guards, legacy ID safety
├────────────────────────────────────────────────────────┤
│ Phase 4: Cloud Sync & Dual-Mode Supabase Security      │ ➔ RLS lockdown, offline local vs authenticated cloud
├────────────────────────────────────────────────────────┤
│ Phase 5: Code Hygiene & Dual-Execution Sign-Off Gate   │ ➔ Final zero-error file:/// & HTTP verification
└────────────────────────────────────────────────────────┘
```

---

### Step 0: Source Parity & Bundling Foundation *(Prerequisite — Eliminates Dual-Editing)*

> **Goal**: Stop the error-prone practice of manually editing both `bundle.js` (3,334 lines) and modular files (`assets/js/services/*`) in parallel. Establish a single source of truth before modifying core logic.

| Task | Bug | Files to Edit | Effort | Acceptance Criteria |
|------|-----|---------------|--------|---------------------|
| Back-port all 3 cloud sync write hooks into source module | B05 | `assets/js/services/history-service.js` | 20 min | `saveToHistory`, `editReportCost`, and `deleteReport` call Supabase sync directly in source module. |
| Create zero-dependency build script | B05 | `scripts/build-bundle.js` | 30 min | Running `node scripts/build-bundle.js` compiles ES6 modules into `bundle.js` in <1 second with zero build dependencies. |
| Deprecate `app.js` and document bundling flow | B05, B11 | `AGENTS.md §2.2` | 10 min | Clear instructions in docs for single-source editing. |

**Step 0 total: ~1 hour**

---

### Phase 1: Critical Safety, Clinical Accuracy & Automated Test Harness *(Zero offline impact, highest patient risk)*

| Task | Bug | Files to Edit | Effort | Acceptance Criteria |
|------|-----|---------------|--------|---------------------|
| Create automated clinical test runner | B06, B18, B19 | `scripts/test-clinical.js` | 45 min | Running `node scripts/test-clinical.js` asserts all clinical formulas, formatting, and null-guards automatically. |
| Fix platelet count threshold (`formatPlateletValue`) | B18 | `cbc-calculator.js`, `bundle.js` | 20 min | `5000` cells formats to `0.05` lakhs (not `50.00` lakhs); `145` formats to `1.45`. Verified by test runner. |
| Add `escapeHtml()` utility & neutralize XSS | B02 | `dom-helpers.js`, `report-builder.js`, `search-service.js`, `bundle.js` | 1.5 hr | Patient inputs with `<script>` or `<img onerror>` render as safe escaped text in preview, history, and search badges. |
| Guard `isAbnormalByRange` / `refRangeFor` / `crpTier` / `isWidalPositive` | B06 | `test-constants.js`, `bundle.js` | 45 min | Non-numeric `"abc"` returns `false` (no false Normal/Very High); blank gender falls back to unisex reference range. |
| Fix combo pricing rules for extra panels | B06 | `pricing-config.js`, `bundle.js` | 30 min | Combo + Bilirubin/CRP/Dengue correctly calculates cumulative cost instead of suppressing panel prices. |
| Null-guard date parsing and search filters | B19 | `stats-service.js`, `search-service.js`, `bundle.js` | 30 min | Missing or empty `reportedDate` / `patientName` / `patientId` never throws `TypeError`. |
| Remove PHI from console logs | B10 | `history-service.js`, `storage.js`, `bundle.js` | 15 min | No patient names, diagnoses, or record payloads logged to browser console. |

**Phase 1 Gate**: `node scripts/test-clinical.js` passes 100% of test assertions.  
**Phase 1 total: ~4.5 hours**

---

### Phase 2: Print & Layout Compliance *(A4 Physical Document & Pagination Integrity)*

| Task | Bug | Files to Edit | Effort | Acceptance Criteria |
|------|-----|---------------|--------|---------------------|
| Fix `@page` margins to AGENTS.md spec | B07 | `assets/css/print.css` | 10 min | `@page { margin: 10mm 12mm 15mm 12mm; }` — headers and doctor signature not clipped by printer margins. |
| Fix body width from `21cm` to `auto` | B07 | `assets/css/print.css` | 5 min | Content right edge does not clip horizontally on standard A4 portrait sheets. |
| Remove `position: absolute` from `.report-output` & add 20mm footer spacer | B07 | `assets/css/print.css` | 25 min | Multi-page tables break naturally across pages; disclaimer and signature blocks do not collide with fixed footer. |
| Deduplicate `.report-output` CSS rules | B07 | `assets/css/print.css` | 10 min | Single coherent `.report-output` media block in `print.css`. |
| Remove duplicate `html2pdf` script tag | B14 | `create-report.html` | 5 min | Single `<script>` tag at bottom of body. |
| Add offline PDF fallback | B14 | `pdf-service.js`, `bundle.js` | 20 min | When running offline (`file:///`) without internet, clicking "Download PDF" alerts user and invokes `window.print()`. |

**Phase 2 Gate**: Print preview of single-test and multi-test reports shows zero clipping, clean page breaks, and zero footer overlap.  
**Phase 2 total: ~1.25 hours**

---

### Phase 3: Storage Reliability & Backward-Compatible Data Migration *(Prevents data loss)*

| Task | Bug | Files to Edit | Effort | Acceptance Criteria |
|------|-----|---------------|--------|---------------------|
| Add backward-compatibility migration in `loadHistoryData()` | B03, B08 | `storage.js`, `bundle.js` | 30 min | Legacy numeric IDs (`Date.now()`) coerced to `String` on load so `item.id === id` lookups never fail. |
| Wrap `saveHistoryData` in try/catch for quota errors | B16 | `storage.js`, `bundle.js` | 20 min | Storage quota exceeded shows non-blocking user warning instead of crashing save flow. |
| Route all storage reads through `loadHistoryData()` | B08 | `patient-id.js`, `duplicate-service.js`, `cost-calculator.js`, `bundle.js` | 30 min | Corrupt or invalid JSON in `localStorage` never crashes page initialization. |
| Generate collision-safe IDs | B08 | `history-service.js`, `bundle.js` | 15 min | Generated IDs formatted as `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`. |
| Synchronize `reportHTML` when editing report cost | B20 | `history-service.js`, `bundle.js` | 30 min | Editing cost updates both `item.testCost` and re-renders cost in `item.reportHTML`. |
| Round financial totals in `cost-calculator` | B22 | `cost-calculator.js`, `bundle.js` | 15 min | Header badge and dashboard cards display rounded figures (e.g. `₹300.00`, never `₹300.30000000000006`). |
| Replace consumable `prompt()` loops with onboarding flag | B21 | `inventory-state.js`, `bundle.js` | 30 min | Reaching 0 inventory stock does not trigger blocking browser prompt popups on reload. |
| Implement tombstone soft-deletes | B03 | `storage.js`, `history-service.js`, `bundle.js` | 2 hr | Deletion records `is_deleted: true` and writes to `deletedReportIds`; deletes stay deleted after sync. |
| Guard duplicate Realtime channel subscriptions | B17 | `storage.js`, `bundle.js` | 15 min | Repeated calls to `initRealtimeSync()` reuse existing subscription. |
| Add multi-tab sync timestamp lock | B12 | `storage.js`, `bundle.js` | 1 hr | Two open tabs coordinate via `localStorage` lock; no race conditions or serial clobbering. |

**Phase 3 Gate**: Offline deletion persists after cloud reconnect; 500 reports stored without crash; legacy records load seamlessly.  
**Phase 3 total: ~6 hours**

---

### Phase 4: Cloud Sync & Dual-Mode Supabase Security *(Requires Supabase Dashboard access)*

| Task | Bug | Files to Edit | Effort | Acceptance Criteria |
|------|-----|---------------|--------|---------------------|
| Decide and implement invoice persistence model | B13 | `storage.js`, `invoice-service.js`, `bundle.js` | 1.5 hr | If Option A: `invoices` table created with sync. If Option B: invoices marked stateless and misleading sync calls removed. |
| Decide consumable inventory cloud sync model | B21 | `storage.js`, `AGENTS.md` | 45 min | Tube/kit counts synchronized to Supabase table or formally documented as local-only. |
| Tighten Supabase RLS policies | B01 | Supabase Dashboard SQL | 1 hr | Anonymous curl request returns 401; authenticated requests succeed. |
| Implement Dual-Mode Auth (Offline Local vs Cloud Sync) | B01, B04 | `supabase-config.js`, `storage.js`, `bundle.js` | 3 hr | Offline clinic workflow on `file:///` works 100% without login; cloud sync requires valid authenticated token. |
| Document client PINs as UI operational locks | B04 | `AGENTS.md §4`, `README.md` | 15 min | Documentation clearly states PINs are operational privacy locks, not cryptographic boundaries. |
| Remove dead `LOGIN_PASSWORD` constant | B04 | `auth-config.js`, `bundle.js` | 10 min | Dead credential exports removed from codebase. |
| Rotate exposed Supabase publishable key | B01 | Supabase Dashboard, `supabase-config.js`, `bundle.js` | 15 min | Old anon key revoked; new key deployed with tightened RLS. |

**Phase 4 Gate**: Direct API dump (`curl`) returns 401; clinic workstation operates normally offline on `file:///`.  
**Phase 4 total: ~7.5 hours**

---

### Phase 5: Code Hygiene & Dual-Execution Sign-Off Gate *(Low risk, technical debt cleanup)*

| Task | Bug | Files to Edit | Effort | Acceptance Criteria |
|------|-----|---------------|--------|---------------------|
| Clean up invoice table event listener accumulation | B23 | `invoice-service.js`, `bundle.js` | 15 min | `bindTableEvents` called once during page initialization; Reset does not multiply listeners. |
| Remove dead SPA tab-switching relics | B15 | `bundle.js`, `app.js` | 20 min | Dead button display-toggling functions removed from codebase. |
| Prune dead calculator stubs | B10 | `cbc-calculator.js`, `bundle.js` | 15 min | `calcIndirectBilirubin`, `absoluteCount`, etc. pruned per Karpathy self-cleanup rule. |
| Remove dead `setDisplay` helper | B10 | `dom-helpers.js`, `bundle.js` | 5 min | Dead helper pruned. |
| Align documentation (CSS chain, storage keys, auth gates) | B11 | `AGENTS.md` | 20 min | All tables and architecture sections in `AGENTS.md` accurately match codebase reality. |
| Extract inline styles to CSS utility classes | B09 | `create-report.html`, `index.html` | 30 min | Zero `style="display: none"` inline; `.is-hidden` utility used. |
| Add `aria-hidden="true"` to decorative icons | B09 | All HTML pages | 20 min | Accessibility standard met for screen readers. |
| Remove misleading `type="module"` comments | B11 | `bundle.js` headers | 5 min | Comments aligned to actual IIFE architecture. |

---

### Global Verification & Sign-Off Checklist

Before declaring the bug resolution complete, execute this 3-tier sign-off protocol:

1. **Automated Assertion Suite**:
   ```powershell
   node scripts/test-clinical.js
   ```
   *Requirement: 100% assertions pass (platelet formatting, XSS escaping, range comparisons, pricing combo calculations, date guards).*

2. **Offline `file:///` Dual-Execution Verification**:
   - Disconnect Wi-Fi / disable internet connection.
   - Double-click `index.html` via `file:///` in Google Chrome and Microsoft Edge.
   - Verify: Sign-in modal functions, Dashboard loads with `00` counters, Create Report creates and previews a full CBC + Dengue report, Print dialog opens with proper A4 margins and doctor signature, View History displays record, Statistics loads analytics.
   - Check DevTools Console: **Zero uncaught errors or network crash exceptions**.

3. **Cloud & Multi-Workstation Realtime Verification**:
   - Reconnect internet.
   - Open two tabs: Tab 1 (`dashboard.html`) and Tab 2 (`create-report.html`).
   - Create a report in Tab 2.
   - Verify Tab 1 updates counters in realtime without race conditions or overwriting local storage.
   - Delete report in Tab 1; refresh Tab 2; verify report remains deleted (tombstone sync verified).

---

## Total Estimated Effort

| Phase | Focus | Time | Risk if Skipped |
|-------|-------|------|-----------------|
| **Step 0** | Source Parity & Bundling Foundation | ~1.0 hr | 15+ hours wasted on manual dual-editing, guaranteed bundle drift |
| **Phase 1** | Safety, Clinical Accuracy & Test Harness | ~4.5 hr | Patient data breach, lethal platelet count misdiagnosis, app crash on dates |
| **Phase 2** | Print & Layout Compliance | ~1.25 hr | Clipped reports on physical printers, footer collisions |
| **Phase 3** | Storage & Data Reliability | ~6.0 hr | Data loss, resurrection of deleted records, stale report prints |
| **Phase 4** | Cloud Sync & Security | ~7.5 hr | Public PHI breach via API, unauthenticated database tampering |
| **Phase 5** | Code Hygiene & Sign-Off Protocol | ~2.0 hr | Technical debt accumulation, dual-execution compatibility breakage |
| **Total** | | **~22.25 hours** | |
