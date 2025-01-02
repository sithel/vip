export const fileHandler = {
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