import { useEffect, useId, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

const units = ['px', 'pt', 'em', 'rem', '%', 'in', 'cm', 'mm', 'vh', 'vw', 'ch', '']
const numericValue = /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i
const valuesByProperty = {
  display: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'],
  'font-weight': ['normal', 'bold', '400', '500', '600', '700'],
  'font-style': ['normal', 'italic', 'oblique'],
  'text-align': ['left', 'center', 'right', 'justify'],
  'font-family': ['serif', 'sans-serif', 'monospace', 'inherit'],
  'line-height': ['normal', '1', '1.2', '1.4', '1.5', '1.6'],
  'break-before': ['auto', 'page', 'avoid'],
  'break-after': ['auto', 'page', 'avoid'],
  'break-inside': ['auto', 'avoid', 'avoid-page'],
  'font-size': ['10pt', '11pt', '12pt', '14pt', '16pt', '1rem'],
}

export default function DeclarationRow({ declaration, onCommit, onRemove, fonts, onFont, computed = {} }) {
  const valueListId = useId()
  const [property, setProperty] = useState(declaration.property)
  const [value, setValue] = useState(declaration.value)
  const [colorOpen, setColorOpen] = useState(false)
  const [color, setColor] = useState('#6d8cff')
  useEffect(() => {
    setProperty(declaration.property)
    setValue(declaration.value)
  }, [declaration.property, declaration.value])

  function commit(next = {}) {
    const update = { property: property.trim(), value: value.trim(), important: declaration.important, disabled: declaration.disabled, ...next }
    if (!update.property || !update.value) return
    if (Object.keys(update).some((key) => update[key] !== declaration[key])) onCommit(update)
  }

  function inputKey(event, isValue = false) {
    if (isValue && numeric && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      const amount = event.shiftKey ? 10 : event.altKey ? 0.1 : defaultStep
      stepNumber((event.key === 'ArrowUp' ? 1 : -1) * amount)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      setProperty(declaration.property)
      setValue(declaration.value)
      event.preventDefault()
    }
  }

  const numeric = value.trim().match(numericValue)
  const defaultStep = numeric && (['em', 'rem'].includes(numeric[2]) || (!numeric[2] && Math.abs(Number(numeric[1])) < 2)) ? 0.1 : 1
  const isColor = /color|background|fill|stroke/i.test(property)
  const suggestions = [...new Set([computed[property], ...(valuesByProperty[property] || []),
    ...(/^(margin|padding|gap|width|height)/.test(property) ? ['0', '4px', '8px', '12px', '16px', '1rem', 'auto'] : []),
    ...(isColor ? ['transparent', 'currentColor', '#000000', '#ffffff'] : []), 'inherit', 'initial', 'unset'].filter(Boolean))]
  function changeNumber(next) {
    setValue(next)
    commit({ value: next })
  }
  function stepNumber(amount) { changeNumber(`${Math.round((Number(numeric[1]) + amount) * 1000) / 1000}${numeric[2]}`) }

  return (
    <div className={`se-declaration${declaration.disabled ? ' se-disabled' : ''}`}>
      <div className="se-declaration-main">
        <input type="checkbox" checked={!declaration.disabled} aria-label={`Enable ${property}`} onChange={(event) => commit({ disabled: !event.target.checked })} />
        <input className="se-property" aria-label="CSS property" list="se-properties" value={property} onChange={(event) => setProperty(event.target.value)} onBlur={() => commit()} onKeyDown={inputKey} spellCheck={false} />
        <span aria-hidden="true">:</span>
        <input className="se-value" aria-label={`${property} value`} list={valueListId} value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => commit()} onKeyDown={(event) => inputKey(event, true)} spellCheck={false} />
        <button className={`se-icon${declaration.important ? ' se-active' : ''}`} title="Toggle !important" aria-label={`Toggle important for ${property}`} aria-pressed={Boolean(declaration.important)} onClick={() => commit({ important: !declaration.important })}>!</button>
        <button className="se-icon" title="Remove declaration" aria-label={`Remove ${property}`} onClick={onRemove}>×</button>
      </div>
      <datalist id={valueListId}>{suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
      {computed[property] && <div className="se-inline-computed" title={`Computed ${property}: ${computed[property]}`}>Computed: <span>{computed[property]}</span></div>}
      {(numeric || isColor || property === 'font-family') && (
        <div className="se-value-tools">
          {numeric && <>
            <button className="se-icon" aria-label={`Decrease ${property}`} onClick={() => stepNumber(-defaultStep)}>−</button>
            <button className="se-icon" aria-label={`Increase ${property}`} onClick={() => stepNumber(defaultStep)}>+</button>
            <select aria-label={`${property} unit`} value={numeric[2]} onChange={(event) => changeNumber(`${numeric[1]}${event.target.value}`)}>
              {!units.includes(numeric[2]) && <option value={numeric[2]}>{numeric[2]}</option>}
              {units.map((unit) => <option key={unit} value={unit}>{unit || 'unitless'}</option>)}
            </select>
          </>}
          {isColor && <button className="se-color-button" aria-label={`Pick ${property} color`} aria-expanded={colorOpen} onClick={() => {
            if (/^#[\da-f]{3}([\da-f]{3})?$/i.test(value)) setColor(value)
            setColorOpen(!colorOpen)
          }}><span style={{ background: value }} /> Color</button>}
          {property === 'font-family' && fonts.length > 0 && <select aria-label="Choose bundled font" value="" onChange={(event) => {
            const font = fonts.find((entry) => entry.id === event.target.value)
            if (font) onFont(font)
          }}><option value="">Bundled font…</option>{fonts.map((font) => <option key={font.id} value={font.id}>{font.family}</option>)}</select>}
        </div>
      )}
      {colorOpen && <div className="se-color-popover">
        <HexColorPicker color={color} onChange={setColor} />
        <div className="se-actions"><code>{color}</code><button className="btn" onClick={() => {
          setValue(color)
          commit({ value: color })
          setColorOpen(false)
        }}>Apply color</button><button className="se-icon" aria-label="Close color picker" onClick={() => setColorOpen(false)}>×</button></div>
      </div>}
    </div>
  )
}
