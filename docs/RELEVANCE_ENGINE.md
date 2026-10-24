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

## Not wired yet (next steps in the plan)
- The home page and dashboard use the same endpoint, so they pick up the new order automatically but do not yet show the why-line.
- Emails, job alerts and WhatsApp alerts still use `utils/lifecycle/jobMatch.js`.
- Recruiter candidate search, "Top 5 candidates", college lists and event logging.
- The public job list (`GET /api/jobs`) is unchanged: priority recruiters first, then newest.
