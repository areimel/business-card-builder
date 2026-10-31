import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PORT = Number(process.env.API_PORT) || 4178;
export const RENDER_ORIGIN = `http://localhost:${PORT}`;
export const DOCS_DIR = path.join(ROOT, 'documents');
export const DOC_EXT = '.mdx';
export const THEMES_DIR = path.join(ROOT, 'themes');
export const FONT_SETS_DIR = path.join(THEMES_DIR, 'fonts', 'sets');
export const EXPORTS_DIR = path.join(ROOT, 'exports');
mkdirSync(EXPORTS_DIR, { recursive: true });

/** The one validation rule for slugs and theme names (filesystem-safe). */
export const isValidName = (s) => typeof s === 'string' && /^[\w-]+$/.test(s);

/** A theme exists iff themes/<name>/theme.css is present. */
export const themeExists = (name) =>
  isValidName(name) && existsSync(path.join(THEMES_DIR, name, 'theme.css'));

/** A color mode is exactly 'light' or 'dark'. */
export const isValidMode = (m) => m === 'light' || m === 'dark';

/** 'light' exists for any existing theme; 'dark' needs themes/<theme>/dark.css. */
export const modeExists = (theme, mode) =>
  themeExists(theme) && (mode === 'light' || (mode === 'dark' && existsSync(path.join(THEMES_DIR, theme, 'dark.css'))));

/** Margin override (?margin=): "0" or one CSS length like "0.25in". */
export { isValidMargin } from '../src/lib/units.js';

/** QR overrides (?qr=, ?qrLabel=): a safe, encodable url / short non-empty label. */
export { isValidQrUrl, isValidQrLabel } from '../src/lib/qr.js';

/** A font set exists iff themes/fonts/sets/<name>.css is present. */
export const fontSetExists = (name) =>
  isValidName(name) && existsSync(path.join(FONT_SETS_DIR, `${name}.css`));

export const PAGE_SIZES = {
  letter: '8.5in 11in',
  a4: '210mm 297mm',
  legal: '8.5in 14in',
};

const DEFAULT_MARGIN = '0.5in';

/** "Letter" | "A4" | "8.5in 11in" -> {w, h}. Defaults to Letter. */
export function resolvePageSize(size) {
  const raw = typeof size === 'string' ? size.trim() : '';
  const spec = PAGE_SIZES[raw.toLowerCase()] ?? raw;
  const parts = spec.split(/\s+/).filter(Boolean);
  if (parts.length === 2) return { w: parts[0], h: parts[1] };
  const [w, h] = PAGE_SIZES.letter.split(' ');
  return { w, h };
}

/** Single value or {top,right,bottom,left} -> all four sides. Default 0.5in; "0" -> "0in". */
export function resolveMargins(margin) {
  // A bare 0 is invalid inside calc(), which base.css does with these vars.
  const one = (v) => (v === undefined || v === null || v === '' ? undefined : String(v) === '0' ? '0in' : String(v));
  if (margin && typeof margin === 'object') {
    const base = one(margin.all) ?? DEFAULT_MARGIN;
    return {
      top: one(margin.top) ?? base,
      right: one(margin.right) ?? base,
      bottom: one(margin.bottom) ?? base,
      left: one(margin.left) ?? base,
    };
  }
  const v = one(margin) ?? DEFAULT_MARGIN;
  return { top: v, right: v, bottom: v, left: v };
}
