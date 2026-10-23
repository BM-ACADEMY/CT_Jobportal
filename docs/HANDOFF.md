# Velaivaaipu launch handoff (pricing locked)

**Ownership rule:** Sneha creates and configures every account, key and DNS record, under a company mailbox (hello@velaivaaipu.in or a tech@ alias), never a personal email. Kamar creates nothing; he only approves a payment card, KYC/OTP in the company's name, and the decisions listed at the end. Full phase plan: `MASTER_PLAN.md`.

Apply the code: `git checkout 7ba33a5 && git am launch-fixes.patch`. Full detail: `DEV_BRIEF.md`.

## Dev (short brief)
1. Set server env from `server/.env.example`: JWT_SECRET (32+), MONGODB_URI, FRONTEND_URL, ALLOWED_ORIGINS, Razorpay keys + webhook secret, SMTP, `OPENROUTER_API_KEY`, `API_PUBLIC_URL`, `MAIL_FROM`/`MAIL_REPLY_TO` (hello@velaivaaipu.in), `FOOTER_PHONE`, `WA_APP_SECRET`, Google and LinkedIn OAuth. Client: `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`.
2. Deploy server and client together. Then seed questions: `cd server && node scripts/generateQuestionBank.js --sets 5`.
3. Mail: see the Mail service block below. Keep `LIFECYCLE_EMAILS_ENABLED` and `WHATSAPP_FOLLOWUP_ENABLED` off until mail and the Meta template are ready; start `LIFECYCLE_MAX_PER_RUN=20`.
4. Create plans in the admin screen (pricing below). Confirm where free-plan limits (2 jobs, 10 searches/day, 3 free hires) live.
5. Run `node --test server/tests/payments/*.test.js` (not runnable in my sandbox; one assertion in webhook.test.js changed).
6. Open items, in order: move FreeAssessment.jsx to the new test endpoint; random passwords for CSV-imported students; protect /uploads; "Request refund" button; bounce handling and TLS rejectUnauthorized fix in sendEmail.
7. Run the smoke test in DEV_BRIEF section 8 before announcing, plus the onboarding test in section 9 (new student, company and college each see the tour once, then the checklist), plus the PWA real-device tests in section 10.

## Accounts, keys and external setup checklist (dev ticks each; owner shown)
| # | Item | Sneha creates; Kamar only approves | Dev sets / tests |
|---|---|---|---|
| 1 | OpenRouter account with credit (all AI features, question bank seeding) | Sneha; Kamar approves card | `OPENROUTER_API_KEY`; seed bank; test resume review, resume builder, matching |
| 2 | Razorpay LIVE keys and webhook | Sneha; Kamar does KYC/OTP if asked | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, client `VITE_RAZORPAY_KEY_ID`; webhook URL in Razorpay dashboard; real small payment + refund test |
| 3 | Google sign-in (OAuth client) | Sneha | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`; test login and signup |
| 4 | **LinkedIn sign-in/sign-up** (button is on Login and Register) | Sneha creates LinkedIn developer app, enables "Sign in with LinkedIn using OpenID Connect", redirect `https://<api-domain>/api/auth/linkedin/callback` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_CALLBACK_URL`; test with a real account. Until set, the button leads nowhere |
| 5 | Mail sending service (SES or Brevo), hello@ stays on Hostinger | Sneha chooses (SES recommended); Kamar approves card | see Mail service block; `MAIL_FROM`, `MAIL_REPLY_TO`, SMTP values |
| 6 | Meta WhatsApp: new template approved; app secret; webhook | Sneha submits the template; Kamar approves business verification if asked | confirm existing WhatsApp token/phone-number env already set; `WA_APP_SECRET`; subscribe webhook to `messages`; `WHATSAPP_FOLLOWUP_ENABLED` last |
| 7 | GA4 and Meta Pixel | SEO team | client `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`; mark key events |
| 8 | Google Search Console and Bing Webmaster | SEO team | submit `sitemap.xml` |
| 9 | Footer and invoice details | Kamar gives phone and GSTIN (his info) | `FOOTER_PHONE`, `GSTIN`, `FOOTER_ENTITY`, `FOOTER_ADDRESS`, `API_PUBLIC_URL` |
| 10 | Core secrets | Dev | `JWT_SECRET` (32+), `MONGODB_URI`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+) |
| 11 | CA answer on GST tax invoice (invoice number, SAC code) | Kamar asks the CA | decide receipt vs tax invoice |

## Mail service (decided: keep hello@ on Hostinger, send through a service)
- `hello@velaivaaipu.in` already exists on Hostinger. Keep it as the visible From and Reply-To (`MAIL_FROM="Velaivaaipu" <hello@velaivaaipu.in>`, `MAIL_REPLY_TO=hello@velaivaaipu.in`). No new address needed. Do not send bulk mail through the Hostinger login (low limits, suspension risk); it only receives replies.
- Sending service for all app mail (OTP, receipts, refunds, lifecycle): Amazon SES Mumbai (recommended, needs production access request) or Brevo (free about 300 a day, shared by all mail; fine for the first weeks). No code change, only env: `EMAIL_HOST`, `EMAIL_PORT`, `USER_EMAIL`, `USER_PASS`.
- DNS (dev): keep Hostinger MX. ONE SPF record including Hostinger and the service. Add the service's DKIM records. DMARC `v=DMARC1; p=none; rua=mailto:<inbox>`, move to quarantine after 2 clean weeks.
- Rollout (dev): 0) test OTP to Gmail/Outlook/Yahoo and check SPF/DKIM/DMARC PASS today; 1) DNS; 2) account and domain verification; 3) switch OTP and receipts first, off-peak, keep old values for rollback, turn TLS check back on (`rejectUnauthorized`); 4) bounce and complaint handling in week 1 (not built; until then remove bounces by hand); 5) lifecycle mails: 20/day week 1, 50, 100, 150; pause if complaints above 0.1% or hard bounces above 2%.
- Sneha: choose and create the sending account, add the DNS records, run the test. Kamar only approves the card. Read DMARC reports and Postmaster Tools weekly for a month. Full steps: `EMAIL_DELIVERABILITY_PLAN.md`.

## Every mail the platform sends (so nothing is missed)
| Mail | When | Switch |
|---|---|---|
| OTP, password reset | sign-up and login | always on |
| Welcome | right after email verification (**sent as soon as this is deployed, through whatever SMTP is set, so finish the mail service first or accept the current sender**) | always on |
| GST receipt (plan, first recurring charge, pay-per) | after payment | always on |
| Refund request received / approved / rejected | refund flow | always on |
| Contact-form auto-reply (by segment) | contact form | always on |
| Student: profile nudge (day 2, day 7, monthly while under 70%), skill-test invite, skill gap + course | lifecycle | `LIFECYCLE_EMAILS_ENABLED` |
| Student: paid Job Alerts (daily/weekly/monthly), win-back | lifecycle | `LIFECYCLE_EMAILS_ENABLED` |
| Company: complete company page, first-job tips, post-a-job templates | lifecycle | `LIFECYCLE_EMAILS_ENABLED` |
| College: verify (day 3), create first drive (day 4), share QR (day 7), monthly batch readiness | lifecycle | `LIFECYCLE_EMAILS_ENABLED` |
Rules: one lifecycle mail per person per day, daily cap, unsubscribe link and one-click header on every lifecycle mail, no mail to placeholder `@...portal` addresses. WhatsApp: `course_followup_after_skill_test` only (switch `WHATSAPP_FOLLOWUP_ENABLED`).

## What is in this release (all in the patch)
Refund rules and legal pages; GST receipts; campus QR test with server-side scoring and question bank; WhatsApp consent and course follow-up; lifecycle mail engine; onboarding for all portals (DEV_BRIEF section 9); PWA (DEV_BRIEF section 10, run `python3 scripts/pwa_check.py` then test on real phones); claims clean-up (fake testimonials, 3x claim, +543 counter removed); AI wording and providers in the Privacy Policy.
Not built yet (plans only): relevance engine (`RELEVANCE_AND_AI_ASSISTANT_PLAN.md`), OpenAI assistant, web push, bounce handling, request-refund button, FreeAssessment answer exposure fix, CSV default passwords, protected uploads.

## Meta template (Sneha submits in WhatsApp Manager and switches on after approval)
Only one new template. All other templates the app uses are already verified (list in `WHATSAPP_TEMPLATES.md`; dev checks each is Approved and the variable counts match).

- Name `course_followup_after_skill_test`, category Marketing, language `en`, no header/footer/buttons.
- Body:
```
Hi {{1}}, thanks for taking the {{2}} skill test on Velaivaaipu. To build this skill faster, our {{3}} course can help. {{4}}. Know more: {{5}}

Reply STOP to unsubscribe.
```
- Samples: {{1}} Priya | {{2}} MS Excel | {{3}} Data Analytics with Power BI | {{4}} Festival scholarship price Rs 2999 for students | {{5}} https://learnwithkamar.ai
- {{4}} changes by date (festival scholarship line, otherwise a free 15-minute counselling call), so one template covers both.
- After approval, dev: subscribe webhook `https://<api-domain>/api/whatsapp/webhook` to the `messages` field; set `WHATSAPP_FOLLOWUP_ENABLED=true`, `COURSE_PAGE_URL`, `WA_APP_SECRET`; for a festival set `COURSE_SCHOLARSHIP_ACTIVE=true`, `_PRICE`, `_START`, `_END` (YYYY-MM-DD, India time).
- Rules already in code: consent box ticked, score below 60%, one message per student, 9am-8pm IST, STOP honoured.

## SEO team
- Submit sitemap.xml to Google Search Console and Bing; check a job URL in the Rich Results Test (JobPosting).
- Create GA4 and Meta Pixel, give IDs to dev; mark sign_up, generate_lead, skill_test_complete as key events.
- UTM-tag each college QR link (`?utm_source=college&utm_medium=qr&utm_campaign=<college-code>`).
- Content: /for-colleges, "jobs in Pondicherry" page, three blog posts. Position as "AI-powered job platform" using only claims in DEV_BRIEF section 7 (no invented numbers or testimonials).

## Only Kamar can do (everything else is Sneha)
1. Give the support phone/WhatsApp number for the footer (`FOOTER_PHONE`) and the GSTIN.
2. Confirm sender names (for example "Velaivaaipu", "Velaivaaipu Careers", "Velaivaaipu Campus").
3. Approve any payment card, KYC or OTP that Razorpay, Meta, the mail service or OpenRouter asks for in the company's name.
4. Ask the CA: GST tax invoice needs invoice number and SAC code; what does Razorpay's invoice already cover?
5. Festival scholarship dates and price (current placeholder 2026-10-30 to 2026-11-12).
6. Decide the AI assistant questions in `RELEVANCE_AND_AI_ASSISTANT_PLAN.md` section 4 (OpenAI for the assistant only or everywhere; first job of the assistant; languages), and approve the relevance plan.

## Pricing (locked; GST extra, yearly = 10 months)
Companies per month: Free Rs 0 | Starter Rs 999 | Growth Rs 2,499 | urgent hiring to CoreTalents.
Colleges per year: Free (100 students) | Standard Rs 9,999 (500) | Plus Rs 19,999 (1,500) | Max Rs 34,999 (3,000) | above 3,000 about Rs 10 a student. MoU colleges: 60-day Standard trial. Job Alerts Rs 49 for 30 days. Students free.
