# Handover status: branch launch-fixes-v2

Base: main `7ba33a5` + the 18-commit launch patch + the work below. Server tests: 231 pass. Client: production build passes, SEO tests 5 pass. Nothing here has been run against production, a real database, real phones, or a real OpenAI key.

## What was done in code (beyond applying the patch)
| Area | Change | Guide |
|---|---|---|
| Mail | SMTP TLS certificate check on (`SMTP_TLS_INSECURE` emergency switch); Brevo DNS guide and DNS check script; switch and rollback steps | MAIL_SWITCH_AND_ROLLBACK, BREVO_DNS_RECORDS |
| Mail | Brevo bounce/complaint webhook marks addresses and stops marketing mail (OTP and receipts still send) | BOUNCE_HANDLING |
| WhatsApp | STOP replies never worked (raw body was not kept for the signature check); fixed. Verify token can no longer be empty | WHATSAPP_SWITCH_ON |
| LinkedIn | Login reports unavailable if the callback URL is missing | LINKEDIN_TEST_SHEET |
| Plans | A missing Free plan no longer means unlimited jobs or searches; reactivating a job on an unlimited plan works | script printFreePlanLimits.js |
| Free assessment | Server scores the test; answers no longer sent to the browser; one submission per attempt; save endpoint trusts only a signed result | FREE_ASSESSMENT_FIX |
| Students | CSV import uses random passwords; script to reset old weak ones (dry run first) | resetCsvStudentPasswords.js |
| Security | Removed unused public routes (claim-certificate, old category start/submit) | FREE_ASSESSMENT_FIX |
| Refunds | "Request refund" button and status badges on payment history | SMOKE_TEST_SHEET |
| Relevance | Engine, "why this job", candidate ranking, Top candidates (page and email), event logging; all behind `RELEVANCE_ENGINE_ENABLED` | RELEVANCE_ENGINE |
| AI assistant | Backend, widget, draft legal wording; off until `ASSISTANT_ENABLED`, key and model are set | AI_ASSISTANT |
| Scripts | auditPrivilegedAccounts.js (read-only), printFreePlanLimits.js (read-only), resetCsvStudentPasswords.js (dry run by default), assistantLiveCheck.js (needs `--yes`) | |
| Test sheets | QR test, smoke test, onboarding, PWA devices, LinkedIn | docs/*_SHEET.md |

## Switches, all OFF by default
`LIFECYCLE_EMAILS_ENABLED`, `WHATSAPP_FOLLOWUP_ENABLED`, `RELEVANCE_ENGINE_ENABLED`, `ASSISTANT_ENABLED`, `PROTECT_DOCUMENT_UPLOADS`. Turn on one at a time, in that order of readiness: lifecycle mail after the mail switch and DNS pass; WhatsApp after Meta approves the template; relevance after the soft-launch week; assistant only after legal review and the real-key check.

## New environment variables
`SMTP_TLS_INSECURE` (leave unset), `BREVO_WEBHOOK_SECRET`, `DEFAULT_FREE_JOB_LIMIT`, `DEFAULT_FREE_SEARCH_LIMIT`, `RELEVANCE_ENGINE_ENABLED`, `ASSISTANT_ENABLED`, `AI_PROVIDER_ASSISTANT`, `OPENAI_API_KEY`, `OPENAI_ASSISTANT_MODEL`, `OPENROUTER_ASSISTANT_MODEL`, `ASSISTANT_DAILY_LIMIT`, `ASSISTANT_MONTHLY_TOKEN_BUDGET`. Also read by the code but missing from the old `.env.example`: `EMAIL_HOST`, `EMAIL_PORT`, `USER_EMAIL`, `USER_PASS`, `WA_PHONE_NUMBER_ID`, `WA_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `N8N_BASE_URL`.

## New database collections
`RecommendationEvent` (180-day auto-delete), `AssistantUsage` (counters only). New User fields: `emailPrefs.bounced`, `bouncedAt`, `bounceReason`. New Assessment field: `submittedAt`.

## Not done, needs a person
1. Deploy; OpenRouter credit; seed the question bank; run the QR, smoke, onboarding, LinkedIn and PWA device sheets on the live site.
2. Accounts and keys: Brevo (card, DNS), Meta template, LinkedIn app, GA4, Pixel, Search Console, Razorpay live webhook, OpenAI key.
3. Run the three production scripts (audit privileged accounts, print free plan limits, dry-run the CSV password reset) and act on the output.
4. Decisions: free plan 2 or 3 jobs (decided: 2; the seed, fallback and updateLimit.js now say 2); whether to refresh stored plan copies on existing free users; the assistant's three decisions and token budget.
5. Legal: lawyer review of the Privacy Policy and Terms (assistant, event logging, refunds), OpenAI data terms, effective dates.
6. Open hardening items: protect `/uploads` (about 61 client links need signed URLs); CSV import still matches an existing user by phone number; the session token travels in the URL after Google/LinkedIn login; the whole branch has not been load-tested at 50 to 100 students.
7. Optional, not built: AI re-rank of the top 20 candidates, college lists in the relevance engine, home-page feed and email click tracking, an admin screen for the recommendation summary.
8. "3 free hires" is not a limit that exists in the server code.

## Order to follow
Deploy and the live test sheets, then the mail switch, then lifecycle mail at 20 a day, then WhatsApp after approval, then the soft launch with one college for a week. After one clean week: relevance engine on, compare the summary numbers; then the assistant after legal review.
