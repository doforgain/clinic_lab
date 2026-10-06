/* Extracted from index.html L2015-2025. */
export function saveAsPDF() {
  const element = document.getElementById('reportOutput');
  const opt = {
    margin: 10,
    filename: `lab_report_${document.getElementById('patientId').value}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
