/* Extracted from index.html L2015-2025. */

// One A4 sheet inside the 5mm @page margins declared in print.css.
const PAGE_MARGIN_MM = 5;
const PAGE_WIDTH_MM = 200;
const PAGE_HEIGHT_MM = 286.5;

// Adds a captured card to the PDF, slicing it when a single test section is
// taller than one sheet (the paginator marks those cards .report-page--tall).
function addCanvasPages(pdf, canvas) {
  const sliceHeight = Math.ceil(canvas.width * PAGE_HEIGHT_MM / PAGE_WIDTH_MM);
  for (let top = 0; top < canvas.height; top += sliceHeight) {
    const height = Math.min(sliceHeight, canvas.height - top);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = height;
    slice.getContext('2d').drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
    pdf.addPage();
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.98),
      'JPEG',
      PAGE_MARGIN_MM,
      PAGE_MARGIN_MM,
      PAGE_WIDTH_MM,
      PAGE_WIDTH_MM * height / canvas.width
    );
  }
}

export function saveAsPDF() {
  const element = document.getElementById('reportOutput');
  if (!element) return;

  // Offline / CDN unavailable fallback (file:/// dual execution requirement)
  if (typeof window === 'undefined' || typeof window.html2pdf !== 'function') {
    alert('PDF export library is unavailable offline. Opening print dialog as fallback (select "Save as PDF").');
    window.print();
    return;
  }

  const patientIdEl = document.getElementById('patientId');
  const patientId = patientIdEl && patientIdEl.value ? patientIdEl.value.trim() : 'report';
  const filename = `lab_report_${patientId}.pdf`;
  const opt = {
    margin: PAGE_MARGIN_MM,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  element.classList.add('is-exporting');
  const restore = () => element.classList.remove('is-exporting');

  // One capture per A4 card. Capturing the whole stack at once lets html2pdf
  // re-slice it at its own page height, which stretches cards or adds a page.
  const build = async () => {
    const cards = [...element.querySelectorAll('.report-page')];
    if (!cards.length) {
      // Legacy/unpaginated report: html2pdf slices the single capture itself.
      await window.html2pdf().set(opt).from(element).save();
      return;
    }

    const first = window.html2pdf().set(opt).from(cards[0]);
    await first.toPdf();
    const pdf = await first.get('pdf');

    for (const card of cards.slice(1)) {
      const worker = window.html2pdf().set(opt).from(card);
      await worker.toCanvas();
      addCanvasPages(pdf, await worker.get('canvas'));
    }
    pdf.save(filename);
  };

  return build().then(restore, err => {
    restore();
    console.warn('html2pdf generation failed, falling back to window.print():', err);
    window.print();
  });
}
