const RIGHT_SIDE_UP = 0;
const UP_SIDE_DOWN = 1;
const BOTTOM_TO_LEFT = 2;
const BOTTOM_TO_RIGHT = 3;

export const imposerMagic = {
  /**
   * new_page - the new `PDFPage` you're drawing onto
   * page_map - map of potential page that you're drawing -- they have all already been embedded
   * page_num - page number of final PDF to be rendered
   * x / y - the LOWER LEFT position of that Imposition Cell on the SHEET
   * w / h - the CELL SPACE AVAILABLE 
   * orientation - one of the RIGHT_SIDE_UP/UP_SIDE_DOWN/BOTTOM_TO_LEFT/BOTTOM_TO_RIGHT - how to render page in cell
   * is_odd - as viewed from page numbers in a book, starting w/ page 1.  Odd == right hand side of page, even == left hand side of page
   * center_info - emtpy list if not, [sig index, isOuter - ture outer / false inner]
   */
  _renderPage: function(new_page, page_map, page_num, corner_x, corner_y, w, h, orientation, center_info) {
    const embedded_page = page_map[page_num];
    if (embedded_page == undefined) {
      return;
    }
    const is_odd = page_num % 2 == 0 // YES this looks backwards - because page_map is 0 indexed, but the idea of a book is 1 indexed
    if (window.book.physical.scaling == 'original') {
      this._renderPageOriginal(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info);
    } else if (window.book.physical.scaling == 'fit') {
      this._renderPageFit(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info);
    } else if (window.book.physical.scaling == 'fill') {
      this._renderPageFill(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info);
    } else {
      throw new Error("Invalid scaling option : ",window.book.physical.scaling);
    }
  },
  _calcPadding: function() {
    const isOriginal = window.book.physical.placement == 'original';
    const bottom =  (isOriginal) ? 0 : Number(document.getElementById("pdf_padding_bottom").value)
    const outer = (isOriginal) ? 0 : Number(document.getElementById("pdf_padding_outer").value)
    return {
      padding_i: Number(document.getElementById("pdf_padding_inner").value),
      padding_o: outer,
      padding_t: Number(document.getElementById("pdf_padding_top").value),
      padding_b: bottom,
      total_w: Number(document.getElementById("pdf_padding_inner").value) + outer,
      total_h: Number(document.getElementById("pdf_padding_top").value) + bottom
    }
  },
  _renderSpinePdfBounds: function(new_page, finalPlacement, embedded_w, embedded_h, orientation) {
    const enabled_boundry_marks = document.getElementById('markup_spine_bounds').checked
    if (!enabled_boundry_marks)
      return
    let spineHead = [finalPlacement.x, finalPlacement.y]
    let spineTail = [finalPlacement.x, finalPlacement.y]
    const [w, h] = [embedded_w * finalPlacement.xScale, embedded_h * finalPlacement.yScale]
    switch(orientation) {
      case RIGHT_SIDE_UP:
        spineHead = [finalPlacement.spineHead[0], finalPlacement.y + h];
        spineTail = [finalPlacement.spineTail[0], finalPlacement.y];
      break;
      case UP_SIDE_DOWN:
        spineHead = [finalPlacement.spineHead[0], finalPlacement.y - h];
        spineTail = [finalPlacement.spineTail[0], finalPlacement.y];
      break;
      case BOTTOM_TO_RIGHT:
        spineHead = [finalPlacement.x - h, finalPlacement.spineHead[1]];
        spineTail = [finalPlacement.x, finalPlacement.spineTail[1]];
      break;
      case BOTTOM_TO_LEFT:
        spineHead = [finalPlacement.x + h, finalPlacement.spineHead[1]];
        spineTail = [finalPlacement.x, finalPlacement.spineTail[1]];
      break;
    }
    const weight = this._collectValueOrPlaceholder(document.getElementById('markup_spine_bounds_weight'));
    const color = this._collectValueOrPlaceholder(document.getElementById('markup_spine_bounds_color'));
    const len = this._collectValueOrPlaceholder(document.getElementById('markup_spine_bounds_length'));;
    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const delta = (isTipped) ? [0, len] : [len, 0]// : [0, len]
    new_page.drawLine({
      start: { x: (spineHead[0] + delta[0]), y: spineHead[1] + delta[1] },        end: { x: spineHead[0] - delta[0], y: spineHead[1] - delta[1] },
      thickness: weight,  color: color,   opacity: 1,
    });
    new_page.drawLine({
      start: { x: spineTail[0] + delta[0], y: spineTail[1] + delta[1] },          end: { x: spineTail[0] - delta[0], y: spineTail[1] - delta[1] },
      thickness: weight,  color: color,   opacity: 1,
    });
  },
  /**
   * @param spineHead / spineTail - two dimentional arrays, [x, y]
   */
  _renderSpineSigOrder: function(new_page, sig_num, spineHead, spineTail) {
    const enabled_order_marks = document.getElementById('markup_spine_order').checked
    if (!enabled_order_marks)
      return
    const color = this._collectValueOrPlaceholder(document.getElementById('markup_spine_order_color'));
    const weight = this._collectValueOrPlaceholder(document.getElementById('markup_spine_order_weight'));
    const sig_count = window.book.imposed.signatures.length;
    const segs = sig_count + 3
    const spineDelta = [(spineTail[0] - spineHead[0]) / segs, (spineTail[1] - spineHead[1]) / segs]
    const widthDelta = [ ( (spineDelta[0] == 0)? weight : 0 ),  ( (spineDelta[1] == 0)? weight : 0 )]
    new_page.drawRectangle({
      x: spineHead[0] + spineDelta[0] + spineDelta[0] * sig_num - widthDelta[0]/2.0,
      y: spineHead[1] + spineDelta[1] + spineDelta[1] * sig_num - widthDelta[1]/2.0,
      width:  (widthDelta[0] == 0) ? spineDelta[0] : widthDelta[0],
      height: (widthDelta[1] == 0) ? spineDelta[1] : widthDelta[1],
      borderWidth: 0.5,
      borderColor: PDFLib.rgb(1, 1, 1),
      color: color,
      opacity: 1,
      borderOpacity: 1,
    })
  },
  /**
   * @param spineHead / spineTail - two dimentional arrays, [x, y]
   */
  _renderSewingStations: function(new_page, spineHead, spineTail, orientation, isSpine) {
    const enabled_sewing_marks = document.getElementById('markup_sewing').checked
    const mark_location = document.getElementById('markup_sewing_stations').value
    if (!enabled_sewing_marks)
      return
    if (isSpine && mark_location == "inner")
      return
    if (!isSpine && mark_location == "outer")
      return
    const color = this._collectValueOrPlaceholder(document.getElementById('markup_sewing_stations_color'));
    const borderColor = PDFLib.rgb(1, 1, 1);
    const header_gap = this._collectValueOrPlaceholder(document.getElementById('markup_sewing_dist_top'))
    const footer_gap = this._collectValueOrPlaceholder(document.getElementById('markup_sewing_dist_bottom'))
    const dot_gap = this._collectValueOrPlaceholder(document.getElementById('markup_sewing_station_dist'))/2.0;
    const startDelta = (orientation == RIGHT_SIDE_UP) ? [0, -1 * header_gap] : (orientation == UP_SIDE_DOWN) ? [0, header_gap] : (orientation == BOTTOM_TO_RIGHT) ? [header_gap, 0] : [-1 * header_gap, 0];
    const endDelta = (orientation == RIGHT_SIDE_UP) ? [0, -1 * footer_gap] : (orientation == UP_SIDE_DOWN) ? [0, footer_gap] : (orientation == BOTTOM_TO_RIGHT) ? [footer_gap, 0] : [-1 * footer_gap, 0];
    const gapDelta = (orientation == RIGHT_SIDE_UP) ? [0, -1 * dot_gap] : (orientation == UP_SIDE_DOWN) ? [0, dot_gap] : (orientation == BOTTOM_TO_RIGHT) ? [dot_gap, 0] : [-1 * dot_gap, 0];
    const [xDelta, yDelta] = [ spineTail[0] - spineHead[0] - endDelta[0] - startDelta[0],    spineTail[1] - spineHead[1] - endDelta[1] - startDelta[1]]
    const station_count = this._collectValueOrPlaceholder(document.getElementById('markup_sewing_count')) + 2;
    const dot_size = this._collectValueOrPlaceholder(document.getElementById('markup_sewing_dot_size'));
    for(let i = 0; i < station_count; ++i) {
      const useGapDelta = (i == 0 || i == station_count - 1) ? [0, 0] :  gapDelta
      new_page.drawCircle({
        x: startDelta[0] + spineHead[0] + (xDelta * i/(station_count - 1)) - useGapDelta[0],
        y: startDelta[1] + spineHead[1] + (yDelta * i/(station_count - 1)) - useGapDelta[1],
        size: dot_size,
        borderWidth: 0.5,
        color: color,
        borderColor: borderColor,
        opacity: 1,
        borderOpacity: 1,
      });
      new_page.drawCircle({
        x: startDelta[0] + spineHead[0] + (xDelta * i/(station_count - 1)) + useGapDelta[0],
        y: startDelta[1] + spineHead[1] + (yDelta * i/(station_count - 1)) + useGapDelta[1],
        size: dot_size,
        borderWidth: 0.5,
        color: color,
        borderColor: borderColor,
        opacity: 1,
        borderOpacity: 1,
      });
    }
  },
  _renderPageOriginal: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info) {
    const [embedded_w, embedded_h] = [embedded_page.width, embedded_page.height]
    const finalPlacement = this._calcPlacementOffsets(corner_x, corner_y, w, h, orientation, 1, 1, is_odd, embedded_w, embedded_h)
    new_page.drawPage(embedded_page, { 
                          x: finalPlacement.x,
                          y: finalPlacement.y,
                          xScale: finalPlacement.xScale,
                          yScale: finalPlacement.yScale,
                          rotate: PDFLib.degrees(finalPlacement.rotation_deg)
                        })
    this._maskPage(new_page, embedded_page, corner_x + window.book.physical.short_margin, corner_y + window.book.physical.long_margin, w, h, orientation);
    if (center_info.length > 0 && center_info[1]) 
      this._renderSpineSigOrder(new_page, center_info[0], finalPlacement.spineHead, finalPlacement.spineTail)
    this._renderSpinePdfBounds(new_page, finalPlacement, embedded_w, embedded_h, orientation)
    if (center_info.length > 0)
      this._renderSewingStations(new_page, finalPlacement.spineHead, finalPlacement.spineTail, orientation, center_info[1])
  },
  _renderPageFit: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info) {
    const {total_w, total_h} = this._calcPadding();
    const [embedded_w, embedded_h] = [embedded_page.width, embedded_page.height]
    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const xScale = (isTipped) ? (h-total_w) / embedded_w : (w-total_w) / embedded_w;
    const yScale = (isTipped) ? (w-total_h) / embedded_h : (h-total_h) / embedded_h;
    const scale = Math.min(xScale, yScale);
    const finalPlacement = this._calcPlacementOffsets(corner_x, corner_y, w, h, orientation, scale, scale, is_odd, embedded_w, embedded_h)
    new_page.drawPage(embedded_page, { 
                          x: finalPlacement.x,
                          y: finalPlacement.y,
                          xScale: finalPlacement.xScale,
                          yScale: finalPlacement.yScale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(finalPlacement.rotation_deg)
                        });
    this._maskPage(new_page, embedded_page, corner_x + window.book.physical.short_margin, corner_y + window.book.physical.long_margin, w, h, orientation);
    if (center_info.length > 0 && center_info[1]) 
      this._renderSpineSigOrder(new_page, center_info[0], finalPlacement.spineHead, finalPlacement.spineTail)
    this._renderSpinePdfBounds(new_page, finalPlacement, embedded_w, embedded_h, orientation)
    if (center_info.length > 0)
      this._renderSewingStations(new_page, finalPlacement.spineHead, finalPlacement.spineTail, orientation, center_info[1])
  },
  _renderPageFill: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info) {
    const {total_w, total_h} = this._calcPadding();
    const [embedded_w, embedded_h] = [embedded_page.width, embedded_page.height]
    let [x, y, rotation_deg] = [corner_x, corner_y, 0]

    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const xScale = (isTipped) ? (w-total_h) / embedded_h : (w-total_w) / embedded_w;
    const yScale = (isTipped) ? (h-total_w) / embedded_w : (h-total_h) / embedded_h;
    const finalPlacement = this._calcPlacementOffsets(corner_x, corner_y, w, h, orientation, xScale, yScale, is_odd, embedded_w, embedded_h)
    new_page.drawPage(embedded_page, { 
                          x: finalPlacement.x,
                          y: finalPlacement.y,
                          xScale: (isTipped) ? finalPlacement.yScale : finalPlacement.xScale,
                          yScale: (isTipped) ? finalPlacement.xScale : finalPlacement.yScale,
                          opacity: 0.75,
                          rotate: PDFLib.degrees(finalPlacement.rotation_deg)
                        })
    this._maskPage(new_page, embedded_page, corner_x + window.book.physical.short_margin, corner_y + window.book.physical.long_margin, w, h, orientation);
    if (center_info.length > 0 && center_info[1]) 
      this._renderSpineSigOrder(new_page, center_info[0], finalPlacement.spineHead, finalPlacement.spineTail)
    this._renderSpinePdfBounds(new_page, finalPlacement, embedded_w, embedded_h, orientation)
    if (center_info.length > 0)
      this._renderSewingStations(new_page, finalPlacement.spineHead, finalPlacement.spineTail, orientation, center_info[1])
  },
  /*
   * Remember: working from the lower-left corner of the cell
   * embedded_w & embedded_h are NOT flipped - relative to original page
   * w & h are the CELL dimensions (relative to sheet)
   */
  _calcPlacementOffsets: function(corner_x, corner_y, w, h, orientation, xScale, yScale, is_odd, embedded_w, embedded_h) {
    const p = window.book.physical.placement;
    const isTipped = orientation == BOTTOM_TO_LEFT || orientation == BOTTOM_TO_RIGHT;
    const {padding_i, padding_o, padding_t, padding_b, total_w, total_h} = this._calcPadding();
    embedded_w = (isTipped) ? embedded_w * yScale : embedded_w * xScale;
    embedded_h = (isTipped) ? embedded_h * xScale : embedded_h * yScale;
    let xPadding = 0;
    let yPadding = 0;
    let spineHead = [corner_x, corner_y];
    let spineTail = [corner_x, corner_y];
    let rotation_deg = 0;
    switch(orientation) {
      case RIGHT_SIDE_UP:
        if (p == "center" || p == "center_top") {
          xPadding += (w - embedded_w - total_w)/2.0;
        } else if (!is_odd) {
          xPadding += (w - embedded_w - total_w);
        }
        if (p == "center" || p == "snug_center") {
          yPadding += (h - embedded_h - total_h)/2.0;
        } else {
          yPadding += (h - embedded_h - total_h);
        }
        yPadding += padding_b;
        xPadding += (is_odd) ? padding_i : padding_o;
        spineHead = [corner_x, corner_y + h]
        if (!is_odd) {
          spineHead[0] += w;
          spineTail[0] += w;
        }
      break;
      case UP_SIDE_DOWN:
        rotation_deg = 180;
        xPadding += embedded_w;
        yPadding += embedded_h;
        if (p == "center" || p == "center_top") {
          xPadding += (w - embedded_w - total_w)/2.0;
        } else if (is_odd) {
          xPadding += (w - embedded_w - total_w);
        }
        if (p == "center" || p == "snug_center") {
          yPadding += (h - embedded_h - total_h)/2.0;
        }
        yPadding += padding_t;
        xPadding += (is_odd)? padding_o : padding_i;
        spineTail = [corner_x, corner_y + h]
        if (is_odd) {
          spineHead[0] += w;
          spineTail[0] += w;
        }
      break;



      // is tipped
      case BOTTOM_TO_RIGHT:
        rotation_deg = 90;
        xPadding += embedded_h;
        if (p == "snug_center" || p == "center") {
          xPadding += (w - embedded_h - total_h)/2.0;
        }
        if (p == "center" || p == "center_top") {
          yPadding += (h - embedded_w - total_w)/2.0;
        } else if (!is_odd) {
          yPadding += (h - embedded_w - total_w);
        }
        yPadding += (is_odd) ? padding_i : padding_o;
        xPadding += padding_t;
        spineTail = [corner_x + w, corner_y]
        if (!is_odd) {
          spineHead[1] += h;
          spineTail[1] += h;
        }
      break;
      case BOTTOM_TO_LEFT:
        rotation_deg = -90;
        yPadding += embedded_w;
        if (p == "snug_center" || p == "center") {
          xPadding += (w - embedded_h - total_h)/2.0;
        } else {
          xPadding += (w - embedded_h - total_h);
        }
        if (p == "center" || p == "center_top") {
          yPadding += (h - embedded_w - total_w)/2.0;
        } else if (is_odd) {
          yPadding += (h - embedded_w - total_w);
        }
        yPadding += (is_odd) ? padding_o : padding_i;
        xPadding += padding_b;
        spineHead = [corner_x + w, corner_y];
        if (is_odd) {
          spineHead[1] += h;
          spineTail[1] += h;
        }
      break;
    }
    return {
      x: corner_x + window.book.physical.short_margin + xPadding,
      y: corner_y + window.book.physical.long_margin + yPadding,
      spineHead: spineHead,
      spineTail: spineTail,
      xScale: xScale,
      yScale: yScale,
      rotation_deg: rotation_deg
    }
  },
  _maskPage: function(new_page, embedded_page, x, y, w, h, orientation){
    return 
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
  _calcDimens: function(new_page, x, y) {
    return {
      pW : new_page.getWidth()  - window.book.physical.short_margin * 2,
      pH : new_page.getHeight() - window.book.physical.long_margin  * 2,
      renderPage : this._renderPage.bind(this),
      flip_short : document.getElementById("flip_paper_short").checked,
      renderCrosshair : this._renderCrossHair.bind(this),
      calcCenterInfo : this._calcCenterInfo.bind(this)
    }
  },
  _hexToRgb: function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  _collectValueOrPlaceholder: function(el) {
    if (el.type == 'color') {
      const c = this._hexToRgb(el.value)
      return PDFLib.rgb(c.r / 255.0, c.g / 255.0, c.b / 255.0);
    }
    const v = parseFloat(el.value)
    return (isNaN(v)) ? parseFloat(el.placeholder) : v
  },
  _renderCrossHair: function(new_page, x, y) {
    if (!document.getElementById("markup_crosshairs").checked)
      return;
    const len = this._collectValueOrPlaceholder(document.getElementById("markup_crosshairs_length"))
    const weight = this._collectValueOrPlaceholder(document.getElementById("markup_crosshairs_weight"))
    const color = this._collectValueOrPlaceholder(document.getElementById("markup_crosshairs_color"))
    new_page.drawLine({
      start: { x: x - len, y: y },          end: { x: x + len, y: y },
      thickness: weight,  color: color,   opacity: 0.75,
    });
    new_page.drawLine({
      start: { x: x, y: y - len },          end: { x: x, y: y + len },
      thickness: weight,  color: color,   opacity: 0.75,
    });
  },
  _renderFoldLine: function(new_page, x_start, y_start, x_end, y_end) {
    if (!document.getElementById("markup_fold_lines").checked)
      return;
    const weight = this._collectValueOrPlaceholder(document.getElementById("fold_line_weight"))
    const color = this._collectValueOrPlaceholder(document.getElementById("markup_fold_lines_color"))
    new_page.drawLine({
      start: { x: x_start, y: y_start},          end: { x: x_end, y: y_end },
      thickness: weight,  color: color,   opacity: 0.75,
      dashArray: [7, 5],
    });
  },
  _handleSingle: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    this._renderPage(new_page, pageMap[folio_list[0]], 0, 0)
  },
  _handleFolio: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, calcCenterInfo} = this._calcDimens(new_page)
    const [cell_w, cell_h] = [pW, pH/2.0]
    folio_list.forEach(function(f, i) {
      const center_info = calcCenterInfo(f[(is_front) ? 0 : (flip_short) ? 2 : 1])
      renderPage(new_page, pageMap, f[(is_front) ? 0 : (flip_short) ? 2 : 1], 0, pH/2.0, cell_w, cell_h, (!is_front &&  !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT, center_info)
      renderPage(new_page, pageMap, f[(is_front) ? 3 : (flip_short) ? 1 : 2], 0, 0,    cell_w, cell_h, (!is_front &&  !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT, center_info)
    })
    this._renderCrossHair(new_page, pW, pH/2.0);
    this._renderCrossHair(new_page, 0,  pH/2.0);
  },
  /**
   * @return [sig nummber, ture if outer / false if inner]    or empty list if neither
   */
  _calcCenterInfo(page) {
    return window.book.imposed.signatures.reduce(function(acc, s, i){
      console.log("looking at ",acc," : ",s, " : ",i)
      if (acc.length > 0)
        return acc
      const outerSig = s[0]
      const innerSig = s[s.length - 1]
      if (innerSig[1] == page || innerSig[2] == page) {
        console.log(" -- ["+page+"] see innner "+i+" ", innerSig)
        return [i, false];
      }
      if (outerSig[0] == page || outerSig[3] == page) {
        console.log(" -- ["+page+"] see outer "+i+" ",outerSig)
        return [i, true];
      }
      return acc
    }, []);
  },
  _handleQuarto: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair} = this._calcDimens(new_page)
    const cell_w = pW/2.0;
    const cell_h = pH/2.0;
    const i = (is_front) ? [[0, 0], [0,3], [1,1], [1,2]] 
        : (flip_short) ? [[1, 0], [1,3], [0,1], [0, 2]] 
            : [[0, 2], [0,1], [1,3], [1,0]]
    if (i[0][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[0][0]][i[0][1]])
      renderPage(new_page, pageMap, folio_list[i[0][0]][i[0][1]], 0,      pH/2.0, cell_w, cell_h, UP_SIDE_DOWN, center_info)
      renderPage(new_page, pageMap, folio_list[i[1][0]][i[1][1]], pW/2.0, pH/2.0, cell_w, cell_h, UP_SIDE_DOWN, center_info)
    }
    if (i[2][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[2][0]][i[2][1]])
      renderPage(new_page, pageMap, folio_list[i[2][0]][i[2][1]], 0,      0,    cell_w, cell_h, RIGHT_SIDE_UP, center_info)
      renderPage(new_page, pageMap, folio_list[i[3][0]][i[3][1]], pW/2.0, 0,    cell_w, cell_h, RIGHT_SIDE_UP, center_info)
    }
    const targets = [ [cell_w, 0], [cell_w, pH/2.0], [cell_w, pH], [0, pH/2.0], [pW, pH/2.0] ];
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
    if (is_front)
      this._renderFoldLine(new_page, 0, pH/2.0, pW, pH/2.0)
  },
  _handleSexto: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair} = this._calcDimens(new_page)
    const cell_w = pW/2.0;
    const cell_h = pH/3.0;
    const i = (is_front) ? [[0, 0], [0,3], [1,1], [1,2], [2, 0], [2, 3]] 
        : (flip_short) ? [[2, 1], [2,2], [1,0], [1,3], [0, 1], [0, 2]] 
            : [[0, 2], [0,1], [1,3], [1,0], [2, 2], [2, 1]] 
    const outerFlip = (is_front) ? UP_SIDE_DOWN  : (flip_short) ? RIGHT_SIDE_UP : UP_SIDE_DOWN
    const innerFlip = (is_front) ? RIGHT_SIDE_UP : (flip_short) ? UP_SIDE_DOWN  : RIGHT_SIDE_UP
    if (i[0][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[0][0]][i[0][1]])
      renderPage(new_page, pageMap, folio_list[i[0][0]][i[0][1]], 0,    2 * pH/3.0, cell_w, cell_h, outerFlip, center_info)
      renderPage(new_page, pageMap, folio_list[i[1][0]][i[1][1]], pW/2.0, 2 * pH/3.0, cell_w, cell_h, outerFlip, center_info)
    }
    if (i[2][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[2][0]][i[2][1]])
      renderPage(new_page, pageMap, folio_list[i[2][0]][i[2][1]], 0,    pH/3.0,    cell_w, cell_h, innerFlip, center_info)
      renderPage(new_page, pageMap, folio_list[i[3][0]][i[3][1]], pW/2.0, pH/3.0,    cell_w, cell_h, innerFlip, center_info)
    }
    if (i[4][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[4][0]][i[4][1]])
      renderPage(new_page, pageMap, folio_list[i[4][0]][i[4][1]], 0,    0,    cell_w, cell_h, outerFlip, center_info)
      renderPage(new_page, pageMap, folio_list[i[5][0]][i[5][1]], pW/2.0, 0,    cell_w, cell_h, outerFlip, center_info)
    }
    const targets = [ [0, cell_h], [0, cell_h * 2], [cell_w, 0], [cell_w, cell_h], [cell_w, cell_h * 2], [cell_w, pH], [pW, cell_h], [pW, cell_h * 2]];
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
    if (is_front || (!is_front && flip_short))
      this._renderFoldLine(new_page, 0, cell_h * 2, pW, cell_h * 2)
    if (!is_front && !flip_short)
      this._renderFoldLine(new_page, 0, cell_h, pW, cell_h)
  },
  _handleOctoFat: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const renderPage = this._renderPage.bind(this)
    folio_list.forEach(function(f, i) {
      const center_info = this._calcCenterInfo()
      renderPage(new_page, pageMap, f[0], 0, 10*i, center_info)
      renderPage(new_page, pageMap, f[3], 10, 10*i, center_info)
    })
  },
  _handleOctoThin: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair} = this._calcDimens(new_page)
    const cell_w = pW/2.0;
    const cell_h = pH/4.0;
    // upper right, upper left, lower left, lower right
    const i = (is_front) ? [[0, 0], [0,3], [1,1], [1,2], [2, 3], [2, 0], [3, 2], [3, 1]] 
        : (flip_short) ? [[3,0], [3,3], [2,1], [2,2], [1,3], [1,0], [0,2], [0,1]]
            : [[1,0], [1,3], [0,1], [0,2], [3,3], [3,0], [2,2], [2,1]]
    if (i[0][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[0][0]][i[0][1]])
      renderPage(new_page, pageMap, folio_list[i[0][0]][i[0][1]], pW/2.0, 3 * pH/4.0, cell_w, cell_h, BOTTOM_TO_RIGHT, center_info)
      renderPage(new_page, pageMap, folio_list[i[1][0]][i[1][1]], pW/2.0, 2 * pH/4.0, cell_w, cell_h, BOTTOM_TO_RIGHT, center_info)
    }
    if (i[2][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[2][0]][i[2][1]])
      renderPage(new_page, pageMap, folio_list[i[2][0]][i[2][1]], 0, 3 * pH/4.0,    cell_w, cell_h, BOTTOM_TO_LEFT, center_info)
      renderPage(new_page, pageMap, folio_list[i[3][0]][i[3][1]], 0, 2 * pH/4.0,    cell_w, cell_h, BOTTOM_TO_LEFT, center_info)
    }
    if (i[4][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[4][0]][i[4][1]])
      renderPage(new_page, pageMap, folio_list[i[4][0]][i[4][1]], 0, pH/4.0,        cell_w, cell_h, BOTTOM_TO_LEFT, center_info)
      renderPage(new_page, pageMap, folio_list[i[5][0]][i[5][1]], 0, 0,             cell_w, cell_h, BOTTOM_TO_LEFT, center_info)
    }  
    if (i[6][0] < folio_list.length) {
      const center_info = this._calcCenterInfo(folio_list[i[6][0]][i[6][1]])
      renderPage(new_page, pageMap, folio_list[i[6][0]][i[6][1]], pW/2.0,  pH/4.0,    cell_w, cell_h, BOTTOM_TO_RIGHT, center_info)
      renderPage(new_page, pageMap, folio_list[i[7][0]][i[7][1]], pW/2.0, 0,          cell_w, cell_h, BOTTOM_TO_RIGHT, center_info)
    }
    if (is_front) {
      this._renderFoldLine(new_page, pW/2.0, 0, pW/2.0, pH)
      this._renderFoldLine(new_page, pW/2.0, pH/2.0, pW, pH/2.0)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      targets.push([cell_w, j])
      if (j != 0 && j != pH) {
        targets.push([0, j])
        targets.push([pW, j])
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  // FRONT : folio [0] & [3]            BACK : folio [1] & [2]
  // folio_list -- all the folios for that sheet
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