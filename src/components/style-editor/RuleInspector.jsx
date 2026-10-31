import { useEffect, useState } from 'react'
import { addFontImport, inspectDeclarations, updateDeclaration } from '../../lib/styleCss.js'
import DeclarationRow from './DeclarationRow.jsx'

const commonProperties = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'background-color', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'width', 'height', 'display', 'gap', 'text-align', 'border', 'border-color', 'border-radius', 'opacity', 'break-before', 'break-after', 'break-inside']

export default function RuleInspector({ editor, inspection, fonts }) {
  const [selector, setSelector] = useState(inspection.selector || '')
  const [newProperty, setNewProperty] = useState('')
  const [newValue, setNewValue] = useState('')
  const [localError, setLocalError] = useState('')
  useEffect(() => setSelector(inspection.selector || ''), [inspection.selector])
  let declarations = []
  try { declarations = inspectDeclarations(editor.draft, inspection.selector) } catch { /* Draft diagnostics appear below. */ }

  function update(index, declaration) {
    try {
      editor.setDraft(updateDeclaration(editor.draft, inspection.selector, index, declaration))
      setLocalError('')
    } catch (error) { setLocalError(error.message) }
  }
  function commitSelector() {
    if (selector.trim() !== inspection.selector) inspection.setSelector(selector.trim())
  }
  function addDeclaration(event) {
    event.preventDefault()
    if (!newProperty.trim() || !newValue.trim() || !inspection.selector) return
    update(-1, { property: newProperty.trim(), value: newValue.trim(), important: false, disabled: false })
    setNewProperty('')
    setNewValue('')
  }
  function selectFont(index, font) {
    try {
      const imported = addFontImport(editor.draft, font.cssUrl)
      editor.setDraft(updateDeclaration(imported, inspection.selector, index, { ...declarations[index], value: `"${font.family}"` }))
      setLocalError('')
    } catch (error) { setLocalError(error.message) }
  }

  return <div className="se-inspector">
    <div className="se-pickbar">
      <button className={`btn${inspection.picking ? ' primary' : ''}`} aria-pressed={inspection.picking} onClick={() => inspection.setPicking(!inspection.picking)}>{inspection.picking ? 'Cancel picker' : 'Pick element'}</button>
      <span className="se-muted">{inspection.picking ? 'Click an element in the resume' : 'Select an element or enter a selector'}</span>
    </div>
    {inspection.selectionLabel && <div className="se-selection-label" title={inspection.selectionLabel}>{inspection.selectionLabel}</div>}
    {inspection.ancestors?.length > 0 && <nav className="se-ancestors" aria-label="Selected element ancestors">{inspection.ancestors.map((ancestor, index) => <button key={index} onClick={ancestor.select}>{ancestor.label}</button>)}</nav>}
    <label className="se-selector-label" htmlFor="se-selector">CSS selector</label>
    <input id="se-selector" className="se-selector" value={selector} onChange={(event) => setSelector(event.target.value)} onBlur={commitSelector} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} placeholder=".resume h2" spellCheck={false} />
    <div className="se-target-info"><span>{inspection.matchCount ?? 0} matching element{inspection.matchCount === 1 ? '' : 's'}</span>{inspection.selectionLabel && <button className="se-text-button" onClick={inspection.selectSingle}>Target only this element</button>}</div>
    <h3>Browser overrides</h3>
    {!inspection.selector && <p className="se-muted">Pick an element to begin editing its styles.</p>}
    {inspection.selector && <>
      {declarations.length === 0 && <p className="se-muted">No overrides for this selector yet. Add a property below.</p>}
      <div className="se-declarations">{declarations.map((declaration, index) => <DeclarationRow key={`${inspection.selector}:${index}`} declaration={declaration} onCommit={(value) => update(index, value)} onRemove={() => update(index, null)} fonts={fonts} computed={inspection.computed} onFont={(font) => selectFont(index, font)} />)}</div>
      <form className="se-add-property" onSubmit={addDeclaration}>
        <input aria-label="New CSS property" list="se-properties" placeholder="property" value={newProperty} onChange={(event) => setNewProperty(event.target.value)} spellCheck={false} />
        <input aria-label="New CSS value" placeholder="value" value={newValue} onChange={(event) => setNewValue(event.target.value)} spellCheck={false} />
        <button className="btn" disabled={!newProperty.trim() || !newValue.trim()}>Add</button>
      </form>
    </>}
    <datalist id="se-properties">{commonProperties.map((property) => <option key={property} value={property} />)}</datalist>
    {localError && <p role="alert" className="se-error">{localError}</p>}
    <details className="se-details"><summary>Matching source rules ({inspection.rules?.length || 0})</summary>
      {(inspection.rules || []).map((rule, index) => <div className="se-source-rule" key={index}><span className="se-muted">{rule.source}</span><pre>{rule.css}</pre></div>)}
      {!inspection.rules?.length && <p className="se-muted">No matching source rules.</p>}
    </details>
    <details className="se-details"><summary>Computed styles</summary><dl className="se-computed">{Object.entries(inspection.computed || {}).map(([property, value]) => <div key={property}><dt>{property}</dt><dd>{value}</dd></div>)}</dl></details>
  </div>
}
