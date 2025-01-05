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
    let new_pdf = await PDFLib.PDFDocument.create();
    unified_source.pdf = new_pdf;
    let blocks = window.book.upload_blocks
      .filter(block => { return block.pdfDoc != null })
    if (blocks.length == 0) {
      this._appendPdfSourceError("No PDF files selected!")
      return;
    }
    let maxHeight = 0;
    let maxWidth = 0;
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
      // pagesList = pagesList.map(n => n[0])
      blocks[i]._pagesList = pagesList.flat()
      for(let j = 0; j < blocks[i].precedingBlanks; ++j) {
        pagesList.unshift(-1)
      }

      const pages = original_pdf.getPages()
      let pagesSet = new Set(pagesList)
      for(const pageNumber of pagesSet) {
        console.log("looking at pageIndex ",pageNumber," in ",pagesSet)
        if (pageNumber == -1)
          continue;
        let sourcePdfPage = pages[pageNumber - 1];
        await new_pdf.embedPage(sourcePdfPage);
        new_pdf.addPage([sourcePdfPage.getWidth(),sourcePdfPage.getHeight()]);
        maxHeight = Math.max(maxHeight, sourcePdfPage.getHeight());
        maxWidth = Math.max(maxWidth, sourcePdfPage.getWidth());
      }
    }
    let scale = Math.min(100/maxWidth, 100/maxHeight)
    unified_source.pageCount = window.book.upload_blocks.filter(x => x.pdfDoc != null).reduce( (acc, cur) => acc + cur._pagesList.length, 0)
    unified_source.maxWidth = maxWidth
    unified_source.maxHeight = maxHeight
    unified_source._scale100px = scale
    document.getElementById("insert_pdf_source_details_here").innerHTML = `
            <div id="example_pdf_upload_page" style="width:`+maxWidth*scale+`px;height:`+maxHeight*scale+`px;"></div>
            There are <code>`+ unified_source.pageCount+`</code> pages<br>
            The working size is <code>`+ maxWidth+`</code> x <code>`+ maxHeight +`</code>
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
export const SIDE_COVERAGE_FRONT = 1
export const SIDE_COVERAGE_BACK = 2

export const builder = {
  _populateSheetFront: async function(new_pdf, folioList) {
    console.log("I should handle B ",folioList)
    const pageMap = folioList.map(f => [f[0],f[3]]).flat().reduce(function(acc, p) {
      acc[p] = window.book.unified_source.getPdfPageForPageNumber(p);
      return acc;
    }, {})
    console.log("pageMap is ",pageMap)
    const rawPageNumsToEmbed = [...new Set(Object.keys(pageMap))];
    const embeddedPages = await rawPageNumsToEmbed.reduce(async function(acc, p) {
      if (p == -1) {
        return acc;
      }
      acc[p] = await new_pdf.embedPage(pageMap[p])
      return acc;
    }, {})
    const new_page = new_pdf.addPage()
    folioList.forEach(function(f, i) {
      // TODO :handle blanks
      new_page.drawPage(embeddedPages[f[0]], { 
                          x: 0,
                          y: 100 * i,
                          xScale: 0.5,
                          yScale: 0.5,
                          opacity: 0.75,
                        })
      new_page.drawPage(embeddedPages[f[3]], { 
                          x: 100,
                          y: 100 * i,
                          xScale: 0.5,
                          yScale: 0.5,
                          opacity: 0.75,
                        })
    })
  },
  _populateSheetBack: function(new_pdf, sheetList) {
    console.log("I should handle A "+sheetList)
    // window.book.unified_source.getPdfPageForPageNumber(pageNum);
  },
  generatePreview: async function(firstSigOnly, side_coverage_mode) {
    const new_pdf = await PDFLib.PDFDocument.create();
    const sheets = window.book.imposed.sheets // TODO : prune down to just first signature if needed
    // TODO : move embedding up to this section - do a single embedded pass for front/back/both
    // build map that is result PageNum -> Embedded PDF ref
    sheets.forEach(s => {
      if (side_coverage_mode == SIDE_COVERAGE_BOTH || side_coverage_mode == SIDE_COVERAGE_FRONT) {
        this._populateSheetFront(new_pdf, s);
      }
      if (side_coverage_mode == SIDE_COVERAGE_BOTH || side_coverage_mode == SIDE_COVERAGE_FRONT) {
        this._populateSheetBack(new_pdf, s);
      }
    });
    return new_pdf;
  }
}