# AI candidate sourcing and matching: 2026 research

Research/access date: **2026-10-26**. Sources below are official product documentation, engineering explanations, and vendor announcements. They document vendor-described capabilities; they do not independently establish accuracy, fairness, market share, or an individual employer's configuration.

## What recruiters can search and rank

### LinkedIn Recruiter and Hiring Assistant

LinkedIn's June 11, 2026 engineering explanation describes parallel semantic, Boolean, faceted, personalized, and lookalike retrieval. Natural-language recruiter requests become structured role details and qualifications; semantic retrieval compares those with profile embeddings. A second-stage ranker blends the results, and an LLM guard evaluates qualification fit and supplies explanations. Profile embeddings use profile/resume text and structured attributes. Ranking incorporates qualification relevance and engagement signals. This describes sourcing and ranking, rather than a universal application-rejection algorithm. [LinkedIn engineering: Semantic Search for AI Agents at Scale](https://www.linkedin.com/blog/engineering/ai/semantic-search-for-ai-agents-at-scale-retrieval-and-ranking-for-linkedins-hiring-assistant)

Recruiter search accepts titles, location, experience, skills, companies, and industries. Advanced AI-Assisted Search can accept a job description and show candidate-fit summaries; availability varies by license and language. [LinkedIn Recruiter Help: AI-Assisted Search](https://www.linkedin.com/help/recruiter/answer/a6509735)

Skill signals include explicitly listed skills, skill language elsewhere in the profile, shared-resume skills, and inferred skills supported by experience. Skill search can recognize variants such as SaaS and “Software as a service.” Location also affects Skills Match. [LinkedIn Recruiter Help: Skills filter](https://www.linkedin.com/help/recruiter/answer/a593647)

**Upcoming versus shipped:** Hiring Assistant 2 was announced September 29, 2026, but updates begin in **November 2026**, after this research date. Announced signals include verification, ATS insights, prescreening responses, and relevant experience. LinkedIn reports that over 20,000 companies use its agentic hiring solutions, naming AMD, Cisco, Ochsner Health, Palo Alto Networks, and Zillow; this is vendor-reported adoption, not evidence about any particular job application. [LinkedIn: Hiring Assistant 2 announcement](https://news.linkedin.com/2026/hiring-assistant-2)

**Resume recommendation — inference:** Use clear, conventional role and technology names alongside concrete evidence of qualifications. Keep LinkedIn and the resume consistent. Semantic retrieval makes meaningful descriptions useful, while simultaneous Boolean and structured search preserves the value of accurate explicit terms.

### Eightfold Match Score

Eightfold's August 13, 2025 engineering article describes resume/job embeddings combined with structured signals: overall and recent skill overlap, title progression and seniority, company/industry similarity, and reference profiles supplied by hiring teams. Career-sequence models inform next-title/company similarity. A learned outcome model combines these signals into displayed 0–5 match ratings. These are the vendor's architectural statements; claims of superior fairness or accuracy require independent evaluation. [Eightfold engineering: AI-powered talent matching](https://eightfold.ai/engineering-blog/ai-powered-talent-matching-the-tech-behind-smarter-and-fairer-hiring/)

**Resume recommendation — inference:** Tie important skills to dated, recent roles and show progression, ownership, and domain context. Do not imply prestigious clients were employers: company history is itself a matching signal, and truthful distinctions matter. A keyword list cannot control reference-profile comparisons or employer-specific ranking behavior.

### SeekOut Smart Match and technical sourcing

Smart Match accepts titles, required/preferred skills, and filters, with job-description or candidate-profile input. Missing some required skills produces Partial Match; preferred skills affect result ordering. Recruiters can switch to Boolean search. Required skills normally use implied AND semantics. Company, education, experience, and location filters remain available. [SeekOut Help: Smart Match](https://support.seekout.com/en/articles/11877811-smart-match)

Licensed GitHub sourcing supports language expertise, development topics, contribution repositories, repository counts, stars, and additional profile signals. Field-based search includes skills, titles, descriptions, repositories, topics, and websites. These features depend on the recruiter's subscription. [SeekOut Help: filter overview](https://support.seekout.com/en/articles/11878164-an-overview-of-seekout-s-filters), [SeekOut Help: GitHub field-based search](https://support.seekout.com/en/articles/11878148-github-talent-pool-boolean-field-based-search)

**Resume recommendation — inference:** List genuine core technologies clearly and support them with work examples. Public projects with readable descriptions and accurate technology details can provide additional sourcing evidence. Link relevant work, but do not assume proprietary experience is inferior merely because it lacks public GitHub activity.

### hireEZ: distinguish sourcing from inbound applicant review

hireEZ's sourcing product describes open-web and ATS search using a job description and candidate persona, followed by fit review and explanations. The public page does not disclose model architecture or ranking weights. Productivity and quality claims are vendor marketing assertions. [hireEZ: AI Sourcing](https://hireez.com/ai-sourcing/)

For **inbound Applicant Review**, the FAQ says the system uses information voluntarily submitted by the applicant, typically a resume and application form; it explicitly says it does not supplement that application with open-web profiles. NLP generates an Ideal Persona that recruiters can adjust. Match categories include Best, Good, Partial, and Not a Match; humans can advance or reject candidates regardless. ResumeSense flags inconsistencies for investigation. [hireEZ: Applicant Review and FAQ](https://hireez.com/applicant-review/)

**Resume recommendation — inference:** Put essential qualifying evidence in the submitted document and application rather than assuming a tool will visit portfolio links. Maintain consistent titles, dates, technology claims, and application answers. Do not conflate this inbound review behavior with hireEZ's external sourcing product.

## Application to Alec's rewrite

These are editorial recommendations inferred from the documented mechanics above, not promises of improved rankings:

- Prioritize a coherent role family: hands-on technical leadership and full-stack development, supported by applied AI, security, and marketing-platform experience. Adjust emphasis once target roles are confirmed.
- Pair important terms with technology, action, scope, and result. For example, describing a Next.js knowledgebase connected to agents through a Model Context Protocol (MCP) server communicates more evidence than claiming general AI expertise.
- Preserve supported scope, including approximately 300 client websites and the documented reduction in templated website delivery time. Confirm any new metrics before publication.
- Identify which recent roles actually used TypeScript, React, Next.js, Python, SQL, MCP, local models, and orchestration libraries. Do not imply every listed technology was used in every role.
- Distinguish applied AI development from model training/research. Confirm whether “custom AI training” means prompting, retrieval, fine-tuning, dataset creation, or training model weights.
- Add terms such as retrieval-augmented generation, vector databases, evaluation pipelines, Kubernetes, AWS, or regulatory compliance only when the candidate can substantiate them.
- Expand selected abbreviations naturally where useful; avoid repetitive keyword inventories.
- Keep agency clients clearly labeled as clients and preserve official employment titles while explaining genuine functional responsibilities.
- Treat LinkedIn/profile updates as separate future work unless authorized; this resume task does not authorize modifying external accounts.

## Limits and unsupported tactics

The cited documentation does not establish a universal ATS passing score, a required keyword density, or a reliable benefit from hidden text, keyword stuffing, or prompt injection. Different products perform retrieval, ranking, application review, and workflow filtering in different ways. Actual employer requirements, configuration, and human review remain consequential. A locally readable PDF does not establish correct parsing in every recruiting product.

## High-value follow-up evidence

1. Target titles, employer types, and preference for hands-on leadership versus people management.
2. AI project users, deployment status, models/integrations, security controls, evaluation methods, and measured results.
3. Direct and indirect team size, mentoring scope, hiring/review authority, and project ownership.
4. Verifiable delivery-time, developer-hours, uptime, recovery-time, maintenance, or campaign-measurement improvements.
5. Public repositories, products, awards, and sanitized case studies that establish individual contribution.
6. Recent professional strengths versus occasional, historical, or personal exposure to listed skills.
7. Confirmation of latest employment end date and consistency across applications, LinkedIn, and references.
