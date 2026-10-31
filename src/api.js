async function fetchJson(url, options) {
  const res = await fetch(url, options)
  let body = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || body?.ok === false) {
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return body
}

export const getDocuments = () => fetchJson('/api/documents')

export const getThemes = () => fetchJson('/api/themes')
export const getFonts = () => fetchJson('/api/fonts')

/** "?mode=…&fonts=…&margin=…&qr=…&qrLabel=…" for the set overrides, or "" (shared by /render and export). */
export function overrideQuery({ mode, fonts, margin, qr, qrLabel }) {
  const q = new URLSearchParams(Object.entries({ mode, fonts, margin, qr, qrLabel }).filter(([, v]) => v))
  return q.size ? `?${q}` : ''
}

export function exportPdf(slug, overrides, css = '') {
  return fetchJson(`/api/export/${encodeURIComponent(slug)}${overrideQuery(overrides)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ css }),
  })
}
