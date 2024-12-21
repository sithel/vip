import { form, PAGE_SIZES } from './helper.js';
import { utils } from './pdf.js';

export const basic = {
  txt : "sharks sharksss sharks",
  fun : function() { 
    console.log("hellow world, ", arguments[0]);
    window.reb = arguments[0]
  }
}

export const vip = {
  addUploadBlock: function(e) { form.addUploadBlock(e.parentElement.parentElement, e.parentElement) },
  removeUploadBlock : function(e) { 
    let id = parseInt(e.getAttribute("data-upload-index"));
    form.removeUploadBlock(e.parentElement.parentElement, e.parentElement);
    window.book.upload_blocks[id] = {}
  },
  processUploads : function(btn, uploadSection, detailsEl) {
    console.log("== Processing Uploads...")
    document.getElementById("upload_blocks").setAttribute("style","pointer-events: none;opacity: 0.7;")
    uploadSection.setAttribute("disabled", "")
    btn.setAttribute("aria-busy", "true")

    let callback = function(){
      document.getElementById("upload_blocks").removeAttribute("style")
      uploadSection.removeAttribute("disabled")
      btn.removeAttribute("aria-busy")
      detailsEl.removeAttribute("style")
      detailsEl.setAttribute("open", "")
      console.log("=== Processing Uploads Complete ")
    }
    utils.processUploadBlocks(callback);
  },
  handlePdfMarginUpdate: function() {
    const top = parseInt(document.getElementById("pdf_marin_top").value)
    window.book.unified_source.marginTop = (isNaN(top)) ? 0 : top
    const bottom = parseInt(document.getElementById("pdf_marin_bottom").value)
    window.book.unified_source.marginBottom = (isNaN(bottom)) ? 0 : bottom
    const left = parseInt(document.getElementById("pdf_marin_left").value)
    window.book.unified_source.marginLeft = (isNaN(left)) ? 0 : left
    const right = parseInt(document.getElementById("pdf_marin_right").value)
    window.book.unified_source.marginRight = (isNaN(right)) ? 0 : right
    console.log(" margins "+window.book.unified_source.marginTop+" / "+window.book.unified_source.marginBottom+" / " + window.book.unified_source.marginLeft +" / "+ window.book.unified_source.marginRight)
    form.renderPDFMarginPreview()
  },
  handlePageOrientationUpdate: function(e) {
    console.log("PDF orientation set to option "+ e.getAttribute("data-page-orientation-id"))
    window.book.unified_source.leftRotDeg = parseInt(e.getAttribute("data-page-orientation-left"))
    window.book.unified_source.rightRotDeg = parseInt(e.getAttribute("data-page-orientation-right"))
    window.drawing.updatePdfOrientationExample();
  },
  handlePageImpositionUpdate: function(i) {
    window.book.imposition.canCustomizeCounts = imposition_options[i][3]
    window.book.imposition.defaultFolioCounts = imposition_options[i][4]
    window.book.imposition.foliosPerSheet = imposition_options[i][5]
    form.setSelectedImpositionInfo(imposition_options[i])
    form.calImpositionInfo(window.book.unified_source.pageCount)
  },
  handleFoliosPerSigUpdate: function() {
    form.calImpositionInfo(window.book.unified_source.pageCount)
  },
  /*{ pageSelection: String, precedingBlanks: Int , file: File }*/
  uploadBlockBlank: function(e) {
    let id = parseInt(e.getAttribute("data-upload-index"))
    console.log("I see [blanks] "+id+" has ["+e.value+"] ", e)
    window.book.upload_blocks[id].precedingBlanks = e.value
  },
  uploadBlockPdf: function(e) {
    let id = parseInt(e.getAttribute("data-upload-index"))
    console.log("I see [pdf] "+id+" has ["+e.value+"] ", e)
    window.book.upload_blocks[id].file = e.files[0]
  },
  uploadBlockPageSelection: function(e) {
    let id = parseInt(e.getAttribute("data-upload-index"))
    console.log("I see [page selection] "+id+" has ["+e.value+"] ", e)
    window.book.upload_blocks[id].pageSelection = e.value
  },
  handlePdfPageScaling: function() {

  },
  handleUnitChange: function(e) {
    const roundIt = function(num) {
      return Math.round((num + Number.EPSILON) * 100) / 100
    }
    const selected = document.getElementById("unit_"+e.value)
    const display = selected.getAttribute("data-display")
    const scale = eval(selected.getAttribute("data-convert-from-pt"))
    Array.from(document.getElementsByClassName("units")).forEach(x => x.innerHTML = display)
    console.log("display "+ display+" / scale "+scale)
    window.reb = PAGE_SIZES

    document.getElementById("paper_size_options").innerHTML = Object.keys(PAGE_SIZES)
      .map(p => "<option value='"+p+"'>"+p+" ("+roundIt(PAGE_SIZES[p][0] * scale)+" x "+roundIt(PAGE_SIZES[p][1] * scale)+" "+display+")</option>")
      // .map(s => console.log(" > size "+s.length+" :: ["+s+"]"))

      .join("\n")
  }
  // renderPageRotationDemo : function(aRot, bRot, cRot, scale){ drawing.renderPageRotationDemo(aRot, bRot, cRot, scale) }
}

