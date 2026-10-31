import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { THEMES_DIR, themeExists, modeExists } from './config.js';

/** themes/<name>/theme.json, or {} when missing/invalid. */
export function readThemeMeta(name) {
  try {
    return JSON.parse(readFileSync(path.join(THEMES_DIR, name, 'theme.json'), 'utf8')) || {};
  } catch {
    return {};
  }
}

export function listThemes() {
  if (!existsSync(THEMES_DIR)) return [];
  return readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && themeExists(d.name))
    .map((d) => {
      const meta = readThemeMeta(d.name);
      return {
        id: d.name,
        name: meta.name || d.name,
        description: meta.description || '',
        mode: modeExists(d.name, meta.mode) ? meta.mode : 'light', // matches render.js resolveMode
        modes: ['light', 'dark'].filter((m) => modeExists(d.name, m)),
        fonts: meta.fonts || '',
        margin: meta.margin ?? '',
        fontSets: Array.isArray(meta.fontSets) ? meta.fontSets : [],
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
