export default function FontPicker({ doc, theme, value, onChange }) {
  const sets = theme?.fontSets ?? []
  const fallback = (sets.includes(doc.fonts) && doc.fonts) || theme?.fonts || 'none'
  return (
    <label className="field">
      <span className="field-label">Fonts</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Default ({fallback})</option>
        {sets.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  )
}
