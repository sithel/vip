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
   */
  _renderPage: function(new_page, embedded_page, x, y, w, h, orientation) {
    if (embedded_page == undefined) {
      return;
    }
    let rotation_deg = 0
    switch(orientation) {
      case RIGHT_SIDE_UP:
        break;
      case UP_SIDE_DOWN:
        y += h;
        x += w;
        rotation_deg = 180;
        break;
      case BOTTOM_TO_LEFT:
        y += h
        rotation_deg = -90;
        break;
      case BOTTOM_TO_RIGHT:
        x += w;
        rotation_deg = 90;
        break;
    }
    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const xScale = (isTipped) ? h / embedded_page.width  : w / embedded_page.width;
    const yScale = (isTipped) ? w / embedded_page.height : h / embedded_page.height;
    // TODO : squish appropriately AND factor in all those paddings... 
    new_page.drawPage(embedded_page, { 
                          x: x + window.book.physical.short_margin,
                          y: y + window.book.physical.long_margin,
                          xScale: xScale,
                          yScale: yScale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(rotation_deg)
                        })
  },
  _calcDimens: function(new_page) {
    // TODO : take into account printer margins here
    return {
      pW : new_page.getWidth()  - window.book.physical.short_margin * 2,
      pH : new_page.getHeight() - window.book.physical.long_margin  * 2,
      renderPage : this._renderPage,
      flip_short : document.getElementById("flip_paper_short").checked
    }
  },
  _handleSingle: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    this._renderPage(new_page, pageMap[folio_list[0]], 0, 0)
  },
  _handleFolio: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap[f[0]], 0, 10*i)
      renderPage(new_page, pageMap[f[3]], 10, 10*i)
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
    renderPage(new_page, pageMap[folio_list[i[0][0]][i[0][1]]], 0,    pH/2, cell_w, cell_h, UP_SIDE_DOWN)
    renderPage(new_page, pageMap[folio_list[i[1][0]][i[1][1]]], pW/2, pH/2, cell_w, cell_h, UP_SIDE_DOWN)
    if (folio_list.length < 2)
      return
    renderPage(new_page, pageMap[folio_list[i[2][0]][i[2][1]]], 0,    0,    cell_w, cell_h, RIGHT_SIDE_UP)
    renderPage(new_page, pageMap[folio_list[i[3][0]][i[3][1]]], pW/2, 0,    cell_w, cell_h, RIGHT_SIDE_UP)
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
    renderPage(new_page, pageMap[folio_list[i[0][0]][i[0][1]]], 0,    2 * pH/3, cell_w, cell_h, outerFlip)
    renderPage(new_page, pageMap[folio_list[i[1][0]][i[1][1]]], pW/2, 2 * pH/3, cell_w, cell_h, outerFlip)
    if (folio_list.length < 2)
      return
    renderPage(new_page, pageMap[folio_list[i[2][0]][i[2][1]]], 0,    pH/3,    cell_w, cell_h, innerFlip)
    renderPage(new_page, pageMap[folio_list[i[3][0]][i[3][1]]], pW/2, pH/3,    cell_w, cell_h, innerFlip)
    if (folio_list.length < 3)
      return
    renderPage(new_page, pageMap[folio_list[i[4][0]][i[4][1]]], 0,    0,    cell_w, cell_h, outerFlip)
    renderPage(new_page, pageMap[folio_list[i[5][0]][i[5][1]]], pW/2, 0,    cell_w, cell_h, outerFlip)
  },
  _handleOctoFat: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap[f[0]], 0, 10*i)
      renderPage(new_page, pageMap[f[3]], 10, 10*i)
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
      renderPage(new_page, pageMap[folio_list[i[0][0]][i[0][1]]], pW/2, 3 * pH/4, cell_w, cell_h, BOTTOM_TO_RIGHT)
      renderPage(new_page, pageMap[folio_list[i[1][0]][i[1][1]]], pW/2, 2 * pH/4, cell_w, cell_h, BOTTOM_TO_RIGHT)
    }
    if (i[2][0] < folio_list.length) {
      renderPage(new_page, pageMap[folio_list[i[2][0]][i[2][1]]], 0, 3 * pH/4,    cell_w, cell_h, BOTTOM_TO_LEFT)
      renderPage(new_page, pageMap[folio_list[i[3][0]][i[3][1]]], 0, 2 * pH/4,    cell_w, cell_h, BOTTOM_TO_LEFT)
    }
    if (i[4][0] < folio_list.length) {
      renderPage(new_page, pageMap[folio_list[i[4][0]][i[4][1]]], 0, pH/4,        cell_w, cell_h, BOTTOM_TO_LEFT)
      renderPage(new_page, pageMap[folio_list[i[5][0]][i[5][1]]], 0, 0,           cell_w, cell_h, BOTTOM_TO_LEFT)
    }
    if (i[6][0] < folio_list.length) {
      renderPage(new_page, pageMap[folio_list[i[6][0]][i[6][1]]], pW/2,  pH/4,    cell_w, cell_h, BOTTOM_TO_RIGHT)
      renderPage(new_page, pageMap[folio_list[i[7][0]][i[7][1]]], pW/2, 0,        cell_w, cell_h, BOTTOM_TO_RIGHT)
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