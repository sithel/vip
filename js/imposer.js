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
    console.log("New page ",new_page)
    console.log("Embedded page ",embedded_page)
    console.log(" x : "+x+" \t\t y : "+y)
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
    }
    const xScale = w / embedded_page.width;
    const yScale = h / embedded_page.height;
    // TODO : squish appropriately AND factor in all those paddings... 
    new_page.drawPage(embedded_page, { 
                          x: x,
                          y: y,
                          xScale: xScale,
                          yScale: yScale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(rotation_deg)
                        })
  },
  _calcDimens: function(new_page) {
    // TODO : take into account printer margins here
    return {
      pW : new_page.getWidth(),
      pH : new_page.getHeight(),
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
    if (folio_list.length < 1)
      return
    renderPage(new_page, pageMap[folio_list[0][0]], 0,    pH/2, cell_w, cell_h, UP_SIDE_DOWN)
    renderPage(new_page, pageMap[folio_list[0][3]], pW/2, pH/2, cell_w, cell_h, UP_SIDE_DOWN)
    if (folio_list.length < 2)
      return
    renderPage(new_page, pageMap[folio_list[1][1]], 0,    0,    cell_w, cell_h, RIGHT_SIDE_UP)
    renderPage(new_page, pageMap[folio_list[1][2]], pW/2, 0,    cell_w, cell_h, RIGHT_SIDE_UP)
  },
  _handleSexto: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage
    const pW = new_page.getWidth()
    const pH = new_page.getHeight()
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap[f[0]], 0, i * pH/3)
      renderPage(new_page, pageMap[f[3]], pW/2, i * pH/3)
    })
  },
  _handleOctoFat: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap[f[0]], 0, 10*i)
      renderPage(new_page, pageMap[f[3]], 10, 10*i)
    })
  },
  _handleOctoThin: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage
    const pW = new_page.getWidth()
    const pH = new_page.getHeight()
    const folioXOffsets = [0, 0, pW/2, pW/2]
    const folioYOffsets = [pH/2, 0, 0, pH/2]
    folio_list.forEach(function(f, i) {
      renderPage(new_page, pageMap[f[0]], folioXOffsets[i], folioYOffsets[i])
      renderPage(new_page, pageMap[f[3]], folioXOffsets[i] + pW/4, folioYOffsets[i])
    })
  },
  // FRONT : folio [0] & [3]            BACK : folio [1] & [2]
  imposePdf: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    console.log("  >> pageMap is ",pageMap)
    // 
    switch(window.book.imposition.name) {
      case 'single': this._handleSingle(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'folio': this._handleFolio(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'quarto': this._handleQuarto(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case '6_side': this._handleSexto(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'octavo_fat': this._handleOctoFat(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'octavo_thin': this._handleOctoThin(new_page, pageMap, folio_list, sheet_index, is_front); break;
    }
    console.log("  >> page isFront ["+is_front+"] ",folio_list)
  }
}