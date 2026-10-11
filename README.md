# 🔬 SHAMS HEALTH CARE — Laboratory Information & Report Management System

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Modern-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Modular-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20Sync-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Print Ready](https://img.shields.io/badge/A4%20Print-Pixel%20Perfect-3cc4ad)](#-print--pdf-specifications)
[![License](https://img.shields.io/badge/License-Proprietary-gray)](#)

A modern, responsive, client-side web application and Laboratory Information System (LIS) developed for **Shams Health Care**. Designed to streamline routine clinical pathology workflows, generate standardized diagnostic test reports, manage laboratory inventory, track daily billing collections, and synchronize data in real-time across multiple clinic workstations via Supabase.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Supported Laboratory Investigations](#-supported-laboratory-investigations)
- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [Quick Start](#-quick-start)
- [Cloud Synchronization (Supabase)](#-cloud-synchronization-supabase)
- [Authentication & Access Control](#-authentication--access-control)
- [Print & PDF Specifications](#-print--pdf-specifications)
- [Browser Compatibility](#-browser-compatibility)

---

## ✨ Key Features

### 📋 Patient & Test Order Management
- **Automated Patient ID Generation**: Generates standardized IDs with instant duplicate detection and collision warnings.
- **Demographics Capture**: Patient prefix (`Mr.`, `Mrs.`, `Miss`, `Master`, `Baby`, `B/O`), relationship details (`S/O`, `W/O`, `D/O`, `C/O`), flexible age units (`Yrs`, `Months`, `Days`), gender, contact number, locality, and referring doctor.
- **Pre-analytical Metadata**: Tracks collection date, received date, reported date, and patient fasting status (`Random`, `Fasting`, `Post-Prandial`).

### 🧮 Automated Calculations & Validation
- **CBC Automated Indexing**: Automatically computes Absolute Neutrophils, Absolute Lymphocytes, Absolute Mid, and Erythrocyte Indices with gender-specific reference ranges.
- **Bilirubin Auto-calculation**: Computes Indirect Bilirubin dynamically (`Total - Direct`) with input boundaries.
- **Suggested Costing**: Auto-calculates bill amounts based on configured test rates upon test selection.

### 🖨️ Clinical Master Report & A4 Printing
- **Unified Master Table**: Combines multiple investigations into a cohesive diagnostic report with method badges, specimen types, and clear reference intervals.
- **Digital Physician Signature**: Built-in official doctor signature block (Dr. Shahid Khan, MBBS) automatically placed at the footer.
- **A4 Print Engine**: Dedicated print stylesheet (`print.css`) configured for exact A4 page breaks, pinned footers, clean page margins, and watermarked branding.
- **Client-Side PDF Export**: One-click PDF generation powered by `html2pdf.js`.

### ☁️ Real-Time Cloud Synchronization
- **Multi-Device Support**: Synchronizes patient reports across laboratory workstations, front desk, and consultation rooms using Supabase.
- **Offline Resilient**: Local-first storage (`localStorage`) with automatic background sync and reconnection handling.
- **Tombstone Sync**: Deletion events propagate across devices to prevent resurrected records.

### 💰 Cash & Daily Financial Tracking
- **Payment Method Split**: Categorizes billing between **Cash** and **Online** payments.
- **Privacy-Protected Collections**: Front-desk counter obfuscates collection figures behind a PIN-protected reveal toggle to preserve financial confidentiality.

### 📦 Inventory & Consumables Tracking
- **Phlebotomy Tube Monitoring**: Real-time stock counts for Purple (EDTA) and Red (Plain) tubes.
- **Rapid Kit Counter**: Tracks consumption of Typhoid and Malaria test kits.
- **PIN-Protected Inventory Restock**: Safeguards stock adjustment entries behind administrator passwords.

### 🔍 Historical Archive & Analytics
- **Fast Full-Text Search**: Filter by patient name, ID, date, or referring doctor.
- **Quick Filters**: Immediate 1-day, 7-day, 30-day, test-specific, and payment-type filters.
- **Multi-Parametric Advanced Search**: Filter by date intervals, cost limits, age ranges, gender, and specific test panels.
- **Dedicated Dashboard Pages**: Standalone dedicated views for Report History (`history.html`) and Monthly Statistics (`statistics.html`).

---

## 🧪 Supported Laboratory Investigations

| Test Panel | Parameters / Biomarkers | Specimen & Method |
| :--- | :--- | :--- |
| **Complete Blood Count (CBC)** | Hemoglobin, TLC, Neutrophils, Lymphocytes, Mid, Absolute Counts, RBC, PCV, MCV, MCH, MCHC, Platelet Count | EDTA Whole Blood &bull; Automated Hematology |
| **ESR** | Erythrocyte Sedimentation Rate (Westergren) | Whole Blood / Citrated &bull; Westergren Method |
| **Typhoid Rapid Test** | Qualitative (Negative / Positive) + Subtypes (`IgM`, `IgG`, `Both`) | Serum / Plasma &bull; Immunochromatography |
| **Dengue Antigen / Antibody** | Qualitative (Negative / Positive) | Serum / Plasma &bull; Rapid Cassette |
| **Malaria Parasite (MP)** | Qualitative (Negative / Positive) + Species (`Pf`, `Pv`, `Both`) | Whole Blood &bull; Rapid Antigen Detection |
| **Widal Agglutination** | O Antigen, H Antigen, AH Antigen, BH Antigen (Titers up to 1:1280) | Serum &bull; Slide / Tube Agglutination |
| **ABO & Rh Blood Grouping** | Blood Groups: A+, A-, B+, B-, AB+, AB-, O+, O- | Whole Blood &bull; Hemagglutination |
| **Bilirubin Profile** | Total Bilirubin, Direct Bilirubin, Indirect Bilirubin | Serum &bull; Spectrophotometric / Diazo |
| **C-Reactive Protein (CRP)** | Quantitative CRP (Normal `<10`, Elevated `10-20`, High `20-50`, Very High `>50`) | Serum &bull; Turbidimetric / Latex |

---

## 🏗️ System Architecture

The project is structured with clean separation of concerns, featuring an ES6 modular architecture bundled into a single zero-dependency runtime:

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                    │
│      index.html   │   history.html   │   statistics.html    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    CSS Component System                     │
│   variables.css ──► base.css ──► components/*.css ──► print │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Runtime                      │
│             assets/js/bundle.js (or modular app.js)         │
│  ┌─────────────────────────┐     ┌────────────────────────┐ │
│  │     UI / Controllers    │     │      Calculators       │ │
│  │   form-ui, report-actions│    │   cbc, cost-calculator │ │
│  └───────────┬─────────────┘     └───────────┬────────────┘ │
│              │                               │              │
│  ┌───────────▼─────────────┐     ┌───────────▼────────────┐ │
│  │        Services         │     │     State Management   │ │
│  │ history, inventory, pdf │     │  app-state, inventory  │ │
│  │ search, stats, builder  │     │   storage & sync engine│ │
│  └─────────────────────────┘     └───────────┬────────────┘ │
└──────────────────────────────────────────────┼──────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────┐
│                 Data Persistence & Cloud Sync               │
│        Local: Browser localStorage / sessionStorage         │
│        Cloud: Supabase Database (Realtime PostgreSQL)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
Lab/
├── index.html                   # Main diagnostic report generator interface
├── history.html                 # Standalone report history & record viewer
├── statistics.html              # Standalone statistical analytics & inventory page
├── reference/
│   └── index.legacy.html        # Monolithic legacy baseline
└── assets/
    ├── css/
    │   ├── style.css            # Stylesheet aggregator
    │   ├── variables.css        # Color tokens, fonts, and global themes
    │   ├── base.css             # Base reset, typography, and container layouts
    │   ├── modals.css           # Authentication and popup dialog styles
    │   ├── notifications.css    # Toast notifications and status indicators
    │   ├── print.css            # A4 page print media rules and footer pinning
    │   ├── responsive.css       # Mobile and tablet responsiveness
    │   └── components/
    │       ├── buttons.css          # Action buttons and interaction states
    │       ├── cost-inventory.css   # Billing cards and stock indicator widgets
    │       ├── history-search.css   # Search filters, tag badges, and list items
    │       ├── inventory.css        # Stock editing modal dialogs
    │       ├── report-preview.css   # Screen preview of the lab report
    │       ├── statistics.css       # Daily and monthly analytics cards
    │       └── test-selector.css    # Test checkboxes and dynamic input grids
    ├── js/
    │   ├── bundle.js            # Self-contained bundled application script
    │   ├── app.js               # ES6 modular entrypoint
    │   ├── calculators/
    │   │   ├── cbc-calculator.js    # Automated CBC formula calculations
    │   │   └── cost-calculator.js   # Suggested pricing and collection tally
    │   ├── config/
    │   │   ├── auth-config.js       # Administrative PIN codes and security keys
    │   │   ├── pricing-config.js    # Standard test pricing matrix
    │   │   ├── supabase-config.js   # Supabase client URL and publishable credentials
    │   │   └── test-constants.js    # Reference ranges, units, and test catalogs
    │   ├── services/
    │   │   ├── duplicate-service.js # Duplicate ID detection logic
    │   │   ├── history-service.js   # Report retrieval, editing, and archiving
    │   │   ├── inventory-service.js # Consumable deduction and restocking
    │   │   ├── pdf-service.js       # html2pdf export pipeline
    │   │   ├── report-actions.js    # Form serialization and report dispatch
    │   │   ├── report-builder.js    # HTML report generator with master table
    │   │   ├── search-service.js    # Multi-field search and query filtering
    │   │   └── stats-service.js     # Aggregate test counter calculations
    │   ├── state/
    │   │   ├── app-state.js         # Runtime preview and session flags
    │   │   ├── inventory-state.js   # Stock level getters and setters
    │   │   └── storage.js           # LocalStorage engine with Supabase cloud sync
    │   └── utils/
    │       ├── date-helpers.js      # Date formatting and period calculations
    │       ├── dom-helpers.js       # Element manipulation utilities
    │       └── patient-id.js        # Standardized alphanumeric patient ID generator
    └── images/
        ├── signature.png        # Official physician signature graphic
        └── signature.svg        # Scalable vector signature graphic
```

---

## 🚀 Quick Start

### Option 1: Direct File Execution (Zero Install)
This application requires no build step, compiler, or Node.js environment to run.
1. Clone or download the repository to your local computer:
   ```bash
   git clone https://github.com/doforgain/clinic_lab.git
   ```
2. Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, or Mozilla Firefox.

### Option 2: Run via Local Development Server
Running over HTTP is recommended for full multi-page navigation and network optimizations:

```bash
# Using Python
python -m http.server 8080

# Using Node.js npx
npx serve .
```
Navigate to `http://localhost:8080` in your web browser.

---

## ☁️ Cloud Synchronization (Supabase)

The system automatically syncs patient records and daily reports to the cloud so all computers in the laboratory share the same live database.

### Supabase Database Schema
The application communicates with a Supabase PostgreSQL table named `lab_reports`. If connecting a custom Supabase instance, create the table using the following SQL:

```sql
CREATE TABLE public.lab_reports (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    patient_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    report_data JSONB NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated and anon roles (or configure custom clinic policies)
CREATE POLICY "Allow public read-write for clinic app"
    ON public.lab_reports
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

### Configuration
Connection settings are managed in [assets/js/config/supabase-config.js](file:///assets/js/config/supabase-config.js):
```javascript
export const SUPABASE_CONFIG = {
  url: 'https://<your-project-id>.supabase.co',
  anonKey: '<your-publishable-anon-key>'
};
```

---

## 🔒 Authentication & Access Control

To protect financial records and prevent unauthorized changes to inventory, the application implements password gates:

| Module / Action | Default PIN / Password | Managed In |
| :--- | :--- | :--- |
| **History & Archive View** | `admin1` | [auth-config.js](file:///assets/js/config/auth-config.js) |
| **Test Analytics & Statistics** | `admin1` | [auth-config.js](file:///assets/js/config/auth-config.js) |
| **Daily Financial Collections** | `admin1` | [auth-config.js](file:///assets/js/config/auth-config.js) |
| **Inventory Stock Quantities** | `9211` | [auth-config.js](file:///assets/js/config/auth-config.js) |

> 💡 **Tip**: Passwords can be customized by editing `assets/js/config/auth-config.js` and updating `HISTORY_PASSWORD` and `INVENTORYUPDATE_PASSWORD`.

---

## 🖨️ Print & PDF Specifications

Reports are styled specifically for **Standard A4 (210mm × 297mm)** paper.

### Optimal Browser Print Settings
When pressing **Print Report** (or `Ctrl + P`):
1. **Destination**: Select your physical printer or *Save as PDF*.
2. **Paper Size**: `A4`.
3. **Margins**: Set to `None` or `Default` (the stylesheet handles exact padding).
4. **Options**: Check **Background graphics** to ensure alternating table row shading and badges appear properly.
5. **Scale**: `100%` (or `Fit to printable area` if required by hardware margin limits).

---

## 🌐 Browser Compatibility

Tested and optimized for modern desktop and tablet browsers:
- **Google Chrome** (Recommended for printing and PDF generation)
- **Microsoft Edge**
- **Mozilla Firefox**
- **Safari** (macOS / iPadOS)

---

## 👨‍⚕️ Author & Clinic Details

- **Healthcare Facility**: **SHAMS HEALTH CARE** — Laboratory Diagnostic Services
- **Consultant Physician**: Dr. Shahid Khan, MBBS
- **Maintainer**: [@doforgain](https://github.com/doforgain)
