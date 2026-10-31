// Run with npm run dev already listening; override WEB_ORIGIN when needed.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';

const origin = process.env.WEB_ORIGIN || 'http://localhost:5173';
const css = '.resume { color: rgb(12, 34, 56) !important; font-size: 16px !important; }';
const stylePrefix = 'resume-builder:styles:v1:';
let browser;

before(async () => {
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
});
after(async () => { await browser?.close(); });

async function open(t) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.goto(origin);
  await page.locator('.cm-content').waitFor();
  await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.querySelector('.page-card'));
  return page;
}

async function edit(page, value) {
  const content = page.locator('.cm-content');
  await content.click();
  await content.press('ControlOrMeta+a');
  await page.keyboard.insertText(value);
  await page.waitForFunction((expected) => document.querySelector('.cm-content')?.textContent === expected, value);
}

async function setMode(page, name) {
  await modeGroup(page).getByRole('button', { name: new RegExp(`^${name}`) }).click();
}

function modeGroup(page) {
  return page.getByRole('group', { name: 'Color mode', exact: true });
}

async function previewColor(page, expected) {
  await page.waitForFunction((color) => {
    const doc = document.querySelector('iframe')?.contentDocument;
    const root = doc?.querySelector('body > .sheet .resume');
    return root && doc.defaultView.getComputedStyle(root).color === color;
  }, expected);
}

async function clear(page, all = false) {
  if (all) {
    await page.getByRole('button', { name: 'Clear all…', exact: true }).click();
    await page.getByRole('button', { name: 'Clear all style changes', exact: true }).click();
  } else await page.getByRole('button', { name: 'Clear current', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.cm-content')?.textContent === '');
}

test('live CSS repaginates, invalid drafts preserve preview, and browser state survives reload', { timeout: 30000 }, async (t) => {
  const page = await open(t);
  const originalPages = await page.frameLocator('iframe').locator('.page-card').count();
  await edit(page, css);
  await previewColor(page, 'rgb(12, 34, 56)');
  assert.ok(await page.frameLocator('iframe').locator('.page-card').count() > originalPages);
  assert.equal(await page.frameLocator('iframe').locator('body > .page-cards').count(), 1);
  const invalid = '.resume { color: red;';
  await edit(page, invalid);
  await page.getByRole('alert').filter({ hasText: 'Unfinished CSS' }).waitFor();
  await previewColor(page, 'rgb(12, 34, 56)');
  await page.waitForFunction(({ prefix, draft }) => Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix)).some((key) => JSON.parse(localStorage[key]).draft === draft), { prefix: stylePrefix, draft: invalid });
  await page.reload();
  await page.locator('.cm-content').waitFor();
  await page.waitForFunction((expected) => document.querySelector('.cm-content')?.textContent === expected, invalid);
  assert.equal(await page.locator('.cm-content').textContent(), invalid);
  await previewColor(page, 'rgb(12, 34, 56)');
  await clear(page);
  await page.waitForFunction(() => !document.querySelector('iframe').contentDocument.getElementById('resume-editor-overrides')?.textContent);
  assert.equal(await page.getByRole('button', { name: 'Undo', exact: true }).isDisabled(), true);
});

test('document mode overrides stay isolated and clearing all preserves unrelated browser data', { timeout: 30000 }, async (t) => {
  const page = await open(t);
  await edit(page, css);
  await previewColor(page, 'rgb(12, 34, 56)');
  await setMode(page, 'Dark');
  await page.waitForFunction(() => document.querySelector('iframe')?.getAttribute('src')?.includes('mode=dark'));
  await previewColor(page, 'rgb(12, 34, 56)');
  assert.equal(await page.locator('.cm-content').textContent(), css);
  const alternate = '.resume { color: rgb(99, 88, 77) !important; }';
  await edit(page, alternate);
  await previewColor(page, 'rgb(99, 88, 77)');
  await setMode(page, 'Light');
  await page.waitForFunction(() => !document.querySelector('iframe')?.getAttribute('src')?.includes('mode=dark'));
  await page.waitForFunction((expected) => document.querySelector('.cm-content')?.textContent === expected, alternate);
  await page.locator('.doc-item').nth(1).click();
  await page.waitForFunction(() => document.querySelector('.cm-content')?.textContent === '');
  await page.locator('.doc-item').nth(0).click();
  await page.waitForFunction((expected) => document.querySelector('.cm-content')?.textContent === expected, alternate);
  await setMode(page, 'Dark');
  await page.reload();
  await page.locator('.cm-content').waitFor();
  await page.waitForFunction((expected) => document.querySelector('.cm-content')?.textContent === expected, alternate);
  assert.equal(await modeGroup(page).getByRole('button', { name: /^Dark/ }).getAttribute('aria-pressed'), 'true');
  await page.evaluate(() => localStorage.setItem('unrelated-browser-setting', 'keep'));
  await clear(page, true);
  await page.waitForFunction((prefix) => Object.keys(localStorage).every((key) => !key.startsWith(prefix)), stylePrefix);
  assert.equal(await page.evaluate(() => localStorage.getItem('unrelated-browser-setting')), 'keep');
});

test('CSS copy/download and PDF requests use the current overrides', { timeout: 30000 }, async (t) => {
  const page = await open(t);
  await page.evaluate(() => {
    window.copiedCss = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.copiedCss = value; } } });
  });
  await edit(page, css);
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  assert.equal(await page.evaluate(() => window.copiedCss), css);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .css', exact: true }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /--overrides\.css$/);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString(), css);
  let payload;
  await page.route('**/api/export/*', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Export request captured by browser test' }) });
  });
  await page.getByRole('button', { name: 'Export PDF', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Export request captured' }).waitFor();
  assert.equal(payload.css, css);
});

test('picker maps page clones to resume selectors and property controls support undo', { timeout: 30000 }, async (t) => {
  const page = await open(t);
  await page.locator('.se-selection-label').filter({ hasText: 'article.resume' }).waitFor();
  await page.getByRole('button', { name: 'Pick element', exact: true }).click();
  await page.frameLocator('iframe').locator('.page-card').first().locator('.name-heading').click({ position: { x: 4, y: 4 } });
  await page.locator('.se-selection-label').filter({ hasText: 'h1.name-heading' }).waitFor();
  const selector = await page.getByLabel('CSS selector', { exact: true }).inputValue();
  assert.ok(selector.includes('.name-heading'));
  assert.ok(!selector.includes('page-card'));
  await page.getByLabel('New CSS property', { exact: true }).fill('font-size');
  await page.getByLabel('New CSS value', { exact: true }).fill('24px');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const headingSize = (size) => page.waitForFunction((expected) => {
    const doc = document.querySelector('iframe').contentDocument;
    return doc.defaultView.getComputedStyle(doc.querySelector('body > .sheet .name-heading')).fontSize === expected;
  }, size);
  await headingSize('24px');
  await page.getByRole('button', { name: 'Increase font-size', exact: true }).click();
  await headingSize('25px');
  await page.getByLabel('Enable font-size', { exact: true }).uncheck();
  await headingSize('28px');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await headingSize('25px');
  await page.getByRole('button', { name: 'Target only this element', exact: true }).click();
  assert.match(await page.getByLabel('CSS selector', { exact: true }).inputValue(), /:nth-of-type\(/);
});

test('bundled fonts load once and remain applied through cached import edits', { timeout: 30000 }, async (t) => {
  const page = await open(t);
  await page.getByLabel('New CSS property', { exact: true }).fill('font-family');
  await page.getByLabel('New CSS value', { exact: true }).fill('"JetBrains Mono"');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Choose bundled font', { exact: true }).selectOption('crimson-pro');
  await page.waitForFunction(() => {
    const doc = document.querySelector('iframe').contentDocument;
    return doc.defaultView.getComputedStyle(doc.querySelector('body > .sheet .resume')).fontFamily.includes('Crimson Pro') && doc.fonts.check('12px "Crimson Pro"');
  });
  await page.getByLabel('New CSS property', { exact: true }).fill('font-size');
  await page.getByLabel('New CSS value', { exact: true }).fill('12px');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Increase font-size', exact: true }).click();
  await page.getByRole('button', { name: 'Increase font-size', exact: true }).click();
  await page.waitForFunction(() => {
    const doc = document.querySelector('iframe').contentDocument;
    const root = doc.querySelector('body > .sheet .resume');
    return doc.defaultView.getComputedStyle(root).fontSize === '14px' && doc.defaultView.getComputedStyle(root).fontFamily.includes('Crimson Pro');
  });
  assert.equal((await page.locator('.cm-content').textContent()).match(/@import/g)?.length, 1);
  assert.equal(await page.locator('.preview-style-error').count(), 0);
});

test('storage write failures remain visible while valid CSS still previews', { timeout: 30000 }, async (t) => {
  const page = await open(t);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage disabled for browser test', 'QuotaExceededError'); };
  });
  await edit(page, css);
  await previewColor(page, 'rgb(12, 34, 56)');
  await page.getByRole('alert').filter({ hasText: 'Browser changes could not be saved' }).waitFor();
});

test('narrow drawer can close and reopen without the preview covering toolbar controls', { timeout: 15000 }, async (t) => {
  const page = await open(t);
  await page.setViewportSize({ width: 390, height: 850 });
  const bounds = await page.locator('.style-editor').boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await page.getByRole('button', { name: 'Close style editor', exact: true }).click();
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
  await page.getByRole('region', { name: 'Resume style editor', exact: true }).waitFor();
});

test('removing a selected canonical element clears selection after repagination', { timeout: 15000 }, async (t) => {
  const page = await open(t);
  await page.locator('.se-selection-label').waitFor();
  await page.getByRole('button', { name: 'Pick element', exact: true }).click();
  await page.frameLocator('iframe').locator('.page-card').first().locator('.name-heading').click({ position: { x: 4, y: 4 } });
  await page.locator('.se-selection-label').filter({ hasText: 'h1.name-heading' }).waitFor();
  await page.evaluate(() => document.querySelector('iframe').contentDocument.querySelector('body > .sheet .name-heading').remove());
  await edit(page, '/* @import is only a comment */ .resume { --selection-test: 1; }');
  await page.locator('.se-selection-label').waitFor({ state: 'detached' });
});
