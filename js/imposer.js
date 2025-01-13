const RIGHT_SIDE_UP = 0;
const UP_SIDE_DOWN = 1;
const BOTTOM_TO_LEFT = 2;
const BOTTOM_TO_RIGHT = 3;

export const imposerMagic = {
  /**
   * new_page - the new `PDFPage` you're drawing onto
   * embedded_page - what you're drawing -- it has already been embedded
   * x / y - the LOWER LEFT position of that Imposition Cell on the SHEET
   * w / h - the CELL SPACE AVAILABLE 
   * orientation - one of the RIGHT_SIDE_UP/UP_SIDE_DOWN/BOTTOM_TO_LEFT/BOTTOM_TO_RIGHT - how to render page in cell
   * is_odd - as viewed from page numbers in a book, starting w/ page 1.  Odd == right hand side of page, even == left hand side of page
   */
  _renderPage: function(new_page, page_map, page_num, corner_x, corner_y, w, h, orientation) {
    const embedded_page = page_map[page_num];
    if (embedded_page == undefined) {
      return;
    }
    const is_odd = page_num % 2 == 0 // YES this looks backwards - because page_map is 0 indexed, but the idea of a book is 1 indexed
    if (window.book.physical.scaling == 'original') {
      this._renderPageOriginal(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd);
    } else if (window.book.physical.scaling == 'fit') {
      this._renderPageFit(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd);
    } else if (window.book.physical.scaling == 'fill') {
      this._renderPageFill(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd);
    } else {
      throw new Error("Invalid scaling option : ",window.book.physical.scaling);
    }
  },
  _renderPageOriginal: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd) {
    console.log("==[Render Original]")
    const [embedded_w, embedded_h] = [embedded_page.width, embedded_page.height]
    let rotation_deg = 0
    switch(orientation) {
      case RIGHT_SIDE_UP:
        break;
      case UP_SIDE_DOWN:
        rotation_deg = 180;
        break;
      case BOTTOM_TO_LEFT:
        rotation_deg = -90;
        break;
      case BOTTOM_TO_RIGHT:
        rotation_deg = 90;
        break;
    }
    const finalPlacement = this._calcPlacementOffsets(corner_x, corner_y, w, h, orientation, 1, is_odd, embedded_w, embedded_h)
    new_page.drawPage(embedded_page, { 
                          x: finalPlacement.x,
                          y: finalPlacement.y,
                          xScale: finalPlacement.scale,
                          yScale: finalPlacement.scale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(rotation_deg)
                        })
    this._maskPage(new_page, embedded_page, corner_x + window.book.physical.short_margin, corner_y + window.book.physical.long_margin, w, h, orientation);
  },
  _calcPadding: function() {
    const isOriginal = window.book.physical.placement == 'original';
    return {
      padding_i: Number(document.getElementById("pdf_padding_inner").value),
      padding_o: (isOriginal) ? 0 : Number(document.getElementById("pdf_padding_outer").value),
      padding_t: Number(document.getElementById("pdf_padding_top").value),
      padding_b: (isOriginal) ? 0 : Number(document.getElementById("pdf_padding_bottom").value),
      total_w: Number(document.getElementById("pdf_padding_inner").value) + Number(document.getElementById("pdf_padding_outer").value),
      total_h: Number(document.getElementById("pdf_padding_top").value) + Number(document.getElementById("pdf_padding_bottom").value)
    }
  },
  _renderPageFit: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd) {
    console.log("==[Render Fit]")
    const {total_w, total_h} = this._calcPadding();
    const [embedded_w, embedded_h] = [embedded_page.width, embedded_page.height]
    let rotation_deg = 0;
    let [useW, useH] = (orientation == RIGHT_SIDE_UP || orientation == UP_SIDE_DOWN) ? [embedded_w + total_w, embedded_h + total_h] : [embedded_h + total_h, embedded_w + total_w];
    switch(orientation) {
      case RIGHT_SIDE_UP:
        break;
      case UP_SIDE_DOWN:
        rotation_deg = 180;
        break;
      case BOTTOM_TO_LEFT:
        rotation_deg = -90;
        break;
      case BOTTOM_TO_RIGHT:
        rotation_deg = 90;
        break;
    }
    const scale = Math.min(w/useW, h/useH);
    const finalPlacement = this._calcPlacementOffsets(corner_x, corner_y, w, h, orientation, scale, is_odd, embedded_w, embedded_h)
    new_page.drawPage(embedded_page, { 
                          x: finalPlacement.x,
                          y: finalPlacement.y,
                          xScale: finalPlacement.scale,
                          yScale: finalPlacement.scale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(rotation_deg)
                        })
    this._maskPage(new_page, embedded_page, corner_x + window.book.physical.short_margin, corner_y + window.book.physical.long_margin, w, h, orientation);
  },
  _renderPageFill: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd) {
    console.log("==[Render Fill]")
    const {padding_i, padding_o, padding_t, padding_b, total_w, total_h} = this._calcPadding();
    const [embedded_w, embedded_h] = [embedded_page.width, embedded_page.height]
    let [x, y, rotation_deg] = [corner_x, corner_y, 0]
    switch(orientation) {
      case RIGHT_SIDE_UP:
        y += padding_b - padding_t;
        x += (is_odd) ? padding_i - padding_o : padding_o - padding_i;
        break;
      case UP_SIDE_DOWN:
        y += h + padding_t - padding_b;
        x += w;
        x += (is_odd) ? padding_i - padding_o : padding_o - padding_i;
        rotation_deg = 180;
        break;
      case BOTTOM_TO_LEFT:
        y += h
        x += padding_b - padding_t;
        rotation_deg = -90;
        break;
      case BOTTOM_TO_RIGHT:
        x += w + padding_t - padding_b;
        rotation_deg = 90;
        break;
    }
    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const xScale = (isTipped) ? h / (embedded_w + total_w) : w / (embedded_w + total_w);
    const yScale = (isTipped) ? w / (embedded_h + total_h) : h / (embedded_h + total_h);
    new_page.drawPage(embedded_page, { 
                          x: x + window.book.physical.short_margin,
                          y: y + window.book.physical.long_margin,
                          xScale: xScale,
                          yScale: yScale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(rotation_deg)
                        })
    this._maskPage(new_page, embedded_page, corner_x + window.book.physical.short_margin, corner_y + window.book.physical.long_margin, w, h, orientation);
  },
  /*
   * Remember: working from the lower-left corner of the cell
   * embedded_w / embedded_h -- already flipped if needed so it aligns w/ the correct dimensions for xSpace / ySpace
   */
  _calcPlacementOffsets: function(corner_x, corner_y, w, h, orientation, scale, is_odd, embedded_w, embedded_h) {
    const p = window.book.physical.placement;
    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const {padding_i, padding_o, padding_t, padding_b, total_w, total_h} = this._calcPadding();
    embedded_w = (embedded_w) * scale;
    embedded_h = (embedded_h) * scale;
    const xSpace = w - embedded_w;
    const ySpace = h - embedded_h;
    let xPadding = 0;
    let yPadding = 0;
    switch(orientation) {
      case RIGHT_SIDE_UP:
        if (p == "center" || p == "center_top") {
          xPadding += (w - embedded_w)/2.0;
        } else if (!is_odd) {
          xPadding += (w - embedded_w);
        }
        if (p == "center" || p == "snug_center") {
          yPadding += (h - embedded_h)/2.0;
        } else {
          yPadding += (h - embedded_h);
        }
      break;
      case UP_SIDE_DOWN:
        xPadding += embedded_w
        yPadding += embedded_h
        if (p == "center" || p == "center_top") {
          xPadding += (w - embedded_w)/2.0;
        } else if (is_odd) {
          xPadding += (w - embedded_w);
        }
        if (p == "center" || p == "snug_center") {
          yPadding += (h - embedded_h)/2.0;
        }
      break;
      case BOTTOM_TO_RIGHT:
        if (p == "snug_center" || p == "center") {
          xPadding += (w - embedded_h)/2.0;
        }
        xPadding += embedded_h + padding_t - padding_b;
        if (p == "center" || p == "center_top") {
          yPadding += (h - embedded_w)/2.0;
        } else if (!is_odd) {
          yPadding += (h - embedded_w);
        }
      break;
      case BOTTOM_TO_LEFT:
        if (p == "snug_center" || p == "center") {
          xPadding += (w - embedded_h)/2.0;
        } else {
          xPadding += (w - embedded_h);
        }
        if (p == "center" || p == "center_top") {
          yPadding += (h - embedded_w)/2.0;
        } else if (is_odd) {
          yPadding += (h - embedded_w);
        }
        yPadding += embedded_w;
        xPadding += padding_b - padding_t;
      break;
    }
    return {
      x: corner_x + window.book.physical.short_margin + xPadding,
      y: corner_y + window.book.physical.long_margin + yPadding,
      scale: scale
    }
  },
  _maskPage: function(new_page, embedded_page, x, y, w, h, orientation){
    const [margin_top, margin_bottom, margin_right, margin_left] = [20, 30, 40, 50];
    const lower = (orientation == RIGHT_SIDE_UP) ? margin_bottom : (orientation == UP_SIDE_DOWN) ? margin_top : (orientation == BOTTOM_TO_RIGHT) ? margin_left : margin_right
    const upper = (orientation == RIGHT_SIDE_UP) ? margin_top : (orientation == UP_SIDE_DOWN) ? margin_bottom : (orientation == BOTTOM_TO_RIGHT) ? margin_right : margin_left
    const left = (orientation == RIGHT_SIDE_UP) ? margin_left : (orientation == UP_SIDE_DOWN) ? margin_right : (orientation == BOTTOM_TO_RIGHT) ? margin_top : margin_bottom
    const right = (orientation == RIGHT_SIDE_UP) ? margin_right : (orientation == UP_SIDE_DOWN) ? margin_left : (orientation == BOTTOM_TO_RIGHT) ? margin_bottom : margin_top
    if (lower > 0) {
      new_page.drawRectangle({
                          width: w,
                          height: lower,
        x: x, y: y, borderWidth: 0, color: PDFLib.rgb(0,1,1), opacity: 0.25
      });
    }
    if (upper > 0) {
      new_page.drawRectangle({
                          width: w,
                          height: upper,
        x: x, y: y + h - upper, borderWidth: 0, color: PDFLib.rgb(0,0,1), opacity: 0.25
      });
    }
    if (left > 0) {
      new_page.drawRectangle({
                          width: left,
                          height: h,
        x: x, y: y, borderWidth: 0, color: PDFLib.rgb(0,1,0), opacity: 0.25
      });
    }
    if (right > 0) {
      new_page.drawRectangle({
                          width: right,
                          height: h,
        x: x + w - right, y: y, borderWidth: 0, color: PDFLib.rgb(1,0,1), opacity: 0.25
      });
    }
  },
  _calcDimens: function(new_page) {
    return {
      pW : new_page.getWidth()  - window.book.physical.short_margin * 2,
      pH : new_page.getHeight() - window.book.physical.long_margin  * 2,
      renderPage : this._renderPage.bind(this),
      flip_short : document.getElementById("flip_paper_short").checked
    }
  },
  _handleSingle: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    this._renderPage(new_page, pageMap[folio_list[0]], 0, 0)
  },
  _handleFolio: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short} = this._calcDimens(new_page)
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap, f[(is_front) ? 0 : (flip_short) ? 2 : 1], 0, pH/2, (!is_front &&  !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT)
      renderPage(new_page, pageMap, f[(is_front) ? 3 : (flip_short) ? 1 : 2], 0, 0, (!is_front &&  !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT)
    })
  },
  _handleQuarto: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short} = this._calcDimens(new_page)
    const cell_w = pW/2;
    const cell_h = pH/2;
    const i = (is_front) ? [[0, 0], [0,3], [1,1], [1,2]] 
        : (flip_short) ? [[1, 0], [1,3], [0,1], [0, 2]] 
            : [[0, 2], [0,1], [1,3], [1,0]]
    if (folio_list.length < 1)
      return
    renderPage(new_page, pageMap, folio_list[i[0][0]][i[0][1]], 0,    pH/2, cell_w, cell_h, UP_SIDE_DOWN)
    renderPage(new_page, pageMap, folio_list[i[1][0]][i[1][1]], pW/2, pH/2, cell_w, cell_h, UP_SIDE_DOWN)
    if (folio_list.length < 2)
      return
    renderPage(new_page, pageMap, folio_list[i[2][0]][i[2][1]], 0,    0,    cell_w, cell_h, RIGHT_SIDE_UP)
    renderPage(new_page, pageMap, folio_list[i[3][0]][i[3][1]], pW/2, 0,    cell_w, cell_h, RIGHT_SIDE_UP)
  },
  _handleSexto: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short} = this._calcDimens(new_page)
    const cell_w = pW/2;
    const cell_h = pH/3;
    const i = (is_front) ? [[0, 0], [0,3], [1,1], [1,2], [2, 0], [2, 3]] 
        : (flip_short) ? [[2, 1], [2,2], [1,0], [1,3], [0, 1], [0, 2]] 
            : [[0, 2], [0,1], [1,3], [1,0], [2, 2], [2, 1]] 
    const outerFlip = (is_front) ? UP_SIDE_DOWN  : (flip_short) ? RIGHT_SIDE_UP : UP_SIDE_DOWN
    const innerFlip = (is_front) ? RIGHT_SIDE_UP : (flip_short) ? UP_SIDE_DOWN  : RIGHT_SIDE_UP
    if (folio_list.length < 1)
      return
    renderPage(new_page, pageMap, folio_list[i[0][0]][i[0][1]], 0,    2 * pH/3, cell_w, cell_h, outerFlip)
    renderPage(new_page, pageMap, folio_list[i[1][0]][i[1][1]], pW/2, 2 * pH/3, cell_w, cell_h, outerFlip)
    if (folio_list.length < 2)
      return
    renderPage(new_page, pageMap, folio_list[i[2][0]][i[2][1]], 0,    pH/3,    cell_w, cell_h, innerFlip)
    renderPage(new_page, pageMap, folio_list[i[3][0]][i[3][1]], pW/2, pH/3,    cell_w, cell_h, innerFlip)
    if (folio_list.length < 3)
      return
    renderPage(new_page, pageMap, folio_list[i[4][0]][i[4][1]], 0,    0,    cell_w, cell_h, outerFlip)
    renderPage(new_page, pageMap, folio_list[i[5][0]][i[5][1]], pW/2, 0,    cell_w, cell_h, outerFlip)
  },
  _handleOctoFat: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage.bind(this)
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap, f[0], 0, 10*i)
      renderPage(new_page, pageMap, f[3], 10, 10*i)
    })
  },
  _handleOctoThin: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short} = this._calcDimens(new_page)
    const cell_w = pW/2;
    const cell_h = pH/4;
    // upper right, upper left, lower left, lower right
    const i = (is_front) ? [[0, 0], [0,3], [1,1], [1,2], [2, 3], [2, 0], [3, 2], [3, 1]] 
        : (flip_short) ? [[3,0], [3,3], [2,1], [2,2], [1,3], [1,0], [0,2], [0,1]]
            : [[1,0], [1,3], [0,1], [0,2], [3,3], [3,0], [2,2], [2,1]]
    if (i[0][0] < folio_list.length) {
      renderPage(new_page, pageMap, folio_list[i[0][0]][i[0][1]], pW/2, 3 * pH/4, cell_w, cell_h, BOTTOM_TO_RIGHT)
      renderPage(new_page, pageMap, folio_list[i[1][0]][i[1][1]], pW/2, 2 * pH/4, cell_w, cell_h, BOTTOM_TO_RIGHT)
    }
    if (i[2][0] < folio_list.length) {
      renderPage(new_page, pageMap, folio_list[i[2][0]][i[2][1]], 0, 3 * pH/4,    cell_w, cell_h, BOTTOM_TO_LEFT)
      renderPage(new_page, pageMap, folio_list[i[3][0]][i[3][1]], 0, 2 * pH/4,    cell_w, cell_h, BOTTOM_TO_LEFT)
    }
    if (i[4][0] < folio_list.length) {
      renderPage(new_page, pageMap, folio_list[i[4][0]][i[4][1]], 0, pH/4,        cell_w, cell_h, BOTTOM_TO_LEFT)
      renderPage(new_page, pageMap, folio_list[i[5][0]][i[5][1]], 0, 0,           cell_w, cell_h, BOTTOM_TO_LEFT)
    }
    if (i[6][0] < folio_list.length) {
      renderPage(new_page, pageMap, folio_list[i[6][0]][i[6][1]], pW/2,  pH/4,    cell_w, cell_h, BOTTOM_TO_RIGHT)
      renderPage(new_page, pageMap, folio_list[i[7][0]][i[7][1]], pW/2, 0,        cell_w, cell_h, BOTTOM_TO_RIGHT)
    }
  },
  // FRONT : folio [0] & [3]            BACK : folio [1] & [2]
  imposePdf: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    switch(window.book.imposition.name) {
      case 'single': this._handleSingle(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'folio': this._handleFolio(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'quarto': this._handleQuarto(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case '6_side': this._handleSexto(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'octavo_fat': this._handleOctoFat(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'octavo_thin': this._handleOctoThin(new_page, pageMap, folio_list, sheet_index, is_front); break;
    }
  }
}