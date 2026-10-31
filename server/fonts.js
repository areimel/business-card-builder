import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { THEMES_DIR, isValidName } from './config.js';

/** Families available locally; CSS URLs also work in standalone exports. */
export function listFonts() {
  const root = path.join(THEMES_DIR, 'fonts');
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isValidName(entry.name))
    .flatMap(({ name: id }) => {
      const file = path.join(root, id, 'font.css');
      if (!existsSync(file)) return [];
      const family = readFileSync(file, 'utf8').match(/font-family\s*:\s*["']([^"']+)["']/i)?.[1];
      return family ? [{ id, family, cssUrl: `/themes/fonts/${id}/font.css` }] : [];
    })
    .sort((a, b) => a.family.localeCompare(b.family));
}
