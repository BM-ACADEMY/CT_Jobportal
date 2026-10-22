# WhatsApp template to submit to Meta

Submit this in WhatsApp Manager > Message templates. Approval usually takes from a few minutes to 2 days, so submit it first.

## course_followup_after_skill_test

- **Category:** Marketing
- **Language:** English (`en`)
- **Header / footer / buttons:** none (the link is inside the message)

**Body:**

```
Hi {{1}}, thanks for taking the {{2}} skill test on Velaivaaipu. To build this skill faster, our {{3}} course can help. {{4}}. Know more: {{5}}

Reply STOP to unsubscribe.
```

**Sample values (Meta asks for these):**

| Variable | Sample |
|---|---|
| {{1}} | Priya |
| {{2}} | MS Excel |
| {{3}} | Data Analytics with Power BI |
| {{4}} | Festival scholarship price Rs 2999 for students |
| {{5}} | https://learnwithkamar.ai |

**Rules the code already follows:** only students who ticked the consent box get this; one message per student; sent between 9am and 8pm IST; a STOP reply switches it off for that number.

## Switching it on (after approval)

Set on the server: `WHATSAPP_FOLLOWUP_ENABLED=true`, `COURSE_PAGE_URL=<the course page link>`, `WA_APP_SECRET=<Meta app secret>`. The scholarship is for festivals only. For a festival, set `COURSE_SCHOLARSHIP_ACTIVE=true`, `COURSE_SCHOLARSHIP_PRICE=<amount>`, `COURSE_SCHOLARSHIP_START=YYYY-MM-DD` and `COURSE_SCHOLARSHIP_END=YYYY-MM-DD`; it switches on and off by itself on those dates (India time). At all other times the message offers a free 15-minute counselling call. Message {{4}} changes with the date, so one approved template covers both.

Also in the Meta app, subscribe the webhook `https://<api-domain>/api/whatsapp/webhook` to the `messages` field, so STOP replies reach us.

## Already approved templates the app uses

- `offer_letter_document_delivery` is used to send the skill certificate link (service message).
- `assessment_testinvite` is used for assessment invites.
