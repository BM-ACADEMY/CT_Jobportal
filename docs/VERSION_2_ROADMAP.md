# Velaivaaipu Version 2 roadmap

Last updated: Mon 16 Nov 2026. Kamar sets the order. Sneha takes the items in this order and reports when each is done. No dates.

## Order of work

1. **Reliable codes.** Backup sender (branch `mail-fallback`), code counter (branch `otp-stats`), Brevo credits watch.
   Status: built, waiting for merge and for the BACKUP_* server settings.
2. **Admin autopilot check.** Test the needs-action inbox, auto-assign, notifications and feedback with real activity and fix the gaps.
   Status: features and unit tests exist. A tick-list for testing with real data is in `docs/AUTOPILOT_CHECK.md` (branch `v2-complete`); Sneha runs it.
3. **Installable website** (Add to Home Screen). Branch `installable-site`.
   Status: the installable base (manifest, icons, service worker) is already in main. The branch `installable-site` only adds the camera QR scan for drive check-in and two shortcuts; it waits for merge.
4. **Jobs page filters** by place, plus non-graduate, contract and part-time jobs.
   Status: done. Place chips and no-degree, part-time and contract filters are live on the Jobs page.
5. **Government jobs section on autopilot.** The site watches official announcements, Kamar approves, admin posts.
   Status: built (branch `v2-complete`). Admin > Government jobs: add official recruitment pages; the site checks them every morning at 8:00 India time; new notices wait for Kamar; "Post as job" opens the web-jobs form prefilled. Needs the pages chosen by Kamar.

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
