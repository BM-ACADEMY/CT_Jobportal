# Launch week status (go-live Thursday 5 Nov 2026) — written Wed 4 Nov

## Done in the code (working copy, not yet committed or deployed)
| # | Item | Result |
|---|---|---|
| 1 | seo-job-urls patch applied | client tests 7/7 pass |
| 1b | seo-own-server patch applied (server /seo routes, nginx doc) | server tests 13/13 pass |
| 2 | clean-data-autopilot patch applied (auditTestData.js, removeTestData.js) | scripts present, NOT run (needs live DB) |
| 3 | account-deletion-v2 and menu-names-update applied | tests pass; client `vite build` OK |
| - | Full server suite | 275 / 275 pass |
| 6 | Baseline `liveSmokeTest.js` on live (old code) | 18 pass, 2 warn, 1 fail (see below) |

Not applied on purpose (week 2): assistant-openrouter.

Baseline smoke test on live today (before this release): FAIL "Job quality check needs a login" (404, route not deployed yet — expected to clear after deploy); WARN Google Analytics ID missing in the build (set VITE_GA_MEASUREMENT_ID and rebuild); WARN skill dropdown 16 of 17 (run generateQuestionBank.js).

## Blocked — needs server access or a decision
| # | Item | Needs |
|---|---|---|
| 1 | Deploy, `curl -sI .../job/<telecaller link> \| grep -i x-velaivaaipu-seo` = `job`, Rich Results Test | Server/Vercel access, the telecaller job link. API_BASE_URL in Vercel (only matters if Vercel is used; site is on Hostinger) |
| 1b | SEO on own server | Answers to: (a) site folder and nginx config path, (b) Node port, (c) frontend built on server or uploaded; then set CLIENT_INDEX_PATH, SITE_URL, API_PUBLIC_URL, add 2 nginx blocks, `nginx -t`, reload, submit sitemap in Search Console |
| 2 | DB backup, audit + cleanup, private Root Super Admin, remove old admins | DB access. Backup first. Kamar must mark rows "yes" in the audit CSV. "Root Super Admin" is not defined in the repo: need the email/name and rules |
| 3 | Deploy account-deletion-v2 and menu-names-update | Same deploy as above |
| 4 | Switch mail to Brevo | Server access. Steps in docs/MAIL_SWITCH_AND_ROLLBACK.md |
| 5 | The 19 database tests (payments, webhooks, mail, top candidates) | Not found as a list of 19; the repo has 275 automated tests that pass. Need the manager's list or the sheet |
| 6 | Final smoke test on live after deploy | After deploy |
| 7 | RELEVANCE_ENGINE_ENABLED=true | Only after #6 passes |

## Mail switch (Brevo) — values for the server (key is NOT stored in the repo)
New: EMAIL_HOST=smtp-relay.brevo.com, EMAIL_PORT=587, USER_EMAIL=c14cb0001@smtp-brevo.com, USER_PASS=<Brevo SMTP key>,
MAIL_FROM="Velaivaaipu" <hello@velaivaaipu.in>, MAIL_REPLY_TO=hello@velaivaaipu.in.
Rollback values (from server/.env.production): EMAIL_HOST=smtp.hostinger.com, MAIL_FROM="Velaivaaipu" <admin@bmtechx.in>; the old USER_EMAIL / USER_PASS / EMAIL_PORT must be copied from the live server before the change.
Keep LIFECYCLE_EMAILS_ENABLED and WHATSAPP_FOLLOWUP_ENABLED off. Do not turn on "Activate for SMTP keys" in Brevo yet.
Reminders: Brevo SMTP key expires 3 Nov 2027 (remind 3 Oct 2027) and after 90 days of no use. Free limit about 300 mails a day, shared by all mail.
Outgoing IP: api.velaivaaipu.in resolves to 82.25.85.114, but the outgoing IP must be confirmed on the server with `curl -s ifconfig.me`.

## Week 2 (stay OFF)
LIFECYCLE_EMAILS_ENABLED, WHATSAPP_FOLLOWUP_ENABLED, assistant, PROTECT_DOCUMENT_UPLOADS.
