import { imposerMagic } from './imposer.js';

export const utils = {
  /** 
    selectedPages - the 'all' or 1,2,3,4 or 1-5 or 1,b,4,b string given by user 
    return -  [[i],[j],[k]] type result of page numbers (-1 representing "blank") or undefined if there was an error with the input
  */
  _buildPageList : function(selectedPages, pageCount) {
    let fillAll = function() {
      return new Array(pageCount).fill(0).map( (x, i) => i + 1)
    }
    if (selectedPages == undefined || selectedPages == "all" || selectedPages == "") {
      return fillAll()
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
    let results = selectedPages
      .replaceAll(" ", "")
      .split(",")
      .reduce((acc, cur) => {
        let p = (cur == 'b') ? 'b' : (cur.indexOf("-") > -1) ? breakRange(cur) : (cur == "all") ? fillAll() : parseInt(cur)
        p = (p < 1 || p > pageCount) ? "" : (p == 'b') ? -1 : p
        if (Array.isArray(p)) {
          p.forEach(i => acc.push([i]))
        } else {
          acc.push([p]); 
        }
        return acc
      }, new Array())
      .filter( x => x != "")
    // console.log("given ["+selectedPages+"]/"+pageCount+" looking at ", results)
    let isValidValue = i => { return i.length == 1 && (i[0] == -1 || (i[0] > 0 && i[0] <= pageCount)) }
    return (results.findIndex(i => {return !isValidValue(i)}) > -1) ? undefined : results
  },
  _appendPdfSourceError: function(errorMsg) {
    console.error(errorMsg)
    let e = document.getElementById("insert_pdf_source_errors_here");
    e.innerHTML += errorMsg +"<BR>"
    e.removeAttribute("style")
  },
  _calcPdfDimensions: async function() {
    let unified_source = window.book.unified_source;
    unified_source.pdf_is_valid = false
    let blocks = window.book.upload_blocks
      .filter(block => { return block.pdfDoc != null })
    if (blocks.length == 0) {
      this._appendPdfSourceError("No PDF files selected!")
      return;
    }
    let sourceHeights = [];
    let sourceWidths = [];
    let fileSize = 0;
    for (let i = 0; i < blocks.length; ++i) {
      let original_pdf = blocks[i].pdfDoc;
      let selectedPages = blocks[i].pageSelection;
      let pageCount = original_pdf.getPageCount()
      let pagesList = this._buildPageList(selectedPages, pageCount)
      if (pagesList == undefined) {
        blocks[i]._pagesList = []
        this._appendPdfSourceError("Invalid page list: <code>"+selectedPages+"</code> for PDF <code>"+window.book.upload_blocks[0].file.name+"</code>")
        continue;
      }
      blocks[i]._pagesList = pagesList.flat()
      for(let j = 0; j < blocks[i].precedingBlanks; ++j) {
        pagesList.unshift(-1)
      }

      const pages = original_pdf.getPages()
      let pagesSet = new Set(pagesList)
      for(const pageNumber of pagesSet) {
        if (pageNumber == -1)
          continue;
        let sourcePdfPage = pages[pageNumber - 1];
        sourceHeights.push(sourcePdfPage.getHeight());
        sourceWidths.push(sourcePdfPage.getWidth());
      }
      fileSize += blocks[i].file.size
    }
    sourceHeights.sort()
    sourceWidths.sort()
    const maxHeight = sourceHeights[sourceHeights.length - 1];//sourceHeights[Math.floor(sourceHeights.length/2)]
    const maxWidth = sourceWidths[sourceWidths.length - 1];//sourceWidths[Math.floor(sourceWidths.length/2)]
    let scale = Math.min(100/maxWidth, 100/maxHeight)
    const valid_upload_blocks = window.book.upload_blocks.filter(x => x.pdfDoc != null)
    const is_interlaced = valid_upload_blocks.length == 2 && window.book.unified_source.interlaced
    unified_source.pageCount = (is_interlaced)
      ? Math.max(valid_upload_blocks[0]._pagesList.length,valid_upload_blocks[1]._pagesList.length)
      : valid_upload_blocks.reduce( (acc, cur) => acc + cur._pagesList.length, 0)
    unified_source.maxWidth = maxWidth
    unified_source.maxHeight = maxHeight
    unified_source._scale100px = scale
    unified_source.pdf_is_valid = true
    unified_source.is_large_file = fileSize > 20_000_000  // TODO : vet that file size limit - totes made up ATM
    if (unified_source.is_large_file) {
      document.getElementById("pdf_results_preview_mode").checked = true
    }
    document.getElementById("pdf_preview_size_warning").style.display = (unified_source.is_large_file) ? '' : 'none';
    document.getElementById("insert_pdf_source_details_here").innerHTML = `
            <div id="example_pdf_upload_page" style="width:`+maxWidth*scale+`px;height:`+maxHeight*scale+`px;"></div>
            There are <code>`+ unified_source.pageCount+`</code> pages<br>
            `+((is_interlaced) ? '<small>( 📖 interlacing the '+valid_upload_blocks[0]._pagesList.length+' and '+valid_upload_blocks[1]._pagesList.length+' pages between two provided PDFs)</small><br>' : '')+`
            The working size is <code>`+ maxWidth+`</code> x <code>`+ maxHeight +`</code><br>
            <small>(working with `+(fileSize * 0.000001).toFixed(2)+` MB in memory
            `+ ((unified_source.is_large_file) ? `[⚠️ large file size detected, be sure to only preview first signature]` : ``) +`
            )</small>
    `
  },
  _shark: async function(origPdf) {

const pdfDoc = await PDFLib.PDFDocument.create()
const page = pdfDoc.addPage()

const sourcePdfUrl = 'https://pdf-lib.js.org/assets/with_large_page_count.pdf'
const sourcePdf = await fetch(sourcePdfUrl).then((res) => res.arrayBuffer())

// Embed page 74 from the PDF
const [embeddedPage] = await pdfDoc.embedPdf(sourcePdf, [73])
console.log("Trying to do stuff w/ ",sourcePdf)

page.drawPage(embeddedPage, {
  x: 25,
  y: 20,
  xScale: 0.5,
  yScale: 0.5,
  rotate: PDFLib.degrees(30),
  opacity: 0.75,
})
return pdfDoc
  },
  _splitPdfFile: async function(origPdf) {
      console.log("  [_splitPdfFile] splitting pdf pages in half ("+origPdf.getPageCount()+" pages) ")
      const newPdf = await PDFLib.PDFDocument.create();
      for(var i = 0; i < origPdf.getPageCount(); ++i) {
        const origPage = origPdf.getPage(i);
        const newDimension = [origPage.getWidth() / 2, origPage.getHeight()];
        const embeddedPage = await newPdf.embedPage(origPage)
        const left =  newPdf.addPage(newDimension)
        left.drawPage(embeddedPage, {x: 0, y: 0})
        const right =  newPdf.addPage(newDimension)
        right.drawPage(embeddedPage, {x: newDimension[0] * -1, y: 0})
      }
      const pdfBytes = await newPdf.save()
      console.log("  [_splitPdfFile] saving reassembled PDF and reloading it")
      return await PDFLib.PDFDocument.load(pdfBytes);
  },
  _ingestPdfFile: async function(file, splitPages, framePages) {
    const input = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(input);
    if (splitPages) {
      return await this._splitPdfFile(pdfDoc);
    }
    if (!framePages) {
      return pdfDoc
    }
    const newPdf = await PDFLib.PDFDocument.create();
    for(var i = 0; i < pdfDoc.getPageCount(); ++i) {
      const origPage = pdfDoc.getPage(i);
      var { x,y, width, height } = origPage.getCropBox();
      const embeddedPage = await newPdf.embedPage(origPage,   { left: x,  bottom: y, right: width + x, top: height + y});
      const newDimension = [width, height];
      if (x > 0 || y > 0) {
        console.log("We're going to translate the page ["+i+"] -- "+-x+", "+-y+" : ["+newDimension[0]+", "+newDimension[1]+"]")
      }
      const newPage =  newPdf.addPage(newDimension);
      
      newPage.drawPage(embeddedPage, {x: 0, y: 0});
      // newPage.drawRectangle({x: 0, y:0, width: newDimension[0], height:newDimension[1], opacity: 0, borderOpacity: 1, borderWidth: 10, borderColor: PDFLib.grayscale(0.5)})
      // newPage.drawRectangle({x: x, y:x, width: width, height:height, opacity: 0, borderOpacity: 1, borderWidth: 5, borderColor: PDFLib.grayscale(0.25)})
    }
    const pdfBytes = await newPdf.save()
    return await PDFLib.PDFDocument.load(pdfBytes);
  },
  processUploadBlocks : async function (callback){
    let errorE = document.getElementById("insert_pdf_source_errors_here");
    errorE.innerHTML = ""
    errorE.setAttribute("style", "visibility: hidden;")
    let resultsE = document.getElementById("insert_pdf_source_details_here");
    resultsE.setAttribute("style", "opacity: 0.5;")
    let blocks = window.book.upload_blocks
      .filter(block => { return block.file != null })
    for (let i = 0; i < blocks.length; ++i) {
      let block = blocks[i]
      console.log("it could work ["+i+"] ", this) 
      block.pdfDoc = await this._ingestPdfFile(block.file, !!block.splitPages, !!block.framePages) // the !! is to squish undefined into false
    }
    this._calcPdfDimensions()
    resultsE.removeAttribute("style")
    setTimeout(callback,500); // make sure folks feel like it's processing, even if it's quick
  }
}






export const SIDE_COVERAGE_BOTH = 0
export const SIDE_COVERAGE_FRONT = 1    // folio [0] & [3]
export const SIDE_COVERAGE_BACK = 2     // folio [1] & [2]

export const builder = {
  _populateSheetBack: function(new_pdf, sheetList, pageMap) {
    console.log("  >> page back ",folioList)
    console.log("  >> pageMap is ",pageMap)
    const new_page = new_pdf.addPage()
  },
  /**
   * @param signature_index - 0 based index into signature list for which one you want
   * @return [ set of final page numbers that make up the signature (and bonus folios on sheet), sublist of sheets the signature spans ]
   */
  _buildSingleSigOnlySet: function(signature_index) {
    const required = new Set(window.book.imposed.signatures[signature_index])
    const flatSetFun = function(s) {
      return new Set([...s].flat())
    }
    console.log("Looking at _buildSingleSigOnlySet for signature "+signature_index+" -- required : ",required)
    const result = new Set()
    const sheets = []
    for(let i = 0; i < window.book.imposed.sheets.length; ++i){
      let sheetSigOverlap = new Set(window.book.imposed.sheets[i]).intersection(required)
      if (sheetSigOverlap.size == 0) {
        continue;
      }
      sheets.push(window.book.imposed.sheets[i])
      window.book.imposed.sheets[i].forEach(item => result.add(item))
    }
    return [flatSetFun(result), sheets]
  },
  _buildPageSetBasedOnSideCoverageMode: function(side_coverage_mode) {
    const outer = function(f) {
      return [f[0], f[3]]
    }
    const inner = function(f) {
      return [f[1], f[2]]
    }
    if (side_coverage_mode == SIDE_COVERAGE_FRONT) {
      return new Set(window.book.imposed.sheets.map(s => s.map((f, i) =>  (i % 2 == 0) ? outer(f) : inner(f)  )).flat().flat())
    } else if (side_coverage_mode == SIDE_COVERAGE_BACK) {
      return new Set(window.book.imposed.sheets.map(s => s.map((f, i) =>  (i % 2 == 0) ? inner(f) : outer(f)  )).flat().flat())
    } else {
      return new Set(window.book.imposed.sheets.flat().flat())
    }
  },
  /**
   * @return [map of result page num -> embedded PDF page, imposed sheets covered]
   */
  _buildAndEmbedPageMap: async function(signature_index, side_coverage_mode, new_pdf) {
    const [pageSet, sheets] = (signature_index > -1) ? this._buildSingleSigOnlySet(signature_index) : [this._buildPageSetBasedOnSideCoverageMode(side_coverage_mode), window.book.imposed.sheets]
    console.log("Done w/ that pageSet now -- we have "+sheets.length+" sheets & ",pageSet)
    const pageMap = {}
    const origPageMap = window.book.upload_blocks.map(b => { return {} });
    for (const page of pageSet) {
      if (page == -1)
        continue;
      const pageFetchResults =  window.book.unified_source.getPdfPageForPageNumber(page);

      if (typeof pageFetchResults === "number" || pageFetchResults == "b") {
        continue;   // this is for blanks or pages at the end of the book that overflow the original PDF(s) but pad out final signature
      }
      const [block_i, origPage] = pageFetchResults;
      origPage.drawText(` `, {x: 125, y: 100, size: 24, },  )   // hack to prevent exception due to embedding a blank page!
      origPageMap[block_i][page] = origPage;
    }
    for(const subPageMap of origPageMap) {
      const pageNumList = Object.keys(subPageMap)
      const bbox = {
        left: this._collectValueOrPlaceholder(document.getElementById("pdf_margin_left")), 
        right: window.book.unified_source.maxWidth-this._collectValueOrPlaceholder(document.getElementById("pdf_margin_right")),
        top: window.book.unified_source.maxHeight-this._collectValueOrPlaceholder(document.getElementById("pdf_margin_top")),
        bottom: this._collectValueOrPlaceholder(document.getElementById("pdf_margin_bottom"))
      }
      console.log("doing that embedded page stuff...")
      const embeddedPages = await new_pdf.embedPages(pageNumList.map(k => subPageMap[k]), pageNumList.map(k => bbox))
      embeddedPages.forEach((p,i) => pageMap[pageNumList[i]] = p)
    }
    return [pageMap, sheets]
  },
  _collectValueOrPlaceholder: function(el) {
    if (el.type == 'color') {
      const c = this._hexToRgb(el.value)
      return PDFLib.rgb(c.r / 255.0, c.g / 255.0, c.b / 255.0);
    }
    const v = parseFloat(el.value)
    return (isNaN(v)) ? parseFloat(el.placeholder) : v
  },
  /**
   * @param signature_index - the signature to export as a file (printed as a full sheet) or -1 to print all of them
   */
  buildPdf: async function(signature_index, side_coverage_mode) {
    console.log("Building PDF -- signature_index ["+signature_index+"] / side_coverage_mode ["+side_coverage_mode+"]")
    const new_pdf = await PDFLib.PDFDocument.create();

    const [pageMap, sheets] = await this._buildAndEmbedPageMap(signature_index, side_coverage_mode, new_pdf)
    // const sheetCount = (signature_index > -1) ? this._buildSingleSigOnlySet(signature_index)[1] : window.book.imposed.sheets.length
    // const sheets = window.book.imposed.sheets.slice(0, sheetCount)
    console.log(" > Sheet count ["+sheets.length+"] -> ",sheets)

    sheets.forEach((s,i) => {
      if (s.length == 0)
        return;
      if (side_coverage_mode == SIDE_COVERAGE_BOTH || side_coverage_mode == SIDE_COVERAGE_FRONT) {
        const new_page = new_pdf.addPage(window.book.physical.paper_size);
        imposerMagic.imposePdf(new_page, pageMap, s, i, true);
      }
      if (side_coverage_mode == SIDE_COVERAGE_BOTH || side_coverage_mode == SIDE_COVERAGE_BACK) {
        const new_page = new_pdf.addPage(window.book.physical.paper_size);
        imposerMagic.imposePdf(new_page, pageMap, s, i, false);
      }
    });
    return new_pdf;
  }
}