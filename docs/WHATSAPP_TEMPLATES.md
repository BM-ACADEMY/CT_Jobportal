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

## Templates the app already uses (developer to confirm each is Approved in WhatsApp Manager)

Names are read from the code. The body text and approval status live in your Meta account, so compare the number of `{{variables}}` in each approved template with the parameter list below. A mismatch makes Meta reject the send.

| Template | Used for | Who gets it | Parameters in the code, in order |
|---|---|---|---|
| `campus_welcome` | After QR registration | Student | name, college name (sent through the older `sendWhatsAppMessage` helper) |
| `assessment_testinvite` | Company invites a candidate to a skill test | Candidate | name, skill, company, deadline, link |
| `offer_letter_document_delivery` | Skill certificate link; offer letter | Student, candidate | name, college or company, document name, link |
| `job_application_status_update` | Application status change | Candidate | name, job title, company, status label, link |
| `whatsapp_interview_invitation` | Interview scheduled | Candidate | name, job title, company, date, time, mode (Video Call / In-Person), link |
| `application_resume_unlockalert` | New applicant, and credit unlock alert | Recruiter | name, count, subject text, count, link |
| `bulk_candidate_communication` | Recruiter bulk message | Candidate | name, sender, subject, date, link, link |
| `off_platform_chat_bridge` | New chat message or drive invite | User, company owner | name, from, subject, message text, link |
| `verification_approval_notification` | ID, college or drive-invite verification result | Student, college, company | name, item, Approved / Rejected, note, link |
| `placement_onboarding_alert` | Drive round update | Student | name, round, status label, link |
| `campus_drive_interview_notification` | Drive announcement | Student | name, company, college, title, message (60 characters), link |
| `report_delivery_for_tp_officers_tpos` | Placement report | TPO | name, frequency, college, placement summary, link |
| `auto_renewal_billing_reminder` | Admin-sent renewal reminder | Subscriber | name, plan, expiry date, plan, link (link fixed to the right subscription page in this patch) |
| `renewal_success`, `renewal_failed` | Renewal result | College, company | name (and attempt number for failed), sent through `sendWhatsAppMessage` |
| `course_followup_after_skill_test` (new) | Course suggestion after a low score | Student who ticked consent | see above |

Template names, parameter counts and the `en` language code are what the code sends. If a template was approved under a different language code or with a different number of variables, tell the developer so the code or the template can be changed.
