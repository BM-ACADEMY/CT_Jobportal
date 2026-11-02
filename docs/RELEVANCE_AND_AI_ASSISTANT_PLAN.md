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

Build one module, `server/utils/relevance.js`, used by the website, emails and WhatsApp alerts, so the same person sees the same order everywhere. Each audience has its own weights; a score is 0 to 100 and every result carries a "why" list (matched skills, city, etc.). Weights live in one config file so they can be tuned without code changes. Sneha owns the order and the timing of the build; every item below is in scope.

### A. Students and job seekers (jobseeker accounts and campus students)
1. **Jobs for you** (home feed, "matching jobs", search results default order): skills overlap 35, job title / preferred role 25, location and work mode 15, experience and education fit 10, freshness 10 (decays over 30 days), priority listing 5 (shown as a "Priority" label).
2. **Always exclude** blocked or hidden jobs, jobs already applied to, expired or closed jobs.
3. **"Why this job"** on every card and on the job detail page ("matches Excel, Tally, Pondicherry").
4. **Similar jobs** block on the job detail page, using the same scorer.
5. **Thin profile** (under 40% complete): fall back to location + newest and show the checklist banner, so the feed improves as the profile fills.
6. **Fresher rule:** never hide entry-level jobs from people with no experience.
7. **Job alerts** (emails, the Rs 49 alert plan, WhatsApp) switch to the same scorer; the old separate scorer in `utils/lifecycle/jobMatch.js` is removed.
8. **Campus students:** drives they are eligible for first (department, year, minimum score), then best match; "companies hiring for your department".
9. **Skill gap and next step:** show the top 3 skills missing for the jobs they view or apply to, suggest the matching free skill test, and after a low score the matching course (course mapping in `courseMap.js`).
10. **Profile tips** that raise relevance ("add Tally to get 12 more matches"), tied to the onboarding checklist.
11. **Search:** typed search ranks by text match first, then relevance; filters unchanged.

### B. Companies (employer accounts, org_employee, subadmin)
1. **Candidates for each job:** after a job is posted, "Top 5 candidates for this job" on the company dashboard and one email.
2. **Job post quality score** before publishing: missing salary range, vague title, no skills listed, no location; show tips such as "adding 5 skills improves matches". Jobs with no skills listed rank lower, and the poster is told why.
3. **Colleges to approach:** list colleges with students who match the job (needs college consent settings already in the app; show counts, not private details).
4. **Plan usage:** free-plan limits (searches per day, active jobs) shown beside the suggestions, with the upgrade path (Starter, Growth) when a limit is reached. Do not hide suggestions behind a paywall without saying so.
5. **Company dashboard:** "needs attention" list: jobs with no applicants after 7 days, jobs about to expire, shortlisted candidates not contacted.
6. **Urgent hiring** requests route to CoreTalents (existing flow), not to the scorer.

### C. Recruiters
1. **Candidate search default order:** relevance to the recruiter's most recent job, then profile completeness. Not A to Z. A typed query still ranks by text match first.
2. **Applicant list:** cheap score (skills 40, role and experience 20, location 15, qualification 10, profile completeness 10, verified skill-test certificate 5) shown first; AI match (OpenAI or OpenRouter) only re-ranks the top 20, never the whole pool. This controls cost.
3. **Saved searches with alerts:** "new candidates match your saved search" digest, once a day at most, with unsubscribe.
4. **Shortlist feedback:** shortlisting, rejecting and inviting to a test are logged and used to tune weights, never to rank by personal traits.
5. **Candidate badges:** verified skill test, profile complete, recently active. A paid candidate "priority badge" stays a badge: at most 5 points, always labelled.
6. **Duplicate and low-quality profiles** (empty, copied) are down-ranked and flagged to admin.

### D. Colleges (TPO, drive in-charge)
1. **Students to drives:** eligibility first (department, year, minimum score), then skills; "add all eligible" already exists, so show the ranked list inside it.
2. **Companies to the college:** companies hiring for the college's departments, with the match reason.
3. **Weekly "students ready for hiring" list:** passed a skill test, profile above 70%.
4. **Department skill-gap report:** which skills students are weakest in (from campus test results), with the matching course, for the principal report.
5. **Nudges to students** with incomplete profiles use the existing onboarding mails, with the match count as the reason ("7 jobs match you, finish your profile").
6. **Placement report** shows match quality (suggested, applied, shortlisted) next to the placement numbers.

### E. Admin and operations
1. **Weights config** in one file, with a version number logged against every suggestion.
2. **Quality dashboard:** suggestions shown, clicked, applied, shortlisted per audience; click rate, apply rate, shortlist rate. Review monthly and tune.
3. **Admin can see "why"** for any ranking when a user complains.
4. **Kill switch:** an environment flag turns relevance off and falls back to newest-first, so a bad release never blocks the site.

### F. Paid placement ("ads" / priority listing), the rule
- Money never beats relevance: a priority boost adds at most 5 points (jobs) or 5 points (candidates), with a clearly labelled "Priority" tag. A priority job that matches nothing does not rise to the top.
- If a "Sponsored" slot is ever added, keep it separate from the ranked list, labelled, and capped at 1 in 10.

### G. Fairness, safety and performance (needed to market "AI-powered hiring")
- Never use gender, age, religion, caste, name, photo, marital status or disability in any score.
- Keep the "why" list so any ranking can be explained to a user or a regulator. Do not describe results as a guarantee.
- No personal data in logs; event logs hold ids and scores only.
- Database indexes and a short cache for the ranked lists so the home feed stays fast at college-drive load; cheap score first, AI only on a small top set.
- Tests with fixtures: 30 job seekers against 30 jobs with expected top results; a priority job that matches nothing does not rise; a fresher still sees entry-level jobs; thin profile fallback; kill switch.

Build order is Sneha's call. A sensible order is: the scorer and tests first, then job seeker feed, alerts and emails, then company and recruiter, then college, then event logging and the admin view.

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

Build (after the answers):
- Add provider switching to `aiHelper.js`: `AI_PROVIDER` per feature, `OPENAI_API_KEY`, model name in env, so a model change needs no code change.
- Assistant endpoint with: login required, per-user rate limit and a daily cap, a monthly cost alarm, input length limit, no payment or password data ever sent, and a notice "AI can make mistakes".
- Update the Privacy Policy and Terms to name OpenAI and say what is sent (profile and resume text for the features the person uses). Check OpenAI's current API data terms before publishing the wording.
- It must only use the person's own data and public job data, never another user's data.
- First version: job seeker help. Later versions for companies (post a better job, read applicants), recruiters (search tips) and colleges (reports); the same endpoint and limits apply.
- Test cases: prompt-injection attempts in resumes and job posts, Tamil input, empty profile.
