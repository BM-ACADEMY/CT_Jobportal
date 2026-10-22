# Velaivaaipu lifecycle mails (from the Afra Ventures Smart Reply Mail Plan, 7 Oct 2026)

What the plan asks for Velaivaaipu, what is built, and what is still needed. The engine is off until a developer sets `LIFECYCLE_EMAILS_ENABLED=true` (see the env list at the end).

## Built

| Plan row (Platform lifecycle mails) | Mail | Code |
|---|---|---|
| Job seeker signs up | Welcome + first step (also company, recruiter, college versions) | `utils/lifecycleEmails.js` `sendWelcomeEmail`, called after OTP verification and social sign-up |
| Job seeker profile under 70% after 2 days | "Recruiters skip incomplete profiles" | rule `js_profile_incomplete` |
| Job seeker profile done, no skill test | Free skill test invite | rule `js_skill_test_invite` |
| Job seeker low skill score | Skill gap mail with the matched BM Academy course (needs `COURSE_PAGE_URL`) | rule `js_skill_gap`, uses `config/courseMap.js` |
| Job seeker no login for 7 days | New jobs matching you (max once per 14 days, 3 jobs) | rule in `jobMails` |
| Company signs up | Welcome + post first job | welcome mail |
| Company first job posted | Three tips + review applicants (sent 1 to 14 days later) | rule `co_first_job_tips` |
| Company no job posted in 5 days | Ready-made job post templates | rule `co_post_job_templates`, public page `/job-post-templates` (10 roles) |
| College signs up | Welcome + create first drive | welcome mail |
| College students uploaded | Batch readiness report from skill tests (monthly, needs 10+ students and 5+ tests) | rule `cl_batch_readiness` |
| Any user, payment done | Thank-you + receipt with GST breakdown | `sendReceiptEmail` (plans, first college/company charge, pay-per) |
| Contact form (any) | Instant reply that points to the right sign-up (new "I am a" field) | `routes/publicRoutes.js` |

Free hooks #6 (skill-gap report to course), #7 (job post templates) and #8 (batch readiness report) from the plan are all built.

### Rules from the plan and how the code follows them

| Rule | Status |
|---|---|
| Under 120 words, one button | Enforced by a test on every mail |
| Personalised with name | Yes. The option they chose is used where we have it (skill test category, college) |
| Honest: no fake urgency, no job guarantee | A test fails the build if a mail says "guarantee", "100%" or "seats left" |
| One Tamil line for students | In the skill-gap mail |
| Footer: Afra Ventures Pvt Ltd, address, phone, unsubscribe | Yes. Address and phone come from `FOOTER_ADDRESS` and `FOOTER_PHONE` |
| Unsubscribe / STOP | One-click link in every lifecycle mail (`/api/public/unsubscribe`). Stops all lifecycle mail; receipts and security mail still arrive |
| Sequence stops when the person acts | Each mail is once-only (or once per period) and conditions are checked at send time, so a person who completed the step no longer qualifies |
| Never more than one mail at a time | One lifecycle mail per person per day, and a daily cap |
| Seasonal offers switch on and off by date | Scholarship line uses `COURSE_SCHOLARSHIP_START/END` (WhatsApp follow-up) |
| Email links tagged | Every link carries `utm_source=email&utm_medium=lifecycle&utm_campaign=<mail>` so GA4 shows clicks and sign-ups per mail |
| Placeholder `@college.portal` addresses | Never mailed |

## Found while mapping, and fixed

- **Job Alerts were sold but never sent.** It is a paid feature (Rs 49 pay-per, and Daily/Weekly/Monthly on plans) but no code delivered alerts. The engine now emails matching jobs to paying users at their plan frequency (or daily for the pay-per feature).
- Mails and WhatsApp messages linked to `/jobseeker/...` pages that do not exist. Server links now point to `/candidate/...` and old links redirect.
- The contact form had no rate limit and put user text into the admin email unescaped. Both fixed.

## Not built yet (and why)

| Plan row | What is needed |
|---|---|
| Company: "You've reached your free limit" and "3 free hires used" | The free limits in the plan (2 jobs, 10 searches a day, 3 free hires) are not in the code I read. Developer to confirm where the plan limits live, then add the triggers. |
| Job seeker: "no shortlist in 14 days" | Can be added from application status. Say if you want it. |
| College: renewal reminder 30 days before term | An admin-triggered renewal reminder exists; the automatic one is not built. |
| Payment done: onboarding call, referral offer | Needs a decision on who calls and what the referral offer is. |
| Cross-brand mails (BM Academy, CoreTalents, others to or from Velaivaaipu) | Those brands send from their own systems. On our side the sign-up links `/register?role=jobseeker|company|college` and `/for-colleges` work as deep links, and UTM tags are stored on campus students. Developer to confirm whether the n8n "leados" flow is the shared lead store. |
| Day 1, 3, 7 nudges for contact-form leads | Needs the lead store above. |
| Open and click metrics | Clicks show in GA4 through the UTM tags. Open tracking was left out on purpose (privacy and Gmail image blocking). |
| WhatsApp within 5 minutes of Day 0 | Only the campus QR flow has a WhatsApp welcome (`campus_welcome`). A welcome template for normal sign-ups needs a new Meta template. |
| SPF, DKIM, DMARC for velaivaaipu.in | Developer / domain admin. |

## Inputs

Footer, sender names, festival dates, the 10 job template roles and a pricing proposal are filled in `docs/DECISIONS_AND_INPUTS.md`. Still needed from Kamar: the support phone or WhatsApp number for the footer, a yes on the pricing, and approval of the sender names.

## Switching on (developer)

Set `LIFECYCLE_EMAILS_ENABLED=true`, `FRONTEND_URL`, `API_PUBLIC_URL`, `FOOTER_ADDRESS`, `FOOTER_PHONE`, optionally `LIFECYCLE_FROM`. Start with `LIFECYCLE_MAX_PER_RUN=20` for a week and watch bounces and unsubscribes, then raise it. It runs daily at 10:00 India time. Check SMTP daily limits first (a Gmail or Hostinger mailbox allows only a few hundred a day).
