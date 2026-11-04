# Team permissions, enforced on the server (branch `team-permissions`)

## What was wrong

A company admin invites a recruiter and ticks the pages that person may use (Post Job, My Jobs, Candidate
Search, Messages, Applicants / ATS, Analytics, Bulk Messaging, Bulk Applicant Management, Video Interview /
Scheduling, AI Candidate Matching). Until now only the browser enforced that list: the menu hid the pages
and `PrivateRoute` bounced the person to the dashboard. The API behind those pages checked only the role
(`recruiter`), so a team member could still post or delete the company's jobs, read every applicant, export
the applicant list, run bulk messages or AI matching by calling the API directly or from another page.

Also, the team roster (`GET /api/company/team`) did not return `teamPermissions`, so the "Manage permissions"
dialog opened with nothing ticked even when permissions had been granted.

## What changed

- `server/config/teamPermissions.js` is the one list of keys and labels (model enum, invite validation and the
  route gate all read it; a test checks `client/src/config/teamPermissions.js` matches).
- `server/middlewares/teamPermission.js`: `requireTeamPermission('a', 'b')` passes when the signed-in person
  holds any of the keys. **Only a `recruiter` who is team-managed is gated**, exactly like the client: company
  owners, solo recruiters, org employees, colleges and admins pass through with no lookup, so nothing changes for
  them. A blocked call gets `403 { msg: "Your company admin has not given you access to <page>...", permission }`.
- Gates on the company APIs (any-of lists mirror what each client page calls):

| API | Needs |
|---|---|
| `POST /jobs`, `POST /jobs/:id/clone` | post_job |
| `POST /jobs/quality-check` | post_job or my_jobs |
| `PUT /jobs/:id`, `DELETE /jobs/:id` | my_jobs |
| `PATCH /jobs/:id/mark-viewed` | my_jobs or ats_pipeline |
| `GET /jobs/company-jobs`, `/company-jobs-stats`, `/quota` | any job-area permission (every such page lists the jobs first) |
| `GET /jobs/analytics` | analytics |
| `GET /jobs/candidates/search` | candidate_search |
| `GET /jobs/candidates/:id/profile`, `GET /jobs/:jobId/top-candidates` | candidate_search or ats_pipeline |
| `GET /jobs/:jobId/matched-candidates` | ai_candidate_matching |
| `POST /jobs/:jobId/bulk-ai-match` | ai_candidate_matching or ats_pipeline |
| `POST /jobs/import-pipeline` | ats_pipeline |
| `GET /applications/job/:jobId` | ats_pipeline, bulk_messaging, bulk_applicant_management or interview_scheduling |
| `PUT /applications/:id/status` | ats_pipeline or bulk_applicant_management |
| `GET /applications/export/:jobId`, `POST .../track-download`, `POST /applications/invite-assessment` | ats_pipeline |
| `POST /applications/:id/calculate-match` | ats_pipeline or ai_candidate_matching |
| `/messages/*` (chat) | messages |
| `POST /messages/bulk` | bulk_messaging |
| `/interviews/*` | interview_scheduling |

- Team management itself (`/api/company/team/*`) was already owner-only (`company` role), so a team member
  cannot grant themselves permissions.
- `GET /api/company/team` now returns `isTeamManaged` and `teamPermissions` for each member.

## Not changed (on purpose)

- **Org employees** (`org_employee`) have no permission picker, by design ("just marked as working here"), and
  the client gives them their fixed menu. The server gate leaves them alone too. If employees should be limited,
  that is a product decision: give them the same picker and the gate will apply as is.
- Job-seeker and public routes are untouched; the gate ignores every role except `recruiter`.

## Tests

`server/tests/auth/teamPermissions.test.js`: who is gated, any-of keys, the 403 message, one lookup per request,
and a walk of each router's stack that asserts the exact keys on every route above (and no gate on public or
job-seeker routes). Full server run: 293 pass.

## Manual check (before merging)

1. As a company owner, invite a recruiter with only "My Jobs" ticked; accept the invite in another browser.
2. As that recruiter, the menu shows My Jobs only. In the browser console run
   `fetch('/api/jobs', {method:'POST', headers:{Authorization:'Bearer '+localStorage.token,'Content-Type':'application/json'}, body:'{}'}).then(r=>r.json()).then(console.log)`
   and expect the 403 message. `GET /api/jobs/company-jobs` still works (My Jobs needs it).
3. Owner ticks "Applicants / ATS Pipeline" in Manage permissions (the dialog now shows the current ticks);
   the recruiter can open Applicants and change a status without signing out.
