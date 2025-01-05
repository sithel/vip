import { form, PAGE_SIZES } from './helper.js';
import { utils } from './pdf.js';
import { fileHandler } from './files.js';
import { previewer } from './preview.js';

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
      if (window.book.unified_source.hasValidPdf()) {
        document.getElementById("page_manipulation").setAttribute("class","")
      }
      window.book.unified_source.processUpdate()
    }
    utils.processUploadBlocks(callback);
  },
  handlePdfMarginUpdate: function() {
    const top = parseInt(document.getElementById("pdf_margin_top").value)
    window.book.unified_source.marginTop = (isNaN(top)) ? 0 : top
    const bottom = parseInt(document.getElementById("pdf_margin_bottom").value)
    window.book.unified_source.marginBottom = (isNaN(bottom)) ? 0 : bottom
    const left = parseInt(document.getElementById("pdf_margin_left").value)
    window.book.unified_source.marginLeft = (isNaN(left)) ? 0 : left
    const right = parseInt(document.getElementById("pdf_margin_right").value)
    window.book.unified_source.marginRight = (isNaN(right)) ? 0 : right
    console.log(" margins "+window.book.unified_source.marginTop+" / "+window.book.unified_source.marginBottom+" / " + window.book.unified_source.marginLeft +" / "+ window.book.unified_source.marginRight)
    form.renderPDFMarginPreview()
    window.book.unified_source.processUpdate();
  },
  handleImpositionPaddingUpdate: function() {
    const top = parseInt(document.getElementById("pdf_padding_top").value)
    window.book.unified_source.marginTop = (isNaN(top)) ? 0 : top
    const bottom = parseInt(document.getElementById("pdf_padding_bottom").value)
    window.book.unified_source.marginBottom = (isNaN(bottom)) ? 0 : bottom
    const inner = parseInt(document.getElementById("pdf_padding_inner").value)
    window.book.unified_source.marginInner = (isNaN(inner)) ? 0 : inner
    const outer = parseInt(document.getElementById("pdf_padding_outer").value)
    window.book.unified_source.marginOuter = (isNaN(outer)) ? 0 : outer
    console.log(" margins "+window.book.unified_source.marginTop+" / "+window.book.unified_source.marginBottom+" / " + window.book.unified_source.marginInner +" / "+ window.book.unified_source.marginOuter)
    form.renderPDFMarginPreview()
    window.book.unified_source.processUpdate();
  },
  handlePageOrientationUpdate: function(e) {
    console.log("PDF orientation set to option "+ e.getAttribute("data-page-orientation-id"))
    window.book.unified_source.leftRotDeg = parseInt(e.getAttribute("data-page-orientation-left"))
    window.book.unified_source.rightRotDeg = parseInt(e.getAttribute("data-page-orientation-right"))
    window.book.unified_source.processUpdate()
  },
  handlePageImpositionUpdate: function(i) {
    window.book.imposition.canCustomizeCounts = imposition_options[i][3]
    window.book.imposition.defaultFolioCounts = imposition_options[i][4]
    window.book.imposition.foliosPerSheet = imposition_options[i][5]
    window.book.imposition.cellCount_s = imposition_options[i][6][0]
    window.book.imposition.cellCount_l = imposition_options[i][6][1]
    window.book.imposition.rotate = imposition_options[i][8]
    form.setSelectedImpositionInfo(imposition_options[i])
    form.calImpositionInfo(window.book.unified_source.pageCount)
    window.book.imposed.processUpdate();
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
    window.book.physical.scaling = document.getElementById("pdf_page_scaling").value;
    window.book.imposed.processUpdate();
  },
  handlePaperSizeDropdownChange: function(el) {
    console.log("We selected '"+el.value+"'")
    console.log(PAGE_SIZES[el.value])
    window.book.selected_paper_size = el.value
    const customDimens = function() {
      const customEl = document.getElementById("paper_size_custom")
      PAGE_SIZES['custom'] = [customEl.getAttribute("data-width-pt"),customEl.getAttribute("data-height-pt")]
      return PAGE_SIZES['custom']
    }
    const dimens = (el.value == "custom") ? customDimens() : PAGE_SIZES[el.value]
    window.book.physical.paper_size = PAGE_SIZES[el.value]
    window.book.selected_paper_dimensions = dimens
    document.getElementById("paper_size").setAttribute("placeholder", dimens[0] +" x "+dimens[1])
    if (el.value != "custom") {
      document.getElementById("paper_size").value = ""
    } else {
      document.getElementById("paper_size").value = dimens[0] + " x " + dimens[1]
    }
    window.book.imposed.processUpdate();
  },
  handleManualPaperSizeChange: function(el) {
    const optionEl = document.getElementById("paper_size_custom")
    console.log("Looking at '"+el.value+"' given ", optionEl)
    if (el.value == "") {
      el.removeAttribute("aria-invalid")
      if (optionEl != null)
        optionEl.remove()
      return;
    }
    const [w,h] =el.value.split("x").map(n => n.trim()).map(n => n.trim()).map(n => parseInt(n))
    const custom = (optionEl == null) ? document.createElement("option") : optionEl;
    custom.setAttribute("value", "custom");
    custom.setAttribute("id", "paper_size_custom");
    custom.setAttribute("data-width-pt", w);
    custom.setAttribute("data-height-pt", h);
    custom.innerHTML = "Custom ("+w+" x "+h+")"
    if (optionEl == null)
      document.getElementById("paper_size_options").appendChild(custom)
    el.setAttribute("aria-invalid", isNaN(w) || isNaN(h))
    document.getElementById("paper_size_options").value = "custom"
    window.book.imposed.processUpdate();
  },
  handleUnitChange: function(e) {
    const roundIt = window.roundIt;
    const selected = document.getElementById("unit_"+e.value)
    const display = selected.getAttribute("data-display")
    const scale = eval(selected.getAttribute("data-convert-from-pt"))
    window.book.display_unit = display
    window.book.display_unit_scale = scale
    window.book.physical.display_unit = display
    Array.from(document.getElementsByClassName("units")).forEach(x => x.innerHTML = display)
    console.log("display "+ display+" / scale "+scale)
    window.reb = PAGE_SIZES

    const dropDownEl = document.getElementById("paper_size_options")
    const selectedDropDown = dropDownEl.value
    dropDownEl.innerHTML = Object.keys(PAGE_SIZES)
      .map(p => "<option value='"+p+"'>"+p+" ("+roundIt(PAGE_SIZES[p][0] * scale)+" x "+roundIt(PAGE_SIZES[p][1] * scale)+" "+display+")</option>")
      .join("\n")
    dropDownEl.value = selectedDropDown
    window.book.imposed.processUpdate();
  },
  refreshPreview: async function() {
    if (window.book.unified_source.hasValidPdf()) {
      console.log("Starting Preview build...")
      document.getElementById('preview_pdf_btn').setAttribute("aria-busy", "true")
      await previewer.build(document.getElementById("pdf_results_preview_mode").checked)
        .then(() => {
          document.getElementById('preview_pdf_btn').innerHTML = "Refresh PDF Preview";
          document.getElementById('preview_pdf_btn').setAttribute("aria-busy", "")
        });
      console.log("Preview build completed...")
    } else {
      console.log("No valid PDF to work with")
    }
  },
  downloadFile: function(fileName, defaultFileName) {
    const nameToUse = (fileName == "") ? defaultFileName : fileName
    console.log("Downloading file ["+fileName+"/"+defaultFileName+"] -> ["+nameToUse+"]")
    console.log("gettin' ", fileHandler.makeTheZip(window.book.unified_source.pdf, nameToUse))
  }
}

