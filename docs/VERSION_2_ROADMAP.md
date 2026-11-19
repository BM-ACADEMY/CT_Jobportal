# Velaivaaipu Version 2 roadmap

Last updated: Mon 16 Nov 2026 (night). Kamar sets the order. Sneha takes the items in this order and reports when each is done. No dates.

## Order of work

1. **Reliable codes.** Backup sender (branch `mail-fallback`), code counter (branch `otp-stats`), Brevo credits watch.
   Status: built, waiting for merge and for the BACKUP_* server settings.
   Also built, waiting for merge: second admin by email invite (`admin-invites`), then Limited access for new admins (`admin-restrict`, merge after `admin-invites`).
2. **Admin autopilot check.** Test the needs-action inbox, auto-assign, notifications and feedback with real activity and fix the gaps.
   Status: features and unit tests exist. A tick-list for testing with real data is in `docs/AUTOPILOT_CHECK.md` (branch `v2-complete`); Sneha runs it.
3. **Installable website** (Add to Home Screen). Branch `installable-site`.
   Status: the installable base (manifest, icons, service worker) is already in main. The branch `installable-site` only adds the camera QR scan for drive check-in and two shortcuts; it waits for merge.
4. **Jobs page filters** by place, plus non-graduate, contract and part-time jobs.
   Status: done. Place chips and no-degree, part-time and contract filters are live on the Jobs page.
5. **Government jobs section on autopilot.** The site watches official announcements, Kamar approves, admin posts.
   Status: built (branch `v2-complete`). Admin > Government jobs: add official recruitment pages; the site checks them every morning at 8:00 India time; new notices wait for Kamar; "Post as job" opens the web-jobs form prefilled. The 21 official pages chosen with the BD team (18 Nov) are built into `server/config/govtSources.js`; any page in that file not yet watched is added when the server starts (to add more, add a line there). A new page's first scan only sets the baseline. Madras High Court is left out until someone confirms the page.

## Built on branches, waiting for Sneha to merge

Merge order: `mail-fallback`, `otp-stats`, `qc-fixes`, `brand-leads-help`, `admin-invites`, then `admin-restrict`. `whatsapp-link` last, after the WhatsApp inbox test.

- `qc-fixes`: home job count matches the public list, same-day jobs show Pondicherry and Tamil Nadu first, job titles and cities tidied when saved, footer line corrected, Plans page grammar.
- `brand-leads-help`: help requests readable in Admin > Requests (no recruiter Assign), Brand leads with priority, WhatsApp, follow-up dates.
- `admin-restrict`: new admins are Limited. They cannot delete, change money, plans or users, export data, change security or add admins. After deploying, test one blocked action with the new admin's login.

## From the live-site review (16 Nov)

- Companies page shows only BM Academy. Check why Core Talents and The Balified Villa are not listed (verified or hidden setting).
- Job fairs page is empty. Add 2 or 3 real fairs, or hide the menu item until there is one.
- Mostly Core Talents jobs, outside Tamil Nadu. Get local employers to post (Puducherry shops, clinics, schools).
- Not yet checked: phone layout and the admin pages on a real phone.
- Ideas, in order: WhatsApp job alerts (needs a WhatsApp Business account; consent is already recorded), new-jobs-today strip on the home page, Tamil toggle (after the Tamil text check), referral rewards (referral tracking exists).

## Also open from the launch

- Merge `whatsapp-link` (Chat on WhatsApp in the footer and Contact page) after the WhatsApp inbox test passes.
- Ask Hostinger why its mail refused mail on Sat 14 Nov night (it is the backup sender).
- Link the office computer.
- Tamil text check (needs a Tamil reader).
- Lawyer review of Terms and Privacy (Kamar).
- Prices from Kamar: the three Sponsored add-ons, Campus Lite, fair stall. Invoice details for Admin > Settings.

## Later (status 17 Nov)

- Companies and other sectors creating their own job fairs. Built (branch `job-fairs-orgs`): companies and recruiters send a fair in, it waits for admin review, nothing is public until published.
- Permanent email fix through a transactional mail service with the domain verified (SPF, DKIM, DMARC). Steps written in `docs/EMAIL_AND_APP_PLAN.md` (branch `later-items`); needs DNS access, so Sneha and Kamar do it.
- Stricter checking of flagged internship postings. Built (branch `later-items`): a flagged internship stays off the public pages until an admin reviews it.
- Mobile app in Version 3 (installable website first, then a Play Store wrapper of the same site). Steps in `docs/EMAIL_AND_APP_PLAN.md`.
- Sales staff role with a WhatsApp inbox permission. Built (branch `later-items`): Admin > Staff now has a Sales role that can use the WhatsApp inbox only.

## WhatsApp job alerts (built, switched off)

Branch `v2-complete`. Opted-in job seekers get at most one message a week (Tuesday or Friday 11:00 India time) with up to 3 matching jobs. To switch on:
1. Meta approves a template with 4 variables: `Hi {{1}}, {{2}} new jobs match you: {{3}}. See them: {{4}}`.
2. Sneha sets `WA_TEMPLATE_JOB_ALERT` (the template name) and `WHATSAPP_JOB_ALERTS_ENABLED=true`. `WA_PHONE_NUMBER_ID`, `META_PAGE_ACCESS_TOKEN` and `FRONTEND_URL` must already be set.
3. Test with one opted-in account before leaving it on.

## Open task list (status 19 Nov, evening)

Sneha: PRs #60 to #64 merged on 19 Nov, 17:26. Sneha reports all items below done (19 Nov); she also fixed the Post Job form reloading on auth refresh. Still to confirm by looking: items 5 and 6 (limited-admin test, Government jobs screenshot) and Babila's Post Job test.
1. Merge and deploy PR #60 (government watcher list), PR #61 (mobile header: icon left, name centred), PR #62 (this roadmap) and PR #63 (Admin > Applications page).
2. Describe the problem she mentioned with the build.
3. Hostinger backup mail settings (`BACKUP_*`) and send a test code.
4. Brevo: the queue, the 38 held resends, credits and daily limit.
5. Test delete with a limited admin login; open Admins, Government jobs, Job fairs and Send a Job Fair.
6. After deploy: screenshot of Admin > Government jobs; report any "Last check failed".
7. Explain why Core Talents and The Balified Villa do not show on the Companies page (cache or account type).
8. Close the old branches: `remove-fake-job-counts`, `launch-fixes`, `charles`, old `installable-site`.

Kamar:
1. Send BD the health and other pages brief; relay their list so it can be checked and added to `server/config/govtSources.js`.
2. Send Lokeshwari's invite only after the limited-admin test passes.
3. Add 2 or 3 real job fairs, or hide the menu item.
4. Lawyer review of Terms and Privacy.
5. Prices: Sponsored add-ons, Campus Lite, fair stall. Invoice details in Admin > Settings.
6. Tamil text check, link the office computer, Razorpay first-week numbers, WhatsApp inbox test.
7. Meta approval of the WhatsApp alert template; SPF, DKIM and DMARC for email.

Claude:
1. Re-check the Companies page and the government watcher pages after the deploy.
2. Keep this roadmap and the plan docs up to date.
3. Open Admin > Applications after the deploy and check it lists today's applications (the dashboard card opens it).
