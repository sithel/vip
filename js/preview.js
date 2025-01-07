import { builder, SIDE_COVERAGE_BOTH } from './pdf.js';

export const previewer = {
  build: async function(firstSigOnly) {
    const previewPdf = await builder.generatePreview(firstSigOnly, SIDE_COVERAGE_BOTH)
    const previewFrame = document.getElementById('pdf_results_preview');
    const pdfDataUri = await previewPdf.saveAsBase64({ dataUri: true });
    const viewerPrefs = previewPdf.catalog.getOrCreateViewerPreferences();
    viewerPrefs.setHideToolbar(false);
    viewerPrefs.setHideMenubar(false);
    viewerPrefs.setHideWindowUI(false);
    viewerPrefs.setFitWindow(true);
    viewerPrefs.setCenterWindow(true);
    viewerPrefs.setDisplayDocTitle(true);

    previewFrame.src = pdfDataUri;
    // previewFrame.style.width = `450px`;
    // const height = (this.papersize[1] / this.papersize[0]) * 500;
    // previewFrame.style.height = `${height}px`;
    previewFrame.style.display = '';
    await new Promise(r => setTimeout(r, 5000));
  }
}