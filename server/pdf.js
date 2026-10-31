import { chromium } from 'playwright-core';
import path from 'node:path';
import { EXPORTS_DIR, RENDER_ORIGIN, isValidMode, isValidName, isValidMargin, isValidQrUrl, isValidQrLabel } from './config.js';
import { isValidSlug } from './documents.js';

let browserPromise = null;

const attempts = () => [
  { executablePath: '/usr/bin/google-chrome', headless: true },
  { channel: 'chrome', headless: true },
  { executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`, headless: true },
  // Final retry only: sandbox disabled.
  { executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] },
];

async function launch() {
  let lastErr;
  for (const opts of attempts()) {
    try {
      return await chromium.launch(opts);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Could not launch Chrome: ${lastErr?.message?.split('\n')[0]}`);
}

function getBrowser() {
  if (!browserPromise) {
    browserPromise = launch().then((b) => {
      b.on('disconnected', () => { browserPromise = null; });
      return b;
    }, (err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

/** `overrides`: `{ mode, fonts, margin, qr, qrLabel }`, the same query the preview renders with. */
export async function exportPdf(slug, { mode, fonts, margin, qr, qrLabel } = {}, css = '') {
  if (!isValidSlug(slug)) throw new Error('Invalid document slug');
  // Only shape-check here; render.js decides what each theme actually accepts.
  const o = {
    mode: isValidMode(mode) ? mode : '',
    fonts: isValidName(fonts) ? fonts : '',
    margin: isValidMargin(margin) ? margin : '',
  };
  const marginTag = o.margin && `m${o.margin.replace('.', '_')}`;
  const filename = [slug, o.mode, o.fonts, marginTag].filter(Boolean).join('--') + '.pdf';
  const qrOverrides = { qr: isValidQrUrl(qr) ? qr : '', qrLabel: isValidQrLabel(qrLabel) ? qrLabel : '' };
  const query = new URLSearchParams(Object.entries({ ...o, ...qrOverrides }).filter(([, v]) => v));
  const url = `${RENDER_ORIGIN}/render/${slug}${query.size ? `?${query}` : ''}`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle' });
    if (!res?.ok()) throw new Error(`Render failed (${res?.status()}) for ${slug}`);
    if (css) {
      await page.addStyleTag({ content: css });
      await page.waitForLoadState('networkidle');
    }
    await page.evaluate(async () => {
      // Use the same canonical DOM and identifiers as the preview. Refresh also
      // forces layout before awaiting newly requested font faces.
      if (window.resumePreview) await window.resumePreview.refresh();
      else await document.fonts.ready;
    });
    await page.pdf({
      path: path.join(EXPORTS_DIR, filename),
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await page.close();
  }
  return { file: path.join(EXPORTS_DIR, filename), name: filename, url: `/exports/${filename}` };
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const p = browserPromise;
  browserPromise = null;
  try { await (await p).close(); } catch { /* already gone */ }
}
