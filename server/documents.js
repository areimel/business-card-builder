import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { DOCS_DIR, DOC_EXT, isValidName, resolvePageSize, resolveMargins } from './config.js';

export const isValidSlug = isValidName;

const lineCount = (s) => s.split('\n').length;

function parseFile(slug, withBody) {
  const file = path.join(DOCS_DIR, slug + DOC_EXT);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const doc = {
    slug,
    title: data.title || slug,
    theme: data.theme || '',
    mode: data.mode || null,
    fonts: data.fonts || '',
    page: {
      size: resolvePageSize(data.page?.size),
      // null when unset, so the theme.json default margin can apply at render time.
      margins: data.page?.margin == null ? null : resolveMargins(data.page.margin),
    },
  };
  // Pad with the stripped frontmatter's newlines so MDX error line numbers match the file.
  if (withBody) doc.body = '\n'.repeat(lineCount(raw) - lineCount(content)) + content;
  return doc;
}

export function listDocuments() {
  if (!existsSync(DOCS_DIR)) return [];
  const docs = [];
  for (const f of readdirSync(DOCS_DIR)) {
    if (path.extname(f) !== DOC_EXT) continue;
    const slug = path.basename(f, DOC_EXT);
    if (!isValidSlug(slug)) continue;
    try {
      const doc = parseFile(slug, false);
      if (doc) docs.push(doc);
    } catch (err) {
      console.warn(`[documents] skipping ${slug}: ${err.message}`);
    }
  }
  return docs.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadDocument(slug) {
  if (!isValidSlug(slug)) {
    throw Object.assign(new Error('Invalid document slug'), { status: 400 });
  }
  return parseFile(slug, true);
}
