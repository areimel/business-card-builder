import { useCallback, useEffect, useRef, useState } from 'react'
import { INSPECTOR_ID, canonicalNode, computedProperties, defaultSelector, matchingNodes, matchingRules, nodeLabel, resumeRoot, singleSelector } from '../lib/inspectDom.js'

export function useResumeInspection({ frame, revision, theme, enabled }) {
  const [picking, setPicking] = useState(false)
  const [selector, updateSelector] = useState('.resume')
  const [selection, setSelection] = useState({ id: null, path: '.resume' })
  const [snapshot, setSnapshot] = useState({ matchCount: 0, selectionLabel: '', ancestors: [], rules: [], computed: {} })
  const selectedRef = useRef(null)
  const docRef = useRef(null)
  const choseInitialSelector = useRef(false)

  const setSelector = useCallback((value) => {
    updateSelector(value)
    const root = resumeRoot(docRef.current)
    const node = matchingNodes(root, value)[0]
    if (node) setSelection({ id: node.dataset.resumeNode ?? null, path: singleSelector(node, root) })
  }, [])

  useEffect(() => {
    let doc
    try { doc = frame?.contentDocument } catch { return }
    docRef.current = doc
    const root = resumeRoot(doc)
    if (!root) {
      selectedRef.current = null
      setSnapshot({ matchCount: 0, selectionLabel: '', ancestors: [], rules: [], computed: {} })
      return
    }
    if (!choseInitialSelector.current) {
      choseInitialSelector.current = true
      updateSelector(defaultSelector(doc, root, theme))
    }
    const reloaded = selectedRef.current && selectedRef.current.ownerDocument !== doc
    const selected = selection.id == null || reloaded ? matchingNodes(root, selection.path)[0]
      : [root, ...root.querySelectorAll('[data-resume-node]')].find((node) => node.dataset.resumeNode === selection.id)
    if (reloaded) setSelection({ id: selected?.dataset.resumeNode ?? 'missing', path: selection.path })
    selectedRef.current = selected || null
    const select = (node) => {
      if (!node) return
      setSelection({ id: node.dataset.resumeNode ?? null, path: singleSelector(node, root) })
      updateSelector(defaultSelector(doc, node, theme))
    }
    const ancestors = []
    let ancestor = selected?.parentElement
    while (ancestor && (ancestor === root || root.contains(ancestor))) {
      const target = ancestor
      ancestors.push({ label: nodeLabel(target), select: () => select(target) })
      ancestor = ancestor.parentElement
    }
    setSnapshot({
      matchCount: matchingNodes(root, selector).length,
      selectionLabel: nodeLabel(selected), ancestors,
      rules: matchingRules(doc, selected), computed: computedProperties(doc, selected),
    })
    if (!enabled) return
    const overlay = doc.createElement('div')
    overlay.id = INSPECTOR_ID
    overlay.setAttribute('aria-hidden', 'true')
    overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;'
    doc.body.appendChild(overlay)
    let hovered = null
    const draw = () => {
      overlay.replaceChildren()
      for (const [node, color] of [[selected, '#3b82f6'], [hovered, '#f59e0b']]) {
        if (!node) continue
        const id = node.dataset.resumeNode
        const visible = id == null ? [node] : [...doc.querySelectorAll('[data-resume-node]')]
          .filter((candidate) => candidate.dataset.resumeNode === id)
        for (const target of visible) {
          if (doc.defaultView.getComputedStyle(target).visibility === 'hidden') continue
          const rect = target.getBoundingClientRect()
          const clip = target.closest('.page-window')?.getBoundingClientRect()
          const left = Math.max(0, rect.left, clip?.left ?? 0)
          const top = Math.max(0, rect.top, clip?.top ?? 0)
          const right = Math.min(doc.defaultView.innerWidth, rect.right, clip?.right ?? Infinity)
          const bottom = Math.min(doc.defaultView.innerHeight, rect.bottom, clip?.bottom ?? Infinity)
          if (right <= left || bottom <= top) continue
          const box = doc.createElement('div')
          box.style.cssText = `position:fixed;box-sizing:border-box;pointer-events:none;left:${left}px;top:${top}px;width:${right - left}px;height:${bottom - top}px;border:2px solid ${color};background:${color}12;`
          overlay.appendChild(box)
        }
      }
    }
    const move = (event) => {
      if (!picking) return
      hovered = canonicalNode(doc, event.target)
      draw()
    }
    const leave = () => { hovered = null; draw() }
    const click = (event) => {
      if (!picking) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      const node = canonicalNode(doc, event.target)
      if (node) { select(node); setPicking(false) }
    }
    const key = (event) => {
      if (event.key === 'Escape') { setPicking(false); hovered = null; draw() }
    }
    doc.addEventListener('mousemove', move, true)
    doc.addEventListener('mouseleave', leave, true)
    doc.addEventListener('click', click, true)
    doc.addEventListener('keydown', key, true)
    doc.defaultView.addEventListener('scroll', draw, true)
    doc.defaultView.addEventListener('resize', draw)
    window.addEventListener('keydown', key)
    draw()
    return () => {
      overlay.remove()
      doc.removeEventListener('mousemove', move, true)
      doc.removeEventListener('mouseleave', leave, true)
      doc.removeEventListener('click', click, true)
      doc.removeEventListener('keydown', key, true)
      doc.defaultView?.removeEventListener('scroll', draw, true)
      doc.defaultView?.removeEventListener('resize', draw)
      window.removeEventListener('keydown', key)
    }
  }, [frame, revision, theme, enabled, picking, selector, selection])

  useEffect(() => {
    if (!enabled) setPicking(false)
  }, [enabled])

  const selectSingle = useCallback(() => {
    const node = selectedRef.current
    if (node) updateSelector(singleSelector(node, resumeRoot(docRef.current)))
  }, [])

  return { picking, setPicking, selector, setSelector, ...snapshot, selectSingle }
}
