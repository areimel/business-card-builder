import QRCode from 'qrcode';

const QUIET = 2; // quiet-zone width in modules

export { SAFE_URL, isSafeQrUrl } from '../src/lib/qr.js';

// Synchronous QR -> path data: one 1x1 square per dark module in a `box`-sized
// viewBox. Throws if the url is too long to encode.
export const qrPath = (url) => {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  let d = '';
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (modules.get(y, x)) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
  return { box: n + QUIET * 2, d };
};
