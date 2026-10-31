import { Page, PageBreak } from './core.jsx';
import { QR } from './QR.jsx';

// Theme-neutral core injected into every MDX document. Each theme's own
// components (themes/<name>/components/index.js) are merged over it.
export const components = { Page, PageBreak, QR };
