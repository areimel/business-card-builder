import { PORT } from './config.js';
import { createApp } from './index.js';
import { exportPdf, closeBrowser } from './pdf.js';

const [slug, mode] = process.argv.slice(2);
if (!slug) {
  console.error('Usage: node server/export-cli.js <slug> [mode]');
  process.exit(1);
}

function listen() {
  return new Promise((resolve, reject) => {
    const server = createApp().listen(PORT, '127.0.0.1');
    server.once('listening', () => resolve(server));
    server.once('error', (err) => (err.code === 'EADDRINUSE' ? resolve(null) : reject(err)));
  });
}

let server = null;
let code = 0;
try {
  server = await listen(); // null => dev server already running, reuse it
  const { file } = await exportPdf(slug, { mode });
  console.log(file);
} catch (err) {
  console.error(`Export failed: ${err.message}`);
  code = 1;
} finally {
  await closeBrowser();
  server?.closeAllConnections?.();
  server?.close();
  process.exit(code);
}
