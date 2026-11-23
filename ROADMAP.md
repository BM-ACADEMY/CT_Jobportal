# Velaivaaipu roadmap

Last updated: Mon 23 Nov 2026. This is the master plan. Kamar sets the order; Sneha builds, merges and deploys; Claude plans, builds and checks. Details for Version 2 are in `docs/VERSION_2_ROADMAP.md`. Tick a box when it is done.

## Now (this week)

### Sneha
- [x] Merge and deploy PRs #60 to #64 (government watcher list, mobile header, roadmap, Admin > Applications, Post Job timeout). Merged 19 Nov.
- [x] Fix the Post Job form reloading on auth refresh (pushed 19 Nov).
- [x] Merge the roadmap PRs (#65 and this file). Merged 23 Nov.
- [ ] Deploy the latest main on the server (pull, build the client, restart with pm2).
- [ ] Hostinger backup mail settings (`BACKUP_*`) and send a test code. Blocked: Hostinger refused the mailbox password (535).
- [ ] Brevo: the queue, the 38 held resends, credits and daily limit. Blocked: needs the Brevo login holder.
- [ ] Test delete with a limited admin login (problem found 22 Nov: a limited test admin could delete a job on the live site; check the server); open Admins, Government jobs, Job fairs, Send a Job Fair and Applications.
- [x] Send a screenshot of Admin > Government jobs; report any "Last check failed". 13 of 21 OK, 8 failed (21 Nov).
- [x] Explain why Core Talents and The Balified Villa do not show on the Companies page. They were unverified; verified now.
- [ ] Close the old branches: `remove-fake-job-counts` and `installable-site` done; `launch-fixes` branch still on GitHub; `charles` waits for Kamar.

### Kamar
- [ ] Send BD the health and other pages brief; give their list to Claude to check and add to `server/config/govtSources.js`.
- [ ] Send Lokeshwari's invite only after the limited-admin test passes.
- [ ] Add 2 or 3 real job fairs, or ask Claude to hide the menu item.
- [ ] Lawyer review of Terms and Privacy.
- [ ] Prices: Sponsored add-ons, Campus Lite, fair stall. Invoice details in Admin > Settings.
- [ ] Tamil text check, link the office computer, Razorpay first-week payment numbers, WhatsApp inbox test.
- [ ] Meta approval of the WhatsApp alert template; SPF, DKIM and DMARC for email (steps in `docs/EMAIL_AND_APP_PLAN.md`).
- [ ] Ask Babila to post a job on the Core Talent account and confirm the form works.

### Claude
- [ ] Check the live site after the deploy: mobile header, Admin > Applications, Companies page, government watcher pages.
- [ ] Keep this file and the plan docs up to date as things change.

## Version 2 (built and merged)
- [x] Reliable codes: backup sender, code counter. (No Brevo credits check found in the code, 23 Nov.)
- [x] Admin autopilot check (`docs/AUTOPILOT_CHECK.md`).
- [x] Installable website.
- [x] Jobs page filters by place; no-degree, part-time and contract jobs.
- [x] Government jobs watcher with 21 official pages, scanned daily at 08:00 India time.
- [x] Limited admin access, Sales staff role, job fairs sent in by companies, flagged internships hidden.
- [x] WhatsApp job alerts built, switched off until Meta approves the template.
- [x] Home page now says Find Your Dream Job Across India.
- [x] Admin > Applications page.

## Next: Version 2.1 Grow
- [ ] Job seeker welcome email series.
- [ ] Home page latest and sponsored jobs, and logo strips.
- [ ] Matching engine on, with match reasons on job cards (test on 10 real profiles first).
- [ ] Quick apply, WhatsApp share and alerts.
- [ ] College first-week tools.
- [ ] Blog admin (needs real photos first).

## Later: Version 2.2 Drives and 2.3
- [ ] Walk-in drives for companies, hospitals and shops; drive tracking for colleges; five free pilot drives.
- [ ] Tamil and English language switch.
- [ ] Category pages and tests, NAAC export, referrals, phone OTP if needed, response time on company profiles, banner slots.
- [ ] Spike alerts to Kamar; Monday advisor note emailed.

## Version 3
- [ ] Play Store app (a wrapper of the installable website), then a native app only if the numbers justify it.

## Rules that stay
Never push to main without review. Do not enter or print passwords, keys or tokens. Do not touch `.env` values. Do not change plan prices, GST (18%) or the Razorpay setup. Do not loosen any admin check without a test.
