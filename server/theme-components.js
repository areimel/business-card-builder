import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { THEMES_DIR, isValidName } from './config.js';

/** Newest mtime (ms) of any file under `dir`, used to cache-bust the theme's module graph. */
function newestMtime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    newest = Math.max(newest, entry.isDirectory() ? newestMtime(full) : statSync(full).mtimeMs);
  }
  return newest;
}

/**
 * The theme's own MDX components: `themes/<theme>/components/index.js` with a named `components`
 * export, merged over the core map by renderMdx. Returns {} when the theme is invalid or has none.
 * `dir` is overridable for tests.
 */
export async function loadThemeComponents(theme, dir = THEMES_DIR) {
  if (!isValidName(theme)) return {};
  const componentsDir = path.join(dir, theme, 'components');
  const entry = path.join(componentsDir, 'index.js');
  if (!existsSync(entry)) return {};
  const url = `${pathToFileURL(entry).href}?v=${newestMtime(componentsDir)}`;
  return (await import(url)).components || {};
}
