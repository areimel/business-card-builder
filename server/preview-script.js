// Screen-only page cards. The measured .sheet stays in the DOM (hidden on screen,
// untouched in print); each page range is shown as a card holding a clipped clone
// of the sheet. Boundaries fall every content-height, but snap to explicit page
// starts (.page + .page, .page-break), mirroring how break-before: page paginates.
export const PREVIEW_SCRIPT = `
if (window.top !== window) document.documentElement.classList.add('embedded');
(() => {
let pending = Promise.resolve();
let nextNodeId = 0;
const nodeIds = new WeakMap();
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
async function refresh() {
  // Let newly injected stylesheets settle before measuring their font metrics.
  await frame();
  document.body.offsetHeight;
  await document.fonts.ready;
  await frame();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  document.querySelectorAll('body > .page-cards').forEach((cards) => cards.remove());
  document.body.classList.remove('paged');
  const sheet = document.querySelector('body > .sheet');
  if (!sheet) return;
  [sheet, ...sheet.querySelectorAll('*')].forEach((el) => {
    if (!nodeIds.has(el)) nodeIds.set(el, String(nextNodeId++));
    el.dataset.resumeNode = nodeIds.get(el);
  });
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:1px;';
  probe.style.height = 'calc(var(--page-h) - var(--page-mt) - var(--page-mb))';
  sheet.appendChild(probe);
  const contentH = probe.offsetHeight;
  sheet.removeChild(probe);
  if (!contentH) return;
  const { paddingTop, paddingBottom } = getComputedStyle(sheet);
  const sheetTop = sheet.getBoundingClientRect().top;
  const rel = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top - sheetTop, bottom: r.bottom - sheetTop };
  };
  const breaks = [...sheet.querySelectorAll('.resume .page-break, .resume .page + .page')]
    .map((el) => rel(el).top).sort((a, b) => a - b);
  const pages = [...sheet.querySelectorAll('.resume .page')].map(rel);
  // Natural breaks honor the print rules: never slice a line-level block or a
  // break-inside: avoid block that fits on one page, and keep break-after: avoid
  // elements (headings) with what follows them.
  const blocks = [];
  const keeps = [];
  for (const el of sheet.querySelectorAll('.resume *')) {
    const cs = getComputedStyle(el);
    const r = rel(el);
    if ((cs.breakInside === 'avoid' || /^(P|LI|H[1-6]|TR)$/.test(el.tagName)) && r.bottom - r.top <= contentH) blocks.push(r);
    if (cs.breakAfter === 'avoid') keeps.push(r);
  }
  // Content end (excludes the sheet's bottom margin padding, which isn't content)
  const end = sheet.scrollHeight - (parseFloat(paddingBottom) || 0) - 2;

  const ranges = [];
  let start = parseFloat(paddingTop) || 0;
  let overflow = false;
  while (ranges.length < 100) {
    const natural = start + contentH;
    if (natural >= end) { ranges.push({ start, stop: end, overflow }); break; }
    const snap = breaks.find((p) => p > start + 1 && p < natural);
    let stop = snap;
    if (stop === undefined) {
      const cut = blocks.filter((r) => r.top > start + 1 && r.top < natural && r.bottom > natural);
      stop = cut.length ? Math.min(...cut.map((r) => r.top)) : natural;
      const kept = keeps.filter((r) => r.top > start + 1 && r.bottom <= stop + 1 && r.bottom > stop - 24);
      if (kept.length) stop = Math.min(...kept.map((r) => r.top));
    }
    ranges.push({ start, stop, overflow });
    // A natural break inside a <Page> means that page holds more than one page of content
    overflow = snap === undefined && pages.some((p) => p.top < stop && p.bottom > stop + 1);
    start = stop;
  }

  const cards = document.createElement('div');
  cards.className = 'page-cards';
  ranges.forEach(({ start, stop, overflow }, i) => {
    const card = document.createElement('div');
    card.className = 'page-card' + (overflow ? ' overflow' : '');
    card.dataset.label = 'Page ' + (i + 1) + (overflow ? ' · overflow from previous <Page>' : '');
    const win = document.createElement('div');
    win.className = 'page-window';
    win.style.height = (stop - start) + 'px';
    const clone = sheet.cloneNode(true);
    clone.style.marginTop = -start + 'px';
    win.appendChild(clone);
    card.appendChild(win);
    cards.appendChild(card);
  });
  document.body.appendChild(cards);
  document.body.classList.add('paged');
  window.scrollTo(scrollX, scrollY);
}
window.resumePreview = {
  refresh() {
    pending = pending.catch(() => {}).then(refresh);
    return pending;
  },
};
window.addEventListener('load', () => window.resumePreview.refresh());
})();`;
