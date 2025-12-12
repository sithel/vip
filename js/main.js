import { form, PAGE_SIZES } from './helper.js';
import { utils } from './pdf.js';
import { testPrint } from './testPrint.js';
import { fileHandler } from './files.js';
import { previewer } from './preview.js';
import { builder, SIDE_COVERAGE_BOTH } from './pdf.js';

export const basic = {
  txt : "sharks sharksss sharks",
  fun : function() { 
    console.log("hellow world, ", arguments[0]);
    window.reb = arguments[0]
  }
}

export const vip = {
  auditDisabledStates: function() {
    console.log("[auditing disabled states]")
    if (window.book.unified_source.hasValidPdf()) {
      document.getElementById("page_manipulation").classList.remove("disabled");
    } else {
      document.getElementById("page_manipulation").classList.add("disabled")
    }
    if (window.book.unified_source.hasValidPdf() && window.book.imposition.name != undefined) {
      document.getElementById("pdf_placement").classList.remove("disabled");
      document.getElementById("pdf_preview").classList.remove("disabled");
      document.getElementById("pdf_download").classList.remove("disabled");
    } else {
      document.getElementById("pdf_placement").classList.add("disabled");
      document.getElementById("pdf_preview").classList.add("disabled");
      document.getElementById("pdf_download").classList.add("disabled");
    }
  },
  removeUploadBlock : function(e) { 
    let id = parseInt(e.getAttribute("data-upload-index"));
    form.removeUploadBlock(e.parentElement.parentElement, e.parentElement);
    window.book.upload_blocks[id] = {}
    document.getElementById("upload_block_interlacing").style.display = (document.getElementsByClassName("upload_block").length == 2) ? '':'none'
  },
  processUploads : function(btn, uploadSection, detailsEl, is_interlaced) {
    console.log("== Processing Uploads...")
    document.getElementById("upload_blocks").setAttribute("style","pointer-events: none;opacity: 0.7;")
    btn.setAttribute("aria-busy", "true")
    window.book.unified_source.interlaced = is_interlaced;

    let callback = function(){
      document.getElementById("upload_blocks").removeAttribute("style")
      btn.removeAttribute("aria-busy")
      detailsEl.removeAttribute("style")
      detailsEl.setAttribute("open", "")
      console.log("=== Processing Uploads Complete ")
      if (window.book.unified_source.hasValidPdf()) {
        document.getElementById("page_manipulation").setAttribute("class","")
        if (window.book.imposition.name != undefined) {
          form.calImpositionInfo(window.book.unified_source.pageCount)
        }
      }
      window.book.unified_source.processUpdate()
      vip.auditDisabledStates()
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
    window.book.imposition.name = imposition_options[i][0]
    window.book.imposition.canCustomizeCounts = imposition_options[i][3]
    window.book.imposition.defaultFolioCounts = imposition_options[i][4]
    window.book.imposition.foliosPerSheet = imposition_options[i][5]
    window.book.imposition.cellCount_s = imposition_options[i][6][0]
    window.book.imposition.cellCount_l = imposition_options[i][6][1]
    window.book.imposition.rotate = imposition_options[i][8]
    form.setSelectedImpositionInfo(imposition_options[i])
    form.calImpositionInfo(window.book.unified_source.pageCount)
    window.book.imposed.processUpdate();
    this.auditDisabledStates();
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
    if (window.book.physical.scaling == 'original') {
      document.getElementById("pdf_padding_outer_label").style.visibility = "hidden"
      document.getElementById("pdf_padding_bottom_label").style.visibility = "hidden"
    } else {
      document.getElementById("pdf_padding_outer_label").style.visibility = ""
      document.getElementById("pdf_padding_bottom_label").style.visibility = ""
    }
    window.book.imposed.processUpdate();
  },
  handlePdfPagePlacement: function() {
    window.book.physical.placement = document.getElementById("pdf_white_space_placement").value;
    window.book.imposed.processUpdate();
  },
  rotatePrinterPaper: function() {
    const paperSelectionValue = document.getElementById("paper_size_options").value
    const currentOrientation = PAGE_SIZES[paperSelectionValue] 
    const customDimensInput = document.getElementById("paper_size")
    customDimensInput.value = currentOrientation[1] + " x "+ currentOrientation[0]
    console.log("[rotatePrinterPaper] Rotating paper ["+paperSelectionValue+"] was  ", PAGE_SIZES[paperSelectionValue] )
    vip.handleManualPaperSizeChange(customDimensInput)
  },
  /**  Expects the `paper_size_options` select element  */
  handlePaperSizeDropdownChange: function(el, update_text_field) {
    console.log("[handlePaperSizeDropdownChange] We selected '"+el.value+"'")
    const customDimens = function() {
      const customEl = document.getElementById("paper_size_custom")
      if (customEl == null) 
        return PAGE_SIZES
      PAGE_SIZES['custom'] = [parseFloat(customEl.getAttribute("data-width-pt")),parseFloat(customEl.getAttribute("data-height-pt"))]
      return PAGE_SIZES
    }
    const dimens = (el.value == "custom") ? customDimens()[el.value] : PAGE_SIZES[el.value]
    console.log("[handlePaperSizeDropdownChange]    > using dimensions "+ dimens[0]+" x "+dimens[1])
    window.book.selected_paper_size = dimens
    window.book.physical.paper_size = dimens
    window.book.selected_paper_dimensions = dimens
    document.getElementById("paper_size").setAttribute("placeholder", dimens[0] +" x "+dimens[1])
    if (el.value != "custom") {
      document.getElementById("paper_size").value = ""
    } else if (update_text_field) {
      document.getElementById("paper_size").value = dimens[0] + " x " + dimens[1]
    }
    window.book.imposed.processUpdate();
  },
  /** Expects the `paper_size` input text element*/
  handleManualPaperSizeChange: function(el) {
    const optionEl = document.getElementById("paper_size_custom")
    console.log("[handleManualPaperSizeChange] looking at custom user input '"+el.value+"'")
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
    this.handlePaperSizeDropdownChange(document.getElementById("paper_size_options"), false)
    this.handlePaperMarginUpdate()
  },
  handlePaperMarginUpdate: function() {
    const shortMargin = parseInt(document.getElementById("paper_margin_short").value)
    const longMargin = parseInt(document.getElementById("paper_margin_long").value)
    window.book.physical.short_margin = (isNaN(shortMargin)) ? 0 : shortMargin
    window.book.physical.long_margin  = (isNaN(longMargin))  ? 0 : longMargin
    const x_is_short = window.book.physical.paper_size[0] <= window.book.physical.paper_size[1]
    const x_printer_margin_bonus = (x_is_short) ? window.book.physical.long_margin : window.book.physical.short_margin
    const y_printer_margin_bonus = (x_is_short) ? window.book.physical.short_margin : window.book.physical.long_margin
    window.book.physical.printer_marin_bonus = [x_printer_margin_bonus, y_printer_margin_bonus]

  },
  generateTestPrint: function() {
    testPrint.build()
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
  handleMarkupDetailsChange: function(e, detailsId) {
    const display = e.checked
    document.getElementById(detailsId).style.display = (display) ? '' : 'none';
  },
  handleSewingStationChange: function(e) {
    const display = e.checked
    document.getElementById("markup_sewing_stations").style.display = (display) ? '' : 'none';
    document.getElementById("markup_sewing_stations_color").style.display = (display) ? '' : 'none';
    document.getElementById("markup_sewing_stations_details").style.display = (display) ? '' : 'none';

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
  downloadFile: async function(fileName, defaultFileName) {
    const nameToUse = (fileName == "") ? defaultFileName : fileName
    const downloadAggregate = document.getElementById("download-aggregate").checked
    const frontAndBackSeparate = document.getElementById("download-front-back").checked
    const signatureFiles = document.getElementById("download-signatures").checked
    fileHandler.handleDownloadOptions(fileName, downloadAggregate, frontAndBackSeparate, signatureFiles);
  }
}

