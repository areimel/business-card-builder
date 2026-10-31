import { themeExists, fontSetExists, isValidMode, modeExists, isValidMargin, isValidQrUrl, isValidQrLabel, resolveMargins, DOC_EXT } from './config.js';
import { readThemeMeta } from './themes.js';
import { renderMdx } from './mdx.js';
import { loadThemeComponents } from './theme-components.js';
import { escapeHtml } from './html.js';
import { PREVIEW_SCRIPT } from './preview-script.js';
import { QR } from './components/QR.jsx';

const ERROR_STYLE = 'font:15px/1.5 system-ui,sans-serif;max-width:46rem;margin:3rem auto;padding:0 1rem;color:#222';

/** Standalone error page for a failed render (MDX VFileMessage has line/column/reason). */
export function errorPage(doc, err) {
  const where = err.line ? ` (line ${err.line}${err.column ? `:${err.column}` : ''})` : '';
  const message = `${err.reason || err.message || String(err)}${where}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Render error</title></head>
<body style="${ERROR_STYLE}">
<h1 style="color:#b00020">Render error in ${escapeHtml(doc.slug)}${DOC_EXT}</h1>
<pre style="white-space:pre-wrap;background:#f6f6f6;padding:1rem;border-radius:6px">${escapeHtml(message)}</pre>
</body></html>
`;
}

/** Renders a document to a standalone page: `{ html, status }` (500 + error page on failure).
 *  `overrides`: `{ mode, fonts, margin, qr, qrLabel }` from the query string (invalid values are ignored). */
export async function renderDocumentHtml(doc, overrides = {}) {
  try {
    return { html: await buildPage(doc, overrides), status: 200 };
  } catch (err) {
    return { html: errorPage(doc, err), status: 500 };
  }
}

/** Font set: ?fonts= override, then frontmatter `fonts:`, then the theme.json default (always accepted). */
function resolveFonts(theme, doc, fontsOverride) {
  const { fonts, fontSets } = readThemeMeta(theme);
  const allowed = (s) => fontSetExists(s) && (!Array.isArray(fontSets) || fontSets.includes(s));
  return [fontsOverride, doc.fonts].find(allowed) || (fontSetExists(fonts) ? fonts : '');
}

/** Mode: ?mode override, then frontmatter `mode:`, then theme.json `mode`, then 'light'. */
function resolveMode(theme, doc, modeOverride) {
  const ok = (m) => isValidMode(m) && modeExists(theme, m);
  return [modeOverride, doc.mode, readThemeMeta(theme).mode].find(ok) || 'light';
}

/** Margins: ?margin= override, then frontmatter `page.margin`, then theme.json `"margin"`, then 0.5in. */
function resolvePageMargins(theme, doc, marginOverride) {
  if (isValidMargin(marginOverride)) return resolveMargins(marginOverride);
  return doc.page.margins ?? resolveMargins(readThemeMeta(theme).margin);
}

/** ?qr= / ?qrLabel= replace the url/label of every <QR> in the document (the theme's QR, else core). */
function withQrOverrides(components, qr, qrLabel) {
  const props = { ...(isValidQrUrl(qr) && { url: qr }), ...(isValidQrLabel(qrLabel) && { label: qrLabel }) };
  if (!Object.keys(props).length) return components;
  const Base = components.QR ?? QR;
  return { ...components, QR: (p) => Base({ ...p, ...props }) };
}

async function buildPage(doc, { mode: modeOverride, fonts: fontsOverride, margin, qr, qrLabel } = {}) {
  const theme = doc.theme;
  if (!themeExists(theme)) throw new Error(`Unknown theme "${theme ?? ''}" (frontmatter theme:)`);
  const mode = resolveMode(theme, doc, modeOverride);
  const darkLink = mode === 'dark' ? `\n<link rel="stylesheet" href="/themes/${theme}/dark.css">` : '';
  const fonts = resolveFonts(theme, doc, fontsOverride);
  const fontsLink = fonts ? `\n<link rel="stylesheet" href="/themes/fonts/sets/${fonts}.css">` : '';
  const { size } = doc.page;
  const m = resolvePageMargins(theme, doc, margin);
  const pageCss = `@page { size: ${size.w} ${size.h}; margin: ${m.top} ${m.right} ${m.bottom} ${m.left}; }
html:root { --page-w: ${size.w}; --page-h: ${size.h}; --page-mt: ${m.top}; --page-mr: ${m.right}; --page-mb: ${m.bottom}; --page-ml: ${m.left}; }`;

  return `<!doctype html>
<html lang="en" data-mode="${mode}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:,">
<title>${escapeHtml(doc.title)}</title>
<style>
${pageCss}
</style>
<link rel="stylesheet" href="/themes/base.css">
<link rel="stylesheet" href="/themes/${theme}/theme.css">${darkLink}${fontsLink}
</head>
<body class="theme-${theme}">
<div class="sheet"><article class="resume">
${await renderMdx(doc.body, withQrOverrides(await loadThemeComponents(theme), qr, qrLabel))}
</article></div>
<script>${PREVIEW_SCRIPT}</script>
</body>
</html>
`;
}
