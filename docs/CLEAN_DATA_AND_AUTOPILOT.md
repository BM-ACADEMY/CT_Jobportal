# Clean the live data, then switch the platform to autopilot

## Part 1. Remove dummy and test data (do this before marketing)
The admin dashboard on live shows 542 users, Rs 127,584.66 revenue, 23 jobs and 6 organisations. Nobody has checked how much of this is real. The revenue line is high in Aug and zero after, which suggests test payments. Payments are saved as "completed" by default, even without a Razorpay payment id, so test payments look like revenue.

Steps (Sneha, with Kamar reviewing):
1. **Take a full database backup first** and confirm it can be restored.
2. `cd server && node scripts/auditTestData.js` (read-only). It writes `test-data-audit.csv` and prints how many users, jobs, companies, colleges and payments look like test data, and how much "revenue" has no Razorpay id.
3. **Kamar opens the CSV** (the "looks_like_test" and "has_real_payment" columns help). In the last column type `yes` only for rows to remove. Keep every real student, company, college and any real payment.
4. `node scripts/removeTestData.js test-data-audit.csv` is a **dry run**; it shows what would go.
5. When the list is right: `node scripts/removeTestData.js test-data-audit.csv --apply`. It saves a copy of everything removed (`removed-<time>.json`) before deleting. It never removes admins or anything with a real Razorpay payment.
6. Reload the admin dashboard. Revenue should now equal real Razorpay money only. Check against the Razorpay dashboard.
7. Remove old demo accounts and fixed-password admin scripts (task T07 in the plan sheet).

Rule: when in doubt, keep it. Wrong deletes cannot be undone except from the backup file.

## Part 2. Autopilot: what runs by itself, and what a person still does
Everything below is already built. Each part has a switch so it goes on only when it is safe.

| Automation | Runs | Switch | Turn on when |
|---|---|---|---|
| Welcome mail after email verification | On every verification | Always on | Mail service working |
| Lifecycle mails (profile nudges, onboarding, job alerts, college and company nudges, re-engagement) | Every day 10:00 IST, one mail per person per day, daily cap | `LIFECYCLE_EMAILS_ENABLED=true`, cap `LIFECYCLE_MAX_PER_RUN` | Mail service healthy, SPF/DKIM/DMARC pass, bounce handling done. Start with a small cap and raise it |
| WhatsApp follow-up after a skill test below 60% | Every 10 minutes, 9am to 8pm IST only | `WHATSAPP_FOLLOWUP_ENABLED=true` | Meta template approved, STOP webhook live |
| Festival scholarship offer in follow-ups | Inside the dates only | `COURSE_SCHOLARSHIP_*` | Kamar confirms dates and price |
| Interview reminders | Every 15 minutes | Always on | Already on |
| Job expiry | Hourly | Always on | Already on |
| Placement reports for colleges | Daily 07:00 | Scheduled in app | Already on |
| Subscription renewal | Razorpay webhook | Webhook registered | T12 in the plan sheet |
| Question bank for skill tests | Pre-made sets | Seed script | Bank seeded and reviewed |
| Relevance, alerts, assistant | Built in the next sprints | Kill switch | After build |

Still done by a person (not automated, on purpose): college KYC approval, refund approval, support tickets and messages, urgent hiring requests (to CoreTalents), content and blog posts, and payment disputes.

Switch-on order: (1) clean the data, (2) mail service, (3) lifecycle mails at a small cap, (4) Meta template then WhatsApp follow-up, (5) raise caps after a week of clean results (low bounces and complaints), (6) watch the admin dashboard daily for the first two weeks.
