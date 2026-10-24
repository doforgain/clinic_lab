# 🤖 AGENTS.md — AI Agent Guidelines & Project Instructions

> **Project**: Shams Health Care — Laboratory Information & Report Management System  
> **Repository**: [doforgain/clinic_lab](https://github.com/doforgain/clinic_lab)  
> **Architecture**: Zero-Build Client-Side Web Application (Vanilla HTML5 / CSS3 / ES6+ JS) + Supabase Realtime Sync  
> **Audience**: AI Coding Agents (Antigravity, Cursor, Claude Code, Copilot, Codex)

---

## 🎯 1. Core Operating Principles (Karpathy & Ponytail Guidelines)

Every AI agent operating in this repository **must** adhere to these four foundational principles:

### 1.1 Think Before Coding
- **Surface Assumptions**: Explicitly state assumptions before proposing code. If any requirement is ambiguous, pause and ask the user rather than guessing.
- **Explain Trade-offs**: When multiple approaches exist, present them clearly with minimal cognitive load.
- **Understand Existing Code**: Trace data flow through the existing modules before proposing edits. Never rewrite code you haven't read.

### 1.2 Simplicity First (YAGNI & Ponytail)
- **Minimum Viable Code**: Write the shortest, cleanest code that solves the task. Avoid premature abstraction.
- **Native Platform First**: Prefer native browser APIs (DOM, standard CSS, modern JS ES6+) over new external dependencies.
- **Zero-Build Preservation**: **Do not** introduce build steps (Webpack, Vite, Babel) or Tailwind unless explicitly requested by the user. The application must retain its zero-install portability.
- **No Speculative Flexibility**: Do not build configurability, plugins, or helper abstractions for single-use scenarios.

### 1.3 Surgical Changes
- **Targeted Edits**: Only modify the lines strictly necessary to fulfill the request.
- **Preserve Existing Style**: Match existing indentation, naming conventions, and code structure.
- **Respect Comments & Docstrings**: Preserve existing comments, author notes, and line references.
- **Self-Cleanup**: Remove any variables, imports, or dead code created by your changes, but do not delete unrelated existing code unless asked.

### 1.4 Goal-Driven Verification
- **Clear Definition of Done**: Convert tasks into verifiable checks (e.g., "Verify that generating a CBC report reflects correct MCV indices and displays on preview").
- **Inspect DOM & Runtime**: Verify script execution, CSS styling across desktop and A4 print media, and console error logs.

---

## 🏗️ 2. Project Architecture & Runtime Model

### 2.1 Dual Execution Requirement
The application must execute reliably across two distinct environments:
1. **Local File Protocol (`file:///`)**: Double-clicking `index.html` without any local server.
2. **HTTP / Static Host**: Served via Python `http.server`, `npx serve`, Netlify, or Vercel.

> ⚠️ **Critical Rule**: Because the `file:///` protocol blocks ES6 dynamic module imports (`type="module"`) in many browsers due to CORS, production HTML entrypoints (`index.html`, `history.html`, `statistics.html`) load **`assets/js/bundle.js`**.

### 2.2 JavaScript Architecture
- **Source Modules (`assets/js/`)**: Structured into clean ES6 domain modules:
  - `calculators/`: `cbc-calculator.js`, `cost-calculator.js`
  - `config/`: `auth-config.js`, `pricing-config.js`, `supabase-config.js`, `test-constants.js`
  - `services/`: `duplicate-service.js`, `history-service.js`, `inventory-service.js`, `invoice-service.js`, `pdf-service.js`, `report-actions.js`, `report-builder.js`, `report-paginator.js`, `search-service.js`, `stats-service.js`
  - `state/`: `app-state.js`, `inventory-state.js`, `storage.js`
  - `ui/`: `form-ui.js`
  - `utils/`: `date-helpers.js`, `dom-helpers.js`, `patient-id.js`
  - `app.js`: Modular application orchestrator and page route initializers
- **Universal Runtime Bundle (`assets/js/bundle.js`)**:
  - Self-contained IIFE bundle combining all source modules above.
  - **Automated Compilation**: Run `node scripts/build-bundle.js` (zero dependencies, executes in <50ms via native Node.js).
  - **Development Mode**: Run `node scripts/build-bundle.js --watch` to automatically rebuild on file save.
  - **CI / Parity Check**: Run `node scripts/build-bundle.js --check` to verify that `bundle.js` is strictly in sync with source modules.
  - **Single Source of Truth**: Always edit the source modules under `assets/js/` and compile with `node scripts/build-bundle.js`. Never hand-edit `bundle.js` directly to prevent module drift.

### 2.3 CSS Modular Architecture
Aggregated by `assets/css/style.css` in strict dependency order:
```
variables.css ➔ base.css ➔ components/*.css ➔ modals.css ➔ print.css ➔ components/invoice.css ➔ responsive.css ➔ notifications.css ➔ components/landing.css
```
- Never write ad-hoc inline styles when an established CSS class exists.
- Global theme variables (colors, fonts, borders) are defined in `assets/css/variables.css`.

### 2.4 Cloud Sync & Persistence (`assets/js/state/storage.js`)
- **Dual-Mode Architecture**:
  - *Offline Local Mode*: Workstations running on `file:///` operate 100% offline using `localStorage` without requiring logins or cloud connectivity.
  - *Cloud Sync Mode*: Synchronizes `public.lab_reports` and `public.lab_inventory` stock when connected and authenticated to Supabase.
- **Primary Database**: Supabase PostgreSQL tables `public.lab_reports` and `public.lab_inventory` (with Row Level Security enabled).
- **Cloud-Synchronized Inventory**: Tube counts (`purpleTubeCount`, `redTubeCount`) and rapid test kits (`typhoidKitCount`, `malariaKitCount`, `dengueKitCount`) are authoritative in Supabase `public.lab_inventory` (singleton row `id = 1`, authenticated RLS, realtime broadcast); the `localStorage` keys serve as the offline cache with delta-aware reconnect flush (`offlineInventoryDeltas`). Modal recounts are online-only absolute resets (`9211` PIN); report consumption syncs write-through from the originating device only.
- **Stateless Invoice Views**: Invoices (`invoice.html`) are ephemeral printable documents rendered dynamically from `loadHistoryData()` records; line customizations are transient and not cloud-synced.
- **Tombstone Sync**: Deletions set `is_deleted: true` with a tombstone entry in localStorage (`deletedReportIds`) to guarantee deleted records stay deleted across all synchronized devices.

---

## 🖨️ 3. Clinical Master Report & Print Standards

### 3.1 A4 Print Constraints (`assets/css/print.css`)
- **Paper Dimensions**: Standard A4 (`210mm × 297mm`) in portrait orientation.
- **Fixed Page Margins**: Set specifically in `@page { size: A4; margin: 5mm; }`.
- **Page Footers**: Pinned to the report footer via CSS print media rules (`.report-page-footer` with contact metadata and divider).
- **Doctor Signature**: Authorized physician signature block for **Dr. Shahid Khan, MBBS** (`assets/images/signature.png` / `signature.svg`) right-aligned above the footer.
- **Color Preservation**: Print styles enforce `-webkit-print-color-adjust: exact;` and `print-color-adjust: exact;` so badges and alternating row shading render accurately.

---

## 🔒 4. Security & Access Control Reference

### 4.1 UI Operational Privacy Locks vs Cryptographic Boundaries
> ⚠️ **Important Security Model Notice**:  
> Client-side PINs (`admin1`, `9211`, `admin124`) are **UI operational privacy locks** designed for busy counter workstations to prevent walk-in patients or casual observers from viewing financial receipts and history over the counter. In a zero-build client app running on `file:///`, client PINs are not cryptographic boundaries.  
> True data protection for cloud synchronization is enforced at the database layer via **Supabase Row Level Security (RLS)** policies (`scripts/supabase-rls-setup.sql`), ensuring unauthenticated network requests cannot dump or tamper with patient health information.

| Feature | Access Level | Default PIN | Source Reference |
| :--- | :--- | :--- | :--- |
| **All Internal Pages** (`dashboard.html`, `create-report.html`, `history.html`, `statistics.html`, `invoice.html`) | Staff Session Gate | `STAFF_USERNAME` (`staff124`) / `STAFF_PASSWORD` (`admin124`) | `auth-config.js`, `index.html` (`shc_auth_session`) |
| **Report History Portal (`history.html`)** | Direct / Instant (Session-Gated) | *None* | `bundle.js` |
| **Statistics & Analytics (`statistics.html`)** | Direct / Instant (Session-Gated) | *None* | `bundle.js` |
| **Today's Collection (Privacy Toggle)** | UI Operational Privacy Lock | `admin1` | `auth-config.js` (`COLLECTION_PASSWORD`) |
| **Inventory Stock Quantity Updates** | UI Operational Privacy Lock | `9211` | `auth-config.js` (`INVENTORYUPDATE_PASSWORD`) |


---

## 🚦 5. Agent Boundaries & Guardrails

### ✅ Always Do
- Verify changes by reviewing rendered output or checking console logs.
- Keep `file:///` compatibility intact (avoid path assumptions requiring root `/`).
- Use relative paths (e.g., `assets/css/style.css`, not `/assets/css/style.css`).
- Test both screen preview mode and print media styling when modifying report templates.
- Update both the modular source file and `assets/js/bundle.js` when editing JavaScript.

### ⚠️ Ask First
- Modifying clinical diagnostic formulas or reference ranges (`CBC_PARAMS`, `WIDAL_CUTOFF`, `BILIRUBIN_REF`).
- Changing Supabase credentials or database table schemas.
- Removing or restructuring core patient fields in `index.html`.
- Adding any external third-party CDN libraries.

### ❌ Never Do
- Do not introduce a Node.js build pipeline (Webpack, Vite, Gulp, Rollup) without explicit instruction.
- Do not add Tailwind CSS or CSS-in-JS frameworks (use vanilla CSS).
- Do not delete or overwrite `reference/index.legacy.html` (maintained as an immutable reference baseline).
- Do not remove the doctor's signature or A4 page footer print rules.
- Do not delete localStorage keys without tombstone synchronization to Supabase.

---

## 🧰 6. Available Skills & When to Use Them

This repository has project-level skills installed under `.agents/skills/`:

| Skill | Purpose | When to Activate |
| :--- | :--- | :--- |
| **`karpathy-guidelines`** | Behavioral guardrails against common LLM coding pitfalls. | Writing, refactoring, or debugging code; ensures surgical edits and simplicity. |
| **`ponytail`** | Extreme simplicity & standard-library-first approach. | Simplifying over-engineered modules, eliminating boilerplate, keeping code minimal. |
| **`ponytail-review`** | Code review focused exclusively on cutting unnecessary complexity. | Reviewing diffs or PRs for over-engineering and unneeded abstractions. |
| **`frontend-design`** | Production-grade frontend aesthetics, CSS tokens, and layout craft. | Enhancing report preview cards, forms, typography, animations, or responsive UI. |
| **`supabase`** | Supabase database, RLS policies, and Realtime sync best practices. | Modifying cloud synchronization, database schemas, or query logic. |

---

## 📝 7. Commit Message Convention

Follow standard Conventional Commits format:
- `feat(scope)`: New user-facing feature (e.g., `feat(report): add new ESR reference calculation`)
- `fix(scope)`: Bug fix (e.g., `fix(sync): prevent duplicate report upload on reconnect`)
- `style(scope)`: CSS or visual layout adjustments (e.g., `style(print): adjust footer margin`)
- `refactor(scope)`: Code restructuring without functional change
- `docs(scope)`: Documentation updates
