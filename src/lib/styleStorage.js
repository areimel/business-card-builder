import { validateCss } from './styleCss.js'
import { isValidMargin } from './units.js'
import { isValidQrLabel, isValidQrUrl } from './qr.js'

export const STYLE_PREFIX = 'resume-builder:styles:v1:'
export const styleKey = (slug, theme) => `${STYLE_PREFIX}${slug}:${theme}`
export const emptyRecord = () => ({ draft: '', appliedCss: '', fontsOverride: null, modeOverride: null, marginOverride: null,
  qrUrlOverride: null, qrLabelOverride: null })

export function loadStyle(storage, key) {
  const raw = storage.getItem(key)
  if (!raw) return emptyRecord()
  const value = JSON.parse(raw)
  if (value.version !== 1 || typeof value.draft !== 'string' || typeof value.appliedCss !== 'string') {
    throw new Error('Saved editor data could not be read. Clear current changes to reset it.')
  }
  return { draft: value.draft, appliedCss: validateCss(value.appliedCss) ? '' : value.appliedCss,
    fontsOverride: typeof value.fontsOverride === 'string' ? value.fontsOverride : null,
    modeOverride: value.modeOverride === 'light' || value.modeOverride === 'dark' ? value.modeOverride : null,
    marginOverride: isValidMargin(value.marginOverride) ? value.marginOverride : null,
    qrUrlOverride: isValidQrUrl(value.qrUrlOverride) ? value.qrUrlOverride : null,
    qrLabelOverride: isValidQrLabel(value.qrLabelOverride) ? value.qrLabelOverride : null }
}

export function saveStyle(storage, key, value) {
  const empty = !value.draft && !value.appliedCss && !value.fontsOverride && !value.modeOverride && !value.marginOverride
    && !value.qrUrlOverride && !value.qrLabelOverride
  if (empty) storage.removeItem(key)
  else storage.setItem(key, JSON.stringify({ version: 1, ...value }))
}

export function clearStyles(storage) {
  Object.keys(storage).filter((key) => key.startsWith(STYLE_PREFIX)).forEach((key) => storage.removeItem(key))
}
