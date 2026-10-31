import express from 'express';
import { pathToFileURL } from 'node:url';
import { PORT, THEMES_DIR, EXPORTS_DIR } from './config.js';
import { listDocuments, loadDocument } from './documents.js';
import { listThemes } from './themes.js';
import { listFonts } from './fonts.js';
import { renderDocumentHtml, errorPage } from './render.js';
import { sseHandler, closeWatcher } from './watch.js';
import { exportPdf, closeBrowser } from './pdf.js';

// Local-only tool: refuse requests that didn't come from this machine's own
// pages (blocks DNS-rebinding and cross-site POSTs to localhost).
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function localOnly(req, res, next) {
  const host = req.headers.host || '';
  const origin = req.headers.origin;
  const originHost = origin ? new URL(origin).host : null;
  if (!LOCAL_HOST.test(host) || (originHost && !LOCAL_HOST.test(originHost))) {
    return res.status(403).json({ ok: false, error: 'Local requests only' });
  }
  next();
}

/** The per-view overrides a request may carry (documents are locked to their own theme). */
const pickOverrides = ({ mode, fonts, margin, qr, qrLabel }) => ({ mode, fonts, margin, qr, qrLabel });

export function createApp() {
  const app = express();
  app.use(localOnly);

  app.get('/api/documents', (req, res) => res.json(listDocuments()));
  app.get('/api/themes', (req, res) => res.json(listThemes()));
  app.get('/api/fonts', (req, res) => res.json(listFonts()));
  app.get('/api/events', sseHandler);

  app.get('/render/:slug', async (req, res) => {
    let doc;
    try {
      doc = loadDocument(req.params.slug);
    } catch (err) {
      if (err.status) throw err; // invalid slug -> JSON error handler
      // e.g. a frontmatter YAML typo: show it in the preview like an MDX error
      return res.status(500).type('html').send(errorPage({ slug: req.params.slug }, err));
    }
    if (!doc) return res.status(404).json({ ok: false, error: `Document not found: ${req.params.slug}` });
    const { html, status } = await renderDocumentHtml(doc, pickOverrides(req.query));
    res.status(status).type('html').send(html);
  });

  app.post('/api/export/:slug', express.json({ limit: '1mb' }), async (req, res, next) => {
    try {
      const css = req.body?.css ?? '';
      if (typeof css !== 'string') return res.status(400).json({ ok: false, error: 'CSS must be a string' });
      const doc = loadDocument(req.params.slug);
      if (!doc) return res.status(404).json({ ok: false, error: `Document not found: ${req.params.slug}` });
      const { file, name, url } = await exportPdf(req.params.slug, pickOverrides(req.query), css);
      res.json({ ok: true, file, name, url });
    } catch (err) {
      next(err);
    }
  });

  app.use('/themes', express.static(THEMES_DIR));
  app.use('/exports', express.static(EXPORTS_DIR, {
    setHeaders: (res) => res.setHeader('Content-Disposition', 'attachment'),
  }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ ok: false, error: err.message || 'Internal error' });
  });

  return app;
}

const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  // Express 5 passes listen errors to this callback.
  const server = createApp().listen(PORT, '127.0.0.1', (err) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use (stale API process? \`lsof -i :${PORT}\`)`);
      process.exit(1);
    }
    if (err) throw err;
    console.log(`resume-builder API listening on http://localhost:${PORT}`);
  });
  const shutdown = async () => {
    server.closeAllConnections?.();
    await Promise.allSettled([closeBrowser(), closeWatcher()]);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
