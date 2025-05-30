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
   * center_info - emtpy list if not, [sig index, isOuter - true outer / false inner]
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
  _getEmbeddedWidthHeight: function(embedded_page) {
    if (window.book.unified_source.leftRotDeg == -90 || window.book.unified_source.leftRotDeg == 90) {
      return [embedded_page.height, embedded_page.width]
    }
    return [embedded_page.width, embedded_page.height]
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
    const [embedded_w, embedded_h] = this._getEmbeddedWidthHeight(embedded_page)
    const finalPlacement = this._calcPlacementOffsets(corner_x, corner_y, w, h, orientation, 1, 1, is_odd, embedded_w, embedded_h)
    new_page.drawPage(embedded_page, { 
                          x: finalPlacement.x,
                          y: finalPlacement.y,
                          xScale: finalPlacement.xScale,
                          yScale: finalPlacement.yScale,
                          rotate: PDFLib.degrees(finalPlacement.rotation_deg)
                        })
    if (center_info.length > 0 && center_info[1]) 
      this._renderSpineSigOrder(new_page, center_info[0], finalPlacement.spineHead, finalPlacement.spineTail)
    this._renderSpinePdfBounds(new_page, finalPlacement, embedded_w, embedded_h, orientation)
    if (center_info.length > 0)
      this._renderSewingStations(new_page, finalPlacement.spineHead, finalPlacement.spineTail, orientation, center_info[1])
  },
  _renderPageFit: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info) {
    const {total_w, total_h} = this._calcPadding();
    const [embedded_w, embedded_h] = this._getEmbeddedWidthHeight(embedded_page)
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
                          rotate: PDFLib.degrees(finalPlacement.rotation_deg)
                        });
    if (center_info.length > 0 && center_info[1]) 
      this._renderSpineSigOrder(new_page, center_info[0], finalPlacement.spineHead, finalPlacement.spineTail)
    this._renderSpinePdfBounds(new_page, finalPlacement, embedded_w, embedded_h, orientation)
    if (center_info.length > 0)
      this._renderSewingStations(new_page, finalPlacement.spineHead, finalPlacement.spineTail, orientation, center_info[1])
  },
  _renderPageFill: function(new_page, embedded_page, corner_x, corner_y, w, h, orientation, is_odd, center_info) {
    const {total_w, total_h} = this._calcPadding();
    const [embedded_w, embedded_h] = this._getEmbeddedWidthHeight(embedded_page)
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
                          rotate: PDFLib.degrees(finalPlacement.rotation_deg)
                        })
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
    const trueEmbedW = (window.book.unified_source.leftRotDeg == 0 || window.book.unified_source.leftRotDeg == 180) ? embedded_w : embedded_h
    const trueEmbedH = (window.book.unified_source.leftRotDeg == 0 || window.book.unified_source.leftRotDeg == 180) ? embedded_h : embedded_w
    const pdfRotationCorrection = function(origDegrees, finalDegrees) {
      const pair = [origDegrees, finalDegrees];
      switch (pair.toString()) {
        case [0, -90].toString(): return [0, trueEmbedW]; break;
        case [0, 90].toString(): return [trueEmbedH, 0]; break;
        case [0, 180].toString():   return [trueEmbedW, trueEmbedH]; break;
        case [180, 360].toString(): return [trueEmbedW * -1, -1 * trueEmbedH]; break;
        case [180, 270].toString(): return [-1 * trueEmbedH,0]; break;
        case [180, 90].toString(): return [0,-1 * trueEmbedW]; break;
        case [90, 270].toString(): return [trueEmbedH * -1, trueEmbedW]; break;
        case [90, 180].toString(): return [0, trueEmbedH]; break;
        case [90, 0].toString(): return [trueEmbedW * -1, 0]; break;
        case [-90, -180].toString(): return [trueEmbedW,0]; break;
        case [-90, 0].toString(): return [0, -1 * trueEmbedH]; break;
        case [-90, 90].toString(): return [trueEmbedH, -1 * trueEmbedW]; break;
      }
      return [0,0]
    }
    if (window.book.unified_source.leftRotDeg != 0 && !is_odd) {
      const rotOrig = rotation_deg
      const xOrig = xPadding
      const yOrig = yPadding
      rotation_deg += window.book.unified_source.leftRotDeg
      const deltas = pdfRotationCorrection(rotOrig, rotation_deg)
      xPadding += deltas[0];
      yPadding += deltas[1];
    }
    if (window.book.unified_source.rightRotDeg != 0 && is_odd) {
      const rotOrig = rotation_deg
      const xOrig = xPadding
      const yOrig = yPadding
      rotation_deg += window.book.unified_source.rightRotDeg
      const deltas = pdfRotationCorrection(rotOrig, rotation_deg)
      xPadding += deltas[0];
      yPadding += deltas[1];
      
    }
    spineHead[0] += window.book.physical.short_margin
    spineHead[1] += window.book.physical.long_margin
    
    spineTail[0] += window.book.physical.short_margin
    spineTail[1] += window.book.physical.long_margin
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
    x += window.book.physical.short_margin
    y += window.book.physical.long_margin
    new_page.drawLine({
      start: { x: x - len, y: y },          end: { x: x + len, y: y },
      thickness: weight,  color: color,
    });
    new_page.drawLine({
      start: { x: x, y: y - len },          end: { x: x, y: y + len },
      thickness: weight,  color: color,
    });
  },
  _renderFoldLine: function(new_page, x_start, y_start, x_end, y_end) {
    if (!document.getElementById("markup_fold_lines").checked)
      return;
    const weight = this._collectValueOrPlaceholder(document.getElementById("fold_line_weight"))
    const color = this._collectValueOrPlaceholder(document.getElementById("markup_fold_lines_color"))
    x_start += window.book.physical.short_margin
    y_start += window.book.physical.long_margin
    x_end += window.book.physical.short_margin
    y_end += window.book.physical.long_margin
    new_page.drawLine({
      start: { x: x_start, y: y_start},          end: { x: x_end, y: y_end },
      thickness: weight,  color: color,
      dashArray: [7, 5],
    });
  },
  _handleSingle: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, calcCenterInfo} = this._calcDimens(new_page)
    renderPage(new_page, pageMap, folio_list[(is_front) ? 0 : 1], 0, 0, pW, pH, (!is_front && flip_short) ? UP_SIDE_DOWN : RIGHT_SIDE_UP, [])
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
      if (acc.length > 0)
        return acc
      const outerSig = s[0]
      const innerSig = s[s.length - 1]
      if (innerSig[1] == page || innerSig[2] == page) {
        return [i, false];
      }
      if (outerSig[0] == page || outerSig[3] == page) {
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
  _handleDuoSexto: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {cell_w, cell_h, pW, pH, renderCrosshair, flip_short} = this._drawTopBottomConnectedBlocks(
      new_page,
      pageMap,
      folio_list,
      is_front,
      2, // block count
      3 // folio count
      );

    if (is_front) {
      this._renderFoldLine(new_page, 0, cell_h,   pW, cell_h)
    } else if (flip_short) {
      this._renderFoldLine(new_page, 0, cell_h,   pW, cell_h)
      this._renderFoldLine(new_page, pW/2.0, 0,   pW/2.0, cell_h)
    } else {
      this._renderFoldLine(new_page, 0, cell_h * 2,   pW, cell_h * 2)
      this._renderFoldLine(new_page, pW/2.0, cell_h * 2,   pW/2.0, cell_h * 3)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _drawTopBottomConnectedBlocks : function(new_page, pageMap, folio_list, is_front, block_count, folio_count){
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/((block_count == 1) ? 2.0 : 2.0 * 2);
    const cell_h = pH/((block_count == 2) ? folio_count * 1.0 : folio_count * 2.0);
    const flip_short_back = flip_short && !is_front
    const flip_long_back = !flip_short && !is_front
    for(let block = 0; block <= block_count; ++block) {  // 1 blocks = left / right of sheet
      const block_start_x = (block == 0 || block == 2 )//|| (block == 1 && block_count < 3)) 
        ? (is_front || flip_short) ? pW/2 : 0
        : (is_front || flip_short) ? 0 : pW/2
      const block_start_y = (block_count <= 2)
        ? 0
        : (block == 0 || block == 1) 
          ? (is_front || !flip_short) ? pH/2 : 0
          : (is_front || !flip_short) ? 0 : pH/2

      for(let folio = 0; folio < folio_count; ++folio) {  // 3 folio = signature size, per block
        const f_pair_x = block_start_x
        const f_pair_y = block_start_y + ((flip_short_back) ? ( cell_h * (folio_count - 1 - folio)) : (cell_h * (folio)))
        const orientation = (flip_short_back)
          ? ((folio == 0 || folio == 2) ? UP_SIDE_DOWN : RIGHT_SIDE_UP)
          : ((folio == 1 || folio == 3) ? UP_SIDE_DOWN : RIGHT_SIDE_UP)
        const folio_index = folio + (block * folio_count)
        if (folio_index >= folio_list.length) {
          continue;
        }
        const f = folio_list[folio_index]
        const left_page_num = (flip_long_back) 
         ? ( (orientation == RIGHT_SIDE_UP)  ? f[1] : f[0] )
         : (orientation == RIGHT_SIDE_UP)  ? f[3] : f[2]
        const right_page_num = (flip_long_back) 
         ? ( (orientation == RIGHT_SIDE_UP)  ? f[2] : f[3] )
         : (orientation == RIGHT_SIDE_UP) ? f[0] : f[1]
        const center_info = calcCenterInfo(Math.min(left_page_num, right_page_num))
        console.log("> "+block+"/"+folio+"  [front : "+is_front+" | flip_short : "+flip_short+"] >> "+left_page_num+" , "+right_page_num+"  @ "+orientation)
        renderPage(new_page, pageMap, left_page_num,  f_pair_x,           f_pair_y, cell_w, cell_h, orientation, center_info)
        renderPage(new_page, pageMap, right_page_num, f_pair_x + cell_w,  f_pair_y, cell_w, cell_h, orientation, center_info)
      }
    }
    return {
      cell_w: cell_h,
      cell_h: cell_h,
      pW: pW,
      pH: pH,
      renderCrosshair: renderCrosshair,
      flip_short: flip_short
    }
  },
  _handleOctoFat: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair} = this._calcDimens(new_page)
    const cell_w = pW/2.0;
    const cell_h = pH/4.0;
    // upper right, upper left, lower left, lower right
    const i = (is_front) ? [[3, 2], [3, 1], [0, 3], [0,0], [1,1], [1,2], [2, 0], [2, 3]] 
        : (flip_short) ? [[2, 2], [2, 1], [1, 3], [1,0], [0, 1], [0, 2], [3, 0], [3, 3]]
            : [[0, 2], [0, 1], [3, 3], [3, 0], [2, 1], [2, 2], [1, 0], [1, 3]]
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
      this._renderFoldLine(new_page, pW/2.0, pH/2.0, pW/2.0, pH)
      this._renderFoldLine(new_page, 0, pH/2.0, pW, pH/2.0)
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
  _handleSextodecimoThin: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/4.0;
    const cell_h = pH/4.0;
    const drawPair = function(pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets;
      if (f >= folio_list.length)
        return
      const pageNum1 = folio_list[f][a]
      const pageNum2 = folio_list[f][b]
      const center_info = calcCenterInfo(pageNum1)
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, center_info)
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, center_info)
    }
    const pageDeets = (is_front) ?
    [[7,2,1],[0,0,3],  [6,3,0],[1,1,2],  [5,2,1],[2,0,3],  [4,3,0],[3,1,2]]
    : (flip_short) ?  [[4,2,1], [3,0,3],  [5,3,0], [2,1,2],  [6,2,1],[1,0,3],  [7,3,0],[0,1,2]]
     :  [[0,2,1],[7,0,3],  [1,3,0],[6,1,2],  [2,2,1],[5,0,3],  [3,3,0],[4,1,2]]
    drawPair(pageDeets[0],   0,          cell_h * 3,   cell_w, 0,  UP_SIDE_DOWN)
    drawPair(pageDeets[1],   cell_w * 2, cell_h * 3,   cell_w, 0,  UP_SIDE_DOWN)

    drawPair(pageDeets[2],   0,          cell_h * 2,   cell_w, 0,  RIGHT_SIDE_UP)
    drawPair(pageDeets[3],   cell_w * 2, cell_h * 2,   cell_w, 0,  RIGHT_SIDE_UP)

    drawPair(pageDeets[4],   0,          cell_h,       cell_w, 0,  UP_SIDE_DOWN)
    drawPair(pageDeets[5],   cell_w * 2, cell_h,       cell_w, 0,  UP_SIDE_DOWN)

    drawPair(pageDeets[6],   0,          0,            cell_w, 0,  RIGHT_SIDE_UP)
    drawPair(pageDeets[7],   cell_w * 2, 0,            cell_w, 0,  RIGHT_SIDE_UP)


    if (is_front) {
      this._renderFoldLine(new_page, 0, cell_h * 3, pW, cell_h * 3)
      this._renderFoldLine(new_page, 0, cell_h, pW, cell_h)
      this._renderFoldLine(new_page, cell_w * 2, pH, cell_w * 2, cell_h * 3)
    } else {
      this._renderFoldLine(new_page, 0, cell_h * 2, pW, cell_h * 2)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _handleSextodecimoFat: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/4.0;
    const cell_h = pH/4.0;
    const drawPair = function(pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets;
      if (f >= folio_list.length)
        return
      const pageNum1 = folio_list[f][a]
      const pageNum2 = folio_list[f][b]
      const center_info = calcCenterInfo(pageNum1)
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, center_info)
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, center_info)
    }
    const pageDeets = (is_front) ?
    [[0,0,3],[1,2,1],  [3,1,2],[2,3,0],  [4,0,3],[5,2,1],  [7,1,2],[6,3,0]]
    : (flip_short) ?  [[7,0,3],[6,2,1],  [4,1,2],[5,3,0],  [3,0,3],[2,2,1],  [0,1,2],[1,3,0]]
     :  [[1,0,3],[0,2,1],  [2,1,2],[3,3,0],  [5,0,3],[4,2,1],  [6,1,2],[7,3,0] ]
    drawPair(pageDeets[0],   0,          cell_h * 3,   cell_w, 0,  UP_SIDE_DOWN)
    drawPair(pageDeets[1],   cell_w * 2, cell_h * 3,   cell_w, 0,  UP_SIDE_DOWN)

    drawPair(pageDeets[2],   0,          cell_h * 2,   cell_w, 0,  RIGHT_SIDE_UP)
    drawPair(pageDeets[3],   cell_w * 2, cell_h * 2,   cell_w, 0,  RIGHT_SIDE_UP)

    drawPair(pageDeets[4],   0,          cell_h,       cell_w, 0,  UP_SIDE_DOWN)
    drawPair(pageDeets[5],   cell_w * 2, cell_h,       cell_w, 0,  UP_SIDE_DOWN)

    drawPair(pageDeets[6],   0,          0,            cell_w, 0,  RIGHT_SIDE_UP)
    drawPair(pageDeets[7],   cell_w * 2, 0,            cell_w, 0,  RIGHT_SIDE_UP)


    if (is_front) {
      this._renderFoldLine(new_page, pW/2.0, 0, pW/2.0, pH)
      this._renderFoldLine(new_page, 0, cell_h * 3, pW/2.0, cell_h * 3)
      this._renderFoldLine(new_page, 0, cell_h, pW/2.0, cell_h)
      this._renderFoldLine(new_page, pW/2.0, cell_h * 2, pW, cell_h * 2)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _handleMini: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/6.0;
    const cell_h = pH/10.0;
    const drawPair = function(row, pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets
      const fOffset = f + (5*row)
      if (fOffset >= folio_list.length)
        return
      const pageNum1 = folio_list[fOffset][a]
      const pageNum2 = folio_list[fOffset][b]
      const center_info = calcCenterInfo(pageNum1)
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, center_info)
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, center_info)
    }
    const pageDeets = (is_front) ?
    [[4,1,2], [3,3,0], [0,3,0], [1,1,2], [2,3,0]]
    : (flip_short) ?  [[2,1,2], [1,3,0], [0,1,2], [3,1,2], [4,3,0]]
     :  [[4,0,3], [3,2,1], [0,2,1], [1,0,3], [2,2,1]]
    const side = (!is_front && !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT;
    for(let row = 0; row < 6; ++row) {
      const start = (!is_front && !flip_short) ? (cell_w * (5-row)) : cell_w * row;
      drawPair(row, pageDeets[0],   start, cell_h * 0,   0, cell_h,  side)
      drawPair(row, pageDeets[1],   start, cell_h * 2,   0, cell_h,  side)
      drawPair(row, pageDeets[2],   start, cell_h * 4,   0, cell_h,  side)
      drawPair(row, pageDeets[3],   start, cell_h * 6,   0, cell_h,  side)
      drawPair(row, pageDeets[4],   start, cell_h * 8,   0, cell_h,  side)
    }

    if (is_front || (!is_front && flip_short)) {
      this._renderFoldLine(new_page, 0, cell_h * 2,   pW, cell_h * 2)
      this._renderFoldLine(new_page, 0, cell_h * 6,   pW, cell_h * 6)
    } else if(!is_front && !flip_short) {
      this._renderFoldLine(new_page, 0, cell_h * 4,   pW, cell_h * 4)
      this._renderFoldLine(new_page, 0, cell_h * 8,   pW, cell_h * 8)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _handleThreeByThree: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/3.0;
    const cell_h = pH/6.0;
    const drawPair = function(row, pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets
      const fOffset = f + (3*row)
      console.log("looking at fOffset "+fOffset+" out of "+folio_list.length)
      if (fOffset >= folio_list.length)
        return
      const pageNum1 = folio_list[fOffset][a]
      const pageNum2 = folio_list[fOffset][b]
      const center_info = calcCenterInfo(pageNum1)
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, center_info)
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, center_info)
    }
    const pageDeets = (is_front) ?
    [[0,3,0], [1,1,2], [2,3,0]]
    : (flip_short) ?  [[2,1,2], [1,3,0], [0,1,2]]
     :  [[0,2,1], [1,0,3], [2,2,1]]
    const side = (!is_front && !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT;
    for(let row = 0; row < 3; ++row) {
      const start = (!is_front && !flip_short) ? (cell_w * (2-row)) : cell_w * row;
      console.log("row "+row+" is starting at "+start+" when the page width is "+pW)
      drawPair(row, pageDeets[0],   start, cell_h * 0,   0, cell_h,  side)
      drawPair(row, pageDeets[1],   start, cell_h * 2,   0, cell_h,  side)
      drawPair(row, pageDeets[2],   start, cell_h * 4,   0, cell_h,  side)
    }

    if (is_front || (!is_front && flip_short)) {
      this._renderFoldLine(new_page, 0, cell_h * 2,   pW, cell_h * 2)
    } else if(!is_front) {
      this._renderFoldLine(new_page, 0, cell_h * 4,   pW, cell_h * 4)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _handleFourByFour: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/4.0;
    const cell_h = pH/8.0;
    const drawPair = function(row, pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets
      const fOffset = f + (4*row)
      console.log("looking at fOffset "+fOffset+" out of "+folio_list.length)
      if (fOffset >= folio_list.length)
        return
      const pageNum1 = folio_list[fOffset][a]
      const pageNum2 = folio_list[fOffset][b]
      const center_info = calcCenterInfo(pageNum1)
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, center_info)
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, center_info)
    }
    const pageDeets = (is_front) ?
    [[3,1,2], [2,3,0], [1,1,2], [0,3,0]]
    : (flip_short) ?  [[0,1,2], [1,3,0], [2, 1,2], [3,3,0]]
     :  [[3,0,3], [2,2,1], [1,0,3], [0,2,1]]
    const side = (!is_front && !flip_short) ? BOTTOM_TO_LEFT : BOTTOM_TO_RIGHT;
    for(let row = 0; row < 4; ++row) {
      const start = (!is_front && !flip_short) ? (cell_w * (3-row)) : cell_w * row;
      console.log("row "+row+" is starting at "+start+" when the page width is "+pW)
      drawPair(row, pageDeets[0],   start, cell_h * 0,   0, cell_h,  side)
      drawPair(row, pageDeets[1],   start, cell_h * 2,   0, cell_h,  side)
      drawPair(row, pageDeets[2],   start, cell_h * 4,   0, cell_h,  side)
      drawPair(row, pageDeets[3],   start, cell_h * 6,   0, cell_h,  side)
    }

    if (is_front) {
      this._renderFoldLine(new_page, 0, cell_h * 2,   pW, cell_h * 2)
      this._renderFoldLine(new_page, 0, cell_h * 6,   pW, cell_h * 6)
    } else {
      this._renderFoldLine(new_page, 0, cell_h * 4,   pW, cell_h * 4)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _handleFourByFourLandscape: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/4.0;
    const cell_h = pH/8.0;
    const flip_short_back = flip_short && !is_front
    const flip_long_back = !flip_short && !is_front
    for(let block = 0; block < 4; ++block) {  // 4 blocks = four quadrants of sheet
      const block_start_x = (block == 0 || block == 2) 
        ? (is_front || flip_short) ? pW/2 : 0
        : (is_front || flip_short) ? 0 : pW/2
      const block_start_y = (block == 0 || block == 1) 
        ? (is_front || !flip_short) ? pH/2 : 0
        : (is_front || !flip_short) ? 0 : pH/2

      for(let folio = 0; folio < 4; ++folio) {  // 4 folio = signature size, per block
        const f_pair_x = block_start_x
        const f_pair_y = block_start_y + ((flip_short_back) ? ( cell_h * (3 - folio)) : (cell_h * (folio)))
        const orientation = (flip_short_back)
          ? ((folio == 0 || folio == 2) ? UP_SIDE_DOWN : RIGHT_SIDE_UP)
          : ((folio == 1 || folio == 3) ? UP_SIDE_DOWN : RIGHT_SIDE_UP)
        const folio_index = folio + (block * 4)
        if (folio_index >= folio_list.length) {
          break;
        }
        const f = folio_list[folio_index]
        const left_page_num = (flip_long_back) 
         ? ( (orientation == RIGHT_SIDE_UP)  ? f[1] : f[0] )
         : (orientation == RIGHT_SIDE_UP)  ? f[3] : f[2]
        const right_page_num = (flip_long_back) 
         ? ( (orientation == RIGHT_SIDE_UP)  ? f[2] : f[3] )
         : (orientation == RIGHT_SIDE_UP) ? f[0] : f[1]
        const center_info = calcCenterInfo(Math.min(left_page_num, right_page_num))
        console.log("> "+block+"/"+folio+"  [front : "+is_front+" | flip_short : "+flip_short+"] >> "+left_page_num+" , "+right_page_num+"  @ "+orientation)
        renderPage(new_page, pageMap, left_page_num,  f_pair_x,           f_pair_y, cell_w, cell_h, orientation, center_info)
        renderPage(new_page, pageMap, right_page_num, f_pair_x + cell_w,  f_pair_y, cell_w, cell_h, orientation, center_info)
      }
    }

    if (is_front) {
      this._renderFoldLine(new_page, 0, cell_h,   pW, cell_h)
      this._renderFoldLine(new_page, 0, cell_h * 3,   pW, cell_h * 3)
      this._renderFoldLine(new_page, 0, cell_h * 5,   pW, cell_h * 5)
      this._renderFoldLine(new_page, 0, cell_h * 7,   pW, cell_h * 7)
      this._renderFoldLine(new_page, pW/2.0, cell_h * 7,   pW/2.0, cell_h * 8)
      this._renderFoldLine(new_page, pW/2.0, cell_h * 3,   pW/2.0, cell_h * 4)
    } else {
      this._renderFoldLine(new_page, 0, cell_h * 2,   pW, cell_h * 2)
      this._renderFoldLine(new_page, 0, cell_h * 4,   pW, cell_h * 4)
      this._renderFoldLine(new_page, 0, cell_h * 6,   pW, cell_h * 6)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },
  _handleLittle334: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/4.0;
    const cell_h = pH/5.0;
    const drawPair = function(pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets
      console.log("looking at f "+f+" out of "+folio_list.length)
      if (f >= folio_list.length)
        return
      const pageNum1 = folio_list[f][a]
      const pageNum2 = folio_list[f][b]
      const center_info = calcCenterInfo(pageNum1)
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, center_info)
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, center_info)
    }
    const pageDeets = (is_front) ?
    [[0,0,3], [1,1,2], [2,0,3],  [3,0,3], [4,1,2], [5,0,3],  [6,2,1], [7,3,0], [9,0,3], [8,1,2]]
    : (flip_short) ?  [[2,1,2], [1,0,3], [0,1,2],  [5,1,2], [4,0,3], [3,1,2],  [7,2,1], [6,3,0], [8,0,3], [9,1,2]]
     :  [[3,2,1], [4,3,0], [5,2,1],  [0,2,1], [1,3,0], [2,2,1],  [9,2,1], [8,3,0], [6,0,3], [7,1,2]]
    const offset3s = (is_front || !flip_short) ? 0 : (cell_h * -2)
    const offset4 = (is_front || !flip_short) ? 0 : (cell_h * 3)
    const orientation3sOuter = (is_front || !flip_short) ? UP_SIDE_DOWN : RIGHT_SIDE_UP
    const orientation3sInner = (is_front || !flip_short) ? RIGHT_SIDE_UP : UP_SIDE_DOWN

    drawPair(pageDeets[0],   0, cell_h * 4 + offset3s,   cell_w, 0,  orientation3sOuter)
    drawPair(pageDeets[1],   0, cell_h * 3 + offset3s,   cell_w, 0,  orientation3sInner)
    drawPair(pageDeets[2],   0, cell_h * 2 + offset3s,   cell_w, 0,  orientation3sOuter)

    drawPair(pageDeets[3],   cell_w * 2, cell_h * 4 + offset3s,   cell_w, 0,  orientation3sOuter)
    drawPair(pageDeets[4],   cell_w * 2, cell_h * 3 + offset3s,   cell_w, 0,  orientation3sInner)
    drawPair(pageDeets[5],   cell_w * 2, cell_h * 2 + offset3s,   cell_w, 0,  orientation3sOuter)

    drawPair(pageDeets[6],   0, cell_h + offset4,   cell_w, 0,  UP_SIDE_DOWN)
    drawPair(pageDeets[7],   0, offset4,            cell_w, 0,  RIGHT_SIDE_UP)

    drawPair(pageDeets[8],   cell_w * 2, cell_h + offset4,   cell_w, 0,  UP_SIDE_DOWN)
    drawPair(pageDeets[9],   cell_w * 2, offset4,            cell_w, 0,  RIGHT_SIDE_UP)

    if (is_front) {
      this._renderFoldLine(new_page, cell_w * 2, cell_h * 2,   cell_w * 2, cell_h)
    }
    if (is_front || (!is_front && flip_short)) {
      this._renderFoldLine(new_page, 0, cell_h * 2,   pW, cell_h * 2)
      this._renderFoldLine(new_page, 0, cell_h * 4,   pW, cell_h * 4)
    } else if (!is_front && !flip_short) {
      this._renderFoldLine(new_page, 0, cell_h,   pW, cell_h)
      this._renderFoldLine(new_page, 0, cell_h * 3,   pW, cell_h * 3)
      // this._renderFoldLine(new_page, 0, cell_h * 4,   pW, cell_h * 4)
    }
    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
      }
    }
    targets.forEach( x => renderCrosshair(new_page, x[0], x[1]));
  },

  _handle8PageZine: function(new_page, pageMap, folio_list, sheet_index, is_front) {
    if (!is_front)
      return

    const {pW, pH, renderPage, flip_short, renderCrosshair, calcCenterInfo} = this._calcDimens(new_page)
    const cell_w = pW/2.0;
    const cell_h = pH/4.0;
    const drawPair = function(pageDeets, start_x, start_y, delta_x, delta_y, orientation) {
      const [f, a, b] = pageDeets
      console.log("looking at f "+f+" out of "+folio_list.length)
      if (f >= folio_list.length)
        return
      const pageNum1 = folio_list[f][a]
      const pageNum2 = folio_list[f][b]
      renderPage(new_page, pageMap, pageNum1, start_x, start_y, cell_w, cell_h, orientation, [])
      renderPage(new_page, pageMap, pageNum2, start_x + delta_x, start_y + delta_y, cell_w, cell_h, orientation, [])
    }

    drawPair([0,3,0],   cell_w, cell_h * 2,   0, cell_h,  BOTTOM_TO_RIGHT)
    drawPair([1,3,0],   0,      cell_h * 2,   0, cell_h,  BOTTOM_TO_LEFT)

    drawPair([3,0,3],   cell_w, 0,   0, cell_h,  BOTTOM_TO_RIGHT)
    drawPair([2,3,0],   0,      0,   0, cell_h,  BOTTOM_TO_LEFT)

    this._renderFoldLine(new_page, 0, cell_h * 2, pW, cell_h * 2)
    this._renderFoldLine(new_page, cell_w, 0, cell_w, pH)

    const targets = [];
    for(let j = 0; j <= pH; j += cell_h) {
      for (let k = 0; k <= pW; k += cell_w) {
        if ( (k == 0 && j == 0) || (k == 0 && j == pH) || (k == pW && j == 0) || (k == pW && j == pH))
          continue;
        targets.push([k, j]);
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
      case '12_side': this._handleDuoSexto(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'octavo_fat': this._handleOctoFat(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'octavo_thin': this._handleOctoThin(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case '8_zine': this._handle8PageZine(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'sextodecimo_thin': this._handleSextodecimoThin(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'sextodecimo_fat': this._handleSextodecimoFat(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'small_3_by_3': this._handleThreeByThree(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'little_3_3_4': this._handleLittle334(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'tiny_4_by_4': this._handleFourByFour(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'tiny_landscape_4_by_4': this._handleFourByFourLandscape(new_page, pageMap, folio_list, sheet_index, is_front); break;
      case 'mini': this._handleMini(new_page, pageMap, folio_list, sheet_index, is_front); break;
    }
    
  }
}