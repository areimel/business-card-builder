# Resume Builder

A local web app for building resume documents from **MDX (Markdown + components) and HTML/CSS themes**, with a live browser preview and **pixel-identical PDF export** (the preview and the PDF printer render the exact same page).

Resume content lives as plain files on disk — edit them in your editor or let an AI coding agent do it — and the preview reloads automatically.

## Quickstart

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. Pick a document, toggle light/dark from the toolbar (when the theme has a dark mode), click **Export PDF** — the file lands in `exports/` and downloads in the browser.

## Styling in the browser

Open **Styles** to use the right-hand CSS inspector. Pick an element in the preview,
edit its selector and declaration rows, or write CSS in the scrollable **CSS changes**
area. The inspector includes local fonts, color controls, spacing units, computed
values and matching source rules. Drag the panel edges to resize it.

Overrides, mode and font-set choices autosave in localStorage **per document and theme**.
Theme files stay untouched. **Clear current** resets the active pair; **Clear all…**
confirms before clearing overrides for every document/theme. **Copy** and
**Download .css** return the CSS draft, including the selected font-set import.

PDF exports include the active applied overrides. If a CSS draft has syntax errors,
the preview and PDF keep the last valid CSS while the draft remains editable and
saved. Normal CSS specificity still applies: refine the selector or explicitly
toggle `!important` when a theme rule wins. Page size and outer page margins remain
in document frontmatter. See [the editor guide](docs/style-editor.md) for details.

Checks: `npm test`, `npm run build`, and, with the dev server running,
`npm run test:browser`. Set `WEB_ORIGIN` if Vite is using another port. Browser
checks use the installed system Chrome and do not download a browser.

## Adding a resume document

Create `documents/<slug>.mdx` (slug: letters/numbers/dashes only):

```mdx
---
title: My Resume
theme: terminal            # terminal | classic | kojima (locked: a document uses only its own theme)
mode: light              # optional: light | dark (dark only where the theme has one)
page:
  size: Letter             # Letter | A4 | Legal | "8.5in 11in"
  margin: 0.5in
---

<Header>

# Jane Doe, Senior Developer

<Contact>

**Location:** Earth // **Email:** jane@example.com

</Contact>

<QR url="https://example.com/" label="Portfolio" />

</Header>

<SidebarLayout>

<Sidebar>

- **Languages:** JS, CSS…

</Sidebar>

<Main>

<Box title="Profile">

What I do…

</Box>

<Role title="Senior Developer" company="Acme" dates="2022 - 2025" location="Remote"
  subRoles="Tech Lead, DevOps" clientTypes="Retail">

- **Web Development:** …

</Role>

</Main>

</SidebarLayout>
```

- Standard Markdown works everywhere; components are available without imports.
- **Leave blank lines** inside a tag around Markdown content, or it's treated as inline text.
- Components: `Header`, `Contact`, `SidebarLayout`, `Sidebar`, `Main`, `Box` (`title`), `Columns`, `SkillGrid`, `Muted`, `Note`, `DateRange`, `PageBreak`, `Role` (`label title company dates location subRoles clientTypes note`), `QR` (`url label fg bg`). Block components accept `className` and `pageBreak`. Full reference in `CLAUDE.md`.
- `<QR>` `url` is required (`http`, `https`, `mailto` or `tel` only). Inside `<Header>` it sits in the right-hand column.
- A mistyped or unclosed tag shows an error page in the preview with the file line number.

## Adding a theme

Create `themes/<name>/` with `theme.json` (`{ "name", "description", "mode", "fonts", "fontSets" }`), `theme.css` (starting with `@import url("layout.css")`), and `layout.css` for its component layout. Optional: `dark.css` (palette overrides under `html[data-mode="dark"]`, never `@import`ing `theme.css`) and `components/` (its own MDX components). Themes are self-contained; copy code between them rather than importing across. Don't declare `@page` (the server injects page size/margins) and don't re-style `.sheet` geometry. See `themes/terminal/` as the reference.

## How PDF export works

The server renders your document at `/render/<slug>` — the same URL the preview iframe shows — and prints it with headless Chrome (`playwright-core` + your system Chrome). `@page` CSS from frontmatter controls size and margins; backgrounds print exactly as previewed.

You can also export from the command line (works whether or not the dev server is running):

```bash
npm run export -- <slug> [mode]       # e.g. npm run export -- alec-reimel dark
```

## Project layout

```
documents/   your resume .mdx files
themes/      base.css (shared page contract) + one self-contained dir per theme, plus fonts/
server/      Express API: MDX render, core components/, theme loading, live-reload (SSE), PDF export
src/         React preview app (Vite)
exports/     generated PDFs (gitignored)
```
