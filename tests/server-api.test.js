import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../server/index.js';

let server;
let origin;
before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

test('font inventory exposes valid self-hosted family stylesheets', async () => {
  const response = await fetch(`${origin}/api/fonts`);
  assert.equal(response.status, 200);
  const fonts = await response.json();
  assert.ok(fonts.length > 0);
  for (const font of fonts) {
    assert.equal(typeof font.family, 'string');
    assert.equal(font.cssUrl, `/themes/fonts/${font.id}/font.css`);
    const stylesheet = await fetch(`${origin}${font.cssUrl}`);
    assert.equal(stylesheet.status, 200);
    assert.ok((await stylesheet.text()).includes(font.family));
  }
});

test('export rejects non-string CSS before launching a browser', async () => {
  const response = await fetch(`${origin}/api/export/alec-reimel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ css: { color: 'red' } }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'CSS must be a string');
});

test('export limits browser CSS payloads to 1MB', async () => {
  const response = await fetch(`${origin}/api/export/alec-reimel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ css: ' '.repeat(1024 * 1024) }),
  });
  assert.equal(response.status, 413);
});

const renderPage = async (slug, query = '') => {
  const response = await fetch(`${origin}/render/${slug}${query}`);
  return { status: response.status, html: await response.text() };
};

test('documents are locked to their frontmatter theme; ?theme= is ignored', async () => {
  const { status, html } = await renderPage('alec-reimel-kojima', '?theme=classic');
  assert.equal(status, 200);
  assert.ok(html.includes('class="theme-kojima"'));
  assert.ok(html.includes('href="/themes/kojima/theme.css"'));
  assert.ok(!html.includes('/themes/classic/theme.css'));
});

test('?mode=dark links the theme dark.css; default render is light', async () => {
  const dark = await renderPage('alec-reimel', '?mode=dark');
  assert.equal(dark.status, 200);
  assert.ok(dark.html.includes('data-mode="dark"'));
  assert.ok(dark.html.includes('href="/themes/terminal/dark.css"'));

  const light = await renderPage('alec-reimel');
  assert.equal(light.status, 200);
  assert.ok(light.html.includes('data-mode="light"'));
  assert.ok(!light.html.includes('dark.css'));
});

test('invalid ?mode values fall back to light without linking dark.css', async () => {
  for (const query of ['?mode=bogus', `?mode=${encodeURIComponent('<script>')}`]) {
    const { status, html } = await renderPage('alec-reimel', query);
    assert.equal(status, 200, query);
    assert.ok(html.includes('data-mode="light"'), query);
    assert.ok(!html.includes('dark.css'), query);
  }
});

test('?fonts= is honored only when the set is in the theme fontSets', async () => {
  const rejected = await renderPage('alec-reimel', '?fonts=source');
  assert.equal(rejected.status, 200);
  assert.ok(!rejected.html.includes('/themes/fonts/sets/source.css'));
  assert.ok(rejected.html.includes('/themes/fonts/sets/jetbrains.css'));

  const accepted = await renderPage('alec-reimel', '?fonts=plex');
  assert.equal(accepted.status, 200);
  assert.ok(accepted.html.includes('/themes/fonts/sets/plex.css'));
});

test('/api/themes lists modes; dark-capable themes include dark and no id is a -dark variant', async () => {
  const response = await fetch(`${origin}/api/themes`);
  assert.equal(response.status, 200);
  const themes = await response.json();
  assert.ok(themes.length > 0);
  for (const theme of themes) {
    assert.ok(Array.isArray(theme.modes), theme.id);
    assert.ok(theme.modes.includes('light'), theme.id);
    assert.ok(!theme.id.endsWith('-dark'), theme.id);
  }
  for (const id of ['terminal', 'kojima', 'classic']) {
    const theme = themes.find((t) => t.id === id);
    assert.ok(theme, id);
    assert.ok(theme.modes.includes('dark'), id);
  }
});

test('/api/documents entries expose a mode key (null without frontmatter mode)', async () => {
  const response = await fetch(`${origin}/api/documents`);
  assert.equal(response.status, 200);
  const documents = await response.json();
  assert.ok(documents.length > 0);
  for (const doc of documents) {
    assert.ok('mode' in doc, doc.slug);
    assert.equal(doc.mode, null, doc.slug);
  }
});

test('render applies a valid ?margin= override and ignores an invalid one', async () => {
  const page = async (q) => (await renderPage('alec-reimel-kojima', q)).html;
  assert.match(await page('?margin=0'), /@page \{[^}]*margin: 0in 0in 0in 0in;/);
  assert.match(await page('?margin=0.25in'), /--page-mt: 0\.25in;/);
  assert.match(await page(`?margin=${encodeURIComponent('1in;} body{x')}`), /margin: 0in 0in 0in 0in;/);
});

test('margins fall back from frontmatter to the theme.json default', async () => {
  const page = async (slug, q = '') => (await renderPage(slug, q)).html;
  assert.match(await page('alec-reimel-kojima'), /@page \{[^}]*margin: 0in 0in 0in 0in;/);
  assert.match(await page('alec-reimel'), /margin: 0\.45in 0\.45in 0\.45in 0\.45in;/);
  assert.match(await page('alec-reimel-kojima', '?mode=dark'), /@page \{[^}]*margin: 0in 0in 0in 0in;/);
});

test('render applies valid ?qr= / ?qrLabel= overrides and ignores invalid ones', async () => {
  const page = async (q) => (await renderPage('alec-reimel', q)).html;
  const html = await page(`?qr=${encodeURIComponent('https://example.com/x')}&qrLabel=Hello`);
  assert.match(html, /<a class="qr-code" href="https:\/\/example\.com\/x">/);
  assert.match(html, /<span class="qr-label">Hello<\/span>/);
  const kept = await page(`?qr=${encodeURIComponent('javascript:alert(1)')}&qrLabel=`);
  assert.match(kept, /href="https:\/\/alecreimel\.com\/"/);
  assert.match(kept, /<span class="qr-label">Portfolio<\/span>/);
});
