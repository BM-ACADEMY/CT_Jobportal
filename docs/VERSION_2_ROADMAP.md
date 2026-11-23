# Velaivaaipu Version 2 roadmap

Last updated: Mon 23 Nov 2026. Kamar sets the order. Sneha takes the items in this order and reports when each is done. No dates. Every item below carries a tag: [DONE] finished and merged into main (live on the server not always confirmed), [IN PROGRESS], [BLOCKED: reason], [NOT STARTED], [NOT SURE].

## Order of work

1. **Reliable codes.** Backup sender (branch `mail-fallback`), code counter (branch `otp-stats`), Brevo credits watch.
   Status: [DONE] Backup sender code, code counter and Brevo watch code are merged. [BLOCKED: Hostinger refused the backup mailbox password (535); needs a mailbox with a working password] BACKUP_EMAIL_HOST is set but no test code has been delivered yet. [BLOCKED: needs the Brevo login holder] Brevo queue, 38 held resends, credits and daily limit.
   [DONE] Second admin by email invite (`admin-invites`) and Limited access for new admins (`admin-restrict`) are merged.
2. **Admin autopilot check.** Test the needs-action inbox, auto-assign, notifications and feedback with real activity and fix the gaps.
   Status: features and unit tests exist. A tick-list for testing with real data is in `docs/AUTOPILOT_CHECK.md` (branch `v2-complete`); Sneha runs it. [IN PROGRESS] Checks #1 needs-action inbox, #2 auto-assign, #6 feedback and #7 bell are done. #3 reminders (24h/48h) and #4 daily summary (9:00) are waiting for time. #5 failed payment (Razorpay test mode only) and #8 switch-off are not done yet.
3. **Installable website** (Add to Home Screen). Branch `installable-site`.
   Status: the installable base (manifest, icons, service worker) is already in main. The branch `installable-site` only adds the camera QR scan for drive check-in and two shortcuts; it waits for merge. [DONE] Merged in #57. [NOT SURE] whether it is live on the server.
4. **Jobs page filters** by place, plus non-graduate, contract and part-time jobs.
   Status: done. Place chips and no-degree, part-time and contract filters are live on the Jobs page. [DONE]
5. **Government jobs section on autopilot.** The site watches official announcements, Kamar approves, admin posts.
   Status: built (branch `v2-complete`). Admin > Government jobs: add official recruitment pages; the site checks them every morning at 8:00 India time; new notices wait for Kamar; "Post as job" opens the web-jobs form prefilled. The 21 official pages chosen with the BD team (18 Nov) are built into `server/config/govtSources.js`; any page in that file not yet watched is added when the server starts (to add more, add a line there). A new page's first scan only sets the baseline. Madras High Court is left out until someone confirms the page. [DONE] Merged (#58, #60). Admin > Government jobs checked 21 Nov: 13 of 21 pages OK; 8 show "Last check failed" (4 too slow, 3 could not be read, UPSC link gives 404). [NOT STARTED] Fix the failed links once the BD team confirms the right pages.

## Built on branches (all merged into main)

[DONE] All merged: `mail-fallback`, `otp-stats`, `qc-fixes`, `brand-leads-help`, `admin-invites`, `admin-restrict`, `whatsapp-link`. [NOT SURE] WhatsApp inbox test (Kamar).

- `qc-fixes`: home job count matches the public list, same-day jobs show Pondicherry and Tamil Nadu first, job titles and cities tidied when saved, footer line corrected, Plans page grammar. [DONE]
- `brand-leads-help`: help requests readable in Admin > Requests (no recruiter Assign), Brand leads with priority, WhatsApp, follow-up dates. [DONE]
- `admin-restrict`: new admins are Limited. They cannot delete, change money, plans or users, export data, change security or add admins. After deploying, test one blocked action with the new admin's login. [DONE] merged. Lokeshwari set to Limited in the database. [BLOCKED: PROBLEM] On 22 Nov a test admin with level "limited" in the database was able to delete a job on the live site. The code on main refuses it (checked with the real routes), so the live server or the path used must be checked. Do not send Lokeshwari's invite until fixed.

## From the live-site review (16 Nov)

- Companies page shows only BM Academy. Check why Core Talents and The Balified Villa are not listed (verified or hidden setting). [DONE] They were unverified; verified now and listed.
- Job fairs page is empty. Add 2 or 3 real fairs, or hide the menu item until there is one. [NOT STARTED] Kamar.
- Mostly Core Talents jobs, outside Tamil Nadu. Get local employers to post (Puducherry shops, clinics, schools). [NOT STARTED] Kamar and the BD team.
- Not yet checked: phone layout and the admin pages on a real phone. [NOT STARTED]
- Ideas, in order: WhatsApp job alerts (needs a WhatsApp Business account; consent is already recorded), new-jobs-today strip on the home page, Tamil toggle (after the Tamil text check), referral rewards (referral tracking exists). [BLOCKED: WhatsApp alerts wait for Meta template approval] Other ideas [NOT STARTED].

## Also open from the launch

- Merge `whatsapp-link` (Chat on WhatsApp in the footer and Contact page) after the WhatsApp inbox test passes. [DONE] Merged. [NOT SURE] WhatsApp inbox test (Kamar).
- Ask Hostinger why its mail refused mail on Sat 14 Nov night (it is the backup sender). [DONE] Asked 21 Nov. Hostinger: the free mailbox allows 100 outgoing mails per rolling 24 hours (shared with login codes), cannot be raised; paid plans give 1,000 to 3,000 a day. DNS (MX, SPF, DKIM, DMARC) is correct.
- Link the office computer. [NOT SURE] Kamar.
- Tamil text check (needs a Tamil reader). [BLOCKED: needs a Tamil reader]
- Lawyer review of Terms and Privacy (Kamar). [NOT SURE] Kamar.
- Prices from Kamar: the three Sponsored add-ons, Campus Lite, fair stall. Invoice details for Admin > Settings. [NOT SURE] Kamar.

## Later (status 17 Nov)

- Companies and other sectors creating their own job fairs. Built (branch `job-fairs-orgs`): companies and recruiters send a fair in, it waits for admin review, nothing is public until published. [DONE] Merged.
- Permanent email fix through a transactional mail service with the domain verified (SPF, DKIM, DMARC). Steps written in `docs/EMAIL_AND_APP_PLAN.md` (branch `later-items`); needs DNS access, so Sneha and Kamar do it. [NOT STARTED] [BLOCKED: needs DNS access]
- Stricter checking of flagged internship postings. Built (branch `later-items`): a flagged internship stays off the public pages until an admin reviews it. [DONE] Merged.
- Mobile app in Version 3 (installable website first, then a Play Store wrapper of the same site). Steps in `docs/EMAIL_AND_APP_PLAN.md`. [NOT STARTED] Version 3.
- Sales staff role with a WhatsApp inbox permission. Built (branch `later-items`): Admin > Staff now has a Sales role that can use the WhatsApp inbox only. [DONE] Merged.

## WhatsApp job alerts (built and merged, switched off)

Branch `v2-complete`. Opted-in job seekers get at most one message a week (Tuesday or Friday 11:00 India time) with up to 3 matching jobs. To switch on:
1. Meta approves a template with 4 variables: `Hi {{1}}, {{2}} new jobs match you: {{3}}. See them: {{4}}`. [BLOCKED: waiting for Meta approval]
2. Sneha sets `WA_TEMPLATE_JOB_ALERT` (the template name) and `WHATSAPP_JOB_ALERTS_ENABLED=true`. `WA_PHONE_NUMBER_ID`, `META_PAGE_ACCESS_TOKEN` and `FRONTEND_URL` must already be set. [NOT STARTED] (after approval)
3. Test with one opted-in account before leaving it on. [NOT STARTED]

## Status (21 Nov 2026)

Done (merged into main): mail-fallback, otp-stats, qc-fixes, brand-leads-help, admin-invites, admin-restrict, whatsapp-link, installable-site (#57), job-fairs-orgs, later-items, government watcher list (#58), PRs #60-#64 (watcher list, mobile header, roadmap, Admin > Applications, profile photos), the Post Job refresh fix, and the 5 outdated server tests (fix-tests; all 1026 tests pass). The full build passes. Core Talents and The Balified Villa were unverified; they are verified now and listed.

In progress (Sneha): limited-admin delete test, then Admins, Government jobs, Job fairs and Send a Job Fair open without errors. Check that the latest main is deployed on the server.

Blocked: Brevo queue, the 38 held resends, credits and daily limit (needs the Brevo login holder). WhatsApp job alerts (Meta template approval; switched off on purpose). Lokeshwari's invite (after the limited-admin test passes).

Not started: Hostinger backup sender (BACKUP_* settings) and test code. Ask Hostinger about Sat 14 Nov night. Run docs/AUTOPILOT_CHECK.md. Mail the stuck users (75 apology mails unsent). Screenshot of Admin > Government jobs after deploy. Check Admin > Applications after deploy. Close old branches remove-fake-job-counts, launch-fixes, charles (they still have commits not in main, decide first). Phone layout check. SPF, DKIM and DMARC for email. Kamar's items below.

Extra work done: fixed 5 outdated tests; Part 43 phone-check sheet (local file); unverified-user apology mail script (server only); WhatsApp follow-ups set back to false on the server.

## Open task list (status 18 Nov, evening; see Status above for 21 Nov)

Sneha:
1. Merge and deploy PR #60 (government watcher list), PR #61 (mobile header: icon left, name centred), PR #62 (this roadmap) and PR #63 (Admin > Applications page). [DONE] #60-#63 merged. [NOT SURE] deployed on the server.
2. Describe the problem she mentioned with the build. [DONE] No build error; 5 old tests fixed and merged.
3. Hostinger backup mail settings (`BACKUP_*`) and send a test code. [BLOCKED: mailbox password refused (535)]
4. Brevo: the queue, the 38 held resends, credits and daily limit. [BLOCKED: needs the Brevo login holder]
5. Test delete with a limited admin login; open Admins, Government jobs, Job fairs and Send a Job Fair. [BLOCKED: PROBLEM, see admin-restrict above] The delete went through for a limited test admin. Not yet diagnosed; next step is to check the live server (pm2 script path, checkLimited in the running files, last commit of adminLevel.js).
6. After deploy: screenshot of Admin > Government jobs; report any "Last check failed". [DONE] 13 of 21 OK, 8 failed (listed above).
7. Explain why Core Talents and The Balified Villa do not show on the Companies page (cache or account type). [DONE] They were unverified; now verified.
8. Close the old branches: `remove-fake-job-counts`, `launch-fixes`, `charles`, old `installable-site`. [DONE] `remove-fake-job-counts`, `installable-site` removed; PR #31 / `launch-fixes` closed. [NOT SURE] `charles` waits for Kamar's OK.

Kamar:
1. Send BD the health and other pages brief; relay their list so it can be checked and added to `server/config/govtSources.js`. [NOT SURE] Kamar's item.
2. Send Lokeshwari's invite only after the limited-admin test passes. [BLOCKED: do not send until the limited-admin problem is fixed]
3. Add 2 or 3 real job fairs, or hide the menu item. [NOT SURE] Kamar's item.
4. Lawyer review of Terms and Privacy. [NOT SURE] Kamar's item.
5. Prices: Sponsored add-ons, Campus Lite, fair stall. Invoice details in Admin > Settings. [NOT SURE] Kamar's item.
6. Tamil text check, link the office computer, Razorpay first-week numbers, WhatsApp inbox test. [NOT SURE] Kamar's item.
7. Meta approval of the WhatsApp alert template; SPF, DKIM and DMARC for email. [NOT SURE] Kamar's item.

Claude:
1. Re-check the Companies page and the government watcher pages after the deploy. [DONE] Companies page. [DONE] Government watcher pages checked 21 Nov (see above).
2. Keep this roadmap and the plan docs up to date. [DONE] Updated 21 Nov.
3. Open Admin > Applications after the deploy and check it lists today's applications (the dashboard card opens it). [DONE] Opens and shows today's count.

## Extra work done (21 Nov)

- Fixed 5 outdated server tests (all 1026 tests pass).
- Stuck-user apology mails: script `server/scripts/notifyUnverified.js` added (#69). 95 of 208 mailed so far, 0 refused; about 113 left, 15 to 20 per batch because of the 100-a-day Hostinger limit. Next batch 22 Nov.
- Admin autopilot check: #1, #2, #6 and #7 passed. #3 and #4 are waiting for time.
- WhatsApp follow-ups set back to false on the server.
- Deploy check: the live site was rebuilt and restarted on 20 Nov after the `e0795bb` pull.
- Part 43 phone-check sheet built (`docs/PART43_PHONE_CHECK.xlsx`, local only).

## Extra work done (22-23 Nov)

- Backup sender: BACKUP_EMAIL_HOST set to Hostinger; test code refused by Hostinger (535, wrong mailbox password). Left off until a working mailbox password exists.
- Hostinger answered: 100 outgoing mails per rolling 24 hours on the free mailbox, shared with login codes. Paid plans give 1,000 to 3,000 a day.
- Duplicate MONGODB_URI line removed from the server .env (identical copy); database connects.
- Government watcher checked: 13 of 21 pages OK, 8 failed (4 too slow, 3 could not be read, UPSC 404).
- Phone layout checked on a real phone: no problems reported.
- Server shows "System restart required" (pending system update). Needs a quiet time chosen by Kamar.
- Part 43 phone-check sheet added to docs/.
