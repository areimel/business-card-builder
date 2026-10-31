export const INSPECTOR_ID = 'resume-editor-inspector'

export function resumeRoot(doc) {
  return doc?.querySelector('body > .sheet .resume') || null
}

export function matchingNodes(root, selector) {
  if (!root || !selector.trim()) return []
  try {
    return [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)]
  } catch {
    return []
  }
}

export function canonicalNode(doc, node) {
  const root = resumeRoot(doc)
  if (!root || !node?.closest) return null
  if (node === root || root.contains(node)) return node
  const tagged = node.closest('[data-resume-node]')
  const id = tagged?.getAttribute('data-resume-node')
  if (id == null) return null
  return [root, ...root.querySelectorAll('[data-resume-node]')]
    .find((candidate) => candidate.getAttribute('data-resume-node') === id) || null
}

export function nodeLabel(node) {
  if (!node) return ''
  return node.localName + [...node.classList].map((name) => `.${name}`).join('')
}

export function singleSelector(node, root) {
  if (!node || !root || (node !== root && !root.contains(node))) return ''
  const parts = []
  while (node !== root) {
    const siblings = [...node.parentElement.children].filter((item) => item.localName === node.localName)
    parts.unshift(`${node.localName}:nth-of-type(${siblings.indexOf(node) + 1})`)
    node = node.parentElement
  }
  return ['.resume', ...parts].join(' > ')
}

// Split only selector-list commas; functional selectors can contain their own lists.
function selectorParts(selector) {
  const parts = []
  let depth = 0, quote = '', start = 0, escaped = false
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]
    if (escaped) { escaped = false; continue }
    if (char === '\\') { escaped = true; continue }
    if (quote) { if (char === quote) quote = ''; continue }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === '(' || char === '[') depth++
    if (char === ')' || char === ']') depth--
    if (char === ',' && depth === 0) { parts.push(selector.slice(start, i).trim()); start = i + 1 }
  }
  parts.push(selector.slice(start).trim())
  return parts
}

export function matchingRules(doc, node) {
  if (!node) return []
  const result = []
  const visited = new Set()
  const view = doc.defaultView
  function visit(sheet, source, contexts = []) {
    if (!sheet || visited.has(sheet)) return
    visited.add(sheet)
    if ([INSPECTOR_ID, 'resume-editor-overrides'].includes(sheet.ownerNode?.id)) return
    if (sheet.disabled) return
    if (sheet.media?.mediaText && !view.matchMedia(sheet.media.mediaText).matches) return
    let rules
    try { rules = sheet.cssRules } catch { return }
    walk(rules, sheet.href || source, contexts)
  }
  function walk(rules, source, contexts) {
    for (const rule of rules || []) {
      if (rule.type === 3) {
        if (rule.media?.mediaText && !view.matchMedia(rule.media.mediaText).matches) continue
        visit(rule.styleSheet, source, contexts)
        continue
      }
      if (rule.type === 4 && !view.matchMedia(rule.conditionText).matches) continue
      if (rule.type === 12 && !view.CSS.supports(rule.conditionText)) continue
      if (rule.selectorText && rule.style) {
        try {
          if (node.matches(rule.selectorText)) result.push({
            selector: rule.selectorText,
            css: rule.cssText,
            source: [source, ...contexts].filter(Boolean).join(' · '),
          })
        } catch { /* unsupported selector */ }
      }
      if (rule.cssRules) {
        const context = rule.conditionText || rule.name
        walk(rule.cssRules, source, context ? [...contexts, context] : contexts)
      }
    }
  }
  for (const sheet of doc.styleSheets) visit(sheet, sheet.ownerNode?.id || 'Document styles')
  return result
}

export function defaultSelector(doc, node, theme) {
  if (!node) return ''
  const escapedTheme = doc.defaultView.CSS.escape(theme || '')
  const prefix = theme ? `.theme-${escapedTheme}` : ''
  const candidates = matchingRules(doc, node).flatMap((rule) => selectorParts(rule.selector))
    .filter((selector) => {
      if (selector.includes(':') || /data-resume-node/.test(selector)) return false
      try { return node.matches(selector) } catch { return false }
    })
  // Prefer a theme rule for this element over generic browser/layout rules.
  const themed = candidates.filter((selector) => prefix && selector.includes(prefix))
  const readable = (themed.length ? themed : candidates).sort((a, b) => b.length - a.length)
  if (readable.length) return readable[0]
  const semantic = [...node.classList].filter((name) => !/^(on|active|selected)$/.test(name))
  const target = node === resumeRoot(doc) ? '.resume' : semantic.length
    ? `.${doc.defaultView.CSS.escape(semantic[0])}` : node.localName
  return `${prefix}${target === '.resume' ? ' ' : ' .resume '}${target}`.trim()
}

const COMMON_PROPERTIES = `font-family font-size font-weight font-style font-variant line-height letter-spacing word-spacing color background background-color opacity text-align text-transform text-decoration white-space display position width height min-width max-width min-height max-height box-sizing margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left border border-top border-right border-bottom border-left border-color border-width border-style border-radius gap row-gap column-gap grid-template-columns align-items justify-content flex-direction flex-wrap break-before break-after break-inside`.split(' ')

export function computedProperties(doc, node) {
  if (!node) return {}
  const style = doc.defaultView.getComputedStyle(node)
  const properties = new Set([...COMMON_PROPERTIES, ...Array.from(style)])
  return Object.fromEntries([...properties].map((name) => [name, style.getPropertyValue(name)]))
}
