export const utils = {
  /** selectedPages - the 'all' or 1,2,3,4 or 1-5 or 1,b,4,b string given by user */
  _buildPageList : function(selectedPages, pageCount) {
// def parse_range(astr):
//     result=set()
//     for part in astr.split(','):
//         x=part.split('-')
//         result.update(range(int(x[0]),int(x[-1])+1))
//     return sorted(result)

    if (selectedPages == undefined || selectedPages == "all") {
      return new Array(pageCount).fill(0).map( (x, i) => i + 1)
    } 

    let breakRange = function(range) {
      let r = range.split("-")
      let result = [];
      let start = Math.max(1, parseInt(r[0]));
      let end = Math.min(pageCount, parseInt(r[1]));
      let isBackwards = end < start
      for (let i = start; (isBackwards) ? i >= end : i <= end; (isBackwards) ? --i : ++i){
        result.push(i);
      }
      return result;
    }
    return selectedPages
      .replaceAll(" ", "")
      .split(",")
      .reduce((acc, cur) => {
        let p = (cur == 'b') ? 'b' : (cur.indexOf("-") > -1) ? breakRange(cur) : parseInt(cur)
        p = (p < 1 || p > pageCount) ? "" : (p == 'b') ? -1 : p
        acc.push([p]);
        return acc
      }, new Array())
      .filter( x => x != "")
  },
  _calcPdfDimensions: async function() {
    let new_pdf = await PDFLib.PDFDocument.create();
    window.book.unified_source.pdf = new_pdf;
    let blocks = window.book.upload_blocks
      .filter(block => { return block.pdfDoc != null })
    let maxHeight = 0;
    let maxWidth = 0;
    for (let i = 0; i < blocks.length; ++i) {
      let original_pdf = blocks[i].pdfDoc;
      let selectedPages = blocks[i].pageSelection;
      let pagesList = this._buildPageList(selectedPages, original_pdf.getPageCount())
      blocks[i]._pagesList = pagesList


      const pages = original_pdf.getPages()
      for (let j = 0; j < pages.length; ++j) {
        let sourcePdfPage = pages[j];
        await new_pdf.embedPage(sourcePdfPage);
        new_pdf.addPage([sourcePdfPage.getWidth(),sourcePdfPage.getHeight()]);
        console.log("on page "+j+" of PDF "+i+" I have  "+sourcePdfPage.getWidth()+" x "+sourcePdfPage.getHeight())
        maxHeight = Math.max(maxHeight, sourcePdfPage.getHeight());
        maxWidth = Math.max(maxWidth, sourcePdfPage.getWidth());
      }
    }
    document.getElementById("insert_pdf_source_details_here").innerHTML = `
            There are <code>`+ new_pdf.getPageCount()+`</code> pages<br>
            The working size is <code>`+ maxWidth+`</code> x <code>`+ maxHeight +`</code>
    `
  },
  _ingestPdfFile: async function(file) {
    const input = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(input);
    return pdfDoc
  },
  processUploadBlocks : async function (callback){
    let blocks = window.book.upload_blocks
      .filter(block => { return block.file != null })
    for (let i = 0; i < blocks.length; ++i) {
      let block = window.book.upload_blocks[i]
      console.log("it could work ["+i+"] ", this) 
      block.pdfDoc = await this._ingestPdfFile(block.file)
    }
    this._calcPdfDimensions()
    setTimeout(callback,500); // make sure folks feel like it's processing, even if it's quick
  },
  openDoc : async function(file) {
    console.log("I see this ", PDFLib.PDFDocument);
    const input = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(input);
    const pages = pdfDoc.getPages();
    console.log("open doc ran -- ", pdfDoc)
    console.log(pages)
    window.reb2 = pdfDoc
  }
}