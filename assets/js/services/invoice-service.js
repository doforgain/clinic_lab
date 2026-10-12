/* ==========================================================================
   SHAMS HEALTH CARE - INVOICE SERVICE & INTERACTION HANDLER
   ========================================================================== */

import { loadHistoryData } from '../state/storage.js';

export const TEST_CATALOG = {
  cbc: { name: 'Complete Blood Count (CBC / Hemogram)', sample: 'EDTA Whole Blood', rate: 200 },
  esr: { name: 'Erythrocyte Sedimentation Rate (ESR)', sample: 'EDTA Whole Blood', rate: 100 },
  typhi: { name: 'Typhoid (Typhi-dot) Rapid Antibody Test', sample: 'Serum / Whole Blood', rate: 100 },
  dengue: { name: 'Dengue NS1 Antigen & IgG/IgM Antibodies', sample: 'Serum / Whole Blood', rate: 400 },
  malaria: { name: 'Malaria Antigen Rapid Test (Pv / Pf)', sample: 'Whole Blood', rate: 100 },
  widal: { name: 'Widal Slide Agglutination Test (S. Typhi)', sample: 'Serum', rate: 100 },
  bloodGroup: { name: 'ABO & Rh Blood Grouping', sample: 'Whole Blood', rate: 100 },
  bilirubin: { name: 'Serum Bilirubin Profile (Total, Direct, Indirect)', sample: 'Serum', rate: 200 },
  crp: { name: 'C-Reactive Protein (CRP) Quantitative', sample: 'Serum', rate: 250 }
};

export function numberToIndianWords(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(v) {
    if (v < 20) return units[v];
    const unit = v % 10;
    return tens[Math.floor(v / 10)] + (unit ? ' ' + units[unit] : '');
  }

  function convertThreeDigits(v) {
    let str = '';
    const hundred = Math.floor(v / 100);
    const rem = v % 100;
    if (hundred > 0) str += units[hundred] + ' Hundred';
    if (rem > 0) {
      if (str) str += ' and ';
      str += convertTwoDigits(rem);
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (rem > 0) words += convertThreeDigits(rem);

  return words.trim() + ' Rupees Only';
}

let activeReport = null;

export function initInvoicePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  const printBtn = document.getElementById('btnPrintInvoice');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  const resetBtn = document.getElementById('btnResetInvoice');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (activeReport && confirm('Reset all invoice edits to original report details?')) {
        renderInvoice(activeReport);
      }
    });
  }

  const addBtn = document.getElementById('btnAddItem');
  if (addBtn) {
    addBtn.addEventListener('click', () => addInvoiceRow());
  }

  if (!reportId) {
    showInvoiceEmptyState('No Report Selected', 'Please navigate to Report History and click the "Invoice" button on a specific report.');
    return;
  }

  const history = loadHistoryData();
  const report = history.find(item => String(item.id) === String(reportId));

  if (!report) {
    showInvoiceEmptyState('Report Not Found', `Unable to find report #${reportId} in local or synchronized records.`);
    return;
  }

  activeReport = report;
  renderInvoice(report);
}

export function renderInvoice(report) {
  const invoiceContainer = document.getElementById('invoiceSheet');
  const emptyState = document.getElementById('invoiceEmptyState');
  if (emptyState) emptyState.style.display = 'none';
  if (invoiceContainer) invoiceContainer.style.display = 'block';

  // Invoice Meta
  const year = new Date().getFullYear();
  const invNumberElem = document.getElementById('invNumber');
  if (invNumberElem) invNumberElem.innerText = `INV-${year}-${String(report.serial || '001').padStart(4, '0')}`;

  const invDateElem = document.getElementById('invDate');
  if (invDateElem) invDateElem.innerText = report.reportedDate || report.collectionDate || new Date().toISOString().split('T')[0];

  const invSerialElem = document.getElementById('invSerial');
  if (invSerialElem) invSerialElem.innerText = `#${report.serial || 'N/A'}`;

  const invPaymentModeElem = document.getElementById('invPaymentMode');
  if (invPaymentModeElem) invPaymentModeElem.innerText = report.paymentMode || 'Cash';

  const invPaymentStatusElem = document.getElementById('invPaymentStatus');
  if (invPaymentStatusElem) invPaymentStatusElem.innerText = 'PAID';

  // Patient Demographics
  const invPatientNameElem = document.getElementById('invPatientName');
  if (invPatientNameElem) invPatientNameElem.innerText = report.patientName || 'Not specified';

  const invPatientIdElem = document.getElementById('invPatientId');
  if (invPatientIdElem) invPatientIdElem.innerText = report.patientId || 'N/A';

  const ageGenderStr = [report.patientAge, report.patientGender].filter(Boolean).join(' / ') || 'N/A';
  const invAgeGenderElem = document.getElementById('invAgeGender');
  if (invAgeGenderElem) invAgeGenderElem.innerText = ageGenderStr;

  const invPhoneElem = document.getElementById('invPhone');
  if (invPhoneElem) invPhoneElem.innerText = report.patientPhone || 'N/A';

  const invCityElem = document.getElementById('invCity');
  if (invCityElem) invCityElem.innerText = report.patientCity || 'N/A';

  const invReferredByElem = document.getElementById('invReferredBy');
  if (invReferredByElem) invReferredByElem.innerText = report.referredBy || 'Self';

  const invCollectionDateElem = document.getElementById('invCollectionDate');
  if (invCollectionDateElem) invCollectionDateElem.innerText = report.collectionDate || report.reportedDate || 'N/A';

  // Build items from report.tests
  const tbody = document.getElementById('invTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    const selectedTests = [];

    if (report.tests && typeof report.tests === 'object') {
      Object.keys(report.tests).forEach(testKey => {
        if (report.tests[testKey] === true && TEST_CATALOG[testKey]) {
          selectedTests.push(TEST_CATALOG[testKey]);
        }
      });
    }

    if (selectedTests.length === 0) {
      const fallbackCost = parseFloat(report.testCost) || 0;
      selectedTests.push({
        name: 'Diagnostic Clinical Investigation',
        sample: 'Blood / Serum',
        rate: fallbackCost
      });
    }

    let subtotal = 0;
    selectedTests.forEach((t, idx) => {
      subtotal += t.rate;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-num">${idx + 1}</td>
        <td><span contenteditable="true" class="editable-field td-desc">${t.name}</span></td>
        <td><span contenteditable="true" class="editable-field td-sample">${t.sample}</span></td>
        <td class="td-rate"><span contenteditable="true" class="editable-field td-rate-val">${t.rate}</span></td>
        <td class="td-amount"><span contenteditable="true" class="editable-field td-amount-val">${t.rate}</span></td>
        <td class="td-action no-print"><button type="button" class="item-delete-btn" title="Delete row">✕</button></td>
      `;
      tbody.appendChild(tr);
    });

    const netCost = report.testCost && report.testCost !== 'Not specified' ? (parseFloat(report.testCost) || subtotal) : subtotal;
    const discount = Math.max(0, subtotal - netCost);

    updateTotals(subtotal, discount, 0);
    bindTableEvents();
  }
}

export function bindTableEvents() {
  const tbody = document.getElementById('invTableBody');
  if (!tbody) return;

  // Handle amount and rate editing
  tbody.addEventListener('input', function (e) {
    if (e.target.classList.contains('td-amount-val') || e.target.classList.contains('td-rate-val')) {
      recalculateFromTable();
    }
  });

  // Handle delete button click
  tbody.addEventListener('click', function (e) {
    if (e.target.classList.contains('item-delete-btn')) {
      const row = e.target.closest('tr');
      if (row) {
        row.remove();
        reindexRows();
        recalculateFromTable();
      }
    }
  });

  // Handle manual discount editing
  const discountElem = document.getElementById('invDiscount');
  if (discountElem) {
    discountElem.oninput = () => {
      recalculateFromTable();
    };
  }

  // Handle manual tax editing
  const taxElem = document.getElementById('invTax');
  if (taxElem) {
    taxElem.oninput = () => {
      recalculateFromTable();
    };
  }

  // Handle manual net total editing
  const netElem = document.getElementById('invNetTotal');
  if (netElem) {
    netElem.oninput = () => {
      const net = parseFloat(netElem.innerText.replace(/[^0-9.-]/g, '')) || 0;
      const wordsElem = document.getElementById('invAmountInWords');
      if (wordsElem) wordsElem.innerText = numberToIndianWords(net);
      const paidElem = document.getElementById('invPaidAmount');
      if (paidElem) paidElem.innerText = `₹${net.toFixed(0)}`;
    };
  }
}

export function addInvoiceRow() {
  const tbody = document.getElementById('invTableBody');
  if (!tbody) return;

  const rowCount = tbody.querySelectorAll('tr').length;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="td-num">${rowCount + 1}</td>
    <td><span contenteditable="true" class="editable-field td-desc">Additional Diagnostic / Sample Charge</span></td>
    <td><span contenteditable="true" class="editable-field td-sample">Blood / Serum</span></td>
    <td class="td-rate"><span contenteditable="true" class="editable-field td-rate-val">100</span></td>
    <td class="td-amount"><span contenteditable="true" class="editable-field td-amount-val">100</span></td>
    <td class="td-action no-print"><button type="button" class="item-delete-btn" title="Delete row">✕</button></td>
  `;
  tbody.appendChild(tr);
  recalculateFromTable();
}

function reindexRows() {
  const rows = document.querySelectorAll('#invTableBody tr');
  rows.forEach((row, i) => {
    const numCell = row.querySelector('.td-num');
    if (numCell) numCell.innerText = i + 1;
  });
}

function getTableSubtotal() {
  let subtotal = 0;
  const amountCells = document.querySelectorAll('#invTableBody .td-amount-val');
  amountCells.forEach(cell => {
    const val = parseFloat(cell.innerText.replace(/[^0-9.-]/g, '')) || 0;
    subtotal += val;
  });
  return subtotal;
}

function recalculateFromTable() {
  const subtotal = getTableSubtotal();
  const discountElem = document.getElementById('invDiscount');
  const discount = discountElem ? (parseFloat(discountElem.innerText.replace(/[^0-9.-]/g, '')) || 0) : 0;
  const taxElem = document.getElementById('invTax');
  const tax = taxElem ? (parseFloat(taxElem.innerText.replace(/[^0-9.-]/g, '')) || 0) : 0;

  updateTotals(subtotal, discount, tax);
}

function updateTotals(subtotal, discount, tax = 0) {
  const taxable = Math.max(0, subtotal - discount);
  const net = taxable + tax;

  const subtotalElem = document.getElementById('invSubtotal');
  if (subtotalElem) subtotalElem.innerText = `₹${subtotal.toFixed(0)}`;

  const discountElem = document.getElementById('invDiscount');
  if (discountElem && !discountElem.matches(':focus')) {
    discountElem.innerText = discount > 0 ? `- ₹${discount.toFixed(0)}` : '₹0';
  }

  const taxableElem = document.getElementById('invTaxable');
  if (taxableElem) taxableElem.innerText = `₹${taxable.toFixed(0)}`;

  const taxElem = document.getElementById('invTax');
  if (taxElem && !taxElem.matches(':focus')) {
    taxElem.innerText = tax > 0 ? `₹${tax.toFixed(0)}` : '₹0';
  }

  const netElem = document.getElementById('invNetTotal');
  if (netElem) netElem.innerText = `₹${net.toFixed(0)}`;

  const paidElem = document.getElementById('invPaidAmount');
  if (paidElem) paidElem.innerText = `₹${net.toFixed(0)}`;

  const balanceElem = document.getElementById('invBalanceDue');
  if (balanceElem) balanceElem.innerText = '₹0';

  const wordsElem = document.getElementById('invAmountInWords');
  if (wordsElem) wordsElem.innerText = numberToIndianWords(net);
}

function showInvoiceEmptyState(title, message) {
  const sheet = document.getElementById('invoiceSheet');
  if (sheet) sheet.style.display = 'none';

  const emptyState = document.getElementById('invoiceEmptyState');
  if (emptyState) {
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: 40px auto;">
        <div style="font-size: 48px; margin-bottom: 16px;">🧾</div>
        <h3 style="color: #0f172a; margin-bottom: 8px; font-size: 20px;">${title}</h3>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">${message}</p>
        <a href="history.html" class="invoice-btn invoice-btn-primary" style="display: inline-flex;">
          📂 Open Report History
        </a>
      </div>
    `;
  }
}
