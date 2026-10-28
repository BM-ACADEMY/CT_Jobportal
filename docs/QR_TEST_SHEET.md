# Full QR test sheet (run on the deployed site, as a student)

Prerequisites: server and client deployed together, `OPENROUTER_API_KEY` has credit, question bank seeded (`cd server && node scripts/generateQuestionBank.js --sets 5`). You need a drive QR/link from a test college account (college dashboard > drive > QR), a phone with WhatsApp, and an email inbox you can read.

Pass mark is 60% (`PASS_RATIO` in `server/config/courseMap.js`); each set has 10 questions. Answering faster than 2 seconds per question is rejected as "too quick", so take at least 20 seconds.

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Open the drive link on a phone (`/...drive/<code>`) | Drive page loads, form asks only name + WhatsApp number (plus optional consent box) | |
| 2 | Register with a real WhatsApp number; leave the consent box ticked | Student created, test category picker shown | |
| 3 | Pick "MS Excel" and start | 10 questions appear. In DevTools > Network, the response has NO correct answers, only an `attemptToken` | |
| 4 | Answer in more than 20 seconds, aiming for 7 or more right, and submit | Score shown, `passed: true`, certificate code `CERT-XXXXXXXX` | |
| 5 | Download the certificate | PDF opens with name, skill, score, code. Co-branded only if the college is on a paid plan | |
| 6 | Check email | "You passed the MS Excel skill assessment!" with the certificate link (needs working mail) | |
| 7 | Check WhatsApp | Certificate message arrives (template `offer_letter_document_delivery`) | |
| 8 | Go back and start MS Excel again with the same student | Blocked: "You have already completed this assessment" (409, `alreadyCompleted`) | |
| 9 | Call submit again with the old token (DevTools > replay request) | 409 "already completed", score unchanged | |
| 10 | Take a different skill (e.g. Computer Basics) | Allowed once, then blocked on retake | |
| 11 | Take a skill and score below 6 right with the consent box ticked | `passed: false`, no certificate, a follow-up is queued (nothing is sent while `WHATSAPP_FOLLOWUP_ENABLED=false`) | |
| 12 | Register a second student with the consent box unticked and fail a test | No follow-up queued | |
| 13 | Result screen on Android Chrome | Install prompt offered here (not on the first screen) | |
| 14 | Admin/college dashboard | The student and scores appear; UTM source stored if the link had `?utm_source=college&utm_medium=qr&utm_campaign=<code>` | |

## Known behaviours to watch (found while reading the code)
- A failed attempt still overwrites `student.certificateCode` with a new code, so a student who passed one skill and then failed another can lose the code of the first on the student record (the earlier certificate PDF and URL are not removed but `certificateUrl` is also only replaced on a pass). Check this in step 10 if you test pass then fail.
- The retake block is checked at start and at submit, but there is no database-level lock. Two near-simultaneous submits for the same skill could both pass the check. Low risk for students, worth a unique-skill guard later.
- Rate limits are per network: 400 registrations and 600 test requests per 15 minutes per IP. A college on one Wi-Fi with a few hundred students at once could hit them. For the 50 to 100 student soft launch this is fine.
- The certificate WhatsApp message reuses the `offer_letter_document_delivery` template; check the wording is acceptable for a skill certificate.
- `FreeAssessment.jsx` still uses the old `/assessments/public` endpoint (returns answers). Not part of this QR flow; fix is on Day 8.
