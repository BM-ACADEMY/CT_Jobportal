# Velaivaaipu launch handoff (pricing locked)

Apply the code: `git checkout 7ba33a5 && git am launch-fixes.patch`. Full detail: `DEV_BRIEF.md`.

## Dev (short brief)
1. Set server env from `server/.env.example`: JWT_SECRET (32+), MONGODB_URI, FRONTEND_URL, ALLOWED_ORIGINS, Razorpay keys + webhook secret, SMTP, `OPENROUTER_API_KEY`, `API_PUBLIC_URL`, `MAIL_FROM`/`MAIL_REPLY_TO` (hello@velaivaaipu.in), `FOOTER_PHONE`, `WA_APP_SECRET`, Google and LinkedIn OAuth. Client: `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`.
2. Deploy server and client together. Then seed questions: `cd server && node scripts/generateQuestionBank.js --sets 5`.
3. Mail: make hello@ able to send (Amazon SES Mumbai or Brevo, SPF/DKIM/DMARC). Keep `LIFECYCLE_EMAILS_ENABLED` and `WHATSAPP_FOLLOWUP_ENABLED` off until mail and the Meta template are ready; start `LIFECYCLE_MAX_PER_RUN=20`.
4. Create plans in the admin screen (pricing below). Confirm where free-plan limits (2 jobs, 10 searches/day, 3 free hires) live.
5. Run `node --test server/tests/payments/*.test.js` (not runnable in my sandbox; one assertion in webhook.test.js changed).
6. Open items, in order: move FreeAssessment.jsx to the new test endpoint; random passwords for CSV-imported students; protect /uploads; "Request refund" button; bounce handling and TLS rejectUnauthorized fix in sendEmail.
7. Run the smoke test in DEV_BRIEF section 8 before announcing.

## Meta template (Kamar submits; dev switches on after approval)
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

## From Kamar
1. Support phone/WhatsApp for the footer (FOOTER_PHONE).
2. Confirm sender names, and that hello@velaivaaipu.in can be given SMTP/API sending.
3. Confirm Meta template `course_followup_after_skill_test` is submitted and approved (old templates already verified).
4. CA: GST tax invoice needs invoice number and SAC code; ask what Razorpay's invoice already covers.
5. Festival scholarship dates and price (current placeholder 2026-10-30 to 2026-11-12) and Meta/mail provider accounts.
6. A LinkedIn developer app (callback `https://<api-domain>/api/auth/linkedin/callback`).
7. OpenRouter account with credit.

## Pricing (locked; GST extra, yearly = 10 months)
Companies per month: Free Rs 0 | Starter Rs 999 | Growth Rs 2,499 | urgent hiring to CoreTalents.
Colleges per year: Free (100 students) | Standard Rs 9,999 (500) | Plus Rs 19,999 (1,500) | Max Rs 34,999 (3,000) | above 3,000 about Rs 10 a student. MoU colleges: 60-day Standard trial. Job Alerts Rs 49 for 30 days. Students free.
