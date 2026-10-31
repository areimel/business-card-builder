# Resume Builder — Agent Guide

Local-only web app: resume documents are MDX files on disk, rendered through swappable CSS themes, previewed live in the browser, and exported to PDF via headless Chrome. **The preview iframe and the PDF printer load the exact same URL (`/render/:slug`) — that parity is the core invariant. Never break it.**

## Architecture

- Express API on **:4178** (`server/`) + Vite React dev server on **:5173** (`src/`), run together with `npm run dev`. Vite proxies `/api`, `/render`, `/themes`, `/exports` to the API. `API_PORT` env var overrides :4178 for both the server and the Vite proxy (parallel checkouts).
- `GET /render/:slug?mode=<light|dark>&fonts=<set>` compiles the document's MDX **on the server** (`server/mdx.js`) and returns a **standalone HTML page**: `<html data-mode>`, an injected `<style>` with literal `@page { size; margin }` from frontmatter plus `:root` page CSS vars (`--page-w`, `--page-h`, `--page-mt/mr/mb/ml`), then `<link>`s to `/themes/base.css`, `/themes/<theme>/theme.css`, `/themes/<theme>/dark.css` (dark mode only), and the font set. Body is `class="theme-<name>"` wrapping `<div class="sheet"><article class="resume">…rendered MDX…</article></div>`. The theme comes from frontmatter only; `?theme=` is ignored.
- MDX pipeline: `@mdx-js/mdx` `evaluate()` with `remark-gfm` and the React JSX runtime, then `renderToStaticMarkup` (react-dom/server). Async. **No MDX or React runtime ships to the client.**
- A render failure (bad MDX, unclosed tag, unknown frontmatter theme, missing component, `<QR>` with a bad url) returns HTTP **500** with a standalone error page showing the message and file line:col (`renderDocumentHtml` in `server/render.js`).
- PDF export: `playwright-core` + system Chrome prints that same URL into `exports/`.
- Margin override: the app's Margins picker sends `?margin=` (`0` or one CSS length; `isValidMargin` in `server/config.js` validates, invalid values are ignored). Resolution (`render.js` `resolvePageMargins`): `?margin=`, then frontmatter `page.margin`, then `theme.json` `"margin"` (kojima: `"0"`), then 0.5in; `doc.page.margins` is `null` when frontmatter omits it. The override replaces all four sides for both `@page` and the `--page-m*` vars, is stored as `marginOverride` in the per-document/theme localStorage record, and shows a print-clipping warning below 0.25in. `resolveMargins` turns a bare `0` into `0in` (unitless 0 breaks `calc()`). The injected page vars sit on `html:root` so they beat base.css's `:root` defaults.
- QR override: the editor panel's **QR code** section (`src/components/style-editor/QrEditor.jsx`) edits the document's `<QR>` url and label. They are sent as `?qr=` / `?qrLabel=` (validated by `isValidQrUrl` / `isValidQrLabel` in `src/lib/qr.js`, re-exported by `server/config.js`; invalid values are ignored) and replace the props of every `<QR>` in the document (`withQrOverrides` in `render.js`). They are stored as `qrUrlOverride` / `qrLabelOverride` in the per-document localStorage record. The `.mdx` is never modified.
- Browser CSS overrides: the app injects a final `#resume-editor-overrides` stylesheet into the preview; export receives the same applied CSS in the POST JSON body and injects it before printing. Overrides, `modeOverride`, `fontsOverride` and `marginOverride` live in a versioned localStorage record per document/theme (`styleKey(slug, theme)`). CSS errors retain the last valid applied stylesheet. The app builds preview/export query strings with `overrideQuery({mode, fonts, margin, qr, qrLabel})`.
- Screen-only page cards: `server/preview-script.js` (inlined by `render.js`) measures the `.sheet`, works out page boundaries (snapping to `<Page>`/`.page-break` starts and honoring computed `break-inside`/`break-after: avoid`), then hides the sheet and shows each page as a `.page-card` holding a clipped clone of it. A `<Page>` that overflows gets a red `.overflow` card. Print CSS hides the cards and prints the original sheet, so PDF output is unaffected. Inside the app iframe (`html.embedded`) the page background is transparent, so the cards sit on the app backdrop.
- Themes: `terminal`, `classic`, and `kojima`. Each is a self-contained directory (see Themes below). Light is the default mode; a theme with a `dark.css` also supports `dark`. Kojima has `"margin": "0"` in theme.json and insets each `<Page>` with `--page-inset` (default 0.22in) in its `theme.css`.

## Hard rules

1. **Themes must NEVER declare `@page`** — only `server/render.js` injects it (CSS vars don't work inside `@page`, so values are injected as literals).
2. **Use components for block layout, never raw block-level `<div>`s wrapping Markdown** — use `<Header>`, `<SidebarLayout>`, `<Box>`, etc. from the document's theme. A plain `<div className="…">` is fine for a one-off class, but its contents must still be JSX-valid. Inline/leaf HTML (`<span>`, `<img>`, `<br />`) is fine.
3. **`playwright-core` + `/usr/bin/google-chrome` only.** Never install the full `playwright` package, never trigger a browser download. Fallbacks: `channel: 'chrome'`, then `~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`.
4. Files stay **under 300-400 lines** (target ≤150). DRY within a theme: extract shared code/CSS once something repeats 3+ times in that theme. Across themes, duplication is intentional (see rule 8).
5. Plain **JS/JSX, no TypeScript**. ESM everywhere (`"type": "module"`).
6. Print fidelity: `print-color-adjust: exact` lives in base.css; PDF export always uses `printBackground: true` and `preferCSSPageSize: true`.
7. **Fonts: any typeface is allowed** (mono, serif, sans, display…) and webfonts are preferred. Self-host them under `themes/fonts/` (see Font sets) so preview and PDF load the same local files; never load fonts from a CDN at render time. System font stacks are only a **last-resort fallback** at the end of a stack, never the primary choice.
8. **Documents are locked to their frontmatter `theme:`, and each theme owns its code.** A theme's components live in `themes/<t>/components/`, its CSS in `themes/<t>/layout.css`, `theme.css` (and `dark.css`). Themes never import each other. The only shared code is `server/components/core.jsx`/`QR.jsx` and `themes/base.css`. Don't hoist theme components into core to avoid duplication: themes are meant to diverge.
9. **Dark mode is palette-only.** `dark.css` overrides custom properties under `html[data-mode="dark"] …`, adds no layout rules, and never `@import`s `theme.css`.

## Documents (`documents/*.mdx`)

Frontmatter is YAML (parsed by gray-matter); the body is MDX. Document slugs = filename without `.mdx`, must match `^[\w-]+$` (`isValidName` in `server/config.js` is the single validation source — never inline that regex elsewhere). `DOC_EXT` in `server/config.js` is `.mdx`.

```mdx
---
title: Alec Reimel — Lead Developer
theme: terminal          # must match a themes/<name>/ directory; the document is locked to it
mode: light              # optional: light | dark (needs themes/<theme>/dark.css); default from theme.json
fonts: plex              # optional font set; must be listed in the theme's theme.json "fontSets"
page:
  size: Letter           # Letter | A4 | Legal | "<width> <height>" e.g. "8.5in 11in"
  margin: 0.45in         # single value, or { top, right, bottom, left }
---

<Header>

<NameHeading name="Alec Reimel" title="Lead Developer" />

<Contact>

<ContactRow><ContactField label="Location">Doylestown, PA</ContactField><ContactField label="Email">you@example.com</ContactField></ContactRow>

</Contact>

</Header>

<SidebarLayout>

<Sidebar>

<SidebarList fill>

- <Label>Languages</Label> HTML, CSS, JS
- <Label>Frameworks</Label> React, Next.js

</SidebarList>

</Sidebar>

<Main>

<ProfileSection>

I specialize in…

</ProfileSection>

<Role label="Latest Role" title="Lead Developer" company="Acme" dates="2024 - Present" location="Remote" fill>

<JobRoleListSection title="Responsibilities">

- <Label>Frontend</Label> Built the marketing sites.

</JobRoleListSection>

</Role>

</Main>

</SidebarLayout>
```

- **No imports** in documents. Components are injected via MDX's `components` map: the core map (`server/components/index.js`) merged under the document theme's own map (`themes/<theme>/components/index.js`, theme wins).
- The body is padded with the frontmatter's newlines, so MDX error line numbers match the file.
- Components emit the base.css or theme `layout.css` class names below; themes stay CSS-only (theme-specific components are the exception, see Theme components).
- Example docs: `documents/alec-reimel.mdx` (terminal), `documents/alec-reimel-kojima.mdx` (kojima, with theme components), `documents/alec-reimel-cover-letter.mdx` (kojima cover letter template).

### MDX authoring gotchas

- **Blank lines** after an opening tag and before a closing tag when the content is Markdown. Without them the content is treated as inline.
- A lone `<Muted>` on its own line is **not** wrapped in `<p>`. For a standalone muted paragraph use `<Note>`.
- Same for any line holding only JSX elements (e.g. `<ContactField>`): no `<p>` wrapper. Put them inside a wrapper like `<ContactRow>` (a `p.contact-row`) instead of a raw `<p>`.
- Escape `{`, `}`, and `<` in prose (`\{`, `\}`, `&lt;`).
- Use `className`, not `class`. Self-close void/empty tags (`<br />`).
- An unclosed or mismatched tag is a hard error: `/render` returns the 500 error page with line:col. If the preview shows that page, find the tag named in the message.

## Core components (`server/components/`)

Theme-neutral only: `core.jsx` (`cx`, `make`, `Page`, `PageBreak`) and `QR.jsx`. `index.js` maps `{ Page, PageBreak, QR }` and is the base every theme's map merges over.

| Component | Props | Output |
|---|---|---|
| `<Page>` | block | `div.page`: one printed page; at least the printable height, and every `<Page>` after the first breaks before it. Its `.fill` child (otherwise its last child) grows, and so do the cells of a `.sidebar`/`.main` inside it. Content past one page overflows and is not clipped, so move cells between `<Page>`s to control where pages start and stop |
| `<PageBreak>` | — | `div.page-break` |
| `<QR>` | `url` (required), `label?`, `fg?`, `bg?` | `a.qr-code` > inline `svg.qr-img` + `span.qr-label`; `fg`/`bg` (CSS colors) set inline `--qr-fg`/`--qr-bg` on the svg, overriding the theme |

### Theme components (reference set)

`terminal`, `classic`, and `kojima` each ship their own copy of this set in `themes/<t>/components/` (`layout.jsx`, `text.jsx`, `sections.jsx`, `Role.jsx`, `index.js`). The tables below describe that reference set. Themes may diverge, so check the document's theme's own `components/` before assuming a prop or output.

Block wrappers (and `<Role>`) accept `className` (extra classes), `pageBreak` (adds `page-break`), and `fill` (adds `fill`: inside a `<Page>`, this cell grows to absorb the leftover height).

| Component | Props | Output |
|---|---|---|
| `<Header>` | block | `div.page-header` (full-width band; QR child makes it two-column) |
| `<Contact>` | block | `div.contact-line.meta` |
| `<Meta>` | block | `div.meta`: metadata lines (location, dates, roles…), body font at `--meta-size` |
| `<SidebarLayout>` | block | `div.sidebar-layout` |
| `<Sidebar>` | block | `div.sidebar` |
| `<Main>` | block | `div.main` |
| `<Box>` | `title?` | `div.box`; `title` renders first via `<CellHeading>` → `p.cell-heading > strong.label` (colon added) |
| `<Columns>` | block | `div.columns` (two equal columns) |
| `<SkillGrid>` | block | `div.skill-grid` |
| `<Muted>` | inline | `span.muted` |
| `<Note>` | children | `<p><span class="muted">…</span></p>` (standalone muted paragraph) |
| `<DateRange>` | inline | `span.date-range` |
| `<Role>` | `label` (default `"Role"`), `title`, `company`, `dates`, `location`, `subRoles`, `clientTypes`, `note`, `pageBreak`, `fill`, `className` | `div.box.role`: optional `note` (muted, first), then `<JobRoleHeading>` (same props, no box), then children |

Text primitives (`text.jsx`):

| Component | Props | Output |
|---|---|---|
| `<Label>` | `colon` (default `true`), `className?` | `strong.label` + `:`; the single source of "Label:" markup within a theme |
| `<CellHeading>` | `colon?` | `p.cell-heading` > `<Label>` (Box `title` uses this) |
| `<CellSubHeading>` | `colon?` | `p.cell-subheading` > `<Label>` |
| `<NameHeading>` | `name`, `title?` | `h1.name-heading`: name, then `span.name-title` (", title") |
| `<ContactRow>` | block | `p.contact-row`: one line of `<ContactField>`s (inside `<Contact>`) |
| `<ContactField>` | `label`, children | `span.contact-field` > `<Label>` + value; layout.css adds " // " between fields |
| `<JobRoleHeading>` | `label` (default `"Role"`; `""` drops the `Label: ` prefix), `title`, `company`, `dates`, `location`, `subRoles`, `clientTypes` | `p.job-role-heading` > `strong`: `{label}: {title} - {company}`, then `div.meta` with `Duration // Location`, `Sub-Roles:`, `Client Types:` lines (only the ones given) |

Section components (`sections.jsx`, titled `Box`es unless noted):

| Component | Props | Output |
|---|---|---|
| `<ProfileSection>` | `title` (default `"Profile"`), `className?`, `pageBreak`, `fill` | `div.box.profile-section` |
| `<PreviousClientSection>` | `title` (default `"Previous Clients"`), same as above | `div.box.client-section` |
| `<SidebarList>` | `title?`, same as above | `div.box.sidebar-list` |
| `<JobRoleListSection>` | `title?`, `className?` | `div.job-role-list` (not a box): optional `<CellSubHeading>`, then children |
| `<PageNote>` | children | `div.box.page-note` > `p.cell-heading` (no colon); e.g. "Next Page: …" |
| `<ExperienceItem>` | `title`, `company?`, `dates?`, `className?` | `div.experience-item` > `p`: `<Label>{title}</Label> {company} — <DateRange>`, then children |

Example: `<Role label="Latest Role" title="Senior Developer" company="…" dates="…" location="…" subRoles="…" clientTypes="…">` followed by Markdown bullets and a closing `</Role>`.

Use a raw `<div className="contact-left">` inside a component for one-off classes (see `documents/alec-reimel-classic.mdx`).

### Adding a component

- Add it to the theme(s) that need it, in `themes/<t>/components/`: `layout.jsx` (`make` factory + `cx`, thin class wrappers), `text.jsx` (inline/heading primitives; `Label` is that theme's single source of "Label:" markup), `sections.jsx` (`Box` + titled sections), `Role.jsx` (`Role` + `JobRoleHeading`), or a new file for logic. Import `make`/`cx` from `../../../server/components/core.jsx` and reuse the theme's own helpers rather than re-inlining them.
- New titled Box variant: `section(cls, defaultTitle)` in that theme's `sections.jsx` (see `ProfileSection`), not a hand-written wrapper.
- Register it in that theme's `components/index.js` — that map is the only place its documents get components from. Copy it into another theme only if that theme needs it; hoist into `server/components/` only if it is theme-neutral like `Page`/`QR`.
- `.jsx` loads in Node only through `server/jsx-hooks.js` (esbuild load hook). Any new Node entrypoint must run with `node --import ./server/jsx-hooks.js` (already set in the `dev`, `dev:api`, and `export` npm scripts).
- Edits under `server/` restart the API via `--watch-path=./server`.

### QR codes (`<QR>`)

```mdx
<QR url="https://alecreimel.com/" label="Portfolio" />
```

- `url` must start with `http:`, `https:`, `mailto:`, or `tel:` (`isSafeQrUrl` in `src/lib/qr.js`, re-exported by `server/qr.js`; case-insensitive). A missing or unsafe url, or one too long to encode, **throws** and the document shows the error page.
- `server/qr.js` exports `qrPath(url) → { box, d }` (pure SVG path data) and `isSafeQrUrl`; `server/components/QR.jsx` builds the element from them. The SVG is inline — no network, identical in preview and PDF, clickable in the PDF.
- Direct child of `<Header>` → the theme's layout.css makes the header a two-column grid (QR cell on the right, full height).
- Theme hooks: `--qr-size` (default `0.9in`), `--qr-fg`, `--qr-bg`, set in each theme's `theme.css` and overridden in `dark.css` where the dark palette differs. Prefer dark-on-light codes; inverted codes fail on some older scanners. Kojima is a deliberate exception: its QR cell (`--qr-cell-bg`) and tile are the orange accent with an ink code in light mode, and black with an orange code (inverted) in dark mode; `--qr-label` colors its label.
- Per-instance colors: `<QR url="…" fg="#000" bg="#ff4d00" />`. Values containing `;{}<>` throw (error page).
- Escape any interpolated text in server-side HTML with `escapeHtml` from `server/html.js` (the single escaper — don't re-inline one).

## Themes (`themes/<name>/`)

Each theme directory holds: `theme.json` (`name`, `description`, `mode`, `fonts`, `margin`, `fontSets`), `theme.css` (starts with `@import url("layout.css")`, then typography/color), `layout.css` (the theme's geometry and component layout), optional `dark.css` (palette overrides for `data-mode="dark"`), and `components/` (`index.js` exporting a named `components` map plus its own `.jsx` files).

- `theme.json`: `mode` is the default (`light` for all three). `fonts` is the default font set, always accepted. `fontSets` lists the sets this theme accepts and the app's Fonts picker shows.
- `theme.json` `margin` (optional): the default page margin when neither `?margin=` nor frontmatter `page.margin` is set (kojima: `"0"`); otherwise 0.5in.
- Mode resolution (`resolveMode` in `server/render.js`): `?mode=` override → frontmatter `mode:` → theme.json `mode` → `light`. A requested mode is ignored unless `modeExists` (`dark` needs `dark.css`).
- `loadThemeComponents(theme)` (`server/theme-components.js`) loads `themes/<theme>/components/index.js` for the **active** theme only and merges it over the core map (theme wins). Documents using a theme's components only render under that theme; the document is locked to it, so this is intentional.
- Theme components import only `../../../server/components/core.jsx` plus their own local files.
- Hot reload: imports carry `?v=<newest mtime of that theme's components/ dir>`, and the jsx-hooks `resolve` hook propagates it to relative imports outside `server/` and `node_modules`, so edits apply on the next render with no API restart. Core components stay singletons.
- Theme-component styles go in the theme's CSS (kojima: `components.css` and `letter.css` for cover-letter components, both `@import`ed by `theme.css`).

Kojima components (`themes/kojima/components/`, in addition to the reference set):

| Component | Props | Output |
|---|---|---|
| `<Kicker>` | `index?`, `className?`, children | `p.kicker` > `span.kicker-index` + `span.kicker-sep` (" / ", only with `index`) + `span.kicker-text`. Reads "01 / PROFILE" |
| `<Plate>` | `code` (default `"Plate 001"`), `org` (default `"Signal / Résumé"`) | `div.plate-strip` > `span.plate-org` + `span.plate-code` |
| `<Fig>` | `n`, children? | `span.fig`: "FIG. {n}", plus " / {children}" when given |
| `<Section>` | `index?`, `title?`, `className?`, rest → `<Box>` | `div.box.section` > `<Kicker index>{title}</Kicker>`, then children |
| `<Signal>` | `index?`, `note?`, `pageBreak`, `fill`, `className?`, `<Role>` props (`label` default `"Role"`, `title`, `company`, `dates`, `location`, `subRoles`, `clientTypes`) | `div.box.role.signal` > `<Kicker index>` with `label` as its text, then `Note`, then `<JobRoleHeading label="">` (no prefix), then children |
| `<CaseStudy>` | `index?`, `kicker`, `title?`, `stack?`, `pageBreak`, `fill`, `className?` | `div.box.case-study` > `<Kicker index>{kicker}</Kicker>`, `h2.case-title`, children, then `p.case-stack` ("Stack: …") when `stack` is given. See `documents/bemarketing-outcomes.mdx` |
| `<StatRow>` / `<Stat>` | `<Stat value label>` | `div.stat-row` (equal-column metric strip) > `div.stat` > `span.stat-value` + `span.stat-label` |
| `<Challenge>` / `<Action>` / `<Result>` | block | `div.story-part.story-<label>` > `p.story-label` + `div.story-body` (labeled two-column row) |
| `<Letter>` | block, `fill`, `pageBreak`, `className` | `div.box.letter`: the main-column letter body. See `documents/alec-reimel-cover-letter.mdx` |
| `<Dateline>` | children | `p.letter-date` |
| `<Recipient>` | `name`, `title?`, `company?`, children (address lines) | `div.letter-recipient.meta` > `p.recipient-name`, then title/company `<p>`s (only those given), then children |
| `<Salutation>` | children | `p.salutation` |
| `<LetterPart>` | `index?`, `label?`, children | `div.letter-part` > `<Kicker index className="letter-part-kicker">{label}</Kicker>` (only with `label`) + `div.letter-part-body` |
| `<SignOff>` | `closing` (default `"Sincerely,"`), `name`, `title?` | `div.sign-off` > `p.sign-off-closing`, `p.sign-off-name`, `p.sign-off-title` (only with `title`) |
| `<StatStack>` | block of `<Stat>`s | `div.stat-stack`: vertical sidebar variant of `<StatRow>` |

## Font sets (`themes/fonts/`)

- `themes/fonts/<id>/`: one self-hosted family (latin woff2, `font.css` with its `@font-face` rules, `OFL.txt`), generated by `node scripts/fetch-fonts.js [id…]` from Fontsource (the Google Fonts files). To add a family, put its Fontsource id in `FAMILIES`, run the script, and commit the output.
- `themes/fonts/sets/<name>.css`: a font set. It `@import`s the families it needs and sets `--font-body` and `--font-heading` on `.resume`, with fallback stacks. A set may also carry small font-only rules (e.g. `martian` uses `font-stretch`).
- Themes only consume those vars, and declare fallback defaults on `body`. `--body-weight` controls body weight (kojima's `dark.css` raises it to 380 for light-on-dark text).
- Selection (`resolveFonts` in `server/render.js`): `?fonts=` or frontmatter `fonts:` is used only if it is listed in the theme's `fontSets` (and `fontSetExists` in `server/config.js` passes). Otherwise the theme.json `fonts` default applies. The app's Fonts picker shows only the theme's `fontSets`.
- Mono sets: `jetbrains` (terminal default), `plex`, `geist`, `martian`, `retro`. Serif sets: `source` (classic default), `garamond`, `plex-serif`, `newsreader`, `crimson`. Sans sets: `kojima` (kojima default; DM Sans body/heading, DM Mono labels).
- `--font-label` is an optional var a set may define (kojima sets DM Mono). Themes consume it with a fallback: `var(--font-label, var(--font-body))`.
- The PDF is printed after `document.fonts.ready`. `pdffonts exports/<file>.pdf` should list the set's faces.

## Layout classes

Ownership is split: `themes/base.css` holds only the theme-neutral page contract; each theme's `layout.css` styles its own components.

### `themes/base.css` (shared page contract)

| Class | Purpose |
|---|---|
| `.page` | explicit page (`<Page>`): flex column with min-height = printable height; `.page + .page` breaks |
| `.fill` | the cell that grows inside a `.page` (or inside its `.sidebar`/`.main`) |
| `.sheet` | the page surface — geometry from page vars; never restyled by themes except `--sheet-bg` |
| `.avoid-break` / `.page-break` | keep unbroken / force a page break before this element |
| `.qr-code` / `.qr-img` | `<QR>` link cell and inline SVG; themes set `--qr-*` vars |
| `.page-card` / `.page-cards` | screen-only page cards (preview), hidden in print |

### Each theme's `layout.css`

Defines the layout vars (`--sidebar-w`, `--layout-gap`, `--box-border`, `--meta-size`, `--meta-lh`) and styles:

| Class | Purpose |
|---|---|
| `.page-header` | full-width header band (name, contact); two-column grid with a `.qr-code` child |
| `.sidebar-layout` / `.sidebar` / `.main` | grid of sidebar + main columns |
| `.box` | bordered/boxed section, `break-inside: avoid` |
| `.role` | hook class added by `<Role>`; no base styling (for theme targeting) |
| `.columns` / `.skill-grid` | two equal columns / auto-fit grid for skill tags |
| `.contact-line` / `.meta` | compact contact line / metadata text at `--meta-size` |
| `.date-range` / `.muted` | muted date span / de-emphasized text |
| `.contact-field` | `<ContactField>`; layout.css adds the " // " separator between consecutive fields |
| `.experience-item` | `<ExperienceItem>`; kept unbroken and spaced |
| `.page .sidebar` / `.page .main` | fill rules for `<Page>` cells and the margin kills |
| `.name-heading` / `.name-title`, `.contact-row`, `.label`, `.cell-heading` / `.cell-subheading`, `.job-role-heading`, `.job-role-list`, `.sidebar-list` / `.profile-section` / `.client-section`, `.page-note` | component hook classes; styled by each theme as needed |

Most hook classes have no base styling; they exist so themes can target them. Theme CSS should style these hooks, not structural descendant selectors (`.box > p:first-child`, `.sidebar p strong`).

`terminal` is a gapless grid: `--layout-gap: 0`, and adjacent cells overlap by `--rule-w` so they share one border. A `<Sidebar>` that holds `<Box>`es becomes a stack of those cells (see `documents/alec-reimel.mdx`). Theme CSS only does typography, color, borders, spacing character.

### Dark mode (`dark.css`)

Linked by render.js after `theme.css` when the mode is `dark`. It overrides custom properties only, scoped `html[data-mode="dark"] body { … }` (plus its own QR tile colors if needed). It never `@import`s `theme.css` and adds no layout rules. Terminal's `dark.css` is the reference.

## API surface

`GET /api/documents` · `GET /api/themes` → `[{ id, name, description, modes, fonts, margin, fontSets }]` · `GET /api/fonts` → `[{ id, family, cssUrl }]` · `GET /api/events` (SSE live-reload: emits on documents/ or themes/ change) · `GET /render/:slug?mode=&fonts=&margin=&qr=&qrLabel=` (theme from frontmatter; `?theme=` ignored) · `POST /api/export/:slug?mode=&fonts=&margin=&qr=&qrLabel=` (optional JSON `{ css }`, 1MB cap) → `{ ok, file, name, url }`; the file is `slug--mode--fonts--m<margin>.pdf` (empty parts dropped; `.` in the margin becomes `_`) · static `/themes/*`, `/exports/*`

Validation helpers in `server/config.js` are the single sources: `isValidName`, `themeExists`, `isValidMode`, `modeExists`, `fontSetExists`, `isValidMargin`, `isValidQrUrl`, `isValidQrLabel`.

`window.resumePreview.refresh()` repaginates after style/font changes. Picker code maps cloned page elements to canonical elements through `data-resume-node`; exported selectors must not use clone wrappers or internal identifiers. See `docs/style-editor.md`.

## Verify

`npm run dev` → http://localhost:5173. `curl localhost:4178/api/documents`. `curl -i localhost:4178/render/<slug>` should return 200 (and `?mode=dark` for a theme with `dark.css`); a 500 means the error page is showing. Exports land in `exports/` (gitignored). CLI export: `npm run export -- <slug> [mode]`. `pdftotext` and `pdfinfo` are available for PDF checks.
