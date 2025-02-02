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
    let maxHeight = 0;
    let maxWidth = 0;
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
        maxHeight = Math.max(maxHeight, sourcePdfPage.getHeight());
        maxWidth = Math.max(maxWidth, sourcePdfPage.getWidth());
      }
      fileSize += blocks[i].file.size
    }
    let scale = Math.min(100/maxWidth, 100/maxHeight)
    unified_source.pageCount = window.book.upload_blocks.filter(x => x.pdfDoc != null).reduce( (acc, cur) => acc + cur._pagesList.length, 0)
    unified_source.maxWidth = maxWidth
    unified_source.maxHeight = maxHeight
    unified_source._scale100px = scale
    unified_source.pdf_is_valid = true
    document.getElementById("insert_pdf_source_details_here").innerHTML = `
            <div id="example_pdf_upload_page" style="width:`+maxWidth*scale+`px;height:`+maxHeight*scale+`px;"></div>
            There are <code>`+ unified_source.pageCount+`</code> pages<br>
            The working size is <code>`+ maxWidth+`</code> x <code>`+ maxHeight +`</code><br>
            <small>(working with `+(fileSize * 0.000001).toFixed(2)+` MB in memory
            `+ ((fileSize > 20_000_000) ? `[⚠️ large file size detected, be sure to only preview first signature]` : ``) +`
            )</small>
    `
  },
  _ingestPdfFile: async function(file) {
    const input = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(input);
    return pdfDoc
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
      block.pdfDoc = await this._ingestPdfFile(block.file)
    }
    this._calcPdfDimensions()
    resultsE.removeAttribute("style")
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






export const SIDE_COVERAGE_BOTH = 0
export const SIDE_COVERAGE_FRONT = 1    // folio [0] & [3]
export const SIDE_COVERAGE_BACK = 2     // folio [1] & [2]

export const builder = {
  _populateSheetBack: function(new_pdf, sheetList, pageMap) {
    console.log("  >> page back ",folioList)
    console.log("  >> pageMap is ",pageMap)
    const new_page = new_pdf.addPage()
  },
  _buildFirstSigOnlySet: function() {
    const required = new Set(window.book.imposed.signatures[0])
    const flatSetFun = function(s) {
      return new Set([...s].flat())
    }
    console.log("Looking at _buildFirstSigOnlySet -- required : ",required)
    const result = new Set()
    for(let i = 0; i < window.book.imposed.sheets.length; ++i){
      let sheetSigOverlap = new Set(window.book.imposed.sheets[i]).intersection(required)
      if (sheetSigOverlap.size == 0) {
        return [flatSetFun(result), i]
      }
      window.book.imposed.sheets[i].forEach(item => result.add(item))
    }
    return [flatSetFun(result), window.book.imposed.sheets.length]
  },
  _buildPageSetBasedOnSideCoverageMode: function(side_coverage_mode) {
    if (side_coverage_mode == SIDE_COVERAGE_FRONT) {
      return new Set(window.book.imposed.sheets.map(s => s.map(f => [f[0], f[3]])).flat().flat())
    } else if (side_coverage_mode == SIDE_COVERAGE_BACK) {
      return new Set(window.book.imposed.sheets.map(s => s.map(f => [f[1], f[2]])).flat().flat())
    } else {
      return new Set(window.book.imposed.sheets.flat().flat())
    }
  },
  _buildAndEmbedPageMap: async function(firstSigOnly, side_coverage_mode, new_pdf) {
    const [pageSet, sheetCount] = (firstSigOnly) ? this._buildFirstSigOnlySet() : [this._buildPageSetBasedOnSideCoverageMode(side_coverage_mode), window.book.imposed.sheets.length]
    console.log("Done w/ that pageSet now -- we have "+sheetCount+" sheets & ",pageSet)
    const pageMap = {}
    const origPageMap = window.book.upload_blocks.map(b => { return {} });
    console.log("Given page pageSet : ["+ [...pageSet].join(", ")+"]")
    for (const page of pageSet) {
      if (page == -1)
        continue;
      const pageFetchResults =  window.book.unified_source.getPdfPageForPageNumber(page);

      if (typeof pageFetchResults === "number") {
        continue;   // this is for pages at the end of the book that overflow the original PDF(s) but pad out final signature
      }
      const [block_i, origPage] = pageFetchResults;
      console.log("Embedding page "+page)
      origPage.drawText(` `, {x: 125, y: 100, size: 24, },  )   // hack to prevent exception due to embedding a blank page!
      origPageMap[block_i][page] = origPage;
    }
    for(const subPageMap of origPageMap) {
      console.log("look @ block o pages "+ Object.keys(subPageMap).join(", "))
      const pageNumList = Object.keys(subPageMap)
      const embeddedPages = await new_pdf.embedPages(pageNumList.map(k => subPageMap[k]))
      embeddedPages.forEach((p,i) => pageMap[pageNumList[i]] = p)
    }
    return pageMap
  },
  generatePreview: async function(firstSigOnly, side_coverage_mode) {
    console.log("[Generating Preview : start")
    const new_pdf = await PDFLib.PDFDocument.create();

    const pageMap = await this._buildAndEmbedPageMap(firstSigOnly, side_coverage_mode, new_pdf)
    const sheetCount = (firstSigOnly) ? this._buildFirstSigOnlySet()[1] : window.book.imposed.sheets.length
    const sheets = window.book.imposed.sheets.slice(0, sheetCount)
    console.log(" > Sheet count ["+sheetCount+"] -> ",sheets)

    sheets.forEach((s,i) => {
      if (s.length == 0)
        return;
      if (side_coverage_mode == SIDE_COVERAGE_BOTH || side_coverage_mode == SIDE_COVERAGE_FRONT) {
        const new_page = new_pdf.addPage(window.book.physical.paper_size);
        imposerMagic.imposePdf(new_page, pageMap, s, i, true);
      }
      if (side_coverage_mode == SIDE_COVERAGE_BOTH || side_coverage_mode == SIDE_COVERAGE_FRONT) {
        const new_page = new_pdf.addPage(window.book.physical.paper_size);
        imposerMagic.imposePdf(new_page, pageMap, s, i, false);
      }
    });
    return new_pdf;
  }
}