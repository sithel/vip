# vip
[Villainous Imposer Program](https://sithel.github.io/vip/)

Launch February 4th 2025 

## [Versions](#version-history)

- v0.0.14 - Added "spine only" option for PDF bounds to keep the gutter clean.
- v0.0.13 - adding PDF pre-processing so pages can be split in half or cropped to their CropBox -- also cleaned up some unused/unneeded code & switched default to Flip Long (was Flip Short)
- v0.0.12 - fixing Paper Margins (were swapped) & adding Rotate Paper button
- v0.0.11 - fixing Tiny Landscape folding marks and adding duo Sexto imposition
- v0.0.10 - adding Tiny Landscape imposition & slightly improving saved file name
- v0.0.9 - adding [FAQ page](https://sithel.github.io/vip/docs/faq.html) and fixing custom dimensions so they actually work
- v0.0.8 - fixing links and bug introduced in v0.0.3
- v0.0.7 - adding interlacing functionality
- v0.0.6 - fixing opacity bug!! (thanks myro!)
- v0.0.5 - cropping of incoming PDF
- v0.0.4 - test print PDF generation
- v0.0.3 - reverse page order
- v0.0.2 - fix typo, fix octavo fat fold line, turned on rotation functionality
- v0.0.1 - disable rotation UI as it doesn't work yet
- v0.0.0 - launch!


## Help Wanted

- https://github.com/sithel/vip/issues/4  - origiami simulator and the `.fold` file format

# TODOs

There's a lot of features and a lot of work remaining--

### Functionality

- cut lines
- export settings via .txt file
- persist/export/import imposer configurations
- export imposer debug information

### UI/UX:

- saving settings/URL params
- correctly re-rendering values when changing Display Units
- PDF placement preview
- debug info / error states / progress bars
- folding information / animations for impositions
- warn in PDF Placement if known exceeding of bounds (and by how much)
- dynamic button name change for Download from `get that file!` to `get those files!`

### Stretch/Long Term

- figure out CORS stuff so it can be saved to someone's computer
- page numbers in the margins
- printer creep
- printer/PDF skew correction
- UI night mode colors
- more impositions
- improve Imposition options UI/UX to be more compact (in listing options section)

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
- `window.book.unified_source.pageCount` : calculated total pages across multiple PDFs and accounting for blanks -- adjusts for interlaced pages
- `window.book.unified_source.getPdfPageForPageNumber(pageNum)` : given page `N` in the result PDF, looks up in the `window.book.upload_blocks` to fetch the corresponding `PDFLib.PDFPage` -- returns `[upload_block_index, PDFPage]` -- adjusts for reversed or interlaced pages
- `window.book.unifired_source.interlaced` : defaults to `false` - if `true` (set during `Processing`) then the odd pages come from the first PDF and the even come from the second (and there's exactly 2 sources)

## Physical (step 3)

This really highlights the mangling of terms. Height = `y`, Width = `x` (short/long is input, but calculated out to x/y)

- `window.book.physical.display_unit` : either `metric`, `imperial`, or `points`
- `window.book.physical.paper_size` : a 2 value list of the sheet's `[width, height]` in points
- `window.book.physical.short_margin` : value to be mirrored on both sides of the paper (compressing total imposition)
- `window.book.physical.long_margin` : value to be mirrored on both sides of the paper (compressing total imposition)
- `window.book.physical.printer_marin_bonus` : 2 dimensional array `[x, y]` of the correct printer margin (taking into account short/long settings & real dimensions)

## Imposition (step 4)

Oh so very "write once, read never" kinda' logic there for all the specific impositions (seE: `imposer.js`) -- am sure there's a better way to handle/encode the folio positions & handle the front/back flip short/long logic but I've not figured it out yet.

Within `imposer.js`:
 
 - `_renderPage` is pretty solid (and self documented) -- given placement x,y on sheet and cell w,h to work with, figures out how to place specified `page_num` according to the `window.book.physical.scaling`
 - the `_handleIMPOSITION` functions manage folio wrangling and placement, relying on `_renderPage` and getting a lot of helper values from `_calcDimens` (yay for destructuring in JavaScript!)


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

# Notes to Self

- don't forget, use `python3 -m http.server 8000` to launch local server