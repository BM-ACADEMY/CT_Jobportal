# Bounce and complaint handling (Brevo)

## What it does
`POST /api/webhooks/email/brevo?secret=<BREVO_WEBHOOK_SECRET>` (`server/routes/emailWebhook.js`) receives Brevo's transactional events and updates every user with that email:
| Brevo event | Effect |
|---|---|
| hard bounce, invalid email | `emailPrefs.marketingOptOut = true`, `bounced = true`, `bouncedAt`, `bounceReason = hard_bounce` |
| spam (complaint) | `marketingOptOut = true`, `bounceReason = complaint` |
| unsubscribed | `marketingOptOut = true` |
| soft bounce, delivered, anything else | ignored |

Lifecycle mail already skips anyone with `marketingOptOut`, so a bounce or complaint stops it from the next run. OTP, receipts and security mail are deliberately NOT suppressed (a fixed mailbox may work again). The endpoint answers 401 unless the secret matches, and rejects everything if `BREVO_WEBHOOK_SECRET` is unset.

## Setup (dev)
1. Server env: `BREVO_WEBHOOK_SECRET=<a long random string>` (for example `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`). Restart.
2. Brevo > Transactional > Settings > Webhook > Add: URL `https://<api-domain>/api/webhooks/email/brevo?secret=<the same value>`. Tick: Hard bounce, Invalid email, Spam (complaint), Unsubscribed.
3. Test: send a mail to `bounce@simulator.amazonses.com` is SES-only; for Brevo use Brevo's "Send a test" on the webhook if offered, or send to a made-up address on a real domain, wait for the hard bounce event, then check the user record has `emailPrefs.bounced: true`.
4. Weekly in week 1: compare Brevo's bounce and complaint counts with the number of users with `emailPrefs.bounced` or `bounceReason: complaint`. Pause rule stays: complaints above 0.1% or hard bounces above 2%.

## Known gaps
- Only lifecycle mail and the unsubscribe page read `marketingOptOut`. Other senders (for example recruiter bulk messaging) do not check it yet; they still reach bounced addresses.
- Addresses that never had a User row (such as contact-form senders) are not recorded.
- Brevo's own blocklist also stops sending to hard-bounced addresses on their side.
