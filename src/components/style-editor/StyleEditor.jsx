import { useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { css } from '@codemirror/lang-css'
import RuleInspector from './RuleInspector.jsx'
import QrEditor from './QrEditor.jsx'
import '../../style-editor.css'

const cssExtensions = [css()]

export default function StyleEditor({ editor, inspection, frame, revision, fonts = [], onClose }) {
  const [message, setMessage] = useState('')
  const [codeHeight, setCodeHeight] = useState(280)
  const [confirmReset, setConfirmReset] = useState(false)
  const panel = useRef(null)
  const exportCss = editor.exportCss ?? editor.draft

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportCss)
      setMessage('CSS copied to clipboard.')
    } catch { setMessage('Clipboard unavailable. Select the CSS below and copy it manually.') }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportCss], { type: 'text/css;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = editor.filename || 'resume-overrides.css'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('CSS file downloaded.')
  }
  function keyboard(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return
    const key = event.key.toLowerCase()
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      event.stopPropagation()
      if (key === 'y' || event.shiftKey) editor.redo()
      else editor.undo()
    }
  }
  function resizeCode(event) {
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    const startY = event.clientY
    const startHeight = codeHeight
    const move = (moveEvent) => {
      const maximum = Math.max(160, (panel.current?.clientHeight || 600) - 180)
      setCodeHeight(Math.max(140, Math.min(maximum, startHeight + startY - moveEvent.clientY)))
    }
    const stop = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  return <section ref={panel} className="style-editor" aria-label="Resume style editor" onKeyDownCapture={keyboard}>
    <header className="se-header"><div><h2>Style editor</h2><span className="se-muted">Changes saved in this browser</span></div><button className="se-icon" aria-label="Close style editor" onClick={onClose}>×</button></header>
    <div className="se-toolbar">
      <button className="btn" disabled={!editor.canUndo} onClick={editor.undo} title="Undo (Ctrl/⌘ Z)">Undo</button>
      <button className="btn" disabled={!editor.canRedo} onClick={editor.redo} title="Redo (Ctrl/⌘ Shift Z)">Redo</button>
      <span className="spacer" />
      <button className="se-text-button" onClick={editor.clearCurrent}>Clear current</button>
      <button className="se-text-button" onClick={() => setConfirmReset(true)}>Clear all…</button>
    </div>
    {confirmReset && <div className="se-reset" role="group" aria-label="Clear saved style changes"><p>Clear style overrides for every document and theme in this browser?</p><div className="se-actions"><button className="btn se-danger" onClick={() => { editor.clearAll(); setConfirmReset(false) }}>Clear all style changes</button><button className="se-text-button" onClick={() => setConfirmReset(false)}>Cancel</button></div></div>}
    {editor.persistenceError && <p className="se-error" role="alert">{editor.persistenceError}</p>}
    <QrEditor editor={editor} frame={frame} revision={revision} />
    <RuleInspector editor={editor} inspection={inspection} fonts={fonts} />
    <div className="se-code-resizer" role="separator" aria-label="Resize CSS code area" aria-orientation="horizontal" aria-valuemin={140} aria-valuemax={Math.max(160, (panel.current?.clientHeight || 600) - 180)} aria-valuenow={codeHeight} tabIndex={0} onPointerDown={resizeCode} onKeyDown={(event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const maximum = Math.max(160, (panel.current?.clientHeight || 600) - 180)
        setCodeHeight((height) => Math.max(140, Math.min(maximum, height + (event.key === 'ArrowUp' ? 20 : -20))))
      }
    }} />
    <div className="se-code" style={{ height: codeHeight }}>
      <div className="se-code-head"><h3>CSS changes</h3><div className="se-actions"><button className="btn" onClick={copy}>Copy</button><button className="btn" onClick={download}>Download .css</button></div></div>
      <p className="se-code-hint se-muted">Edit overrides directly. PDF exports use these styles; Copy and Download also include the selected font set import.</p>
      <div className="se-code-input"><CodeMirror value={editor.draft} height="100%" theme="dark" extensions={cssExtensions} onChange={(value) => editor.setDraft(value, true)} basicSetup={{ foldGutter: false, highlightActiveLine: true, history: false }} aria-label="CSS changes" /></div>
      {editor.error && <p role="alert" className="se-error">{editor.error}</p>}
      <p className="se-feedback" role="status">{message || (editor.error ? 'Preview shows the last valid CSS.' : 'Override CSS only · saved automatically')}</p>
    </div>
  </section>
}
