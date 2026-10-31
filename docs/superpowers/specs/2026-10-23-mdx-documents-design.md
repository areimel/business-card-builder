# Design: Migrate resume docs from Markdown + `:::` directives to MDX components

## Context

Resume docs (`documents/*.md`) use a custom `:::` container tokenizer (`server/markdown.js`) and a `::qr{}` leaf directive (`server/qr.js`). Hand-editing is painful on four fronts (user-confirmed): colon-counting to nest (`:::::` → `::::` → `:::`), the `::qr{}` syntax is hard to read and remember, every role block repeats the same bold-label lines (Duration // Location / Sub-Roles / Client Types), and you can't see at a glance where the header, sidebar, and main column start and end.

**Decision (user-confirmed):** move to **MDX** with **layout + data-prop components**, **replace .md fully** (one format), and keep **shared components with CSS-only themes** (components emit the existing class names, so themes don't change).

**Why MDX over the other options:**
- **Markdoc** (`{% box %}…{% /box %}`) also fixes nesting, but it's a niche syntax and you can't write real components in it.
- **Pure YAML/JSON-Resume data** makes the prose awkward to edit.
- **MDX** gives named, explicitly closed tags you can read at a glance. Props replace the repeated lines. Prose stays Markdown, and the components are real JSX.

**Invariant kept:** MDX is compiled and rendered to static HTML **on the server** inside `/render/:slug`. The preview iframe and the PDF printer still load that same URL, so they stay identical. The client ships no MDX runtime.

## Target authoring format (example)

```mdx
---
title: Alec Reimel — Senior Developer
theme: terminal
page: { size: Letter, margin: 0.45in }
---

<Header>
# Alec Reimel, Senior Developer

<Contact>
**Location:** Doylestown, PA // **Phone:** 610-908-6127 // **Email:** alecreimel1@gmail.com
…
</Contact>

<QR url="https://alecreimel.com/" label="Portfolio" />
</Header>

<SidebarLayout>
<Sidebar>
- **Coding Languages:** HTML, CSS, …
</Sidebar>

<Main>
<Box title="Profile">
I specialize in …
</Box>

<Role label="Latest Role" title="Senior Developer" company="The Grovery (formerly Mota 9)"
  dates="Oct. 2022 - Aug. 2025" location="Lambertville, NJ"
  subRoles="Tech Lead, DevOps, Software Architect, AI Engineer, Marketing Analyst"
  clientTypes="Pharma, Healthcare, Lifestyle, Retail">

**Responsibilities:**

- **Tech Lead:** …
</Role>
</Main>
</SidebarLayout>

<Role pageBreak title="React Developer" company="Thorium Digital" …>
…
</Role>
```

Documents need **no imports**: components are injected through MDX's `components` option.

## Architecture

| Piece | File | Notes |
|---|---|---|
| JSX loader | `server/jsx-hooks.js` (new, ~20 lines) | Node 24 `module.registerHooks` load hook transforms `.jsx` with `esbuild.transformSync({ loader:'jsx', jsx:'automatic' })`. Wired via `node --import ./server/jsx-hooks.js` in `dev`, `dev:api`, `export` scripts. |
| MDX renderer | `server/mdx.js` (new, replaces `server/markdown.js`) | `evaluate(body, { ...runtime, remarkPlugins:[remarkGfm] })` from `@mdx-js/mdx` + `react/jsx-runtime`, then `renderToStaticMarkup(<Content components={components}/>)` from `react-dom/server`. Async. |
| Component registry | `server/components/index.js` | Exports `{ Header, Contact, QR, SidebarLayout, Sidebar, Main, Box, Columns, SkillGrid, Muted, DateRange, PageBreak, Role }`. |
| Layout components | `server/components/layout.jsx` | Thin wrappers that output the **exact existing class names** (`page-header`, `contact-line`, `sidebar-layout`, `sidebar`, `main`, `box`, `columns`, `skill-grid`, `muted`, `date-range`, `page-break`). Shared `className` + `pageBreak` prop handling goes in one helper (DRY). `<Box title>` renders `<p><strong>{title}:</strong></p>` first, to match today's output. |
| Role | `server/components/Role.jsx` | Props: `label` (default `"Role"`), `title`, `company`, `dates`, `location`, `subRoles`, `clientTypes`, `pageBreak`. Renders a `.box.role` with the same `<p><strong>` structure as today, then `children`. Adds a `.role` hook class only (no new styling required). |
| QR | `server/components/QR.jsx` + refactor `server/qr.js` | `qr.js` keeps the pure `qrSvg` logic and exports `qrPath(url) → { box, d }`. The directive is deleted. The component renders `<a class="qr-code"><svg class="qr-img">…</svg><span class="qr-label">`, with the same safe-URL check (`SAFE_URL`). A bad url **throws**, which surfaces on the error page. |
| Render | `server/render.js` | `renderDocumentHtml` becomes `async` and awaits `renderMdx(doc.body)`. On a compile/render error it returns an **error page** (HTTP 500, still standalone HTML) that shows the MDX message plus line:col, escaped with `escapeHtml`. This replaces the "raw `:::` stays visible" signal. |
| Route | `server/index.js` | `/render/:slug` handler becomes `async` and awaits the render. |
| Docs loading | `server/documents.js` + `server/config.js` | Add `DOC_EXT = '.mdx'` to config. `parseFile`/`listDocuments` use it. gray-matter still parses the frontmatter (MDX gets only the body). |
| Deps | `package.json` | Add `@mdx-js/mdx` (^3), `remark-gfm` (^4), `esbuild`. Remove `marked` once the migration is done. |

Reuse what's already there: `escapeHtml` (`server/html.js`), `isValidName`/`themeExists`/`resolvePageSize`/`resolveMargins` (`server/config.js`), `GUIDE_SCRIPT` and the page CSS injection in `render.js` (unchanged), and the watcher (`server/watch.js` already watches `documents/`). Component edits restart the API through `--watch-path=./server`.

MDX authoring rules to document:
- Put **blank lines** inside and around a tag whenever its content is block Markdown.
- `{` and `<` in prose must be escaped (`\{`, `&lt;`).
- An unclosed tag is a hard compile error, shown on the error page.

## Execution: TODO list, subagent assignments, commits

Run with `superpowers:subagent-driven-development`. Haiku handles mechanical and verification work; Sonnet handles the pipeline, components, and review. About 8 agents in total.

| # | Task | Agent | Depends | Commit |
|---|---|---|---|---|
| 1 | Write the design spec to `docs/superpowers/specs/2026-10-23-mdx-documents-design.md` (contents of this plan) | Haiku | — | **C1** `docs: MDX migration design spec` |
| 2 | Capture the **baseline**: save `/render/<slug>` HTML for both docs and themes, export PDFs, and record `pdfinfo` page counts and `pdftotext` output in the scratchpad | Haiku | — | — |
| 3 | Pipeline: deps, `jsx-hooks.js`, `mdx.js`, async render + error page, `DOC_EXT`, npm scripts. Keep `.md` loading temporarily so the app works at this checkpoint (list both extensions, pick the renderer by extension) | Sonnet | 1 | — |
| 4 | Components: `layout.jsx`, `Role.jsx`, `QR.jsx`, `index.js`, `qr.js` refactor | Sonnet | 1 (API defined above; runs in parallel with 3) | **C2** (3+4) `feat: server-side MDX rendering with shared resume components` |
| 5 | Convert `alec-reimel.md` → `.mdx` using `<Role>`, `<Box title>`, `<QR>` | Sonnet | 4 API | — |
| 6 | Convert `alec-reimel-classic.md` → `.mdx` (adds a `contact-left`/`contact-right` `<Columns>` usage via `className`) | Haiku | 4 API | **C3** (5+6) `content: migrate resume documents to MDX` |
| 7 | Remove the `.md` path: delete `server/markdown.js` and the `qrDirective`, drop `marked`, make documents `.mdx`-only | Haiku | C3 | **C4** `refactor: drop legacy ::: markdown pipeline` |
| 8 | Verify against the baseline (see below). Fix diffs (Sonnet if non-trivial) | Haiku → Sonnet | C4 | folded into C4/C5 |
| 9 | Code review of the whole branch (`superpowers:requesting-code-review`) | Sonnet | 8 | fixes → **C5** |
| 10 | Update `CLAUDE.md` (Documents section, component table, MDX gotchas, hard rule #2 rewritten for MDX) and the memory files | Haiku | 9 | **C6** `docs: document MDX components and authoring rules` |

Work on a feature branch `feat/mdx-documents` (the repo is on `main`). Every commit ends with the Co-Authored-By trailer.

Left to the builder: the exact esbuild hook wiring, whether `Box title` adds the trailing colon automatically (match today's output), the error-page styling, and whether to add `components/` to chokidar for an instant preview reload (restart + SSE reconnect is acceptable).

## Verification

1. `npm run dev`. Then `curl -s localhost:4178/api/documents` lists both slugs, and `curl -s localhost:4178/render/alec-reimel` returns 200.
2. **Structural parity:** for both docs × each theme, count class occurrences (`page-header`, `sidebar-layout`, `box`, `qr-code`, `page-break`, …) in the new vs baseline render HTML. They should match, except the intentional `.role` additions.
3. **Content parity:** `npm run export` both docs. `pdftotext` diff against the baseline should show no text changes, and `pdfinfo` page counts must match (2 pages for the main resume).
4. **Visual:** Playwright MCP screenshots of `/render/alec-reimel?theme=terminal`, `terminal-dark`, and `classic`, compared with the baseline screenshots. Check that the QR is still in the header's right column and still scans (it is a link in the PDF).
5. **Error path:** temporarily remove a `</Box>` and confirm `/render` shows the error page with a line number and the preview survives. Then restore it.
6. Live reload: edit the `.mdx` file and confirm the preview refreshes.
