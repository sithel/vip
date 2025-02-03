import { builder, SIDE_COVERAGE_BOTH } from './pdf.js';

export const previewer = {
  build: async function(firstSigOnly) {
    try {
      const statusEl = document.getElementById('preview_status_slot')
      statusEl.style.display = '';
      statusEl.innerHTML = "beginning pdf preview...  [0/4]"
      document.getElementById('preview_error_slot').style.display = 'none';
      statusEl.style.display = '';
      statusEl.innerHTML = "generating preview pdf...  [1/4]"
      console.log("beginning PDF preview!")
      const previewPdf = await builder.generatePreview(firstSigOnly, SIDE_COVERAGE_BOTH)
      statusEl.innerHTML = "saving preview pdf...  [2/4]"
      const previewFrame = document.getElementById('pdf_results_preview');
      const pdfBytes = await previewPdf.save();
      // "now you're working with bindary data"
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf"});
      statusEl.innerHTML = "displaying preview pdf ("+(pdfBlob.size * 0.000001).toFixed(2)+" MB)  [3/4]"
      if (window.book.imposed.pdfUrl != undefined) {
        // don't forget to revoke URLs or memory will start leaking for real!!!
        URL.revokeObjectURL(window.book.imposed.pdfUrl);
      }
      window.book.imposed.pdfUrl = URL.createObjectURL(pdfBlob);
      const viewerPrefs = previewPdf.catalog.getOrCreateViewerPreferences();
      viewerPrefs.setHideToolbar(false);
      viewerPrefs.setHideMenubar(false);
      viewerPrefs.setHideWindowUI(false);
      viewerPrefs.setFitWindow(true);
      viewerPrefs.setCenterWindow(true);
      viewerPrefs.setDisplayDocTitle(true);

      previewFrame.src = window.book.imposed.pdfUrl;

      // // Print all available viewer preference fields
      // console.log('HideToolbar:', viewerPrefs.getHideToolbar())
      // console.log('HideMenubar:', viewerPrefs.getHideMenubar())
      // console.log('HideWindowUI:', viewerPrefs.getHideWindowUI())
      // console.log('FitWindow:', viewerPrefs.getFitWindow())
      // console.log('CenterWindow:', viewerPrefs.getCenterWindow())
      // console.log('DisplayDocTitle:', viewerPrefs.getDisplayDocTitle())
      // console.log('NonFullScreenPageMode:', viewerPrefs.getNonFullScreenPageMode())
      // console.log('ReadingDirection:', viewerPrefs.getReadingDirection())
      // console.log('PrintScaling:', viewerPrefs.getPrintScaling())
      // console.log('Duplex:', viewerPrefs.getDuplex())
      // console.log('PickTrayByPDFSize:', viewerPrefs.getPickTrayByPDFSize())
      // console.log('PrintPageRange:', viewerPrefs.getPrintPageRange())
      // console.log('NumCopies:', viewerPrefs.getNumCopies())

      // previewFrame.style.width = `450px`;
      // const height = (this.papersize[1] / this.papersize[0]) * 500;
      // previewFrame.style.height = `${height}px`;
      previewFrame.style.display = '';
      statusEl.innerHTML = "preview pdf complete ("+(pdfBlob.size * 0.000001).toFixed(2)+" MB)  [4/4]"
      await new Promise(r => setTimeout(r, 5000));
    } catch (error) {
      console.error("Error w/ PDF preview : ", error);
      document.getElementById('pdf_results_preview').style.display = 'none';
      document.getElementById('preview_error_slot').innerHTML = "There was an errror genderating the preview<BR><small><code><pre>"+error.stack.replaceAll("\n","<BR>")+"</pre></code></small>";
      document.getElementById('preview_error_slot').style.display = '';
    }
  }
}