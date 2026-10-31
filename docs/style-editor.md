# Browser style editor

Use the toolbar's **Styles** button to open or close the right-hand panel. The
preview's Fit zoom automatically adjusts to the available width. Below 1100px,
the panel opens as a right-hand drawer.

## Editing

- **Pick element** highlights content under the pointer. Click to select; Escape
  cancels. Ancestor buttons select enclosing resume components.
- The default selector targets matching elements. Check the match count before
  editing, or choose **Target only this element** for a structural selector.
- Add property/value pairs under **Browser overrides**. Declaration rows support
  enable/disable, removal, `!important`, numeric increments and unit changes.
  Arrow keys step numeric values; Shift uses larger steps and Alt smaller ones.
- Font-family rows offer the project's bundled families and add their local
  stylesheet import automatically. The toolbar font-set choice is also saved.
- **Matching source rules** is read-only reference. **Computed styles** and inline
  computed values show what the browser actually applies. A more specific theme
  rule can beat a normal override; the editor preserves CSS cascade behavior.
- The lower CodeMirror area accepts CSS, including conditional rules and custom
  properties. Declaration rows edit the last top-level rule for the exact active
  selector. Conditional and other rules can be edited directly in the CSS area.
- Undo/Redo covers both CSS and font-set and color-mode changes for this document session.

## QR code

When the document has a `<QR>`, the panel shows a **QR code** section with URL and
Label fields prefilled from the preview. Edits apply on Enter or blur. The URL must
start with `http:`, `https:`, `mailto:` or `tel:` (max 1000 characters), and the
label must be non-empty (max 80). Invalid input shows an error and is not applied.
The override is saved with the document's record, covered by Undo/Redo and
**Clear current**, and sent as `?qr=` / `?qrLabel=` to both the preview and PDF
export. **Reset to document** returns to the `.mdx` values. The source file is never
changed. To make the change permanent, edit the `<QR url label>` in the `.mdx`.

CSS text retains its comments and formatting when individual declarations change.
Disabled declarations are stored as encoded `resume-editor-disabled` comments so
they survive reloads and CSS downloads without applying to the document.

## Persistence, output and reset

Changes autosave after a short delay, and pending changes flush when leaving a
document or closing the page. Each document has a separate record (its theme is
fixed by frontmatter, and there is no theme picker); the light/dark mode choice
is stored with the font set in that record and creates no separate record. History is session-only.
Storage failures appear in the panel, and editing can continue without persistence.

**Clear current** immediately resets the active CSS, font-set and mode overrides.
**Clear all…** requires confirmation and removes only editor override records.
Panel preferences and unrelated localStorage data remain intact.

**Copy** and **Download .css** return the visible draft plus an import for an
explicitly selected font set. Family imports are already part of the CSS draft.
The downloaded file uses local `/themes/fonts/…` URLs and is intended for reuse
inside this project. It does not contain the baseline theme.

Structural CSS errors keep the previous valid stylesheet applied, while the
unfinished draft is preserved. Copy/download still returns that draft. PDF export
uses the valid applied stylesheet and current font set, matching the preview.
Unsupported `@page` and sheet/page geometry changes are diagnosed: update document
frontmatter for page size and outer margins. Ordinary element margin/padding,
layout variables, typography, colors and borders are editable here.

## Integration

The React app injects one final `resume-editor-overrides` stylesheet into the
same-origin preview iframe. `window.resumePreview.refresh()` waits for fonts and
rebuilds screen page cards while retaining the canonical document for printing.
Internal `data-resume-node` identifiers map picked clones to canonical elements;
generated CSS selectors do not depend on those identifiers.

`GET /api/fonts` returns `{ id, family, cssUrl }` entries for self-hosted fonts.
`POST /api/export/:slug?mode=&fonts=` accepts an optional JSON `{ css }` body
(maximum request size 1MB). The server opens the existing render URL and applies
that stylesheet before printing. Existing bodyless exports and CLI exports work
without browser overrides. Browser overrides are not written to source files.

Dependencies: CodeMirror 6 with its React wrapper and CSS language support, CSS
Tree for parsing/source locations, and react-colorful for the color picker.

## Verification

Run `npm test` for CSS editing, storage and API tests, and `npm run build` for the
production build. Run `npm run test:browser` with `npm run dev` already running;
use `WEB_ORIGIN=http://localhost:5174` for an alternate Vite port. Tests launch
system Chrome in isolated browser contexts and never touch your browser profile.
After installing dependencies, restart a running Vite process if its dependency
cache still refers to the previous installation.
