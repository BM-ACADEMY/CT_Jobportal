# Sheet-ready entries (I can read the Velaivaaipu sheet but not edit it: paste these)

## Daily Log tab: one row for 7 Nov 2026
Columns: Date | What I did today | Problems or errors | New users (last 24h) | Site up | Errors fixed | Backup done

7 Nov 2026 | Real Rs 588.82 payment test passed (pay, plan, refund through admin screen, Razorpay refund processed). Fixed wrong Razorpay account key, Cancel plan blocking refunds, false auto-renew tick, refund status and 10-day window. Payments ON for job seeker and recruiter plans only. Installed 2-minute payment checker (switches payments off and emails on any problem). Merged and deployed admin-verify-company, fix-verified-wording, admin-skill-tests, revenue-from-launch; removed all "reach millions" claims. Dashboard revenue now Rs 0. CoreTalents job-limit dry run done. | GST number and billing contact in Settings look like test values; webhook page has no Logs tab; no nightly DB backup exists | 5 | OK | Yes | No (manual backups before deploys only; the last full backup was before today's deploy)

## Tasks tab: status updates
1 Register velaivaaipu.in in Razorpay: Done (approved on the Afra Ventures account; site now uses that account's key)
2 Live test: Done (order_TxBt5lHI8JX8vA, pay_TxBtDvuzpymBlg, refund rfnd_TxCNJecgmiGapg processed)
3 Webhook active with order.paid: Done (4 events enabled; our server answered 200 at 06:44:33 UTC; payment shows captured)
7 Cancel recurring cancels the Razorpay mandate: code Done and tested; real-money recurring test still To do
8 "millions" claims gone: Done (last five removed today, deployed c1a95c8)
9 Home wording and popular searches: Done
10 GA4 and Meta Pixel: IDs are live in the site; registration screenshot from GA4 and Meta is To do (needs someone with access)
11 CoreTalents job limit: Doing (dry run done for hello@coretalents.in: 3 now, +147 = 150; waiting for confirmation of the exact account that will post)
12 WhatsApp opt-in checkbox: To do
13 Push test Android, desktop, iPhone: To do

## Needs from Kamar tab: new rows (date asked 7 Nov 2026, Status Open)
- Correct GST number, billing name, address and contact for invoices (Admin > Settings still has test values)
- Confirm which CoreTalents account will post (hello@coretalents.in is a recruiter account with no company yet) so I can apply the 150 limit
- Decide: should pay-per-use add-ons be open now? (they open with the payments switch)
- Decide Recruiter Elite: it is stored as Lifetime but sold in 1, 3 and 12 month options (a Lifetime plan gets a 100-year expiry)
- Approve a nightly database backup job on the server (none exists)
- Bug list items 2 and 4 need an example: "students and skill set count setting" and "all specifications listed in admin"
- After launch: regenerate the Razorpay key secret (it was shown in chat); change the server login password (same as the old DB password); close the MongoDB port to the internet
- Razorpay webhook delivery screenshot (dashboard has no Logs tab; ask Razorpay support if needed)

## Version 2 tab: ideas, bugs, improvements (admin panel first)
Admin panel
- Show the Razorpay refund status (pending, processed, failed) on the admin Refunds screen, like buyers see
- Plan editor: stop saving a plan whose duration and pricing options disagree (Elite: Lifetime with 1, 3, 12 month options); warn when a price or period change creates a new Razorpay plan
- List every plan specification (feature) in one admin place and allow adding new ones (bug list item 4)
- Admin setting for the home page numbers: minimum to show, and optional manual override (bug list item 2)
- Dashboard: tiles stay on loading dots for some admins (cause not found); add refunds, failed payments and today's payments tiles
- admin.velaivaaipu.in is an older separate copy without the new screens (job limits, skill tests, verify company): merge it into the main admin or retire it
- Per-account actions: job limits for one or many accounts (built), plus extend plan days with a reason and a log
- Audit log screen: who verified a company, raised a limit, approved a refund
- Staff roles: show who has access to what and last login
- Payment checker results page in admin (OK / problem per payment)
Payments and plans
- Autopay test for college and company with a Rs 1 plan on a 7-day cycle (Razorpay's shortest repeat is 7 days)
- Day Pass (Rs 1, Daily) exists but inactive: decide whether to keep as a real product
- Remind buyers before a plan expires; one-click renew
Site and growth
- WhatsApp opt-in checkbox on the free skill test (about 16 Nov), then switch on the follow-up
- Push notifications: test on Android, desktop and iPhone before setting the keys
- Verified company badge: verify real companies in admin (0 of 6 are verified today)
- Nightly backup with a weekly restore test; monitoring alert if the site is down
- Pre-render public pages so each shows its own title in the page source
Security
- Rotate Razorpay key secret after launch; move server login off the reused password; close the database port to the internet
