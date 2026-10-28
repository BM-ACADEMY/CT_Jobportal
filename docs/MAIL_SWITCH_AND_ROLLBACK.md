# Switch OTP and receipts to Brevo, with rollback

Prerequisite: `docs/BREVO_DNS_RECORDS.md` done and `node scripts/checkMailDns.js ...` shows all PASS, domain authenticated in Brevo, `hello@velaivaaipu.in` confirmed as a Brevo sender. This release also turns the TLS certificate check on (`utils/sendEmail.js`).

## Before
Copy the current values of `EMAIL_HOST`, `EMAIL_PORT`, `USER_EMAIL`, `USER_PASS`, `MAIL_FROM`, `MAIL_REPLY_TO` to a safe place (password manager). Pick an off-peak time.

## Switch
Set on the server and restart:
- `EMAIL_HOST=smtp-relay.brevo.com`, `EMAIL_PORT=587`
- `USER_EMAIL=<Brevo SMTP login>`, `USER_PASS=<Brevo SMTP key>`
- `MAIL_FROM="Velaivaaipu" <hello@velaivaaipu.in>`, `MAIL_REPLY_TO=hello@velaivaaipu.in`

## Test (all must pass)
1. Sign-up OTP to a Gmail, an Outlook and a Yahoo address: arrives in the inbox, not spam.
2. In Gmail > Show original: SPF PASS, DKIM PASS, DMARC PASS, From is hello@velaivaaipu.in.
3. Forgot-password mail arrives.
4. Do one small real payment: receipt mail arrives, then refund it.
5. Reply to an OTP mail: the reply reaches the hello@ mailbox on Hostinger.
6. Server log shows `Email sent:` lines and no `[SMTP ERROR]`.

## If it fails
- Log shows a certificate error (e.g. `self signed certificate` or `unable to verify`): the check is working. Confirm the host name is exactly `smtp-relay.brevo.com`. Only as a short-term stopgap set `SMTP_TLS_INSECURE=true`, then fix the cause and remove it.
- Authentication error: re-create the Brevo SMTP key; the login is not the account email.
- Mails land in spam or fail DMARC: restore the old values below, then re-check DNS.
- Rollback: put the saved old values back and restart. No code change is needed. If the old Hostinger login fails the new TLS check, set `SMTP_TLS_INSECURE=true` for the rollback only.
