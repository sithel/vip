# vip
Villainous Imposer Program

Targeting launch early February 2025

# TODOs

There's a lot of features and a lot of work remaining--

### Functionality

- all of PDF page placement
  - [x] handling both flip options
  - masking logic
    - fix preview to reflect updated behavior
  - padding/margin logic
- file downloading (all options)
- all of mark-up
  - PDF boundary spine marks
  - spine order marks
  - punching guidelines/marks (spine/interior)
  - cut lines
  - [x] fold lines
  - [x] corner cross-hairs
- [x] preview

### UI/UX:

- [x] enable/disable sections based on entered values
- saving settings/URL params
- correctly re-rendering values when changing Display Units
- PDF placement preview
- debug info / error states / progress bars
- folding information / animations for impositions
- disable outer/bottom for PDF Placement if `Original` scaling
- warn in PDF Placement if known exceeding of bounds (and by how much)
- dynamic button name change for Download from `get that file!` to `get those files!`

### Stretch/Long Term

- creep
- PDF skew correction
- page numbers in the margins
- night mode
- more impositions
- improve Imposition options UI/UX to be more compact (in listing options section)
- figure out CORS stuff so it can be saved to someone's computer

# Helper Functions & Code Structure

## Source PDFs

Processed in `vip.processUploads`, offloads most the work to `pdf.js`'s `processUploadBlocks` (which calls helper functions within that file). Tucks all results in `window.book.upload_blocks`, each entry containing a `_pagesList` array (`-1` means blank!) and `pdfDoc` (`PDFLib.PDFDocument`)


## `unified_source` (steps 1 & 2)

Needs `unified_source_modifier.attach()` to be called first to hook everything up (see `state_modifiers.js`).
Call `window.book.unified_source.processUpdate()` after base changes to re-calculate things. Things like:

- `window.book.unified_source.hasValidPdf()` : returns a boolean
- `window.book.unified_source.maxWidth` / `window.book.unified_source.maxHeight` : raw PDF height (post step 1)
- `window.book.unified_source.isTurned()` : returns true if it's -90 or 90 degree rotation (post step 2)
- `window.book.unified_source.pdf_w` / `window.book.unified_source.pdf_h` : takes into account PDF margins and rotation. (post step 2)
- `window.book.unified_source.pageCount` : calculated total pages across multiple PDFs and accounting for blanks
- `window.book.unified_source.getPdfPageForPageNumber(pageNum)` : given page `N` in the result PDF, looks up in the `window.book.upload_blocks` to fetch the corresponding `PDFLib.PDFPage`

## Physical (step 3)

This really highlights the mangling of terms. Height = Long Side = `y`, Width = Short Side = `x`

- `window.book.physical.display_unit` : either `metric`, `imperial`, or `points`
- `window.book.physical.paper_size` : a 2 value list of the sheet's `[width, height]` in points
- `window.book.physical.short_margin` : value to be mirrored on both sides of the paper (compressing total imposition)
- `window.book.physical.long_margin` : value to be mirrored on both sides of the paper (compressing total imposition)

## Imposition (step 4)

## Placement / Imposed (step 5)

You can find the logic handling this over in `helper.js` `calImpositionInfo()`

- `window.book.imposed.sheets` : List of lists. Each entry in the outer list is a sheet of paper (front and back), which contains a list of folios, which contains a list of 4 pages making up that folio. The order of the folios within a sheet is specific to the imposition. The order of the pages in the folio is front, inner left, inner right, back
- `window.book.imposed.signatures` : List of lists. Each entry in the outer list is a signature, which contains a list of folios, which contains a list of 4 pages making up the folio. The order of signatures is start of book to end of book. The order of folios in the signature is outer-most first and ends with inner-most. The order of the pages in the folio is front, inner left, inner right, back

## Markup (step 6)

Part of the `imposer.js` code - tacked on AFTER the pages have been laid out and AFTER masking -- leverages functions such as `_renderCrosshair`, `_renderFoldLine`

## Preview (step 8) / Rendering

Starts in `preview.js`'s `build` function, kicked off via `vip.refreshPreview()`. Has some initial corner case logic (first signature only?) and hard coded assumptions (always 'both sides') - but otherwise runs the same path as the Downloaded PDF (see next section)

## Download (step 9)

When rendering/building the PDF, some settings are stored in `window.book` and referenced via hard-coded links. Some settings are passed in as parameters the further along the process you go. Some settings are checked at-time-of-evaluation via `document.getElementById`. The poorly named `_calcDimens` collects functions and stats at the beginning of the page assembly. 

- `document.getElementById("flip_paper_short").checked` : never stored, always evaluated when rendering
- all of the mark-up values/settings

Drawing on the canvas always confuses me. Some notes:

- when thinking about the `rotate` when calling `drawPage` on a `PDFPage`, remember that it pivotes around the natural "lower left" corner. That is placed where you specify w/ `x` & `y` and then it rotates around that point. 
- when looking at actual physical sheet, the side with the `1` on it is the front, and it's oriented like a normal sheet (long side vertical, short side horizontal) with the `1` on the top half of the page

The general flow of rendering found in `imposer.s` goes:
- start with `imposePdf` - branch based on which type of imposition
- each imposition knows how to lay out it's folios (( this logic is hairy, not easy to read, and is meant to be a write-once sort of thing -- alter with care!))
- `_renderPage` is called by each of the individual impositions to place an embedded page at a specific location. Depending on the scalling option, it calls a helper function to do th work (`_renderPageFill`/`_renderPageFit`/`_renderPageOriginal`) - it is those functions that call `_maskPage`
- after it has placed all the pages, it renders markup

For the actual download zip file/logic itself, check out `files.js`