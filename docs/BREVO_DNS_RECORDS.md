# Brevo DNS records for velaivaaipu.in

Current live DNS (checked 2026-10-24): MX = Hostinger (keep), SPF = `v=spf1 include:_spf.mail.hostinger.com ~all`, DMARC = `v=DMARC1; p=none` (no report address). No Brevo records yet.

## Steps in Brevo
1. Create the account under the company mailbox (Kamar approves card/OTP). Settings > Senders, Domains > Domains > Add `velaivaaipu.in`. Brevo shows the exact records below for this account.
2. Senders > add `hello@velaivaaipu.in` as a sender (Brevo emails a confirmation to that Hostinger mailbox).
3. SMTP & API > SMTP: note the login and create an SMTP key.

## Records to add at the DNS host
Edit, do not duplicate, the SPF record. There must be exactly ONE SPF TXT record.

| Type | Host | Value |
|---|---|---|
| TXT (edit existing) | `@` | `v=spf1 include:_spf.mail.hostinger.com include:spf.brevo.com ~all` |
| DKIM | the two names Brevo shows (usually `brevo1._domainkey` and `brevo2._domainkey`) | Copy the exact values from the Brevo domain screen; they are unique to the account |
| TXT | `@` | the `brevo-code:...` verification record Brevo shows (a separate TXT; it does not touch SPF) |
| TXT (edit existing) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:<an inbox you read>` |

Do not guess the DKIM values. Brevo's screen is the source of truth; if it differs from the names above, pass the real names to the check script.

## Verify
`cd server && node scripts/checkMailDns.js velaivaaipu.in brevo1._domainkey brevo2._domainkey` (use the names Brevo gave you). Expect all PASS; DNS can take minutes to a few hours. Then click Authenticate in Brevo.

## Server env for Brevo (used on the next task, Day 2-3)
- `EMAIL_HOST=smtp-relay.brevo.com`
- `EMAIL_PORT=587`
- `USER_EMAIL=<Brevo SMTP login>`
- `USER_PASS=<Brevo SMTP key>`
- `MAIL_FROM="Velaivaaipu" <hello@velaivaaipu.in>`, `MAIL_REPLY_TO=hello@velaivaaipu.in`

## Inbox test (today)
Register test accounts on Gmail, Outlook and Yahoo. In Gmail open the OTP mail > Show original and confirm SPF, DKIM and DMARC all say PASS. Also send to the address on mail-tester.com, and set up Google Postmaster Tools for the domain.

Brevo's free plan is about 300 mails a day shared by all mail (check current terms). The rollout caps (20, then 50, 100, 150 a day) stay within that.
