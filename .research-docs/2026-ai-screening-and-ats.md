# AI screening and applicant tracking systems: evidence for the resume rewrite

Research date and access date for all sources: **2026-10-26**.

Purpose: guide the content rewrite of `documents/alec-reimel-kojima-codex-rewrite.mdx` while preserving its Kojima styling. This is a snapshot of documented capabilities, not a claim about every employer's configuration or the prevalence of any product. Vendor documentation explains intended behavior; it does not independently establish accuracy, fairness, or hiring success.

## Different stages need different optimizations

| Stage | What happens | Practical implication |
| --- | --- | --- |
| Parsing | Document text becomes candidate-profile fields. | Keep names, dates, companies, titles, and contact details extractable and clearly associated. |
| Database search | Recruiters search text or structured fields, sometimes with Boolean queries. | Use recognizable, correctly spelled technology and role names. |
| AI assessment | An employer's requirements are compared with resume evidence. | Explain relevant work in context: contribution, technology, scope, adoption, and result. |
| Ranking or prioritization | Matches, grades, or criteria percentages influence review order. | A focused, evidence-rich resume can communicate fit more clearly; no universal score exists across these products. |
| Knockout rules | Configured application answers trigger rejection. | Accurate application answers matter independently of resume wording. |
| Hiring decisions | Recruiters and hiring managers use the available information and workflows. | Readability and credible achievements remain important. |

This table synthesizes the product-specific documentation below. Its writing recommendations are our inference, rather than vendor promises about passing a screen.

## Greenhouse

### Parsing and formatting

Greenhouse describes parsing as filling candidate fields from an uploaded resume. When parsing fails, the file remains attached and details require manual entry. It cannot parse files over 2.5 MB. Listed formatting risks include columns, graphics, tables, headers/footers, contact information in text boxes, inconsistent sections, and incomplete titles. These are potential failure causes, not proof that every document using those features fails. Source: [Unsuccessful resume parse](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse), updated 2026-03-02.

**Inference for this project:** retain the requested two-column design, check the exported PDF's selectable text and logical reading order, and disclose that this is not a Greenhouse parser test. Do not claim that keeping the design guarantees ATS compatibility.

### AI matching and human decisions

Talent Matching lets recruiters set weighted criteria for skills, experience, titles, and optionally industry, then groups applicants into match categories. Related terms can map to one skill, so adding more synonyms does not necessarily increase a match result. The feature does not automatically advance or reject candidates. Source: [Talent Matching FAQ](https://support.greenhouse.io/hc/en-us/articles/41131886674075-Talent-Matching-FAQ), updated 2026-10-05.

The technical FAQ describes extracting skills, job titles, experience duration, employer names, employment dates, and derived employer industry where available. It uses specialized LLM extraction and semantic matching of skills/titles. This matching calculation uses resume data, rather than structured application-form answers. Source: [Talent Matching — Data Processing FAQ](https://support.greenhouse.io/hc/en-us/articles/41131616864283-Talent-Matching-Data-Processing-FAQ), displayed update 2026-02-02.

**Inference:** connect skills to specific employment and projects. Keep employer, client, and project relationships explicit; serving a large brand through an agency does not mean employment by that brand. Use relevant terminology without repetitive keyword lists.

### Actual automatic rejection

Greenhouse separately supports application rules that reject applicants based on configured answers to Yes/No, single-select, or multi-select questions. Rejection reasons and emails can accompany those actions. Source: [Auto-reject](https://support.greenhouse.io/hc/en-us/articles/360000653472-Auto-reject), updated 2026-01-30.

**Inference:** an immediate rejection can reflect an application-answer rule. Its speed does not prove that an AI read and rejected the resume. Resume keywords cannot compensate for an unmet required license or other screening answer.

## Lever

### Search remains literal as well as structured

Lever documents searching names and parseable profile content, including resumes, notes, and feedback. Its resume filter limits searches to parsed resume text. Boolean AND, OR, and NOT and structured fields such as title, company, education, and location help recruiters narrow results. Work-history titles are parsed from resumes. Source: [Searching the Database for Candidates](https://help.lever.co/s/article/Searching-the-Database-for-Candidates), displayed publication 2026-03-01.

**Inference:** exact standard names remain useful even where other systems support semantic matching. Use JavaScript, TypeScript, Node.js, React, Next.js, and other verified skills with consistent capitalization; expand useful abbreviations once, such as Model Context Protocol (MCP) and Google Analytics 4 (GA4). This is discoverability guidance, not an instruction to add unverified experience.

### Talent Fit

Lever's Talent Fit compares job descriptions with resumes, highlights closer matches, and presents positives, clarification areas, and concerns. The documentation describes Spring 2026 improvements and says new jobs default to Talent Fit OFF as of 2026-08-04. It says the feature is intended to provide context rather than filter candidates out. Source: [Talent Fit in Lever](https://help.lever.co/s/article/Talent-Fit-in-Lever), displayed publication 2026-08-04.

**Inference:** make relevant experience explicit enough to answer a reviewer's likely clarification questions. Identify whether an AI application was a deployed internal tool or an experiment, its users, and your contribution. Do not assume every employer using Lever activates Talent Fit.

Access limitation: Lever's direct help pages returned a CSS/loading error in the browsing tool. The search index exposed the primary-source article contents and displayed publication dates; these findings rely on those indexed versions. Recheck live documentation before treating settings or release details as permanent.

## Ashby

AI-Assisted Application Review evaluates employer-defined resume criteria, which can be custom or suggested from a job posting. Results include meets, does not meet, and undecided with explanations. Reviewers can filter results and sort by **AI Job Criteria Met Percentage**; this is separate from human reviewers' average score. The feature also checks whether configured long-form questions were answered, flagging blank or unrelated answers. Its setup requires organizational enablement. Source: [AI-Assisted Application Review](https://docs.ashbyhq.com/ai-assisted-application-review), publication/update date not displayed.

Ashby also documents full-text resume searches using specific terms and Boolean operators. Source: [Candidate Search](https://docs.ashbyhq.com/candidate-search), publication/update date not displayed.

**Inference:** write statements that can establish a concrete criterion: what you built, technologies used, your ownership, scale, and result. Avoid requiring a reader to infer team leadership from the title alone. Distinguish unverified claims from demonstrable facts. Answer application questions directly and consistently with the resume.

The review documentation establishes AI evaluation, filtering, sorting, and reviewer bulk actions. It does not justify a blanket claim that every low percentage automatically triggers rejection.

## Workday HiredScore

HiredScore's candidate profile provides a standardized parsed resume, employment-gap and time-in-position calculations, job-related insights, comparisons with the job description, original-resume keyword searching, and prescreening responses. Supported attachments include DOC, DOCX, PDF, RTF, and TXT. Source: [Concept: Candidate Profiles](https://doc.workday.com/hiredscore/en-us/workday-hiredscore/recruiter-productivity-/concept--candidate-profiles.html), publication/update date not displayed.

An **opt-in** release dated 2026-08-05 introduces LLM evaluation of individual screenable qualifications against parsed resumes, with explanations and evidence pointers. Basic qualifications determine A/B versus C/D; preferred qualifications and basic-qualification scores further distinguish grades. Enablement requires a pilot and requested rollout. Customers taking no action retain existing matching; requisitions preceding the cutover keep the earlier algorithm. Source: [Workday HiredScore Spotlight Fit and Gap Enhancement with LLM](https://doc.workday.com/hiredscore/en-us/workday-hiredscore/hiredscore-release-notes/2026/august/wednesday--5th-august.html), release 2026-08-05.

Workday describes its own deployment of HiredScore to prioritize qualification fit rather than application arrival order. This is an example of actual use, not an independent estimate of adoption across employers. Source: [The Peace Treaty: Workday's Fix for the AI-Recruiter Split](https://www.workday.com/en-us/perspectives/hr/the-peace-treaty.html), publication date not displayed.

**Inference:** provide accurate dates and direct evidence for qualifications; distinguish required from preferred experience when tailoring applications. Do not generalize one HiredScore version or configuration to all Workday application portals.

## What this means for Alec's rewrite

These are editorial conclusions from the evidence above, not measured promises of improved hiring outcomes:

- Lead with an identifiable engineering profile, then support it with relevant achievements rather than a long list of possible roles.
- Keep official employment titles and dates accurate. A summary can describe a target discipline without rewriting employment history.
- Prioritize full-stack/frontend engineering, technical leadership, deployed AI tools, security operations, and analytics according to the target opening.
- Name verified technologies in both the skills inventory and relevant accomplishment context; avoid keyword repetition merely to increase density.
- Preserve the existing approximately 300-site fleet scope and the documented delivery-time improvement. Do not manufacture revenue, conversion, uptime, security, or productivity statistics.
- Separate genuine model training from using hosted models, local inference, prompt libraries, or knowledgebase applications. Add RAG, embeddings, fine-tuning, cloud platforms, databases, or evaluation methods only when confirmed.
- State client brands as clients, and describe leadership scope without inventing direct reports or formal management responsibilities.
- Prefer useful section labels and concise evidence. Keep portfolio/contact information available as text rather than requiring a QR scan.
- Export a selectable-text PDF and check contact information, dates, titles, technology names, page count, clipping, and reading order. These checks reduce observable risks but do not simulate proprietary vendor parsing or scoring.

## Claims to avoid

- **One universal ATS score:** products use different criteria, categories, grades, searches, and employer configurations.
- **No ATS supports AI ranking:** Ashby documents criteria-percentage sorting; HiredScore documents grading.
- **Every ATS rejects low keyword scores:** Greenhouse explicitly separates assistive matching from answer-based rejection rules.
- **More synonyms always improve ranking:** Greenhouse explicitly describes many terms mapping to one skill.
- **PDF always fails:** HiredScore explicitly supports PDF; extraction and structure still need checking.
- **Two columns always pass or always fail:** Greenhouse identifies a risk, not a universal outcome. Local extraction cannot certify vendor compatibility.
- **Hidden keywords or resume prompt injection are a reliable strategy:** the reviewed sources establish no such benefit. The rewrite should contain truthful, visible professional evidence.

## Evidence gaps worth resolving later

The vendors do not publish a universal successful keyword density, a resume format guaranteed to work across all parsers, or sufficient information to predict a specific employer's review outcome. Employer configuration, enabled product version, job requirements, applicant pool, and reviewer behavior remain unknown. Independent evaluation would be needed to establish accuracy or hiring-outcome effects; no vendor marketing claim should be treated as that evaluation.
