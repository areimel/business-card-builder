export const SAFE_URL = /^(https?:|mailto:|tel:)/i

/** A <QR> url must use http(s):, mailto: or tel: (case-insensitive). */
export const isSafeQrUrl = (url) => typeof url === 'string' && SAFE_URL.test(url)

/** QR url override (?qr=): a safe url short enough to always encode. */
export const isValidQrUrl = (s) => isSafeQrUrl(s) && s.length <= 1000

/** QR label override (?qrLabel=): non-empty text, at most 80 characters. */
export const isValidQrLabel = (s) => typeof s === 'string' && s.trim() !== '' && s.length <= 80
