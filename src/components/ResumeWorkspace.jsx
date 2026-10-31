import { lazy, Suspense, useCallback, useState } from 'react'
import Preview from './Preview.jsx'
import Toolbar from './Toolbar.jsx'
import { useStyleEditor } from '../hooks/useStyleEditor.js'
import { useResumeInspection } from '../hooks/useResumeInspection.js'

const PREFS = 'resume-builder:editor-panel:v1'
const StyleEditor = lazy(() => import('./style-editor/StyleEditor.jsx'))
function preferences() {
  try { return JSON.parse(localStorage.getItem(PREFS)) || {} } catch { return {} }
}

export default function ResumeWorkspace({ doc, theme, fonts, reloadKey }) {
  const editor = useStyleEditor(doc.slug, doc.theme)
  const [panel, setPanel] = useState(() => {
    const value = preferences()
    return { open: value.open !== false, width: Math.max(320, Math.min(640, Number(value.width) || 400)) }
  })
  const [frame, setFrame] = useState(null)
  const [revision, setRevision] = useState(0)
  const ready = useCallback((next) => { setFrame(next); setRevision((value) => value + 1) }, [])
  const qrOverrides = { qr: editor.qrUrlOverride, qrLabel: editor.qrLabelOverride }
  const inspection = useResumeInspection({ frame, revision, theme: doc.theme, enabled: panel.open })
  const updatePanel = (patch) => {
    setPanel((previous) => {
      const next = { ...previous, ...patch }
      try { localStorage.setItem(PREFS, JSON.stringify(next)) } catch { /* Style persistence errors have their own status. */ }
      return next
    })
  }
  const resize = (event) => {
    const start = event.clientX
    const width = panel.width
    event.currentTarget.setPointerCapture(event.pointerId)
    const move = (next) => updatePanel({ width: Math.max(320, Math.min(640, width + start - next.clientX)) })
    const target = event.currentTarget
    const stop = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', stop)
      target.removeEventListener('pointercancel', stop)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', stop)
    target.addEventListener('pointercancel', stop)
  }
  return (
    <div className={`resume-workspace${panel.open ? ' editor-open' : ''}`} style={{ '--editor-width': `${panel.width}px` }}>
      <div className="resume-main">
        <Toolbar doc={doc} theme={theme} modeOverride={editor.modeOverride} onMode={editor.setModeOverride}
          fontsOverride={editor.fontsOverride} onFonts={editor.setFontsOverride}
          marginOverride={editor.marginOverride} onMargin={editor.setMarginOverride} qrOverrides={qrOverrides}
          css={editor.appliedCss} editorOpen={panel.open} onToggleEditor={() => updatePanel({ open: !panel.open })} />
        <Preview slug={doc.slug} mode={editor.modeOverride} fonts={editor.fontsOverride} margin={editor.marginOverride} {...qrOverrides} reloadKey={reloadKey}
          pageW={doc.page?.size?.w} css={editor.appliedCss} onFrameReady={ready} />
      </div>
      {panel.open && <div className="editor-dock">
        <div className="editor-resizer" role="separator" aria-label="Resize style editor" aria-orientation="vertical"
          aria-valuemin={320} aria-valuemax={640} aria-valuenow={panel.width} tabIndex={0} onPointerDown={resize}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              updatePanel({ width: Math.max(320, Math.min(640, panel.width + (event.key === 'ArrowLeft' ? 20 : -20))) })
            }
          }} />
        <Suspense fallback={<div className="style-editor">Loading style editor…</div>}>
          <StyleEditor editor={editor} inspection={inspection} frame={frame} revision={revision} fonts={fonts} onClose={() => updatePanel({ open: false })} />
        </Suspense>
      </div>}
    </div>
  )
}
