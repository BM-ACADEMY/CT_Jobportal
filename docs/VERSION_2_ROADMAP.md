# Velaivaaipu Version 2 roadmap

Last updated: Mon 16 Nov 2026. Kamar sets the order. Sneha takes the items in this order and reports when each is done. No dates.

## Order of work

1. **Reliable codes.** Backup sender (branch `mail-fallback`), code counter (branch `otp-stats`), Brevo credits watch.
   Status: built, waiting for merge and for the BACKUP_* server settings.
2. **Admin autopilot check.** Test the needs-action inbox, auto-assign, notifications and feedback with real activity and fix the gaps.
   Status: features exist; not yet tested with real traffic.
3. **Installable website** (Add to Home Screen). Branch `installable-site`.
   Status: not in main; needs merge and test.
4. **Jobs page filters** by place, plus non-graduate, contract and part-time jobs.
   Status: not started.
5. **Government jobs section on autopilot.** The site watches official announcements, Kamar approves, admin posts.
   Status: nothing built yet.

## Also open from the launch

- Merge `whatsapp-link` (Chat on WhatsApp in the footer and Contact page) after the WhatsApp inbox test passes.
- Ask Hostinger why its mail refused mail on Sat 14 Nov night (it is the backup sender).
- Link the office computer.
- Tamil text check (needs a Tamil reader).
- Lawyer review of Terms and Privacy (Kamar).
- Prices from Kamar: the three Sponsored add-ons, Campus Lite, fair stall. Invoice details for Admin > Settings.

## Later (status 17 Nov)

- Companies and other sectors creating their own job fairs. Not built: it needs its own flow (organiser sign-up, stall pricing, approval), so it is a Version 2 item after the five above.
- Permanent email fix through a transactional mail service with the domain verified (SPF, DKIM, DMARC). Steps written in `docs/EMAIL_AND_APP_PLAN.md` (branch `later-items`); needs DNS access, so Sneha and Kamar do it.
- Stricter checking of flagged internship postings. Built (branch `later-items`): a flagged internship stays off the public pages until an admin reviews it.
- Mobile app in Version 3 (installable website first, then a Play Store wrapper of the same site). Steps in `docs/EMAIL_AND_APP_PLAN.md`.
- Sales staff role with a WhatsApp inbox permission. Built (branch `later-items`): Admin > Staff now has a Sales role that can use the WhatsApp inbox only.
