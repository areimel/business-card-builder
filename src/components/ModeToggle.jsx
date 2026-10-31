const MODES = ['light', 'dark']

/** Document default mode: frontmatter, then the theme's, then light. */
export const defaultMode = (doc, theme) => doc?.mode || theme?.mode || 'light'

export default function ModeToggle({ doc, theme, value, onChange }) {
  if (!theme?.modes?.includes('dark')) return null
  const fallback = defaultMode(doc, theme)
  const active = value ?? fallback
  return (
    <div className="field">
      <span className="field-label">Mode</span>
      <div className="segmented" role="group" aria-label="Color mode">
        {MODES.map((mode) => (
          <button key={mode} className={mode === active ? 'on' : ''} aria-pressed={mode === active}
            title={mode === fallback ? 'Document default' : undefined}
            onClick={() => onChange(mode === fallback ? null : mode)}>
            {mode === 'light' ? 'Light' : 'Dark'}{mode === fallback ? ' •' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
