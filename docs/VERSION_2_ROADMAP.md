# Velaivaaipu Version 2 roadmap

Last updated: Mon 16 Nov 2026 (night). Kamar sets the order. Sneha takes the items in this order and reports when each is done. No dates.

## Order of work

1. **Reliable codes.** Backup sender (branch `mail-fallback`), code counter (branch `otp-stats`), Brevo credits watch.
   Status: built, waiting for merge and for the BACKUP_* server settings.
   Also built, waiting for merge: second admin by email invite (`admin-invites`), then Limited access for new admins (`admin-restrict`, merge after `admin-invites`).
2. **Admin autopilot check.** Test the needs-action inbox, auto-assign, notifications and feedback with real activity and fix the gaps.
   Status: features exist; not yet tested with real traffic.
3. **Installable website** (Add to Home Screen). Branch `installable-site`.
   Status: not in main; needs merge and test.
4. **Jobs page filters** by place, plus non-graduate, contract and part-time jobs.
   Status: not started.
5. **Government jobs section on autopilot.** The site watches official announcements, Kamar approves, admin posts.
   Status: nothing built yet.

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

## Later

- Companies and other sectors creating their own job fairs.
- Permanent email fix through a transactional mail service with the domain verified (SPF, DKIM, DMARC).
- Stricter checking of flagged internship postings.
- Mobile app in Version 3 (installable website first, then a Play Store wrapper of the same site).
- Sales staff role with a WhatsApp inbox permission (shelved).
