# Admin panel plan (super admin, support, moderators)

Status: PLAN only. Nothing here is built. Not for the developers until Kamar says so; they finish the current sheet first.

## 1. What the admin panel does today (from the code and Kamar's screenshot)
- Pages: Command Center (dashboard), Users Account, Job Inventory, Companies, College KYC, Subscriptions, Renewals, Pay-per features, Coupons, Requests, Payment History, Refunds, Messages, Tickets and Queries, Reviews, Blog, Settings.
- Dashboard shows total revenue, total users, jobs, organisations, a revenue graph and subscription mix.
- Login has OTP and an optional 2FA switch. Admin can block, edit, verify and delete users, companies and jobs, and extend subscriptions.

Problems found:
1. **Revenue is not trustworthy.** It adds every payment saved as "completed", even with no Razorpay payment id. Test payments inflate it (the August spike).
2. **Counts include test and dummy data** (users, jobs, organisations). There is no way to tell real from test.
3. **Roles exist but are not enforced.** The admin record has Root Super Admin, Moderator and Support Admin, but no route checks which one is logged in. Every admin can delete users and see payments.
4. **No audit trail of admin actions.** Deletes and edits are not logged, so nobody can say who did what.
5. **Fixed-password admin setup scripts** exist in the code (removal is task T07).
6. **No view of the automatic parts:** mail sent, bounced or blocked, WhatsApp follow-ups, cron job health, AI cost, question bank quality.
7. **Nothing for the new work:** relevance quality, skill test review, onboarding progress, plan limits.

## 2. Principles
- One source of truth for money: Razorpay payment id, status captured, reconciled with Razorpay.
- Everything real vs test is visible and filterable; test data never counts.
- Least privilege: each admin sees and does only what their role allows.
- Every sensitive action is logged and can be explained.
- Autopilot is visible: a person can see at a glance that everything runs and be told when it does not.

## 3. Plan by area

### A. Command Center (home)
- Cards: real revenue (Razorpay-verified only), new users today and this week by audience (students and job seekers, companies, recruiters, colleges), active jobs, applications, open tickets, pending KYC, pending refunds.
- Funnel per audience: signed up, email verified, profile above 70%, first application or first job posted or first drive, paid.
- "Needs attention" list: failed payments, refund requests, KYC waiting more than 2 days, tickets with no reply, mail bounce rate above limit, a cron job that did not run.
- Real versus test toggle (default real only).

### B. Students and job seekers
- List and search with filters: college, skill, profile completion, last active, verified skill test, source (QR, campus, organic).
- Profile view with applications, skill test results, onboarding progress, mails and WhatsApp sent, consent and opt-out status.
- Actions: block, reset, merge duplicates, export, send a one-off message. Delete only through the safe removal tool.

### C. Companies and recruiters
- Company list with plan, usage against limits (jobs, searches, hires), jobs, team members, payments, KYC status.
- Recruiter list with activity (searches, shortlists, hires) and complaints.
- Job moderation queue: new jobs flagged by rules (fees asked, personal numbers only, copy-pasted, spam words), approve, hide, ask for edits.
- Priority listing and paid candidate badges: who has them, when they end, revenue from them, and that the 5-point cap is respected.

### D. Colleges
- KYC queue with documents, MoU and 60-day trial tracking, plan, student count against plan limit.
- Per-college: students registered, tests taken, pass rate, drives, placements, report schedule, principal report download.
- Campus QR drives: codes, registrations, test completion, follow-up mails and WhatsApp sent.

### E. Money
- Payments: filter by real, test, failed, refunded; match to Razorpay; export for the CA.
- Refunds: request queue with the refund rules applied and a decision log; refund mails sent.
- Renewals and webhooks: status and failures; retry button.
- GST receipts and (after CA confirms) tax invoices; coupons; festival scholarship dates and price (read from settings, not environment).
- Revenue reports by plan, audience and month, with MRR and churn.

### F. Autopilot control room
- Status of every automatic job: last run, next run, result (interview reminders, job expiry, placement reports, course follow-ups, lifecycle mails).
- Mail: sent, delivered, bounced, complaints, unsubscribe rate, daily cap, and whether lifecycle mail is on or paused. A pause button for each automation (kill switch) with a log of who paused it.
- WhatsApp: template status, sent, replies, STOP counts, send window.
- Alerts to the admin by email or WhatsApp when a job fails or bounce rate rises.

### G. Quality and AI
- Skill tests: question bank by skill, sets per skill, reported questions, switch a set on or off, pass rates.
- Relevance: shown, clicked, applied, shortlisted per audience, weights version, kill switch.
- AI assistant and AI features: usage, cost per day and month, per-user limits, blocked prompts.

### H. Support and content
- Tickets and queries with assignment, status, SLA timers, canned replies in English and Tamil.
- Reviews moderation (no fake reviews; only verified users can review).
- Blog and pages (privacy, terms, refund) with version history.
- Announcements to a chosen audience.

### I. Security and roles
- Enforce roles: **Root Super Admin** (everything, manages admins), **Finance** (payments, refunds, reports), **Support** (tickets, users read and block), **Moderator** (jobs, reviews, KYC).
- 2FA required for every admin. Session timeout. Login history with IP and device.
- Admin audit log: who did what, when, before and after values, for deletes, edits, refunds, plan changes, pausing automations.
- Soft delete for users, jobs and companies (hide first, purge later) so a wrong delete can be undone.
- No fixed or shared admin accounts; the person who creates admins is a Root Super Admin only.
- Export and download of personal data is logged.

### J. Data hygiene
- A "test" flag on users, companies, jobs and payments, set by the cleanup tool and by an admin; all counts and revenue ignore test records.
- Duplicate detector (same phone or email variants) with merge.
- Scheduled report of orphan records and incomplete profiles.

## 4. Order of work (priority, not time)
1. Trust first: real revenue, test flag, cleaned data, admin audit log, enforced roles, 2FA required.
2. Autopilot control room and alerts.
3. Colleges, companies, students: lists, usage against limits, KYC and moderation queues.
4. Money: reconciliation, refunds, invoices.
5. Quality: skill test review, relevance and AI dashboards.
6. Support tools and content.

## 5. What Kamar decides
- The list of admin roles and who gets which (names).
- Who receives automatic alerts (email and WhatsApp number).
- Whether a Finance role exists separately for the CA.
- Which reports he wants every week, and where (email or WhatsApp).
