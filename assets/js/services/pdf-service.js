/* Extracted from index.html L2015-2025. */
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
  const opt = {
    margin: 10,
    filename: `lab_report_${patientId}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    window.html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.warn('html2pdf generation failed, falling back to window.print():', err);
    window.print();
  }
}
