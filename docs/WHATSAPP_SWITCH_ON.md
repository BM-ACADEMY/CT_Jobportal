# WhatsApp follow-up: switch-on and test steps

Prerequisite: Meta has approved `course_followup_after_skill_test` (see `docs/WHATSAPP_TEMPLATES.md` and `docs/EXTERNAL_REQUESTS_PACK.md` section 1).

## Code review result (`routes/whatsapp.js`, `cron/courseFollowUps.js`, `utils/whatsapp.js`)
- **Bug fixed: STOP replies could never work.** The global JSON parser in `index.js` ran first and only kept the raw request bytes for Razorpay paths, so the WhatsApp webhook never had the bytes it needs to check Meta's signature and silently ignored every message. `utils/webhookRawBody.js` now keeps them for `/api/whatsapp/` too. A test sends a correctly signed STOP through the same parser setup; it failed before the fix and passes now.
- **Bug fixed: unset verify token.** With `WA_VERIFY_TOKEN` empty, Meta's handshake could pass with no token. It now needs the token to be set and to match.
- **Improved:** "STOP.", "Stop!" and " stop " now count (punctuation and case are ignored). Normal sentences containing the word do not.
- Verified in code: one message per student (`followUp.status`), only students who ticked consent, not opted out, send window 9:00 to 20:00 India time (cron every 10 minutes, 40 per run), failures are marked `failed` and not retried, the template gets 5 parameters in the right order (name, skill, course, offer text, link), language `en`.
- Tests: `tests/auth/whatsappWebhook.test.js` (6 cases). Whole suite 130/130.

## Switch-on steps (dev, after approval)
1. In the Meta app, add the webhook `https://<api-domain>/api/whatsapp/webhook`, verify token = your `WA_VERIFY_TOKEN`, subscribe to the `messages` field.
2. Server env: `WA_PHONE_NUMBER_ID`, `META_PAGE_ACCESS_TOKEN` (a permanent system-user token, not a temporary one), `WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `COURSE_PAGE_URL`, `WHATSAPP_FOLLOWUP_ENABLED=true`, `WA_TEMPLATE_COURSE_FOLLOWUP=course_followup_after_skill_test`. Restart.
3. Festival price only: `COURSE_SCHOLARSHIP_ACTIVE=true`, `COURSE_SCHOLARSHIP_PRICE`, `COURSE_SCHOLARSHIP_START`, `COURSE_SCHOLARSHIP_END` (YYYY-MM-DD, India time). Otherwise the message offers a free 15-minute counselling call.

## Test
1. Register a test student with your own WhatsApp number, consent box ticked, and fail a test (answer under 6 of 10 correctly).
2. About 30 minutes later (`WHATSAPP_FOLLOWUP_DELAY_MIN`, and inside 9:00 to 20:00 IST) the template message arrives. The student record shows `followUp.status = sent`.
3. Reply `STOP`. The student record shows `whatsappOptOut = true`. Check the server log has no `[WhatsApp] Webhook error`.
4. A second failed skill for the same student sends nothing (one message per student). A student with the consent box unticked gets nothing.
5. Check Meta's webhook dashboard shows 200 deliveries.

## Other templates (already verified by the team)
`docs/WHATSAPP_TEMPLATES.md` lists each template name and the parameter order the code sends. In WhatsApp Manager, confirm each shows Approved and that its number of `{{variables}}` equals the code's parameter count. Two exceptions to know:
- `campus_welcome`, `renewal_success` and `renewal_failed` are sent through the older `sendWhatsAppMessage` helper, which posts to the n8n `whatsapp-send` webhook, not directly to Meta. They need `N8N_BASE_URL` and the n8n flow to be running; they are not covered by the Meta env above.
- The skill-certificate message reuses `offer_letter_document_delivery` (name, college, "<skill> Certificate", link). Check that template's wording suits a certificate.
