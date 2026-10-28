# Lifecycle mails: go-live and pause checklist (start at 20 a day)

Reviewed: `server/cron/lifecycleMails.js`, `server/models/EmailLog.js`, `server/utils/lifecycleEmails.js`, `server/routes/publicRoutes.js`.

## Safeguards already in the code
- **Off by default.** Nothing runs unless `LIFECYCLE_EMAILS_ENABLED=true` AND `FRONTEND_URL` AND `API_PUBLIC_URL` are set.
- **Daily cap.** The job runs once a day at 10:00 India time. It stops after `LIFECYCLE_MAX_PER_RUN` mails, so 20 means at most 20 a day.
- **One mail per person per day.** A person who got any lifecycle mail in the last 20 hours is skipped.
- **Once only.** `EmailLog` has a unique (user, key) index, so each mail key is claimed before sending; two runs cannot send the same mail. If sending fails the claim is removed so it is retried.
- **Never mailed:** unverified users, admin-blocked users, anyone with `emailPrefs.marketingOptOut`, and placeholder `...@college.portal` addresses.
- **Unsubscribe.** Every mail has a signed one-click link and `List-Unsubscribe` headers (`/api/public/unsubscribe`). Receipts and security mail still arrive.
- **Pacing.** 300 ms between sends.

## Things to know before switching on
1. **The welcome email is NOT behind this switch.** `sendWelcomeEmail` is called directly at sign-up (`authController.js` lines 253 and 741), so it goes out as soon as the code is deployed. Finish the mail switch first.
2. **The welcome email, OTP and receipts do not count toward the 20-a-day cap**, and they share the mail service's daily limit (Brevo free is about 300 a day). Watch the total in Brevo, not just the cap.
3. **Backlog on day one.** On the first run every existing user who fits a rule is eligible. The cap spreads them out, but a user created 8 days ago can get the "day 2" nudge today and the "day 7" nudge tomorrow.
4. **Rule order decides who gets the 20.** Rules run in this order and stop at the cap: profile nudges, skill-test invite, skill-gap, job alerts/win-back, company nudges, employer tips, college onboarding, college batch report. With a cap of 20, the later groups (colleges, employers) get nothing until the cap rises or earlier rules run dry.
5. **No bounce or complaint handling yet** (Day 7 to 8 task). Until it is built, check Brevo's bounce list daily and set `emailPrefs.marketingOptOut` by hand for hard bounces.
6. **Skill-gap mail needs `COURSE_PAGE_URL`.** Without it that rule is skipped.
7. **Run on one server only.** If the server is scaled to several instances each runs the cron; the unique key stops duplicate keys but the daily cap is per instance.

## Go-live steps
1. Confirm the mail switch is done and the DNS check passes (`docs/MAIL_SWITCH_AND_ROLLBACK.md`).
2. Set on the server: `LIFECYCLE_EMAILS_ENABLED=true`, `LIFECYCLE_MAX_PER_RUN=20`, `API_PUBLIC_URL`, `FRONTEND_URL`, `FOOTER_PHONE` (once decided), `MAIL_FROM`/`MAIL_REPLY_TO`. Restart.
3. Before 10:00 India time, send yourself one of each mail type if you can (or wait for the first run) and check: renders on mobile, the unsubscribe link works, the footer shows the right company details.
4. After the first 10:00 run: server log shows `[Cron] Lifecycle mails sent: N` with N at most 20; check Brevo delivered, bounced and spam counts.

## Ramp and pause rule
| Week | `LIFECYCLE_MAX_PER_RUN` |
|---|---|
| 1 | 20 |
| 2 | 50 |
| 3 | 100 |
| 4 | 150 |

Move to the next step only if the week was clean. **Pause immediately** (`LIFECYCLE_EMAILS_ENABLED=false`) if spam complaints exceed 0.1% or hard bounces exceed 2% of sent mail. Read DMARC reports and Google Postmaster Tools weekly for the first month; move DMARC from `p=none` to `p=quarantine` after 2 clean weeks.
