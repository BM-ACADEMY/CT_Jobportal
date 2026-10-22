# Velaivaaipu launch: brief for the developer / SEO owner

Branch `launch-fixes` (3 commits on top of main `7ba33a5`). Delivered as `launch-fixes.patch`. Apply with:

```
git checkout -b launch-fixes main
git apply launch-fixes.patch
git rm -r --cached server/uploads   # stops tracking old resumes/MoUs (the .gitkeep stays)
```

Then run locally: `cd server && npm i && node --test tests/auth/*.test.js tests/payments/*.test.js`, `npm audit`, and `cd client && npm i && npm run build && node --test api/__tests__/seo.test.mjs`. These could not be run in the build sandbox (npm install was blocked), so **the client build has not been run yet**. Fix anything it reports before deploying.

## 1. Developer: set up (about half a day)

**Server env** (see `server/.env.example`): `JWT_SECRET` (32+ random chars, server refuses to start otherwise), `MONGODB_URI`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, Razorpay keys + `RAZORPAY_WEBHOOK_SECRET`, SMTP, `OPENROUTER_API_KEY` (every AI feature uses this key; `GEMINI_API_KEY` is not read anywhere), `ADMIN_EMAIL` + `ADMIN_PASSWORD` (12+ chars, first admin only), Google OAuth, and `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_CALLBACK_URL` (`https://<api-domain>/api/auth/linkedin/callback`).

**Vercel (client) env:** `VITE_API_BASE_URL`, `VITE_API_DOMAIN`, `VITE_RAZORPAY_KEY_ID`, `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, and for the SEO functions `API_BASE_URL` (the `/api` base of the server) and optional `SITE_URL`.

**LinkedIn app:** developer.linkedin.com > Create app > add product "Sign In with LinkedIn using OpenID Connect" > add the redirect URL above. This path is written to LinkedIn's OIDC docs but has **not been tested against a real LinkedIn app**; test login for each role (jobseeker, recruiter, company) before launch.

**Mail sending:** read `docs/EMAIL_DELIVERABILITY_PLAN.md` first. Today's OTP mail goes through a mailbox SMTP login; move app mail to Amazon SES (or Brevo) with SPF, DKIM and DMARC, and set `MAIL_FROM` / `MAIL_REPLY_TO` (see `.env.example`).

**Production checks (today):**
1. Look for `admin@ct.com` and any unknown `admin`/`subadmin`/`drive_incharge` users. Delete or change passwords.
2. Rotate `JWT_SECRET` (signs everyone out; fine).
3. Remove old resumes/MoUs from git history if the repo stays public (`git filter-repo`), or make the repo private.
4. Set SPF, DKIM and DMARC for the sending domain so OTP emails reach the inbox.
5. Razorpay: register webhook `https://<api-domain>/api/payments/razorpay/renewal-webhook`; do one small real payment and refund it.

## 2. Developer: code items still open (not blockers, in this order)

1. **Campus test is now scored on the server (done).** Questions come from pre-generated sets in `CampusQuestionSet`; the browser gets no answers, only a signed attempt token, and the server scores. **Before any college drive:** (a) deploy server and client together, (b) seed the bank once with `cd server && node scripts/generateQuestionBank.js --sets 5` (needs `OPENROUTER_API_KEY`; empty categories also fill lazily on first use, but seed first). Still open: `FreeAssessment.jsx` uses the old public `/assessments/public` endpoint, which still returns answers; move it to the same pattern.
2. **CSV-imported students** get their phone or roll number as the default password. Use a random password and send a set-password link.
3. **Protect uploaded documents.** `/uploads` is public. A switch `PROTECT_DOCUMENT_UPLOADS` exists (default off); about 61 places in the client link to documents directly and need signed URLs first.
4. **"Request refund" button.** The API `POST /api/payments/:paymentId/request-refund` now enforces the rules (24 hours, one per account/email/phone, duplicates always, college plans contact-only) but no screen calls it. Add a button on the payment history pages for company, recruiter and job seeker. Admin approval stays in Manage Refunds. Note that approving only updates our records; the money is returned from the Razorpay dashboard.
5. **WhatsApp Apply** button on job pages and the job-share flow (event `whatsapp_click` is already mapped).
6. Replace old brand text ("CoreTalents") in `client/src/data/importedBlogs.js` and `BulkMessaging.jsx`.
7. Split the 906 kB main JS chunk with `manualChunks`.

## 3. SEO owner

- After deploy, open `https://velaivaaipu.in/sitemap.xml` and confirm it lists static pages, jobs and companies. Submit it in Google Search Console and Bing Webmaster Tools.
- Test one job URL (`/job/<title>-<city>-<id>`) in Google's Rich Results Test; it should show JobPosting. Check the page's "view source" shows the title, canonical and OG tags (they come from the Vercel function `client/api/job.js`).
- GA4: create the property, set `VITE_GA_MEASUREMENT_ID`. Mark `sign_up`, `generate_lead` and `skill_test_complete` as key events. Meta Pixel: set `VITE_META_PIXEL_ID`.
- Campus QR links: add UTM tags to each college's link (`?utm_source=college&utm_medium=qr&utm_campaign=<college-code>`). They are stored on every student record.
- Pages worth adding content for: `/for-colleges`, the three blog posts, a "jobs in Pondicherry" landing page.

## 4. Legal pages (Privacy, Refund, Terms)

New pages `/privacy-policy` and `/refund-policy` are live in the patch, and Terms section 6 was rewritten to match the new refund rules. Before launch:
1. The registered business name, address and CIN are filled in `client/src/components/legal/LegalPage.jsx` from the incorporation records; check them against the certificate. Confirm `support@velaivaaipu.in` is a working inbox.
2. Have a lawyer read the three pages once. Points to check: DPDP Act 2023 wording, a named grievance officer, where data is stored, refund timelines, the Chennai jurisdiction clause.
3. Confirm that "within 3 working days" for refund review and "5 to 7 working days" for money back are promises you will keep.

## 5. WhatsApp follow-up (built, switched off)

Student ticks an optional consent box on the QR form (timestamp stored). If they score below 60% on a test and consented, one follow-up is queued. The scholarship line appears only on festival dates set in env (`COURSE_SCHOLARSHIP_*`); otherwise the message offers a free counselling call. Nothing is sent until Meta approves the template and `WHATSAPP_FOLLOWUP_ENABLED=true`. Template text, sample values and switch-on steps are in `docs/WHATSAPP_TEMPLATES.md`. A "STOP" reply is honoured through the Meta webhook (needs `WA_APP_SECRET`).

Category to course mapping lives in `server/config/courseMap.js` (and the labels in `client/src/data/skillCategories.js`); change the course names there.

## 6. Lifecycle mails (built, switched off)

Decisions made on Kamar's behalf (footer, senders, festival dates, pricing proposal) are in `docs/DECISIONS_AND_INPUTS.md`. Full mapping of the Smart Reply Mail Plan to Velaivaaipu is in `docs/LIFECYCLE_MAIL_PLAN.md`. Summary: welcome, profile nudge, skill-test invite, skill-gap + course, win-back, paid Job Alerts delivery, employer tips and templates, college batch readiness, GST receipts, refund mails, contact-form auto-reply, one-click unsubscribe. Switch on with `LIFECYCLE_EMAILS_ENABLED=true` and the env in `.env.example` (needs `API_PUBLIC_URL` for the unsubscribe link). Start with `LIFECYCLE_MAX_PER_RUN=20`. Confirm the lead store (n8n "leados" or other) and the free-plan limits (2 jobs, 10 searches a day, 3 free hires), which I could not find in the code. All existing payment tests were not runnable in my environment; run `node --test server/tests/payments/*.test.js`. I changed one assertion in `webhook.test.js` (first charge now also sends a receipt).

## 7. Before promoting it as an "AI-powered job platform"

- **Set `OPENROUTER_API_KEY`** on the server and keep credit in the OpenRouter account. All AI features use it (skill tests, resume review, resume builder, candidate matching). Earlier notes said `GEMINI_API_KEY`; that variable is not read anywhere. Without the key the AI features fail.
- Test each AI feature on the live site with a real account: free skill test, AI resume review, AI resume builder, recruiter AI matching.
- **Campus QR load (done):** tests now come from a pre-generated question bank and are scored on the server. Seed it before the first drive (`node scripts/generateQuestionBank.js --sets 5`, see section 2).
- What the code really does with AI (safe to claim): AI-generated skill tests with certificates, AI resume review, AI resume builder, AI ranking and match analysis of applicants for employers. Mock interviews and career counselling are booking forms for team sessions; confirm before calling them AI.
- Claims removed in this patch: made-up testimonials (shown when there were no real reviews), "trusted by companies and colleges statewide", "thousands of professionals", and the "95% match relevance" figure in the Terms. Do not add numbers back unless they are true and provable.
- The AI providers now appear in the Privacy Policy, because resumes are sent to them.

## 8. Smoke test before launch

Signup with email OTP, Google login, LinkedIn login, forgot password; post a job and open its public URL; apply; subscribe with a real small payment and request a refund inside 24 hours; QR campus join with only name + WhatsApp, take the test, download the certificate; check that a closed job URL shows "position filled"; check `/for-colleges`, `/privacy-policy`, `/refund-policy`, `/terms`.
