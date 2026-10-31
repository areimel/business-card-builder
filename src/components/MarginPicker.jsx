import { cssLengthToPx } from '../lib/units.js'

const PRESETS = ['0.25in', '0.5in', '0.75in']
const TIGHT_PX = cssLengthToPx('0.25in') // below this, most printers clip the edges

/** All four sides of a margin spec, as the server resolves it (render.js resolvePageMargins). */
function sidesOf(margin) {
  if (margin && typeof margin === 'object') return Object.values(margin).map(String)
  return [String(margin === '' || margin == null ? '0.5in' : margin)]
}

/** Page margin override ("0" = none); the default is the frontmatter margin, then the theme's. */
export default function MarginPicker({ doc, theme, value, onChange }) {
  const defaults = sidesOf(doc.page?.margins ?? theme?.margin)
  const fallback = new Set(defaults).size > 1 ? 'custom'
    : cssLengthToPx(defaults[0]) === 0 ? 'none' : defaults[0]
  const sides = value != null ? [value] : defaults
  const tight = sides.some((side) => cssLengthToPx(side) < TIGHT_PX)
  return (
    <>
      <label className="field">
        <span className="field-label">Margins</span>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Default ({fallback})</option>
          <option value="0">None</option>
          {PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      {tight && (
        <span className="margin-warning" role="note"
          title="Most home and office printers can't print to the page edge, so the edges may be clipped when printed. The PDF itself is unaffected.">
          ⚠ Edges may clip when printed
        </span>
      )}
    </>
  )
}
