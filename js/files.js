import { builder, SIDE_COVERAGE_BOTH, SIDE_COVERAGE_FRONT, SIDE_COVERAGE_BACK } from './pdf.js';

export const fileHandler = {
  _addToZip: async function(zip, pdf, fileName) {
    await pdf.save().then(pdfBytes => {
      zip.file(fileName+'.pdf', pdfBytes);
    });
  },
  handleDownloadOptions: async function(fileName, downloadAggregate, frontAndBackSeparate, signatureFiles) {
    const zip = new JSZip();
    if (downloadAggregate && !frontAndBackSeparate) {
      const pdf = await builder.generatePreview(false, SIDE_COVERAGE_BOTH)
      const nameToUse = fileName + "_aggregate"
      await this._addToZip(zip, pdf, nameToUse)
    }
    if (downloadAggregate && frontAndBackSeparate) {
      const pdfFront = await builder.generatePreview(false, SIDE_COVERAGE_FRONT)
      const pdfFrontName = fileName + "_front"
      await this._addToZip(zip, pdfFront, pdfFrontName)

      const pdfBack = await builder.generatePreview(false, SIDE_COVERAGE_BACK)
      const pdfBackName = fileName + "_back"
      await this._addToZip(zip, pdfBack, pdfBackName)
    }

    return zip.generateAsync({ type: "blob" }).then(blob => {
      saveAs(blob, fileName+".zip");
    });
  },
  makeTheZip: async function (pdfToSave, fileName) {
    let zip = new JSZip();
    await pdfToSave.save().then(pdfBytes => {
      zip.file(fileName+'.pdf', pdfBytes);
    });
    return zip.generateAsync({ type: "blob" }).then(blob => {
      saveAs(blob, fileName+".zip");
    });
  }
}