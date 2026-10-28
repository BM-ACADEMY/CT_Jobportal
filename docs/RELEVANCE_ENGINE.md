# Relevance engine (job seeker side): what is built

Status: built behind a switch, **off by default**. Nothing changes for users until `RELEVANCE_ENGINE_ENABLED=true`.

## Files
- `server/utils/relevance.js`: pure scoring and ranking. `scoreJobForSeeker`, `rankJobsForSeeker`.
- `server/utils/skillAliases.js`: "MS Excel", "Microsoft Excel (Advanced)" and "excel advanced" all become `excel`. Starter list; add the spellings your real data uses.
- `server/utils/matchingJobs.js`: loads the newest 500 open jobs, drops blocked, hidden, applied, closed and expired jobs, ranks them, returns plain job objects plus `relevance: { score, reasons, priority, thin? }`.
- `server/controllers/jobController.js` `getMatchingJobs` (`GET /api/jobs/matching`): uses the engine when the switch is on, falls back to the classic matching if the engine throws.
- `client/src/pages/Jobs.jsx`: on the "Matched for you" tab shows "Why this job: Matches Excel, Tally · In Pondicherry", and a "Best match" sort that keeps the server order.
- Tests: `tests/auth/relevance.test.js` (14), `tests/auth/matchingJobs.test.js` (5).

## Rules
| Part | Weight |
|---|---|
| Skills overlap (share of the job's required skills the person has) | 35 |
| Job title / preferred role | 25 |
| Location and work mode (work mode only counts together with the city; remote fits any city for someone who accepts remote) | 15 |
| Experience and education (freshers still match entry-level jobs) | 10 |
| Freshness (linear over 30 days) | 10 |
| Priority listing | at most +5, only if the job already scores 20 or more, shown as a "Priority" label |

- Jobs scoring under 15 are not shown as "for you".
- Thin profile (under 40% complete, no skills, no roles): nearby jobs first, newest first, flagged `thin: true` so the page can show the checklist banner.
- The score never reads name, gender, age, religion, caste, photo or marital status (a test changes all of them and checks the score does not move).
- Same ordering rule everywhere: score, then newest.

## Switch on and check
1. Set `RELEVANCE_ENGINE_ENABLED=true`, restart.
2. Log in as a job seeker with skills and a location. Open `/jobs?tab=matched`: jobs show "Why this job", best match first; "Best match" is the default sort on that tab.
3. Apply to one job, reload: it no longer appears.
4. Log in with an almost empty profile: nearby jobs, no why-lines.
5. Roll back by setting the variable to `false`.
6. Compare click and apply rates before and after (event logging arrives in a later step).

## Emails (Day 14)
With RELEVANCE_ENGINE_ENABLED=true the paid job-alert mail and the win-back mail rank with the same engine as the website (`rankForMail` in `utils/lifecycle/jobMatch.js`): same order, jobs the person already applied to are left out, a thin profile gets no job mail, and each job shows a "Why this job" line. With the switch off the original ranker is used. Mail itself still needs LIFECYCLE_EMAILS_ENABLED=true. Tests: `tests/auth/mailRelevance.test.js`.

## Recruiter candidate search (Day 15-16)
With RELEVANCE_ENGINE_ENABLED=true and NO search text, candidate search is ordered by fit to the recruiter's most recent open job (their own, or their company's), then profile completeness, then id. It was A to Z before. Typing a search keeps the existing text-relevance order. If the recruiter has no open job, only completeness decides. If ranking throws, it falls back to A to Z.

| Part | Weight |
|---|---|
| Skills overlap (share of the job's required skills) | 40 |
| Role words 12 + experience years 8 (experience alone never counts as relevance) | 20 |
| Location (same city; any city for a remote job) | 15 |
| Qualification present | 10 |
| Profile completeness, photo points removed | 10 |
| Verified passed skill-test certificate | 5 |
| Paid priority badge | at most +5, only if already 20 or more, shown as a "Priority" label |

- Name is never used, not even as a tie-break (ties go to the id). Photo is taken out of completeness (the stored completion gives 5 points for a photo).
- Each result carries relevance.reasons; the search page shows "Why this candidate: Has Excel, Tally · Lives in Pondicherry".
- The search still counts against the plan's daily limit exactly as before.
- Cost: with the switch on, one extra read of the matching users plus one certificate query per search. Fine at a few hundred job seekers; revisit if the pool reaches tens of thousands.
- Tests: tests/auth/candidateRelevance.test.js (11), tests/auth/candidateSearchRanking.test.js (5).

## Top candidates for a job (Day 16)
All behind RELEVANCE_ENGINE_ENABLED.
- **API:** GET /api/jobs/:jobId/top-candidates (recruiter, company, org employee; only the job's owner or a company user with access). Returns up to 5 job seekers scoring 25 or more, with why-lines. Public fields only: name, avatar, headline, role, city, up to 5 skills, priority flag, relevance. No email, phone or block list. Candidates who blocked the company or the recruiter are never suggested. Answers are cached for 5 minutes per job (the jobs page asks once per active job).
- **Jobs page:** each active job card in My Jobs shows an expandable "N top candidates for this job" panel; it stays hidden while the engine is off or nobody fits.
- **Email:** lifecycle rule topCandidatesMail. One mail per job (key co_top_candidates-<jobId>), sent 1 hour to 3 days after posting, to whoever posted it, only if at least one candidate fits. Names, headline and why-lines only, with a link to candidate search. It goes through the same engine as every lifecycle mail: needs LIFECYCLE_EMAILS_ENABLED=true, counts toward LIFECYCLE_MAX_PER_RUN, one mail per person per day, opt-out and bounce rules apply. The ranking is skipped when that job was already mailed.
- **Tests:** tests/auth/topCandidates.test.js (6), tests/auth/topCandidatesEndpoint.test.js (3).
- **Cost:** each uncached request or mail reads all job seekers once; fine for a few hundred, revisit at tens of thousands.

## Event logging (Day 17)
Behind RELEVANCE_ENGINE_ENABLED: while it is off nothing is stored.
- **Collection** RecommendationEvent: user, side (seeker or recruiter), event (shown, clicked, applied, shortlisted), surface (jobs_matched, home_feed, email, top_candidates, candidate_search), job, candidate (recruiter side), score, day. Ids and numbers only: no names, contact data or profile text. Rows delete themselves after 180 days. A repeat view counts once per person, item and day (India date).
- **Browser to server:** POST /api/recommendations/events (login required, 300 per 15 minutes). Only shown and clicked are accepted from the browser, max 50 per request; ids are validated and the score is clamped to 0-100. Used today by the Matched-for-you tab (shown when the list loads, clicked on a job card) and the Top candidates panel (shown when opened, clicked on Open candidate search).
- **Server-side outcomes:** applied (when an application is created) and shortlisted (when a recruiter sets that status) are recorded by the server, and only if the person was shown or opened that job in the last 30 days, either as a job for them or as a candidate suggested to a recruiter. The browser cannot report outcomes.
- **Admin summary:** GET /api/admin/recommendations/summary?days=30 (admin only, 1 to 180 days) returns, per side and surface: shown, clicked, applied, shortlisted, click rate, apply rate (applied / shown) and shortlist rate (shortlisted / applied), in percent. Review it monthly and tune the weights in utils/relevance.js.
- **Privacy Policy** (section 3) has a new line describing this record and the no-gender/age/religion/caste/photo rule. Effective date was not changed; have the lawyer confirm the wording and the date.
- **Limits to know:** shown means delivered in the list, not scrolled into view; the home page feed and email clicks are not tracked yet (the surfaces exist in the schema); the recruiter side measures the top-candidates panel only, not the search list.
- **Tests:** tests/auth/recommendationEvents.test.js (9), tests/auth/recommendationEndpoint.test.js (4).

## Not wired yet (next steps in the plan)
- The home page and dashboard use the same endpoint, so they pick up the new order automatically but do not yet show the why-line.
- WhatsApp job alerts (none exist today).
- AI re-rank of the top 20 and college lists. Home-page feed and email click tracking.
- The public job list (`GET /api/jobs`) is unchanged: priority recruiters first, then newest.
