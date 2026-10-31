import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addFontImport, inspectDeclarations, outputCss, updateDeclaration, validateCss } from '../src/lib/styleCss.js'

test('CSS validation detects unfinished drafts without rejecting quoted brackets or data URLs', () => {
  for (const css of ['.resume { color: red', '.resume { color:', '/* open', '.resume { content: "hello', '.resume {color:red}}']) {
    assert.ok(validateCss(css), css)
  }
  for (const css of ['', '/* } */ .resume { content: "{"; --note: [hello]; }',
    '.resume { background: url(data:image/svg+xml,%3Csvg%3E); }',
    '@media screen { .resume { font-size: clamp(8pt, 1vw, 12pt); } }']) {
    assert.equal(validateCss(css), null, css)
  }
})

test('page geometry stays under frontmatter control while element spacing is editable', () => {
  assert.ok(validateCss('@page { margin: 1in; }'))
  assert.ok(validateCss(':root { --page-mt: 1in; }'))
  assert.ok(validateCss('.sheet { padding: 1in; }'))
  assert.equal(validateCss('.resume { padding: 10px; --layout-gap: 2em; }'), null)
})

test('row edits preserve surrounding comments, raw formatting and nested CSS', () => {
  const source = '/* keep this */\n.resume { color: red; margin: 2px; }\n@media print { .resume { color: black; } }'
  const changed = updateDeclaration(source, '.resume', 0, { property: 'color', value: 'blue', important: true })
  assert.match(changed, /^\/\* keep this \*\//)
  assert.match(changed, /color: blue !important; margin: 2px;/)
  assert.ok(changed.endsWith('@media print { .resume { color: black; } }'))
  assert.deepEqual(inspectDeclarations(changed, '.resume').map(({ property, value, important }) => ({ property, value, important })), [
    { property: 'color', value: 'blue', important: true }, { property: 'margin', value: '2px', important: false },
  ])
})

test('disabled rows survive text export and re-enable or remove without duplication', () => {
  const disabled = updateDeclaration('.resume { color: red; }', '.resume', 0, { property: 'color', value: 'red', disabled: true })
  const row = inspectDeclarations(disabled, '.resume')[0]
  assert.equal(row.disabled, true)
  const enabled = updateDeclaration(disabled, '.resume', 0, { ...row, disabled: false })
  assert.match(enabled, /color: red;/)
  assert.equal(inspectDeclarations(enabled, '.resume').length, 1)
  assert.equal(inspectDeclarations(updateDeclaration(enabled, '.resume', 0, null), '.resume').length, 0)
})

test('new selectors and font imports produce reusable CSS without duplicate imports', () => {
  const css = updateDeclaration('', '.resume h2', -1, { property: 'font-size', value: '14pt' })
  assert.equal(validateCss(css), null)
  const imported = addFontImport(css, '/themes/fonts/newsreader/font.css')
  assert.equal(addFontImport(imported, '/themes/fonts/newsreader/font.css'), imported)
  assert.match(outputCss(imported, 'plex'), /^@import url\("\/themes\/fonts\/sets\/plex.css"\);/)
})
