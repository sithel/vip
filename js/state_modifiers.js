export const unified_source_modifier = {
  _updatePdfPlacementInfo: function() {
    const {pdf_w, pdf_h,render_w, render_h, display_unit} = this.calcPdfPlacementRenderInfo()
    document.getElementById("layout_padding_center_info").innerHTML = `
`+pdf_h+` <small class="units">`+display_unit+`</small>
 <div style="width:`+render_w+`px;height:`+render_h+`px;background:green;display: inline-block;margin-right: 15px;"></div> <br>
 `+pdf_w+` <small class="units">`+display_unit+`</small>
    `
    console.log("My calc is ", this.calcPdfPlacementRenderInfo())
    console.log(this)
  },
  _isTurned: function() {
    return this.leftRotDeg == -90 || this.leftRotDeg == 90 || this.rightRotDeg == -90 || this.rightRotDeg == 90
  },
  _calcPdfPlacementRenderInfo: function() {
    const isTurned = this.isTurned()
    const scaleDownFactor = 3.0
    return {
      pdf_w: window.roundIt(window.book.display_unit_scale * this.pdf_w),
      pdf_h: window.roundIt(window.book.display_unit_scale * this.pdf_h),
      render_w: this._use_scale_100px/scaleDownFactor * this.pdf_w,
      render_h: this._use_scale_100px/scaleDownFactor * this.pdf_h,
      display_unit: window.book.display_unit
    }
  },
  _calcRotationPreviewRenderInfo: function() {
    const isTurned = this.isTurned()
    return {
      w: this._use_scale_100px * this._use_pdf_w,
      h: this._use_scale_100px * this._use_pdf_h,
      isTurned: isTurned
    }
  },
  _hookUpMinorHelpers: function() {
    window.book.unified_source.pdfHeight = function() { return }
  },
  attach : function() {
    window.book.unified_source.isTurned = this._isTurned
    window.book.unified_source.updatePdfPlacementInfo = this._updatePdfPlacementInfo
    window.book.unified_source.calcPdfPlacementRenderInfo = this._calcPdfPlacementRenderInfo
    window.book.unified_source.calcRotationPreviewRenderInfo = this._calcRotationPreviewRenderInfo
    this._hookUpMinorHelpers()
    window.book.unified_source.processUpdate = function() {
      if (window.book.unified_source.maxHeight == undefined || window.book.unified_source.maxHeight == undefined) {
        return
      }
      this._use_pdf_h = this.maxHeight + this.marginTop + this.marginBottom;
      this._use_pdf_w = this.maxWidth + this.marginLeft + this.marginRight;
      this.pdf_h = (this.isTurned()) ? this._use_pdf_w : this._use_pdf_h
      this.pdf_w = (this.isTurned()) ? this._use_pdf_h : this._use_pdf_w
      this._use_scale_100px = Math.min(100/this._use_pdf_w, 100/this._use_pdf_h)
      console.log("====> Updating unified_source content!")
      console.log(this)
      window.drawing.updatePdfOrientationExample();
      this.updatePdfPlacementInfo()
    }
  }
}








export const imposed_modifier = {
  _calcPreviewSvgInfo: function() {
    const imposition = window.book.imposition
    const scaling = window.book.physical.scaling 
    const source = window.book.unified_source
    const pdf_w = source.maxWidth
    const pdf_h = source.maxHeight
    const scale_factor = 0.5
    const [s_pt, l_pt] = window.book.selected_paper_dimensions
    const [count_s, count_l] = [imposition.cellCount_s, imposition.cellCount_l]
    const cell_w = s_pt/count_s;
    const cell_h = l_pt/count_l;
    const w = (pdf_w == undefined) ? 0 : (scaling == "fill") ? cell_w : (scaling == "original") ? pdf_w : pdf_w * scale_factor
    const h = (pdf_h == undefined) ? 0 : (scaling == "fill") ? cell_h : (scaling == "original") ? pdf_h : pdf_h * scale_factor
    console.log(" ~~ calculating preview info -  "+s_pt+" / "+count_s+"  &   "+l_pt+" / "+count_l+" : "+scaling)
    return {
      cell_w: cell_w,
      cell_h: cell_h,
      w: w,
      h: h
    }
  },
  attach : function() {
    window.book.imposed.calcPreviewSvgInfo = this._calcPreviewSvgInfo
    window.book.imposed.processUpdate = function() {
      const imposition = window.book.imposition
      const selected_paper_dimensions = window.book.selected_paper_dimensions
      if (selected_paper_dimensions == undefined || selected_paper_dimensions.length != 2 || imposition.cellCount_l == undefined || imposition.cellCount_s == undefined ) {
        console.log("bailing because of    "+imposition.cellCount_l+" x "+imposition.cellCount_s +" on ",selected_paper_dimensions);
        return
      }
      window.book.imposed.isValid = true
      console.log("====> Updating imposed content!   "+imposition.cellCount_s+" x "+imposition.cellCount_l +" on "+selected_paper_dimensions[0]+" by "+selected_paper_dimensions[1]);
      drawing.renderPreviewSvg(document.getElementById("pdf_placement_svg"))
      console.log(this);
    }
  }
}