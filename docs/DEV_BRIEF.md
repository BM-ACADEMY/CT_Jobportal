# Velaivaaipu launch: brief for the developer / SEO owner

Branch `launch-fixes` (3 commits on top of main `7ba33a5`). Delivered as `launch-fixes.patch`. Apply with:

```
git checkout -b launch-fixes main
git apply launch-fixes.patch
git rm -r --cached server/uploads   # stops tracking old resumes/MoUs (the .gitkeep stays)
```

Then run locally: `cd server && npm i && node --test tests/auth/*.test.js tests/payments/*.test.js`, `npm audit`, and `cd client && npm i && npm run build && node --test api/__tests__/seo.test.mjs`. These could not be run in the build sandbox (npm install was blocked), so **the client build has not been run yet**. Fix anything it reports before deploying.

## 1. Developer: set up (about half a day)

**Server env** (see `server/.env.example`): `JWT_SECRET` (32+ random chars, server refuses to start otherwise), `MONGODB_URI`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, Razorpay keys + `RAZORPAY_WEBHOOK_SECRET`, SMTP, `GEMINI_API_KEY`, `ADMIN_EMAIL` + `ADMIN_PASSWORD` (12+ chars, first admin only), Google OAuth, and `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_CALLBACK_URL` (`https://<api-domain>/api/auth/linkedin/callback`).

**Vercel (client) env:** `VITE_API_BASE_URL`, `VITE_API_DOMAIN`, `VITE_RAZORPAY_KEY_ID`, `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, and for the SEO functions `API_BASE_URL` (the `/api` base of the server) and optional `SITE_URL`.

**LinkedIn app:** developer.linkedin.com > Create app > add product "Sign In with LinkedIn using OpenID Connect" > add the redirect URL above. This path is written to LinkedIn's OIDC docs but has **not been tested against a real LinkedIn app**; test login for each role (jobseeker, recruiter, company) before launch.

**Production checks (today):**
1. Look for `admin@ct.com` and any unknown `admin`/`subadmin`/`drive_incharge` users. Delete or change passwords.
2. Rotate `JWT_SECRET` (signs everyone out; fine).
3. Remove old resumes/MoUs from git history if the repo stays public (`git filter-repo`), or make the repo private.
4. Set SPF, DKIM and DMARC for the sending domain so OTP emails reach the inbox.
5. Razorpay: register webhook `https://<api-domain>/api/payments/razorpay/renewal-webhook`; do one small real payment and refund it.

## 2. Developer: code items still open (not blockers, in this order)

1. **Score the campus test on the server.** `GET /api/assessments/public` returns the correct answers and the browser computes the score. The score is range-checked and limited to one attempt per skill, but a student can still fake a pass. Move scoring to the server (return questions without `correct_option`, score on submit).
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
1. Put the **registered business name and address** in `client/src/components/legal/LegalPage.jsx` (`LEGAL_ENTITY`). It currently says "Velaivaaipu". Also confirm `support@velaivaaipu.in` is a working inbox.
2. Have a lawyer read the three pages once. Points to check: DPDP Act 2023 wording, a named grievance officer, where data is stored, refund timelines, the Chennai jurisdiction clause.
3. Confirm that "within 3 working days" for refund review and "5 to 7 working days" for money back are promises you will keep.

## 5. WhatsApp follow-up (built, switched off)

Student ticks an optional consent box on the QR form (timestamp stored). If they score below 60% on a test and consented, one follow-up is queued. The scholarship line appears only on festival dates set in env (`COURSE_SCHOLARSHIP_*`); otherwise the message offers a free counselling call. Nothing is sent until Meta approves the template and `WHATSAPP_FOLLOWUP_ENABLED=true`. Template text, sample values and switch-on steps are in `docs/WHATSAPP_TEMPLATES.md`. A "STOP" reply is honoured through the Meta webhook (needs `WA_APP_SECRET`).

Category to course mapping lives in `server/config/courseMap.js` (and the labels in `client/src/data/skillCategories.js`); change the course names there.

## 6. Smoke test before launch

Signup with email OTP, Google login, LinkedIn login, forgot password; post a job and open its public URL; apply; subscribe with a real small payment and request a refund inside 24 hours; QR campus join with only name + WhatsApp, take the test, download the certificate; check that a closed job URL shows "position filled"; check `/for-colleges`, `/privacy-policy`, `/refund-policy`, `/terms`.
