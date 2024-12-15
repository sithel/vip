import { form } from './helper.js';
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
    console.log("== Processing Uploads...", detailsEl)
    document.getElementById("upload_blocks").setAttribute("style","pointer-events: none;opacity: 0.7;")
    uploadSection.setAttribute("disabled", "")
    btn.setAttribute("aria-busy", "true")

    let callback = function(){
      document.getElementById("upload_blocks").removeAttribute("style")
      uploadSection.removeAttribute("disabled")
      btn.removeAttribute("aria-busy")
      detailsEl.removeAttribute("style")
      detailsEl.setAttribute("open", "")
      console.log("=== Processing Uploads Complete ", detailsEl)
    }
    utils.processUploadBlocks(callback);
  },
  handlePageOrientationUpdate: function(e) {
    console.log("PDF orientation set to option "+ e.getAttribute("data-page-orientation-id"))
    window.book.unified_source.leftRotDeg = parseInt(e.getAttribute("data-page-orientation-left"))
    window.book.unified_source.rightRotDeg = parseInt(e.getAttribute("data-page-orientation-right"))
    window.drawing.updatePdfOrientationExample();
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
  }
  // renderPageRotationDemo : function(aRot, bRot, cRot, scale){ drawing.renderPageRotationDemo(aRot, bRot, cRot, scale) }
}

