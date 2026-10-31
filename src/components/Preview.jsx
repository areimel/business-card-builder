import { useEffect, useRef, useState } from 'react'
import { cssLengthToPx } from '../lib/units.js'
import { overrideQuery } from '../api.js'

const PADDING = 48
const GUTTER = 16 // per side inside the iframe: room for its scrollbar and the page shadow
const MAX_FIT = 1.25
const STEP = 0.1
const clamp = (n) => Math.min(3, Math.max(0.25, n))

export default function Preview({ slug, mode, fonts, margin, qr, qrLabel, reloadKey, pageW, css = '', onFrameReady }) {
  const viewport = useRef(null)
  const iframe = useRef(null)
  const [loaded, setLoaded] = useState(0)
  const [styleError, setStyleError] = useState(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState('fit') // 'fit' | number

  useEffect(() => {
    const el = viewport.current
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!loaded) return
    let cancelled = false
    let cancelImport = () => {}
    const timer = setTimeout(async () => {
      const frame = iframe.current
      const doc = frame?.contentDocument
      if (!doc?.querySelector('body > .sheet .resume')) {
        onFrameReady?.(frame)
        return
      }
      try {
        const style = doc.createElement('style')
        style.id = 'resume-editor-overrides'
        // A style element with imports emits load once those sheets settle.
        await new Promise((resolve, reject) => {
          let deadline
          const finish = (error) => {
            clearTimeout(deadline)
            style.onload = style.onerror = null
            error ? reject(error) : resolve()
          }
          cancelImport = () => finish()
          style.onload = () => finish()
          style.onerror = () => finish(new Error('A CSS import could not be loaded.'))
          deadline = setTimeout(() => finish(new Error('CSS imports took too long to load.')), 10000)
          style.textContent = css
          doc.getElementById('resume-editor-overrides')?.remove()
          doc.head.appendChild(style)
          if (![...style.sheet.cssRules].some((rule) => rule.type === 3)) finish()
        })
        if (cancelled) return
        await frame.contentWindow.resumePreview?.refresh()
        if (!cancelled) { setStyleError(null); onFrameReady?.(frame) }
      } catch (err) {
        if (!cancelled) {
          setStyleError(err.message)
          await frame.contentWindow.resumePreview?.refresh()
          if (!cancelled) onFrameReady?.(frame)
        }
      }
    }, 120)
    return () => { cancelled = true; clearTimeout(timer); cancelImport() }
  }, [css, loaded, onFrameReady])

  const frameW = cssLengthToPx(pageW) + 2 * GUTTER
  const fitScale = Math.min(MAX_FIT, Math.max(0.1, (size.w - PADDING) / frameW))
  const scale = zoom === 'fit' ? fitScale : zoom
  const bump = (d) => setZoom(clamp(Math.round((scale + d) * 100) / 100))
  const src = `/render/${encodeURIComponent(slug)}${overrideQuery({ mode, fonts, margin, qr, qrLabel })}`

  // Simple approach: the iframe is one page wide (plus gutters) and as tall as the
  // viewport (in unscaled px), so it scrolls internally; the wrapper reserves
  // the scaled footprint so the outer viewport never scrolls horizontally at Fit.
  const frameH = Math.max(0, size.h - PADDING) / scale

  return (
    <section className="preview">
      <div className="zoom segmented" role="group" aria-label="Zoom">
        <button className={zoom === 'fit' ? 'on' : ''} onClick={() => setZoom('fit')}>Fit</button>
        <button className={zoom === 1 ? 'on' : ''} onClick={() => setZoom(1)}>100%</button>
        <button onClick={() => bump(-STEP)} aria-label="Zoom out">−</button>
        <span className="zoom-value">{Math.round(scale * 100)}%</span>
        <button onClick={() => bump(STEP)} aria-label="Zoom in">+</button>
      </div>
      <div className="viewport" ref={viewport}>
        <div className="stage" style={{ width: frameW * scale, height: frameH * scale }}>
          <iframe
            ref={iframe}
            key={reloadKey}
            onLoad={() => setLoaded((value) => value + 1)}
            title="Resume preview"
            src={src}
            style={{ width: frameW, height: frameH, transform: `scale(${scale})` }}
          />
        </div>
      </div>
      {styleError && <p className="preview-style-error" role="alert">{styleError}</p>}
    </section>
  )
}
