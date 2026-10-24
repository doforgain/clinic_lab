/* A4 report paginator.
 * Re-flows a rendered report into fixed A4 page cards so that:
 *   - the letterhead + patient info repeat at the top of every page,
 *   - the footer is pinned to the bottom of every page (not floating),
 *   - page numbers are exact ("Page 1/3", "Page 2/3", ...),
 *   - a test section is never broken across pages (unless it is taller than a page),
 *   - the disclaimer + signature appear only on the last page.
 * The preview uses the same DOM that prints, so screen and paper match.
 */

// 200mm A4 content width (210mm - 2 x 5mm page margins) expressed in CSS pixels.
const PAGE_WIDTH_PX = (200 / 25.4) * 96;
const TOLERANCE_PX = 1;

function setPageNumber(footer, index, total) {
  if (!footer) return;
  let number = footer.querySelector('.page-number');
  if (!number) {
    const items = [...footer.querySelectorAll('.footer-item')];
    const pageItem = items.find(item => /^\s*Page\b/i.test(item.textContent));
    if (!pageItem) return;
    const label = pageItem.querySelector('span');
    if (label) {
      label.innerHTML = 'Page <strong class="page-number">1/1</strong>';
      number = label.querySelector('.page-number');
    } else {
      const icons = [...pageItem.querySelectorAll('svg')];
      pageItem.innerHTML = '';
      icons.forEach(icon => pageItem.appendChild(icon));
      pageItem.insertAdjacentHTML('beforeend', 'Page <strong class="page-number">1/1</strong>');
      number = pageItem.querySelector('.page-number');
    }
  }
  number.textContent = `${index}/${total}`;
}

export function fitReportPreview(container) {
  if (!container || !container.classList.contains('report-paginated')) return;
  const styles = window.getComputedStyle(container);
  const padding = parseFloat(styles.paddingLeft || 0) + parseFloat(styles.paddingRight || 0);
  const available = container.clientWidth - padding;
  if (available <= 0) return;
  const zoom = available < PAGE_WIDTH_PX ? available / PAGE_WIDTH_PX : 1;
  container.style.setProperty('--report-zoom', zoom.toFixed(4));
}

export function paginateReport(container) {
  if (!container || container.querySelector('.report-page')) return;

  const header = container.querySelector('.report-header');
  const patientInfo = container.querySelector('.report-patient-info');
  const footer = container.querySelector('.report-page-footer');
  const table = container.querySelector('.unified-report-table');
  if (!header && !table) return;

  const headHTML = (header ? header.outerHTML : '') + (patientInfo ? patientInfo.outerHTML : '');
  const footHTML = footer ? footer.outerHTML : '';
  const endingEls = [...container.children].filter(el =>
    el.classList.contains('end-of-report') ||
    el.classList.contains('compact-disclaimer-box') ||
    el.classList.contains('report-signatures-compact'));

  // Group the unified table rows per test section (section banner + its result rows).
  const theadHTML = table && table.tHead ? table.tHead.outerHTML : null;
  const groups = [];
  if (table) {
    for (const tbody of table.tBodies) {
      let group = null;
      for (const row of tbody.rows) {
        if (row.classList.contains('report-section-row')) {
          group = { head: row.outerHTML, rows: [] };
          groups.push(group);
        } else {
          if (!group) {
            group = { head: '', rows: [] };
            groups.push(group);
          }
          group.rows.push(row.outerHTML);
        }
      }
    }
  }

  const stage = document.createElement('div');
  stage.className = 'report-pagination-stage';
  document.body.appendChild(stage);

  const makePage = () => {
    const page = document.createElement('div');
    page.className = 'report-page';
    const head = document.createElement('div');
    head.className = 'report-page-head';
    head.innerHTML = headHTML;
    const body = document.createElement('div');
    body.className = 'report-page-body';
    if (theadHTML !== null) {
      const tbl = document.createElement('table');
      tbl.className = 'unified-report-table';
      tbl.innerHTML = theadHTML;
      body.appendChild(tbl);
    }
    const foot = document.createElement('div');
    foot.className = 'report-page-foot';
    foot.innerHTML = footHTML;
    page.append(head, body, foot);
    stage.appendChild(page);
    return page;
  };

  let page, bodyEl, tableEl;
  const startPage = () => {
    page = makePage();
    bodyEl = page.querySelector('.report-page-body');
    tableEl = bodyEl.querySelector('.unified-report-table');
  };
  startPage();

  const overflows = () => {
    const content = bodyEl.lastElementChild;
    if (!content) return false;
    return content.getBoundingClientRect().bottom > bodyEl.getBoundingClientRect().bottom + TOLERANCE_PX;
  };
  const hasContent = () => tableEl ? !!tableEl.querySelector('tbody tr') : !!bodyEl.firstElementChild;

  // Fallback for legacy/block reports: keep each block whole.
  const placeBlock = (html) => {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    const node = holder.firstElementChild;
    if (!node) return;
    bodyEl.appendChild(node);
    if (!overflows()) return;
    node.remove();
    if (hasContent()) {
      startPage();
      placeBlock(html);
      return;
    }
    bodyEl.appendChild(node);
    page.classList.add('report-page--tall');
  };

  const createTbody = () => {
    const tbody = document.createElement('tbody');
    tbody.className = 'report-test-group';
    tableEl.appendChild(tbody);
    return tbody;
  };

  // Only used when one single test section is taller than a full page.
  // The section banner is repeated on each continued page so no page starts
  // with context-free result rows.
  const splitSection = (group) => {
    const rows = (group.head ? [group.head] : []).concat(group.rows);
    let tbody = createTbody();
    for (const rowHTML of rows) {
      tbody.insertAdjacentHTML('beforeend', rowHTML);
      if (!overflows()) continue;
      tbody.lastElementChild.remove();
      if (hasContent()) {
        startPage();
        tbody = createTbody();
        if (group.head) {
          tbody.insertAdjacentHTML('beforeend', group.head);
          if (overflows()) {
            tbody.lastElementChild.remove();
            page.classList.add('report-page--tall');
          }
        }
      }
      tbody.insertAdjacentHTML('beforeend', rowHTML);
      if (overflows()) page.classList.add('report-page--tall');
    }
  };

  const placeSection = (group) => {
    const tbody = createTbody();
    tbody.innerHTML = group.head + group.rows.join('');
    if (!overflows()) return;
    tbody.remove();
    if (hasContent()) {
      startPage();
      placeSection(group);
      return;
    }
    splitSection(group);
  };

  const placeEnding = () => {
    if (!endingEls.length) return;
    const block = document.createElement('div');
    block.className = 'report-ending-block';
    block.innerHTML = endingEls.map(el => el.outerHTML).join('');
    bodyEl.appendChild(block);
    if (!overflows()) return;
    block.remove();
    if (hasContent()) {
      startPage();
      placeEnding();
      return;
    }
    endingEls.forEach(el => placeBlock(el.outerHTML));
  };

  groups.forEach(placeSection);
  if (!groups.length) {
    [...container.children].forEach(el => {
      if (el === header || el === patientInfo || el === footer || endingEls.includes(el)) return;
      if (el.tagName === 'TABLE') return;
      placeBlock(el.outerHTML);
    });
  }
  placeEnding();

  const pages = [...stage.querySelectorAll('.report-page')];

  // A page that only carries the disclaimer does not need the table header row.
  pages.forEach(p => {
    const tbl = p.querySelector('.unified-report-table');
    if (tbl && !tbl.querySelector('tbody tr')) tbl.remove();
  });

  pages.forEach((p, i) => setPageNumber(p.querySelector('.report-page-foot'), i + 1, pages.length));

  container.innerHTML = '';
  pages.forEach(p => container.appendChild(p));
  container.classList.add('report-paginated');
  stage.remove();
  fitReportPreview(container);
}

if (typeof window !== 'undefined') {
  let fitTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => {
      const el = document.getElementById('reportOutput');
      if (el) fitReportPreview(el);
    }, 150);
  });
}
