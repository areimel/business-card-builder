import chokidar from 'chokidar';
import path from 'node:path';
import { DOCS_DIR, THEMES_DIR } from './config.js';

const ROOT = path.dirname(DOCS_DIR);
const clients = new Set();
let watcher = null;
let timer = null;
let pending = null;

function broadcast(file) {
  const msg = `data: ${JSON.stringify({ type: 'change', file })}\n\n`;
  for (const res of clients) res.write(msg);
}

function onFsEvent(file) {
  pending = path.relative(ROOT, file);
  clearTimeout(timer);
  timer = setTimeout(() => {
    broadcast(pending);
    pending = null;
  }, 120);
}

function ensureWatcher() {
  if (watcher) return;
  watcher = chokidar.watch([DOCS_DIR, THEMES_DIR], { ignoreInitial: true });
  for (const ev of ['add', 'change', 'unlink']) watcher.on(ev, onFsEvent);
  watcher.on('error', (err) => console.warn('[watch]', err.message));
}

export function sseHandler(req, res) {
  ensureWatcher();
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(': connected\n\n');
  res.flushHeaders?.();
  clients.add(res);
  const beat = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => {
    clearInterval(beat);
    clients.delete(res);
  });
}

export async function closeWatcher() {
  clearTimeout(timer);
  await watcher?.close();
  watcher = null;
}
