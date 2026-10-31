import { parse, generate, walk, tokenize, tokenTypes as T } from 'css-tree'

const DISABLED = 'resume-editor-disabled:'
const geometry = /^(width|height|min-width|min-height|max-width|max-height|padding(?:-.+)?|margin(?:-.+)?)$/i

// CSS parsers intentionally recover from unfinished input. Keep such drafts out
// of the applied stylesheet until their strings, comments and blocks close.
function checkBalance(css) {
  const stack = []
  const opening = new Map([[T.LeftCurlyBracket, T.RightCurlyBracket], [T.LeftSquareBracket, T.RightSquareBracket],
    [T.LeftParenthesis, T.RightParenthesis], [T.Function, T.RightParenthesis]])
  tokenize(css, (type, start, end) => {
    const token = css.slice(start, end)
    if (opening.has(type)) stack.push(opening.get(type))
    else if ([T.RightCurlyBracket, T.RightSquareBracket, T.RightParenthesis].includes(type) && stack.pop() !== type) {
      throw new Error('Unmatched CSS bracket')
    }
    if (type === T.BadString || type === T.BadUrl || (type === T.Comment && !token.endsWith('*/')) ||
      (type === T.Url && !token.endsWith(')')) || (type === T.String &&
        (token.length < 2 || token.at(-1) !== token[0] || (token.slice(0, -1).match(/\\+$/)?.[0].length || 0) % 2))) {
      throw new Error('Unfinished CSS string, comment or URL')
    }
  })
  if (stack.length) throw new Error('Unfinished CSS string or block')
}

export function validateCss(css) {
  try {
    checkBalance(css)
    const ast = parse(css, { onParseError: (err) => { throw err } })
    walk(ast, function (node) {
      if (node.type === 'Atrule' && node.name.toLowerCase() === 'page') {
        throw new Error('Page size and outer margins belong in document frontmatter.')
      }
      if (node.type !== 'Declaration') return
      if (/^--page-(?:w|h|mt|mr|mb|ml)$/i.test(node.property) ||
        (this.rule && /\.sheet\b/.test(generate(this.rule.prelude)) && geometry.test(node.property))) {
        throw new Error('Sheet geometry belongs in document frontmatter.')
      }
    })
    return null
  } catch (err) { return err.message }
}

function read(css, selector) {
  const comments = []
  const ast = parse(css, { positions: true, onComment: (value, loc) => comments.push({ value, loc }) })
  const rules = ast.children.toArray().filter((node) => node.type === 'Rule' &&
    css.slice(node.prelude.loc.start.offset, node.prelude.loc.end.offset).trim() === selector.trim())
  return { rule: rules.at(-1), comments }
}

function declarations(css, rule, comments) {
  if (!rule) return []
  const rows = rule.block.children.toArray().filter((node) => node.type === 'Declaration').map((node) => ({
    start: node.loc.start.offset, end: node.loc.end.offset,
    property: node.property, value: generate(node.value), important: !!node.important, disabled: false,
  }))
  for (const { value, loc } of comments) {
    if (!value.trim().startsWith(DISABLED) || loc.start.offset < rule.block.loc.start.offset || loc.end.offset > rule.block.loc.end.offset) continue
    try {
      const node = parse(decodeURIComponent(value.trim().slice(DISABLED.length).trim()), { context: 'declaration' })
      rows.push({ start: loc.start.offset, end: loc.end.offset, property: node.property,
        value: generate(node.value), important: !!node.important, disabled: true })
    } catch { /* An ordinary comment remains untouched. */ }
  }
  return rows.sort((a, b) => a.start - b.start)
}

export function inspectDeclarations(css, selector) {
  try { const { rule, comments } = read(css, selector); return declarations(css, rule, comments) }
  catch { return [] }
}

export function updateDeclaration(css, selector, index, next) {
  parse(selector, { context: 'selectorList' })
  const { rule, comments } = read(css, selector)
  let text = ''
  if (next) {
    text = `${next.property}: ${next.value}${next.important ? ' !important' : ''}`
    parse(text, { context: 'declaration', onParseError: (err) => { throw err } })
    text = next.disabled ? `/* ${DISABLED}${encodeURIComponent(text)} */` : `${text};`
  }
  const row = declarations(css, rule, comments)[index]
  if (row) {
    const end = row.end + (css[row.end] === ';' ? 1 : 0)
    return css.slice(0, row.start) + text + css.slice(end)
  }
  if (!next) return css
  if (!rule) return `${css}${css.trim() ? '\n\n' : ''}${selector} {\n  ${text}\n}\n`
  const end = rule.block.loc.end.offset - 1
  return css.slice(0, end).trimEnd() + `\n  ${text}\n` + css.slice(end)
}

export function addFontImport(css, url) {
  return css.includes(url) ? css : `@import url("${url}");\n${css}`
}

export function outputCss(css, fonts) {
  return fonts ? addFontImport(css, `/themes/fonts/sets/${fonts}.css`) : css
}
