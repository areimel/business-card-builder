import { useEffect, useState } from 'react'
import { exportPdf } from '../api.js'
import ModeToggle from './ModeToggle.jsx'
import FontPicker from './FontPicker.jsx'
import MarginPicker from './MarginPicker.jsx'

function download(url, file) {
  const a = document.createElement('a')
  a.href = url
  a.download = file
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function Toolbar({ doc, theme, modeOverride, onMode, fontsOverride, onFonts, marginOverride, onMargin, qrOverrides, css = '', editorOpen, onToggleEditor }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // { kind: 'ok' | 'error', text }

  // Status belongs to the document it was produced for.
  useEffect(() => setStatus(null), [doc.slug])

  useEffect(() => {
    if (status?.kind !== 'ok') return
    const t = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(t)
  }, [status])

  const onExport = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const { name, url } = await exportPdf(doc.slug, { mode: modeOverride, fonts: fontsOverride, margin: marginOverride, ...qrOverrides }, css)
      download(url, name)
      setStatus({ kind: 'ok', text: `Saved exports/${name}` })
    } catch (err) {
      setStatus({ kind: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="toolbar">
      <h2 className="toolbar-title" title={doc.title}>{doc.title || doc.slug}</h2>
      <ModeToggle doc={doc} theme={theme} value={modeOverride} onChange={onMode} />
      <FontPicker doc={doc} theme={theme} value={fontsOverride} onChange={onFonts} />
      <MarginPicker doc={doc} theme={theme} value={marginOverride} onChange={onMargin} />
      <span className="spacer" />
      <button className="btn" aria-expanded={editorOpen} onClick={onToggleEditor}>Styles</button>
      {status && (
        <span className={`status ${status.kind}`} role="status" title={status.text}>
          {status.text}
        </span>
      )}
      <button className="btn primary" onClick={onExport} disabled={busy}>
        {busy && <span className="spinner" aria-hidden="true" />}
        {busy ? 'Exporting…' : 'Export PDF'}
      </button>
    </div>
  )
}
