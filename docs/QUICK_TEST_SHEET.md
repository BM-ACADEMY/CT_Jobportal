# Quick test sheet (about 20 minutes)

Run this after every deploy, on the live site (`https://velaivaaipu.in`), on a phone and once on a laptop.
Tick **Pass** or write what you saw under **Fail**. If anything in sections 1 or 2 fails, stop and tell the developer before going on.

Test accounts: use your own Gmail for the student, a second email for the company, and the admin login you created. Never share passwords in a chat.

## 1. Site is up (2 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 1.1 | Home page opens, no error message, jobs list shows | | |
| 1.2 | Press F12 > Network, reload: the `jobs` request goes to `api.velaivaaipu.in` and is status 200 | | |
| 1.3 | `/privacy-policy`, `/terms`, `/refund-policy`, `/for-colleges` all open | | |
| 1.4 | Footer shows the company name, address and phone `+91 78269 97187` | | |

## 2. Sign up and login (5 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 2.1 | Register a new student with email: the OTP email arrives (check Spam too) | | |
| 2.2 | Enter the OTP: you land on the student dashboard | | |
| 2.3 | Log out, log in again with email and password | | |
| 2.4 | "Forgot password": the reset email arrives and the new password works | | |
| 2.5 | Wrong password shows a clear error, not a blank page | | |
| 2.6 | The login page has no Google or LinkedIn buttons (they are switched off on purpose) | | |

## 3. Free skill test (4 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 3.1 | `/free-assessment`: the skill dropdown lists the skills (17 once the bank is seeded) | | |
| 3.2 | Choose MS Excel: 10 questions, one at a time | | |
| 3.3 | Finish: score shows, right answers and explanations appear only now | | |
| 3.4 | Logged in as a student: the result is saved under "Skill tests" | | |
| 3.5 | Logged out: "Create free account" keeps the result after sign-up | | |

## 4. Jobs (4 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 4.1 | Student: search a job, open it, apply, and it shows under applications | | |
| 4.2 | Company: log in, Post Job. The quality score and tips panel appears while typing | | |
| 4.3 | Company: leave skills empty: the tip says the job is shown to fewer people | | |
| 4.4 | Company: publish the job. It shows on the public list | | |
| 4.5 | Company: open the applicants. The student's resume opens (signed link works) | | |
| 4.6 | Only if `RELEVANCE_ENGINE_ENABLED=true`: student's "Matched for you" tab shows "Why this job" lines | | |

## 5. Documents (2 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 5.1 | A resume opens from the company's applicants page | | |
| 5.2 | A certificate opens from the QR test result | | |
| 5.3 | Copy a document link into a private window without logging in: it must NOT open once it has expired (a few minutes) | | |

## 6. College QR test (see `docs/QR_TEST_SHEET.md` for the full version) (3 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 6.1 | Scan the college QR on a phone: it opens the test page | | |
| 6.2 | Register, give consent, finish the MS Excel test | | |
| 6.3 | Score and certificate show; scanning the certificate QR opens the verification page | | |
| 6.4 | Retake the same test: it is blocked or asks you to wait | | |

## 7. Admin (2 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 7.1 | `admin.velaivaaipu.in`: log in with the new admin | | |
| 7.2 | Dashboard and users list open | | |
| 7.3 | The old test admins (`admin@ct.com`, `admin123@gmail.com`, `newadmin@example.com`) cannot log in | | |

## 8. Phone (PWA) (2 min)
| # | Check | Pass | Fail |
|---|---|---|---|
| 8.1 | On Android Chrome: "Add to Home screen" works; the app opens full screen | | |
| 8.2 | Pages fit the screen with no sideways scrolling | | |

## Not in this sheet (on purpose)
- Payments, refunds and receipts: skipped until the Razorpay account is unlocked.
- WhatsApp follow-ups and lifecycle emails: switched off. Test them when you switch them on (`docs/WHATSAPP_SWITCH_ON.md`, `docs/LIFECYCLE_GO_LIVE.md`).
- AI assistant: switched off until the OpenAI key and legal wording are ready.

## If something fails
Write down: the page, what you did, what you saw, the time, and a screenshot. For a server problem, the developer runs `pm2 logs --lines 50` on the VPS at that moment.

Result: ____ of ____ passed.  Tested by: ________  Date: ________
