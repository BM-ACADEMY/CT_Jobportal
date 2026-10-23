# Job and candidate relevance plan, and the AI assistant (OpenAI)

Status: PLAN. Nothing in this file is built yet. Written from what the code does today.

## 1. What the code does today (so the plan starts from facts)

| Place | Today | Problem |
|---|---|---|
| Public job list (`jobController`, line ~385) | Priority-listing recruiters first, then newest | No relevance at all |
| "Matching jobs" for a job seeker (`jobController`, line ~490) | Filters by one skill or title keyword, then newest, max 20 | A one-word match ranks the same as a ten-skill match. Location and work mode were removed from matching |
| Job emails (`utils/lifecycle/jobMatch.js`) | Scored: skills x3, title words x2, city +2, remote +2 | Good start, but it is a separate scorer from the website's |
| Recruiter candidate search | Relevance order only when a free-text query is typed; otherwise A to Z by name | Recruiters see arbitrary order |
| Applicant ranking | AI match score (`bulkAiMatch`) per request | Cost grows with every applicant |
| College | No suggestions | Nothing connects drives, companies and students |
| AI assistant | Not in the code | Needs a decision (section 4) |

## 2. One relevance engine for everyone

Build one module, `server/utils/relevance.js`, used by the website, emails and WhatsApp alerts, so the same person sees the same order everywhere. Each audience has its own weights; a score is 0 to 100 and every result carries a "why" list (matched skills, city, etc.).

**A. Job seeker: jobs for you** (home feed, "matching jobs", job alerts, emails)
- Skills overlap 35, job title / preferred role 25, location and work mode 15, experience and education fit 10, freshness 10 (decays over 30 days), priority listing 5 (shown as a "Priority" label).
- Always exclude: blocked or hidden jobs, jobs already applied to, expired or closed jobs.
- Show "Why this job: matches Excel, Tally, Pondicherry".
- Thin profile (under 40% complete): fall back to location + newest, and show the checklist banner so the feed improves as the profile fills.
- Fresher rule: do not hide entry-level jobs from people with no experience.

**B. Recruiter / company: candidates for your job** (candidate search, post-job suggestions, applicant list)
- Skills overlap 40, role and experience 20, location 15, qualification 10, profile completeness 10, verified skill-test certificate 5.
- Paid candidate "priority badge" stays a badge. It may add at most 5 points and is always labelled.
- Use AI match (OpenAI or OpenRouter) only to re-rank the top 20 after the cheap score, never on the whole pool. This controls cost.
- After a job is posted, show "Top 5 candidates for this job" and send one email.
- Default sort when no search text: relevance to the recruiter's most recent job, then profile completeness. Not A to Z.

**C. College / TPO**
- Students to drives: eligibility first (department, year, minimum score), then skills.
- Companies to the college: companies hiring for the college's departments.
- Weekly "students ready for hiring" list (passed a skill test, profile above 70%).

**D. Paid placement ("ads" / priority listing), the rule**
- Money never beats relevance: a priority boost adds at most 5 points (jobs) or 5 points (candidates), and a clearly labelled "Priority" tag is shown. A priority job that matches nothing does not rise to the top.
- If a "Sponsored" slot is ever added, keep it separate from the ranked list, labelled, and capped at 1 in 10.

**E. Fairness and safety (needed to market "AI-powered hiring")**
- Never use gender, age, religion, caste, name, photo or marital status in any score.
- Keep the "why" list so any ranking can be explained to a user or a regulator. Do not describe results as a guarantee.
- Log suggestion shown, clicked, applied, shortlisted, so quality can be measured: click rate, apply rate, shortlist rate. Review monthly and tune weights.

**Build order (about 4 to 5 days):** 1) `relevance.js` + tests with fixtures; 2) job seeker feed and matching jobs; 3) emails and alerts switch to it; 4) recruiter candidate search + top 5 for a job; 5) college lists; 6) event logging.

## 3. Cross-check: nothing missed

| Area | Status |
|---|---|
| Refund rules, legal pages, receipts with GST, refund emails | Built (CA to confirm tax invoice) |
| Campus QR: consent, server-side scored test, question bank, certificate | Built; seed bank needs OpenRouter credit |
| WhatsApp follow-up | Built, off; waiting on Meta template approval |
| Lifecycle mails and onboarding mails | Built, off; waiting on mail service |
| Onboarding tour, checklist, banners, all portals | Built |
| Fake testimonials, 3x claim, +543 placed counter | Removed |
| Relevance engine (this plan) | Not built |
| AI assistant | Not built, needs decisions in section 4 |
| Request refund button | Not built |
| Free assessment page still exposes answers | Not fixed |
| Mail bounce handling, TLS certificate check | Not built |
| CSV-imported students get weak default passwords | Not fixed |
| `/uploads` documents are public | Not fixed |
| Free-plan limits (2 jobs, 10 searches, 3 free hires) | Location in code unknown, dev to confirm |
| Payment tests and client build | Dev reports pass |
| LinkedIn app, GA4, Pixel, Search Console | Waiting on accounts |

## 4. AI assistant with OpenAI

Facts: the code has no assistant today. Every AI feature (skill tests, resume review and builder, applicant matching) goes through `server/utils/aiHelper.js`, which only talks to OpenRouter (`OPENROUTER_API_KEY`). The Terms and Privacy pages say AI providers are used through OpenRouter.

Decisions needed from Kamar (defaults in brackets):
1. OpenAI for the assistant only, or replace OpenRouter everywhere? [assistant only; keep the rest as is]
2. First job of the assistant? [job seeker help: find jobs, improve profile, answer "how do I..." questions; company and college helpers later]
3. Languages? [English and Tamil]

Build (about 3 days after the answers):
- Add provider switching to `aiHelper.js`: `AI_PROVIDER` per feature, `OPENAI_API_KEY`, model name in env, so a model change needs no code change.
- Assistant endpoint with: login required, per-user rate limit and a daily cap, a monthly cost alarm, input length limit, no payment or password data ever sent, and a notice "AI can make mistakes".
- Update the Privacy Policy and Terms to name OpenAI and say what is sent (profile and resume text for the features the person uses). Check OpenAI's current API data terms before publishing the wording.
- It must only use the person's own data and public job data, never another user's data.
- Test cases: prompt-injection attempts in resumes and job posts, Tamil input, empty profile.
