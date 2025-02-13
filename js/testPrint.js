import { fileHandler } from './files.js';

export const testPrint = {
  _render_one_inch_box_o_lines: function(pdfPage, x, y) {
    for(let i = 0; i < 72/2; ++i) {
      pdfPage.drawSquare({
        x: x+i,
        y: y+i,
        size: 72 - (i * 2),
        borderWidth: 0,
        color: (i % 2 == 1) ?  PDFLib.rgb(1,1,1) : PDFLib.rgb(0,0,0),
        // rotate: degrees(-15),
        // borderColor: grayscale(0.5),
        // opacity: 0.5,
        // borderOpacity: 0.75,
      })
    }
  },
  _renderCrossLines: function(pdfPage, w, h) {
    pdfPage.drawLine({
      start: { x: 0, y: h/2.0 },
      end: { x: w, y: h/2.0 },
      thickness: 1, color: PDFLib.rgb(0,0,0), opacity: 1,
    })
    pdfPage.drawLine({
      start: { x: w/2.0, y: 0 },
      end: { x: w/2.0, y: h },
      thickness: 1, color: PDFLib.rgb(0,0,0), opacity: 1,
    })
    pdfPage.drawLine({
      start: { x: 0, y: 0 },
      end: { x: w, y: h },
      thickness: 1, color: PDFLib.rgb(0,0,0), opacity: 1,
    })
    pdfPage.drawLine({
      start: { x: w, y: 0 },
      end: { x: 0, y: h },
      thickness: 1, color: PDFLib.rgb(0,0,0), opacity: 1,
    })
  },
  _renderText: function(pdfPage, w, h) {
    pdfPage.drawText("Top Front",
      {
        x: w - (72*3),
        y: h -72,
        //font: timesRomanFont,
        size: 20,
        color: PDFLib.rgb(0,0,0),
        lineHeight: 12,
        opacity: 1,
      },
    )
    const startX = 72/2.0
    const startY = 72*1.6
    const gap = 72
    const squareSize = 72/4.0
    const lineGap = 8
    const sampleLine = function(curY, color, weight) {
      pdfPage.drawText(""+weight,
        {
          x: startX + (72 * 2),
          y: curY,
          size: 8,
          color: PDFLib.rgb(0,0,0),
          lineHeight: 12,
          opacity: 1,
        },
      )
      pdfPage.drawLine({
        start: { x: startX + 72, y: curY },
        end: { x: startX + (72 * 2), y: curY },
        thickness: weight, color: PDFLib.rgb(color, color, color), opacity: 1,
      })
    }
    for(let i = 0;i < 5;++i){
      const c = 1/5.0 * i
      const squareSize = 72/4
      const curY = startY + gap * i
      pdfPage.drawSquare({
        x: startX,
        y: curY,
        size: squareSize,
        borderWidth: 0,
        color: PDFLib.rgb(c,c,c)
      })
      pdfPage.drawText("color "+Math.round(255 * c),
        {
          x: startX + (squareSize * 1.25),
          y: curY,
          size: 10,
          color: PDFLib.rgb(0,0,0),
          lineHeight: 12,
          opacity: 1,
        },
      )
      sampleLine(curY, c,0.1)
      sampleLine(curY + (lineGap * 1), c,0.25)
      sampleLine(curY + (lineGap * 2), c,0.5)
      sampleLine(curY + (lineGap * 3), c,0.75)
      sampleLine(curY + (lineGap * 4), c,1)
      sampleLine(curY + (lineGap * 5), c,1.25)
      sampleLine(curY + (lineGap * 6), c,1.5)
      sampleLine(curY + (lineGap * 7), c,2)
    }
  },
  _renderTestFront: function(pdfPage, w, h) {
    this._renderCrossLines(pdfPage, w, h)
    this._render_one_inch_box_o_lines(pdfPage, 0,0)
    this._render_one_inch_box_o_lines(pdfPage, 0,h-72)
    this._render_one_inch_box_o_lines(pdfPage, w-72,0)
    this._render_one_inch_box_o_lines(pdfPage, w-72,h-72)
    this._renderText(pdfPage, w, h)
  },
  _renderTestBack: function(pdfPage, w, h) {
    const is_flip_short = document.getElementById("flip_paper_short").checked
    this._renderCrossLines(pdfPage, w, h)
    this._render_one_inch_box_o_lines(pdfPage, 0,0)
    this._render_one_inch_box_o_lines(pdfPage, 0,h-72)
    this._render_one_inch_box_o_lines(pdfPage, w-72,0)
    this._render_one_inch_box_o_lines(pdfPage, w-72,h-72)
    const detail = (is_flip_short) ? "\n(flip short)" : "\n(flip long)"
    pdfPage.drawText("Top Back"+detail,
      {
        x: (is_flip_short) ? w/2.0 - 72 : w - (72*3),
        y: (is_flip_short) ? 72 : h -72,
        //font: timesRomanFont,
        rotate:  (is_flip_short) ? PDFLib.degrees(180) : PDFLib.degrees(0),
        size: 20,
        color: PDFLib.rgb(0,0,0),
        lineHeight: 25,
        opacity: 1,
      },
    )
  },
  build: async function() {
    const new_pdf = await PDFLib.PDFDocument.create();
    const helveticaFont = await new_pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const new_page_front = new_pdf.addPage(window.book.physical.paper_size);
    new_page_front.setFont(helveticaFont)
    this._renderTestFront(new_page_front, window.book.physical.paper_size[0], window.book.physical.paper_size[1]);
    const new_page_back = new_pdf.addPage(window.book.physical.paper_size);
    this._renderTestBack(new_page_back, window.book.physical.paper_size[0], window.book.physical.paper_size[1]);
    fileHandler.makeTheZip(new_pdf, "vip_test_print")
  }
}