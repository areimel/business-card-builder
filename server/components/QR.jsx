import { qrPath, isSafeQrUrl } from '../qr.js';

// Optional fg/bg colors become inline --qr-fg/--qr-bg vars, overriding the theme's.
const colorVars = (fg, bg) => {
  const style = {};
  for (const [name, value] of [['--qr-fg', fg], ['--qr-bg', bg]]) {
    if (value == null) continue;
    if (/[;{}<>]/.test(value)) throw new Error(`<QR> color is not a valid CSS color: ${value}`);
    style[name] = value;
  }
  return style;
};

// <QR url="https://…" label="Portfolio" fg? bg? /> -> inline SVG link (no network, same in preview + PDF).
export const QR = ({ url, label, fg, bg }) => {
  if (!isSafeQrUrl(url)) throw new Error('<QR> needs a url starting with http(s):, mailto:, or tel:');
  const style = colorVars(fg, bg);
  let path;
  try {
    path = qrPath(url);
  } catch {
    throw new Error(`<QR> url is too long to encode as a QR code: ${url.slice(0, 60)}…`);
  }
  const { box, d } = path;
  return (
    <a className="qr-code" href={url}>
      <svg
        className="qr-img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${box} ${box}`}
        shapeRendering="crispEdges"
        style={style}
        role="img"
        aria-label={`QR code: ${url}`}
      >
        <path fill="currentColor" d={d} />
      </svg>
      {label && <span className="qr-label">{label}</span>}
    </a>
  );
};
