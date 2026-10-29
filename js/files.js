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
  _buildConfigFileContents: function() {
    const newSet = generateCurrentSettingsSet()

    const meta = book.upload_blocks.map(b => "# "+b.file.name+" -- "+b.file.lastModifiedDate 
      + ((b.precedingBlanks == undefined) ? "" : "\n# precedingBlanks: "+ b.precedingBlanks)
      + ((b.pageSelection == undefined) ? "" : "\n# pageSelection: "+ b.pageSelection)
      + ((b.preProcessing == undefined) ? "" : "\n# preProcessing: "+ b.preProcessing)
      + "\n# ---------------------"
    ).join("\n")
    
    return meta +"\n" + generateExportString(newSet)
  },
  handleDownloadOptions: async function(fileName, downloadAggregate, frontAndBackSeparate, signatureFiles, includeConfig) {
    console.log("Exporting PDF under file name ["+fileName+"] -- downloadAggregate ["+downloadAggregate+"] / frontAndBackSeparate ["+frontAndBackSeparate+"] / signatureFiles["+signatureFiles+"] / includeConfig["+includeConfig+"]")
    const is_flip_short = document.getElementById("flip_paper_short").checked
    fileName += "_" + ((is_flip_short) ? "FlipShort" : "FlipLong") 
      //+ "_" + window.book.physical.paper_size[0] + "_x_" + window.book.physical.paper_size[1]
      + "_" + window.book.imposition.name
    try {
      const zip = new JSZip();
      if (includeConfig) {
        zip.file("config.txt", this._buildConfigFileContents())
      }
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