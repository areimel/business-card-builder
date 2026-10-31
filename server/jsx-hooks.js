import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Lets the server import .jsx components directly (no build step).
// Loaded via `node --import ./server/jsx-hooks.js`.

// esbuild's default sync API keeps one long-lived service per process; if its child dies, every later
// transform throws "The service is no longer running". Without worker threads each call spawns its own.
process.env.ESBUILD_WORKER_THREADS ??= '0';
const { transformSync } = await import('esbuild');

const sharedPrefix = fileURLToPath(new URL('./', import.meta.url)); // server/: shared components stay singletons
const isShared = (file) => file.startsWith(sharedPrefix) || file.includes('/node_modules/');
const stripQuery = (url) => url.replace(/\?.*$/, '');

registerHooks({
  // Theme modules are imported as `?v=<mtime>`; propagate that query to their relative
  // imports outside server/ and node_modules so editing any theme file re-imports the whole theme graph.
  resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context);
    const query = context.parentURL?.match(/\?v=[^&#]*/)?.[0];
    if (query && /^\.\.?\//.test(specifier) && result.url.startsWith('file:')
        && !isShared(fileURLToPath(stripQuery(result.url)))) {
      return { ...result, url: `${stripQuery(result.url)}${query}` };
    }
    return result;
  },
  load(url, context, nextLoad) {
    const file = stripQuery(url);
    if (!url.startsWith('file:') || !file.endsWith('.jsx')) return nextLoad(url, context);
    const { code } = transformSync(readFileSync(fileURLToPath(file), 'utf8'), {
      loader: 'jsx',
      jsx: 'automatic',
      format: 'esm',
      sourcefile: fileURLToPath(file),
    });
    return { format: 'module', source: code, shortCircuit: true };
  },
});
