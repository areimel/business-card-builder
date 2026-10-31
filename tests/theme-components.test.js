import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFileSync, utimesSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadThemeComponents } from '../server/theme-components.js';

const fixtures = fileURLToPath(new URL('./fixtures/themes', import.meta.url));
const render = async () => {
  const { Greeting } = await loadThemeComponents('fx', fixtures);
  return renderToStaticMarkup(createElement(Greeting));
};

test('returns {} for invalid names and themes without components', async () => {
  assert.deepEqual(await loadThemeComponents('../x', fixtures), {});
  assert.deepEqual(await loadThemeComponents(undefined, fixtures), {});
  assert.deepEqual(await loadThemeComponents('nope', fixtures), {});
});

test('loads theme components and re-imports the graph when a file changes', async () => {
  const word = fileURLToPath(new URL('./fixtures/themes/fx/components/word.js', import.meta.url));
  try {
    writeFileSync(word, "export const word = 'one';\n");
    assert.match(await render(), /fx-greeting[^>]*>one</);
    writeFileSync(word, "export const word = 'two';\n");
    const future = new Date(Date.now() + 5000);
    utimesSync(word, future, future);
    assert.match(await render(), /fx-greeting[^>]*>two</);
  } finally {
    writeFileSync(word, "export const word = 'one';\n");
  }
});
