import { builder, SIDE_COVERAGE_BOTH, SIDE_COVERAGE_FRONT, SIDE_COVERAGE_BACK } from './pdf.js';

export const fileHandler = {
  _addToZip: async function(zip, pdf, fileName) {
    return await pdf
      .save()
      .then(pdfBytes => {
        zip.file(fileName+'.pdf', pdfBytes);
      })
      .catch(error => {
        console.error("Error w/ saving to zip : ",error);
      })
      ;
  },
  handleDownloadOptions: async function(fileName, downloadAggregate, frontAndBackSeparate, signatureFiles) {
    console.log("Exporting PDF under file name ["+fileName+"] -- downloadAggregate ["+downloadAggregate+"] / frontAndBackSeparate ["+frontAndBackSeparate+"] / signatureFiles["+signatureFiles+"]")
    fileName += "_" + window.book.imposition.name + "_"
    try {
      const zip = new JSZip();
      const addToZip = this._addToZip.bind(this)
      if (downloadAggregate && !frontAndBackSeparate) {
        const pdf = await builder.buildPdf(-1, SIDE_COVERAGE_BOTH)
        const nameToUse = fileName + "_aggregate"
        await addToZip(zip, pdf, nameToUse)
      }
      if (downloadAggregate && frontAndBackSeparate) {
        const pdfFront = await builder.buildPdf(-1, SIDE_COVERAGE_FRONT)
        const pdfFrontName = fileName + "_front"
        await addToZip(zip, pdfFront, pdfFrontName)

        const pdfBack = await builder.buildPdf(-1, SIDE_COVERAGE_BACK)
        const pdfBackName = fileName + "_back"
        await addToZip(zip, pdfBack, pdfBackName)
      }

      if (signatureFiles && !frontAndBackSeparate) {
        for(let i = 0; i < window.book.imposed.signatures.length; ++i){
          const pdf = await builder.buildPdf(i, SIDE_COVERAGE_BOTH)
          const nameToUse = fileName + "_signature_"+(i+1)
          await addToZip(zip, pdf, nameToUse)
        }
      }
      if (signatureFiles && frontAndBackSeparate) {
        for(let i = 0; i < window.book.imposed.signatures.length; ++i){
          const pdfFront = await builder.buildPdf(i, SIDE_COVERAGE_FRONT)
          const pdfFrontName = fileName + "_signature_"+(i+1)+"_front"
          await addToZip(zip, pdfFront, pdfFrontName)

          const pdfBack = await builder.buildPdf(i, SIDE_COVERAGE_BACK)
          const pdfBackName = fileName + "_signature_"+(i+1)+"_back"
          await addToZip(zip, pdfBack, pdfBackName)
        }
      }
      return zip.generateAsync({ type: "blob" }).then(blob => {
        saveAs(blob, fileName+".zip");
      });
    } catch (e) {
      console.error("Failed to build PDF : "+e)
    }
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