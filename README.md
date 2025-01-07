# vip
Villainous Imposer Program

Targeting launch early February 2025

# TODOs

There's a lot of features and a lot of work remaining--

### Functionality

- all of PDF page placement
  - handling both flip options
  - rotation/padding/margin logic
- file downloading (all options)
- all of mark-up
  - PDF boundary spine marks
  - spine order marks
  - punching guidelines/marks (spine/interior)
  - cut / fold lines
  - corner cross-hairs
- preview

### UI/UX:

- enable/disable sections based on entered values
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

- `window.book.physical.display_unit` : either `metric`, `imperial`, or `points`
- `window.book.physical.paper_size` : a 2 value list of the sheet's `[width, height]` in points

## Imposition (step 4)

## Placement / Imposed (step 5)

You can find the logic handling this over in `helper.js` `calImpositionInfo()`

- `window.book.imposed.sheets` : List of lists. Each entry in the outer list is a sheet of paper (front and back), which contains a list of folios, which contains a list of 4 pages making up that folio. The order of the folios within a sheet is specific to the imposition. The order of the pages in the folio is front, inner left, inner right, back
- `window.book.imposed.signatures` : List of lists. Each entry in the outer list is a signature, which contains a list of folios, which contains a list of 4 pages making up the folio. The order of signatures is start of book to end of book. The order of folios in the signature is outer-most first and ends with inner-most. The order of the pages in the folio is front, inner left, inner right, back

## Preview (step 8) / Rendering

Starts in `preview.js`'s `build` function, kicked off via `vip.refreshPreview()`. Has some initial corner case logic (first signature only?) and hard coded assumptions (always 'both sides') - but otherwise runs the same path as the Downloaded PDF (see next section)

## Download (step 9)

When rendering/building the PDF, some settings are stored in `window.book` and referenced via hard-coded links. Some settings are passed in as parameters the further along the process you go. Some settings are checked at-time-of-evaluation via `document.getElementById`

- `document.getElementById("flip_paper_short").checked` : never stored, always evaluated when rendering

Drawing on the canvas always confuses me. Some notes:

- when thinking about the `rotate` when calling `drawPage` on a `PDFPage`, remember that it pivotes around the natural "lower left" corner. That is placed where you specify w/ `x` & `y` and then it rotates around that point. 


For the actual download zip file/logic itself, check out `files.js`