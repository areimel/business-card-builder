import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearStyles, emptyRecord, loadStyle, saveStyle, styleKey } from '../src/lib/styleStorage.js'

function storage() {
  const value = {}
  Object.defineProperties(value, {
    getItem: { value: (key) => value[key] ?? null },
    setItem: { value: (key, text) => { value[key] = text } },
    removeItem: { value: (key) => { delete value[key] } },
  })
  return value
}

test('records isolate document/theme scopes and preserve invalid draft plus valid applied CSS', () => {
  const store = storage()
  const record = { draft: '.resume {', appliedCss: '.resume { color: red; }', fontsOverride: 'plex', modeOverride: 'dark', marginOverride: '0',
    qrUrlOverride: 'https://example.com/', qrLabelOverride: 'Site' }
  saveStyle(store, styleKey('one', 'classic'), record)
  assert.deepEqual(loadStyle(store, styleKey('one', 'classic')), record)
  assert.deepEqual(loadStyle(store, styleKey('one', 'terminal')), emptyRecord())
  assert.deepEqual(loadStyle(store, styleKey('two', 'classic')), emptyRecord())
})

test('records saved before mode/margin/QR overrides existed load them as null', () => {
  const store = storage()
  store.setItem('old', JSON.stringify({ version: 1, draft: 'a', appliedCss: '', fontsOverride: 'plex' }))
  assert.deepEqual(loadStyle(store, 'old'), { draft: 'a', appliedCss: '', fontsOverride: 'plex', modeOverride: null, marginOverride: null, qrUrlOverride: null, qrLabelOverride: null })
  store.setItem('bad', JSON.stringify({ version: 1, draft: '', appliedCss: '', modeOverride: 'sepia' }))
  assert.equal(loadStyle(store, 'bad').modeOverride, null)
  store.setItem('bad', JSON.stringify({ version: 1, draft: '', appliedCss: '', marginOverride: '1in;} x' }))
  assert.equal(loadStyle(store, 'bad').marginOverride, null)
  store.setItem('bad', JSON.stringify({ version: 1, draft: '', appliedCss: '', qrUrlOverride: 'javascript:alert(1)', qrLabelOverride: '' }))
  assert.equal(loadStyle(store, 'bad').qrUrlOverride, null)
  assert.equal(loadStyle(store, 'bad').qrLabelOverride, null)
})

test('a record holding only a QR override is kept', () => {
  const store = storage()
  saveStyle(store, 'qr', { ...emptyRecord(), qrLabelOverride: 'Hi' })
  assert.equal(loadStyle(store, 'qr').qrLabelOverride, 'Hi')
})

test('clearing styles leaves other localStorage preferences untouched', () => {
  const store = storage()
  store.setItem('resume-builder:editor-panel:v1', 'keep')
  saveStyle(store, styleKey('one', 'classic'), { ...emptyRecord(), draft: '/* test */' })
  saveStyle(store, styleKey('two', 'classic'), { ...emptyRecord(), fontsOverride: 'plex' })
  clearStyles(store)
  assert.deepEqual(Object.keys(store), ['resume-builder:editor-panel:v1'])
})

test('corrupt or incompatible storage is reported and unsafe applied CSS is discarded', () => {
  const store = storage()
  store.setItem('bad', 'broken')
  assert.throws(() => loadStyle(store, 'bad'))
  store.setItem('bad', JSON.stringify({ version: 9, draft: '', appliedCss: '' }))
  assert.throws(() => loadStyle(store, 'bad'), /Saved editor data/)
  store.setItem('bad', JSON.stringify({ version: 1, draft: '@page {}', appliedCss: '@page {}' }))
  assert.equal(loadStyle(store, 'bad').appliedCss, '')
})
