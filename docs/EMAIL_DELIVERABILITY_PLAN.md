# Getting Velaivaaipu mail into the inbox (site is already live)

## Answers

1. **Which address?** Keep using `hello@velaivaaipu.in`. It is the address people see in From and the address replies go to (Reply-To). Replies are a good signal for Gmail. Do **not** use that free mailbox's own SMTP login to send volume: free mailboxes have low sending limits and the host can suspend them. Keep the mailbox for receiving.
2. **Third party?** Yes. Use a sending service for all app mail (OTP, receipts, refund mails, lifecycle mails). It authenticates the mail for your domain, gives better reputation, and reports bounces and complaints.
   - **Recommended: Amazon SES, Mumbai region.** Very cheap at your volume (check the current price), scales later. Needs about an hour of developer setup and a request for "production access".
   - **Simpler alternative: Brevo.** Free plan has a daily limit (about 300 a day; check current terms), which OTPs, receipts and lifecycle mail would share. Fine for the first weeks, small later.
   - Zoho ZeptoMail is transactional only, so it would not cover lifecycle mail.
3. **Code change needed?** No provider switch in code. The app already sends through SMTP, so SES or Brevo is just new environment values. This patch adds `MAIL_FROM` and `MAIL_REPLY_TO` so the visible sender stays `hello@velaivaaipu.in` while the SMTP login is the service's own.

## Because the site is live: rollout in order

**Step 0, today (30 minutes, nothing to buy).** Check what real users get now. This matters most because sign-up depends on the OTP email.
- Register a test account with a Gmail, an Outlook and a Yahoo address. Does the OTP land in the inbox or spam?
- In Gmail open the mail, "Show original", and look for SPF: PASS, DKIM: PASS, DMARC: PASS. Any FAIL is the first thing to fix.
- Send a mail to the address shown on mail-tester.com and note the score. Check the domain on MXToolbox for blacklists.
- Set up Google Postmaster Tools for velaivaaipu.in (free; shows spam rate and reputation).

**Step 1, DNS (developer, same day).** At the domain registrar:
- **SPF:** one single TXT record for the domain that includes every sender (the mailbox host and the new service). Two SPF records break it.
- **DKIM:** the service gives you records (SES: three CNAMEs). Add them.
- **DMARC:** `v=DMARC1; p=none; rua=mailto:<an inbox you read>`. After two weeks of clean reports change `p=none` to `p=quarantine`.
- Optional but good: a custom return-path (SES "custom MAIL FROM") such as `bounce.velaivaaipu.in`.

**Step 2, service account (you create it with a card; developer configures).** Verify the domain. For SES, request production access and say: transactional mail plus opt-in lifecycle mail for registered users, with unsubscribe and bounce handling.

**Step 3, switch OTP and receipts first (off-peak).** Set `EMAIL_HOST`, `EMAIL_PORT`, `USER_EMAIL` (the service's SMTP username), `USER_PASS`, `MAIL_FROM="Velaivaaipu" <hello@velaivaaipu.in>`, `MAIL_REPLY_TO=hello@velaivaaipu.in`. Keep the old values somewhere so you can roll back in a minute. Re-run Step 0 tests. Also set the TLS check back on (the code currently skips certificate checks; developer to change `rejectUnauthorized`).

**Step 4, bounces and complaints (developer, within the first week).** SES reports each hard bounce and spam complaint (through SNS to a webhook). Mark those addresses so we never mail them again (use `emailPrefs.marketingOptOut` and a new `bounced` flag). Not built yet, so until it is, keep volume low and remove bounced addresses by hand.

**Step 5, lifecycle mails, slowly.** Turn on `LIFECYCLE_EMAILS_ENABLED=true` with `LIFECYCLE_MAX_PER_RUN=20`. Week 1: 20 a day. Week 2: 50. Week 3: 100. Then 150. Pause if complaints go above 0.1% or hard bounces above 2%.

## Already done in the code (this patch)

- Unsubscribe link in every lifecycle mail, plus the `List-Unsubscribe` and one-click headers that Gmail and Yahoo expect from bulk senders.
- Never mails the `@college.portal` placeholder addresses, which would bounce.
- One lifecycle mail per person per day, and a daily cap.
- Plain, short mail with a real company footer and address, no link shorteners, no image-only mail.
- Only registered users are mailed. Never import or buy lists.

## Who does what

| Who | What |
|---|---|
| You | Approve the service (SES recommended), create the account and add a card, give the developer access to the domain DNS |
| Developer | Step 0 test, DNS, service setup, env switch, bounce handling, TLS fix |
| You (later) | Read the DMARC reports and Postmaster Tools weekly for the first month |
