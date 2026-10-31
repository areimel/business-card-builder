import { useEffect, useRef, useState } from 'react'
import { outputCss, validateCss } from '../lib/styleCss.js'
import { clearStyles, emptyRecord, loadStyle, saveStyle, styleKey } from '../lib/styleStorage.js'

// Mount one editor session per document so history never crosses resumes.
export function useStyleEditor(slug, theme) {
  const key = styleKey(slug, theme)
  const [persistenceError, setPersistenceError] = useState(null)
  const [history, setHistory] = useState(() => {
    let record = emptyRecord()
    try { record = loadStyle(window.localStorage, key) }
    catch (err) { queueMicrotask(() => setPersistenceError(err.message)) }
    return { entries: [record], index: 0 }
  })
  const historyRef = useRef(history)
  const lastEdit = useRef(0)
  const current = history.entries[history.index]
  const currentRef = useRef(current)
  currentRef.current = current

  const store = (record) => {
    try { saveStyle(window.localStorage, key, record); setPersistenceError(null) }
    catch (err) { setPersistenceError(`Browser changes could not be saved: ${err.message}`) }
  }
  useEffect(() => {
    const timer = setTimeout(() => store(current), 300)
    return () => clearTimeout(timer)
  }, [current])
  useEffect(() => {
    const flush = () => {
      try { saveStyle(window.localStorage, key, currentRef.current) } catch { /* UI reports normal save failures. */ }
    }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [key])

  const changeHistory = (next) => {
    historyRef.current = next
    currentRef.current = next.entries[next.index]
    setHistory(next)
  }
  const commit = (patch, group = false) => {
    const h = historyRef.current
    const before = h.entries[h.index]
    const record = { ...before, ...patch }
    if (JSON.stringify(record) === JSON.stringify(before)) return
    const now = Date.now()
    const entries = h.entries.slice(0, h.index + 1)
    if (group && h.index > 0 && now - lastEdit.current < 500) entries[entries.length - 1] = record
    else entries.push(record)
    lastEdit.current = group ? now : 0
    changeHistory({ entries: entries.slice(-150), index: Math.min(entries.length - 1, 149) })
  }
  const reset = (all) => {
    try {
      if (all) clearStyles(window.localStorage)
      else window.localStorage.removeItem(key)
      setPersistenceError(null)
    } catch (err) { setPersistenceError(err.message) }
    lastEdit.current = 0
    changeHistory({ entries: [emptyRecord()], index: 0 })
  }
  const travel = (delta) => {
    const h = historyRef.current
    const index = Math.max(0, Math.min(h.entries.length - 1, h.index + delta))
    lastEdit.current = 0
    changeHistory({ ...h, index })
  }
  return {
    ...current, error: validateCss(current.draft), persistenceError,
    exportCss: outputCss(current.draft, current.fontsOverride),
    filename: `${slug}--${theme}--overrides.css`,
    setDraft: (draft, group = false) => commit({ draft, ...(!validateCss(draft) ? { appliedCss: draft } : {}) }, group),
    setFontsOverride: (fontsOverride) => commit({ fontsOverride }),
    setModeOverride: (modeOverride) => commit({ modeOverride }),
    setMarginOverride: (marginOverride) => commit({ marginOverride }),
    setQrOverrides: (patch) => commit(patch),
    canUndo: history.index > 0, canRedo: history.index < history.entries.length - 1,
    undo: () => travel(-1), redo: () => travel(1), clearCurrent: () => reset(false), clearAll: () => reset(true),
  }
}
