import { useEffect, useState } from 'react'
import { isValidQrLabel, isValidQrUrl } from '../../lib/qr.js'

const FIELDS = [
  { key: 'url', label: 'URL', override: 'qrUrlOverride', valid: isValidQrUrl, error: 'Use an http(s):, mailto: or tel: link (max 1000 characters).' },
  { key: 'label', label: 'Label', override: 'qrLabelOverride', valid: isValidQrLabel, error: 'Enter a label (max 80 characters).' },
]

/** The rendered <QR> in the canonical sheet (not a page-card clone): `{ url, label }`, or null. */
function readQr(frame) {
  const link = frame?.contentDocument?.querySelector('body > .sheet .qr-code')
  return link && { url: link.getAttribute('href') || '', label: link.querySelector('.qr-label')?.textContent || '' }
}

/** Browser override for the document's <QR> url/label; sent as ?qr=&qrLabel= to preview and export. */
export default function QrEditor({ editor, frame, revision }) {
  const [current, setCurrent] = useState(null)
  const [drafts, setDrafts] = useState({ url: '', label: '' })
  useEffect(() => {
    const qr = readQr(frame)
    setCurrent(qr)
    if (qr) setDrafts(qr)
  }, [frame, revision])
  if (!current) return null

  const overridden = editor.qrUrlOverride != null || editor.qrLabelOverride != null
  const commit = (field) => {
    const value = drafts[field.key].trim()
    if (field.valid(value) && value !== current[field.key]) editor.setQrOverrides({ [field.override]: value })
  }
  return <div className="se-qr" role="group" aria-label="QR code">
    <div className="se-qr-head"><h3>QR code</h3>
      {overridden && <button className="se-text-button" onClick={() => editor.setQrOverrides({ qrUrlOverride: null, qrLabelOverride: null })}>Reset to document</button>}
    </div>
    {FIELDS.map((field) => {
      const invalid = !field.valid(drafts[field.key].trim())
      return <label key={field.key} className="se-qr-field">
        <span className="se-selector-label">{field.label}{editor[field.override] != null && ' (override)'}</span>
        <input value={drafts[field.key]} aria-invalid={invalid}
          onChange={(event) => setDrafts({ ...drafts, [field.key]: event.target.value })}
          onBlur={() => commit(field)} onKeyDown={(event) => event.key === 'Enter' && commit(field)} />
        {invalid && <span className="se-qr-error" role="alert">{field.error}</span>}
      </label>
    })}
    <p className="se-muted se-qr-hint">Override saved in this browser; the .mdx is unchanged.</p>
  </div>
}
