# Resume rewrite decisions and follow-up evidence

Date: **2026-10-26**.

## Working brief and TODO

- [x] Inspect the source resume, project instructions, rendering pipeline, and theme.
- [x] Research screening and sourcing using primary vendor documentation.
- [x] Confirm target positioning: senior/lead full-stack roles, with local hybrid/on-site opportunities preferred.
- [x] Rewrite a separate MDX copy using existing evidence; preserve the Kojima theme, fonts, Letter size, and two-page structure.
- [x] Save reusable research with source links and limitations.
- [x] Verify PDF export, readable text, page count, and layout.
- [ ] Revisit claims and add stronger project details after the questionnaire is completed.

The user authorized this first rewrite without further answers. No new performance metrics, reporting relationships, qualifications, or technology implementations were supplied.

## Editorial decisions

- Position the headline around hands-on full-stack technical leadership; retain official titles in employment history. Applied AI, security operations, and marketing technology support that positioning.
- Replace first-person responsibilities with concise ownership and accomplishment statements. Keep technologies beside projects where the source establishes the relationship, including Next.js and MCP in HiveMind, WordPress/Astro templates, and React at Thorium.
- Retain approximately 300 client websites and the stated two-month-to-one-or-two-week development improvement. Do not derive a more precise percentage or invent uptime, revenue, cost, conversion, or incident metrics.
- Preserve employment dates from the requested source, including the October 2026 beMarketing end date. Do not infer ongoing employment or explain gaps without evidence.
- Normalize recognizable names such as JavaScript, TypeScript, Node.js, Tailwind CSS, HubSpot, and Google Analytics 4. Expand Model Context Protocol (MCP) and continuous integration/continuous delivery (CI/CD).
- Keep listed technologies as skills without implying that every technology was used in each job. A skill inventory is not proof of production expertise.
- Replace hobbies and the personal anecdote with relevant interactive-experience and adjacent-domain skills. Shorten the client list and label it explicitly as agency client work across roles.
- Add a visible, clickable portfolio URL so readers and text extractors do not need to interpret a QR code.
- Omit the ambiguous Microsoft certification pending its exact name. Omit broad “custom AI training” and “security-compliant local AI” language because the source does not establish the training method or compliance standard.
- Describe accessibility work without promising legal ADA compliance. Use the source's augmented-reality project description without repeating its inconsistent VR analogy.

These choices follow the evidence-informed recommendations in the [screening research](2026-ai-screening-and-ats.md) and [sourcing research](2026-ai-candidate-sourcing.md). They improve clarity of qualifications; they do not establish a universal passing score or guaranteed hiring result.

## Follow-up evidence for the next revision

| Claim or topic | Current treatment | What would strengthen it |
| --- | --- | --- |
| Employment dates and titles | Preserve requested source | Confirm latest role status and resolve Kane Partners start-date discrepancy across resume versions. |
| Team leadership | State team composition already provided | Direct reports versus coordination, team size, hiring/review authority, mentoring outcomes. |
| Approximately 300 websites | Preserve approximate scope | Active maintenance scope, number of launches, operational responsibilities, measurement date. |
| Build-time improvement | Preserve approximate original values | Comparable project scope, elapsed versus development time, number of builds, team adoption. |
| AI applications | Describe named applications and established integrations | Production/pilot status, users, stack, hosting, databases, reliability measures, individual contribution. |
| AI model training | Omit ambiguous claim | Distinguish prompting, retrieval, embeddings, fine-tuning, and model-weight training. |
| Security and analytics | Describe work without invented results | Incident recovery times, maintenance effort, tracking accuracy, attribution improvements, actual controls. |
| NJ Ad Award | Preserve source's general recognition claim | Award name, year, category, campaign, client, and exact contribution. |
| Microsoft credentials | Omit pending clarification | Exact credential/exam names, issue dates, and status. |
| Skill breadth | Retain existing engineering/AI skills without proficiency ratings | Recent professional strengths versus historical, occasional, or experimental use. |
| Public evidence | Retain existing portfolio URL | Confirmed LinkedIn/GitHub links, strongest repositories, case studies, publication permissions. |

No RAG, vector database, fine-tuning, Kubernetes, AWS, regulatory certification, direct-report count, or formal engineering-manager authority was added without evidence.

## Validation and limits

Export with `npm run export -- alec-reimel-kojima-codex-rewrite`. Inspect metadata with `pdfinfo` and extracted text using both ordinary `pdftotext` and `pdftotext -layout`. Verify contact information, portfolio URL, role/company/date associations, skills, education, and complete bullets.

Check `/render/alec-reimel-kojima-codex-rewrite` in system Chrome after fonts and preview pagination settle: HTTP 200, exactly two `.page-card` elements, and no `.page-card.overflow`. Inspect both pages visually. Keep the original MDX, themes, fonts, components, and application code unchanged.

Initial export produced a two-page searchable Letter PDF; preview checks returned HTTP 200, two cards, and zero overflow. Decorative contact labels extract with letter spacing, but their values remain readable. The sidebar and main column may be interleaved differently by different parsers. These checks assess the local output, not proprietary ATS parsing or ranking.
