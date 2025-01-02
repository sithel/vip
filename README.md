# vip
Villainous Imposer Program

# Helper Functions & Code Structure

## `unified_source` (steps 1 & 2)

Needs `unified_source_modifier.attach()` to be called first to hook everything up (see `state_modifiers.js`).
Call `window.book.unified_source.processUpdate()` after base changes to re-calculate things. Things like:

- `window.book.unified_source.maxWidth` / `window.book.unified_source.maxHeight` : raw PDF height (post step 1)
- `window.book.unified_source.isTurned()` : returns true if it's -90 or 90 degree rotation (post step 2)
- `window.book.unified_source.pdf_w` / `window.book.unified_source.pdf_h` : takes into account PDF margins and rotation. (post step 2)

## Physical (step 3)

- `window.book.physical.display_unit` : either `metric`, `imperial`, or `points`
- `window.book.physical.paper_size` : a 2 value list of the sheet's `[width, height]` in points