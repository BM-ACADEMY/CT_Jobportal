# Velaivaaipu — QC Documents vs. Actual Code

Inputs: (1) Manual Test Case Document (209 cases; the uploaded file and the Google Doc are the same document), (2) Pre-Launch Testing Checklist, (3) the repo at 7ba33a5.
Method: each checklist item checked against the code. Items marked "needs live test" cannot be proven from code alone.

## 1. Where QA stands

- Only about **26 of 209** manual cases are marked done. Done items are mostly happy paths: basic registration, OTP, job post draft, apply, save job, free plan, pay-per purchase, tickets, Home page.
- **Almost no P1 cases are executed** for: login by role, blocked user, forgot password, admin access control, college drives/students, ATS, all paid-subscription cases (SUBS-001, 002, 004-010), refunds, role route guarding (NFR-001/002/007/010), real-time chat.
- **The test plan has no security cases.** None of the launch-blocking holes in `LAUNCH_READINESS.md` (admin via social login, unauthenticated profile completion, OTP brute force, open sockets, public uploads) would be caught by these 209 cases. Add the 8 tests at the end of this file.
- The manual doc says social login covers "Google/GitHub/LinkedIn" (AUTH-025). In code, **only Google and GitHub are wired**. `passport-linkedin-oauth2` is installed but never configured.

## 2. Pre-Launch Checklist vs. code

| # | Checklist item | Status | Evidence / what is needed |
|---|---|---|---|
| 3.1/3.2 | JobPosting JSON-LD **in the raw HTML** | **FAIL (CRITICAL)** | Client is a Vite SPA. `SEOHead.jsx` injects JSON-LD with `useEffect` after JS runs. View-source shows only the generic `index.html`. Google may still render it, but the checklist requires raw HTML. |
| 3.5 | WhatsApp preview card for a job link | **FAIL (CRITICAL)** | WhatsApp does not run JS, so every link shows the homepage title. There is also no `og:image` anywhere. |
| 3.3 | Clean job URL slugs | **FAIL** | Route is `/job/:id` (Mongo id), not `/jobs/title-city`. |
| 3.7/3.8 | Sitemap lists all public pages, auto-updates | **FAIL** | `sitemap.xml` is a static file with 9 URLs. No jobs, companies or blogs. |
| 3.10 | Search Console verified | Needs live check | Not in code. |
| 3.12 | Canonical on all pages | Partial | Set client-side in `SEOHead`; same SPA limitation. |
| 3.14 | Closed job shows "filled", not 404 | Needs live test | Not verified in code. |
| 4.1/4.2/4.3 | GA4 + Meta Pixel installed and firing | **FAIL (CRITICAL)** | No `gtag`, `fbq` or GTM anywhere in `client/`. You cannot measure Meta Ads at all today. |
| 4.4/4.5 | WhatsApp click tracking with source | **FAIL** | No event code. |
| 4.6 | `campus_drive_id` captured via `/join/<college>` | **FAIL** | Route is `/campus/:driveCode`, not `/join/...`. Student model has a `registrationSource` field; needs live check that the drive code is stored. |
| 4.7/4.8 | CompleteRegistration / test-complete events | **FAIL** | No tracking code. |
| 4.9 | UTM params stored against the lead | **FAIL** | No UTM capture in client or server. |
| 4.10 / 6.6 | Skill-gap result sends the **matching course** on WhatsApp | **FAIL (CRITICAL)** | No skill-gap or course-recommendation logic found. `utils/whatsapp.js` exists, but no BM Academy course mapping. |
| 6.2 | Register with **name + WhatsApp only** | **FAIL (CRITICAL)** | `CampusRegistration.jsx` requires **name + email** (line 43); WhatsApp is optional. |
| 6.4/6.5 | Straight into assessment, instant certificate | Partial | Assessment is triggered after registration; `utils/pdfGenerator.js` exists. Needs live test on a phone. |
| 6.7/6.8 | Student visible in college dashboard and report | Needs live test | Code exists. |
| 5.6 | 40 concurrent QR registrations | Untested | No load test. Registration also triggers AI assessment generation (Gemini), which is the likely bottleneck. |
| 7.4 | Pay-per unlock does not double charge | **Pass in code** | `payPerController` returns `alreadyProcessed` for a repeated payment id; UI double-click still needs a live test. |
| 7.5 | Auto-renew + graceful downgrade | **Pass in code** | Webhook handler and tests exist (3-failure downgrade). |
| 7.6 | Refund anti-abuse rules (same device, 6 hr, blacklist) | **FAIL (CRITICAL)** | Not found in `paymentController.js`. Refund is admin approve/reject only. |
| 7.7 | Co-branded certificates | Needs live test | Code references exist in `collegeController`. |
| 7.8 | WhatsApp templates approved by Meta | External | Check Meta Business Manager first (longest lead time). |
| 7.9 | Every admin route requires auth | **Pass for routes, FAIL overall** | Routes are guarded, but anyone can obtain an `admin` role through social login (see `LAUNCH_READINESS.md` P0-1). |
| 7.10 | No old brand name ("CoreTalents") in UI | **FAIL (minor)** | Found in `client/src/data/importedBlogs.js` and `company/features/BulkMessaging.jsx`. |
| 8.1 | Razorpay webhook signatures verified | **Pass** | HMAC + `timingSafeEqual`, with tests. |
| 8.2 | No candidate PII in public results | Needs review | Public routes (`/api/public/recruiters/:id`, companies) not yet reviewed. |
| 8.4 | Input validation | **FAIL** | Operator injection in forgot/reset password; other forms not reviewed. |
| 8.6/8.7 | Backups, error monitoring | Not in code | Set up Atlas backups and Sentry. |
| 1.x/2.x | Domain, DNS, SPF/DKIM/DMARC | Not in code | Ops tasks. Do 2.1-2.4 first: the college funnel depends on TPO emails reaching the inbox. |

**Checklist verdict:** the launch gate (all CRITICAL pass) is not met. Eight code-level critical items fail: JobPosting in raw HTML, WhatsApp preview, GA4/Pixel, skill-gap to course WhatsApp, name+WhatsApp registration, refund anti-abuse, plus the security blockers.

## 3. Things in the docs that conflict with good practice

- **COL-014: student default password = phone number** (roll number if empty). Guessable by anyone who knows the number. Replace with magic link / WhatsApp OTP so students never need a password.
- **AUTH-018 role toggle at login**: fine for UX, but authorization must come from the server-side role, never from the toggle.
- **Campus registration asks for email**: the checklist (and common sense for students at a QR stand) says name + WhatsApp only.

## 4. Plan to make it competitive and easy for colleges

### A. Login: LinkedIn instead of GitHub
- Remove GitHub. Add **LinkedIn "Sign In with LinkedIn using OpenID Connect"** (scopes `openid profile email`). The installed `passport-linkedin-oauth2` uses the old LinkedIn API scopes, so use `passport-oauth2` against LinkedIn's OIDC endpoints instead (verify against LinkedIn's current docs when creating the app). Keep Google.
- LinkedIn sign-up should prefill name, email and photo and drop job seekers straight into a one-screen profile. Never trust a role from the URL (see P0-1).

### B. Job seeker side: what Naukri / Indeed / LinkedIn / foundit have that you need at launch
1. Google-for-Jobs-ready pages (server-rendered JobPosting, slugs, dynamic sitemap). This is also your free traffic engine.
2. **One-tap apply** with a saved profile; apply status tracker with WhatsApp updates (templates already exist).
3. **WhatsApp job alerts** by role + city, and Tamil/English toggle. This is where you beat the national portals for Tamil Nadu.
4. "Verified employer" badges and visible salary ranges.
5. Free skill tests with shareable certificates and a course recommendation (your funnel).
6. Fast mobile pages (route-level code splitting, image compression).

### C. College side: make "yes" the easy answer
Objections TPOs raise and the product answer:
| Objection | Answer to build |
|---|---|
| "Another portal for students to learn" | Students register by QR with name + WhatsApp, no password |
| "Too much data entry" | Upload the student list once (CSV or Excel template) or let students self-register; auto-tag by drive |
| "What does it cost?" | Free tier with real value (drives, student tracking, one-click placement report) and clear upgrade path |
| "We need reports for NAAC / NIRF / the principal" | One-click placement report + the existing Principal Executive Summary link |
| "Will you spam my students or sell data?" | Plain-language data promise on the college landing page and in onboarding |
| "Will companies come?" | Company invite + accept flow already exists; show "companies hiring from colleges like yours" on the college page |

First concrete steps: a `/for-colleges` landing page, a 3-step college onboarding (details, student list, first drive), `/join/<college-code>` short links with QR, name + WhatsApp registration, and magic-link login.

## 5. Suggested build order (ASAP launch)

1. **Security P0 fixes** from `LAUNCH_READINESS.md` (about 1 day).
2. **LinkedIn login** replacing GitHub (half a day).
3. **Campus registration**: `/join/:code`, name + WhatsApp only, UTM + drive id stored, no default password.
4. **GA4 + Meta Pixel** with the events in checklist section 4.
5. **Server-rendered job pages**: slugs, JobPosting JSON-LD in raw HTML, OG tags and image, dynamic sitemap (Vercel serverless function in front of `index.html`).
6. **Skill-gap to course WhatsApp** (needs your category-to-course map and an approved Meta template).
7. **Refund anti-abuse rules**.
8. Then `/for-colleges` page, onboarding wizard, job alerts.

## 6. Test cases to add (security)
1. `POST /api/auth/register` with `role: "admin"` / `"subadmin"` returns 400.
2. `GET /api/auth/google?role=admin` creates a jobseeker.
3. `POST /api/auth/forgot-password` with `{"email":{"$ne":null}}` returns 400.
4. OTP is invalidated after 5 wrong attempts; rate limit returns 429.
5. A blocked user's existing token is rejected.
6. A jobseeker token returns 403 on every `/api/admin/*` route and on another user's application/message id.
7. An unauthenticated socket cannot join a room or send a message.
8. `GET /uploads/<resume>` without login returns 401/403.


---

## 7. Status update (after the second round of changes)

| Checklist item | Now |
|---|---|
| 3.1 / 3.2 JobPosting JSON-LD in raw HTML | Done: `client/api/job.js` (needs `API_BASE_URL` set on Vercel; verify with Google Rich Results Test) |
| 3.3 Clean job URL slugs | Done: `/job/<title>-<city>-<id>`; old `/job/<id>` links keep working |
| 3.5 / 3.6 WhatsApp preview + 1200x630 OG image | Done: OG tags per job, `client/public/og-default.png` |
| 3.7 / 3.8 Sitemap lists all pages and updates | Done: dynamic `/sitemap.xml` (jobs, companies, blogs) |
| 3.9 robots.txt | Updated: blocks `/campus/`, `/join/`, `/api/`, dashboards |
| 3.14 Closed job shows "filled", not 404 | Done: page stays live, `noindex` |
| 3.16 Tamil keywords in meta | Done on the homepage; add to city pages |
| 4.1-4.3 GA4 + Meta Pixel | Done in code; needs `VITE_GA_MEASUREMENT_ID` and `VITE_META_PIXEL_ID`, then verify with Pixel Helper / GA Realtime |
| 4.4 / 4.5 WhatsApp click tracking | Partly: certificate share and job share are tracked. A "WhatsApp Apply" CTA does not exist yet |
| 4.6 `campus_drive_id` captured | Done: `campusDrive`, `campusDriveCode` on the student record |
| 4.7 / 4.8 Registration + skill-test events | Done: `sign_up`, `skill_test_complete` |
| 4.9 UTM stored with the lead | Done for campus registration |
| 6.1 `/join/<code>` | Done |
| 6.2 Name + WhatsApp only | Done (email optional) |
| 6.5 Instant certificate, shareable | Done: download and WhatsApp share buttons on the result screen |
| 4.10 / 6.6 Skill-gap -> matching course on WhatsApp | NOT done: needs your category -> course map and an approved Meta template |
| 7.6 Refund anti-abuse rules | NOT done: needs your exact rules (see notes) |
| 7.10 Old brand name | Not touched |
| 8.2 No PII in public results | Fixed: recruiter email/phone, company tax id/admin email/billing fields and draft jobs removed from public responses |

Extra issues found and fixed on the way:
- `GET /api/college/public/drive/:code` returned company access tokens and in-charge invite tokens to anyone who scanned the QR code.
- Home pages showed invented statistics ("2L+ jobs", "10K+ companies", "50L+ job seekers", "4.8 rating", stock-photo avatars with "+10k") whenever real counts were low. They now show real numbers only.
- `POST /api/college/public/submit-assessment` trusts the score sent by the browser. It is now bounded and limited to one attempt per skill, but the real fix is scoring on the server.
- CSV import still uses the student's phone number (or roll number) as the default password.
