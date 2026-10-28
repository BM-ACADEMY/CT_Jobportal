# External requests pack (Day 1)

Register everything under the company mailbox (hello@velaivaaipu.in or a tech@ alias), never a personal email. Kamar only approves cards, KYC and OTPs. Replace `<api-domain>` with the real API host (the examples in `.env.example` use `api.velaivaaipu.in`).

Submit in this order. Items 1 and 2 have waiting time, so send them first.

## 1. Meta WhatsApp template (approval takes 1 to 3 days)
Meta Business Manager > WhatsApp Manager > Message templates > Create.
- Name: `course_followup_after_skill_test`
- Category: Marketing. Language: English (`en`). No header, footer or buttons.
- Body:
  ```
  Hi {{1}}, thanks for taking the {{2}} skill test on Velaivaaipu. To build this skill faster, our {{3}} course can help. {{4}}. Know more: {{5}}

  Reply STOP to unsubscribe.
  ```
- Samples: {{1}} Priya | {{2}} MS Excel | {{3}} Data Analytics with Power BI | {{4}} Festival scholarship price Rs 2999 for students | {{5}} https://learnwithkamar.ai
- Also collect from the Meta app: App Secret (Settings > Basic) for `WA_APP_SECRET`, the phone number ID for `WA_PHONE_NUMBER_ID`, and choose a verify token for `WA_VERIFY_TOKEN`.
- After approval (dev): subscribe webhook `https://<api-domain>/api/whatsapp/webhook` to the `messages` field.
- Kamar: approves business verification or OTP if Meta asks.

## 2. Mail sending service (SES production access takes 1 to 2 days)
Decision first: Amazon SES Mumbai (recommended) or Brevo (about 300 mails a day shared by all mail, fine for the first weeks). `hello@` stays on Hostinger for receiving replies; do not send bulk mail from it.
- Create the account, add and verify the domain `velaivaaipu.in`.
- SES: request production access (use case: transactional OTP and receipts, plus opt-in lifecycle mail with one-click unsubscribe; expected volume 20 a day rising to 150).
- DNS: keep the Hostinger MX. Exactly ONE SPF TXT record that includes Hostinger and the service. Add the service's DKIM records. DMARC TXT on `_dmarc`: `v=DMARC1; p=none; rua=mailto:<inbox>`; move to quarantine after 2 clean weeks.
- SMTP credentials go to env: `EMAIL_HOST`, `EMAIL_PORT`, `USER_EMAIL`, `USER_PASS`. Keep `MAIL_FROM="Velaivaaipu" <hello@velaivaaipu.in>` and `MAIL_REPLY_TO=hello@velaivaaipu.in`.
- Kamar: creates the account with a card and gives dev DNS access.
- Full steps: `docs/EMAIL_DELIVERABILITY_PLAN.md`.

## 3. LinkedIn login
developer.linkedin.com > Create app (needs a LinkedIn company page) > Products > add "Sign In with LinkedIn using OpenID Connect" > Auth > redirect URL `https://<api-domain>/api/auth/linkedin/callback`.
- Env: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_CALLBACK_URL` (same URL).
- Not yet tested against a real app: test each role after deploy.

## 4. Google OAuth (confirm redirect only)
Google Cloud Console > Credentials > the OAuth client. Authorized redirect URI: `https://<api-domain>/api/auth/google/callback` (matches `GOOGLE_CALLBACK_URL`). Authorized origins: the site domains in `ALLOWED_ORIGINS`.

## 5. GA4
analytics.google.com > Create property > Web data stream for `https://velaivaaipu.in`. Copy the Measurement ID (`G-XXXXXXXXXX`) to Vercel `VITE_GA_MEASUREMENT_ID`. After the first events arrive, mark `sign_up`, `generate_lead` and `skill_test_complete` as key events.

## 6. Meta Pixel
Meta Events Manager > Connect data source > Web > create the dataset. Copy the numeric ID to Vercel `VITE_META_PIXEL_ID`.

## 7. Search Console and Bing
- search.google.com/search-console: add the domain property (DNS TXT verification), then submit `https://velaivaaipu.in/sitemap.xml`.
- Bing Webmaster Tools: import from Search Console or add the site, submit the same sitemap.
- Test one job URL (`/job/<title>-<city>-<id>`) in the Rich Results Test; it should show JobPosting.

## 8. Other keys already needed for deploy
- OpenRouter: account with credit, key to `OPENROUTER_API_KEY`.
- Razorpay live: key id and secret, webhook secret. Webhook `https://<api-domain>/api/payments/razorpay/renewal-webhook` with events `order.paid`, `subscription.charged`, `subscription.halted`, `subscription.pending`.

## What Kamar approves
Card for the mail service, KYC or OTP for Meta, Razorpay live and any OTP for LinkedIn or Google. Also from Kamar: `FOOTER_PHONE`, sender names, festival dates and price, the CA's answer on the GST invoice.
