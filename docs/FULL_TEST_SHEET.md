# Velaivaaipu: full manual test sheet (frontend and backend)

Use this before launch and before each big release. The 20-minute version is `docs/QUICK_TEST_SHEET.md`; the automated live check is `node server/scripts/liveSmokeTest.js`. Run the automated check first.

## How to use
- Test on the live site `https://velaivaaipu.in` (or staging), on **one phone and one laptop**.
- **Frontend** = what you see and click. **Backend** = what to confirm behind it: open F12 > **Network** and check the request and status, or ask the developer to run `pm2 logs --lines 50` on the VPS at that moment.
- Write **P** (pass), **F** (fail) or **B** (blocked) in the Result column. For every F, note the page, the steps, what you saw, the time, and a screenshot.
- Never paste passwords or keys into chats or tickets.
- Rows marked **[switch]** only work when that feature is turned on in the server `.env`.
- Rows marked **[blocked: Razorpay]** wait for the payment account to be activated.

## Test accounts you need
| Role | How to get it |
|---|---|
| Student (job seeker) | register on the site with a real email you can open |
| Recruiter | register as recruiter |
| Company (and a team member) | register as company, then invite one team member |
| College (TPO) | register as college; the admin approves it (section 6) |
| Admin | the admin you created on the VPS with `create-admin.js` |

---

## 1. Public site (no login)
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 1.1 | Home page | Loads, no error banner, jobs and stats visible | `/jobs` and platform stats return 200 from `api.velaivaaipu.in` | |
| 1.2 | Job list `/jobs` | List shows; search by keyword and by location; filters work; pagination or scroll works | Search returns matching jobs only; no crash on an empty result | |
| 1.3 | Job page `/job/:id` | Title, company, salary, skills, Apply button show | Unknown id shows a "not found" page, not a blank page | |
| 1.4 | Companies `/companies`, `/companies/:id` | List and profile pages open | Company data returns 200 | |
| 1.5 | Blog `/blog`, `/blog/:slug` | List and an article open | | |
| 1.6 | Static pages | `/how-it-works`, `/contact`, `/for-colleges`, `/job-post-templates`, `/recruitment-agency-fees-india` open | | |
| 1.7 | Legal pages | `/privacy-policy`, `/terms`, `/refund-policy` open and read correctly | Privacy mentions the analytics tools; no mention of Google or LinkedIn sign-in | |
| 1.8 | Contact form | Submit with valid data shows success | A ticket or email is created; check the admin tickets page | |
| 1.9 | Unknown address `/abc123` | Friendly "page not found" | | |
| 1.10 | Footer | Company name, address, phone `+91 78269 97187`, GSTIN | | |
| 1.11 | SEO | Each public page has its own title (browser tab) | View source: description present; `/robots.txt` and `/sitemap.xml` open if used | |
| 1.12 | Tracking | Network shows `googletagmanager` and `fbevents` requests | GA4 Realtime shows your visit | |

## 2. Free skill test (public)
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 2.1 | Dropdown | Lists every reviewed skill (17 when fully seeded) | `GET /api/assessments/skills` returns the same list | |
| 2.2 | Take a test | 10 questions, next/back, cannot skip to the end by URL | `GET /api/assessments/bank` response has **no** correct answers | |
| 2.3 | Finish | Score, then right answers and explanations | `POST /api/assessments/bank/submit` returns the score; submitting instantly is refused (400) | |
| 2.4 | Result for a logged-in student | Saved under "Skill tests" | `POST /api/skill-tests/save` 200; same skill again replaces the old result | |
| 2.5 | Result for a guest | "Create account" keeps the result after sign-up | The result token is used once after login | |
| 2.6 | Each new skill | Take one test per skill; questions make sense (Dev 2 review list) | Bad sets are `active:false` in the database | |
| 2.7 | Tampering | Change the score in the browser before saving | Server ignores it and uses its own signed score | |

## 3. Sign up, login, account
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 3.1 | Register student | Form validates; OTP screen appears | OTP email arrives within 2 min (also check Spam); `pm2 logs` shows no mail error | |
| 3.2 | Wrong OTP | Clear error; resend works after the wait | Too many wrong tries are limited | |
| 3.3 | Correct OTP | Lands on the student dashboard | Account created once; a second registration with the same email is refused | |
| 3.4 | Login with email and password | Lands on the right dashboard for the role | JWT stored; refresh keeps you logged in | |
| 3.5 | Wrong password | Error message, no crash | 4xx, not 500; many tries get rate limited | |
| 3.6 | Forgot password | Reset email arrives; new password works; old one does not | Reset link expires and cannot be reused | |
| 3.7 | Logout | Returns to the public site; back button does not show private pages | | |
| 3.8 | Company login page `/company-login` | Company and recruiter can log in | | |
| 3.9 | Google and LinkedIn | No buttons on login or register | `GET /api/auth/google` and `/linkedin` return 404 | |
| 3.10 | Role protection | Open `/company/jobs` while logged in as a student | Redirected or blocked; API returns 401 or 403 | |
| 3.11 | Session | Log in on phone and laptop at once | Both work | |

## 4. Student (job seeker) portal
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 4.1 | Onboarding tour | Shows once after first login, then the checklist and banner | Completing it is remembered (no tour on next login) | |
| 4.2 | Profile | Edit name, headline, skills, location, education, experience; save; refresh keeps changes | `PUT` returns 200; profile completion % updates | |
| 4.3 | Upload resume | Upload a PDF; it shows; re-open it | File saved; opening uses a **signed link**; a link copied to a private window stops working after a few minutes | |
| 4.4 | Public profile `PublicProfile` | Opens and shows allowed info only | No email, phone or private data leaks | |
| 4.5 | Apply to a job | Apply, see it in `/candidate/applications` | Application count on the job increases by one; applying twice is refused | |
| 4.6 | Application questions | If the job has questions, they must be answered | Answers are stored with the application | |
| 4.7 | Save a job | Heart or save; appears in Saved jobs; remove works | | |
| 4.8 | Matching jobs "Matched for you" | Tab shows jobs; **[switch RELEVANCE_ENGINE_ENABLED]** each shows "Why this job", best match first, already-applied jobs gone | Thin profile shows nearby jobs only | |
| 4.9 | Job alerts `/candidate/job-alerts` | Create and delete an alert | **[switch lifecycle mails]** alert email arrives | |
| 4.10 | Skill tests `/candidate/skill-tests` | History of results; retake works | | |
| 4.11 | Resume builder `/candidate/resume-builder` | Fill, generate, download PDF; layout is readable | AI call succeeds; on failure a polite message shows, not a crash | |
| 4.12 | AI resume review `/candidate/ai-resume-review` | Upload resume, get feedback | Uses the OpenRouter key; check cost does not repeat on refresh | |
| 4.13 | Mock interviews, career counselling, profile insights | Each page opens and its main action works | | |
| 4.14 | Salary benchmarking | Opens and shows data | | |
| 4.15 | Campus drives `/candidate/campus-drives` | List; open one; join | Only drives the student is eligible for can be joined | |
| 4.16 | Messages `/candidate/messages` | Send and receive a message with a recruiter | Message saved; blocked users cannot message | |
| 4.17 | Notifications | Bell shows new items; marking read works | | |
| 4.18 | Settings | Change password; update notification choices | Old password stops working | |
| 4.19 | Subscription and pay-per features | Plans page opens | **[blocked: Razorpay]** purchase | |
| 4.20 | AI assistant widget | Hidden while switched off | **[switch ASSISTANT_ENABLED]** English and Tamil questions get answers; a daily limit message appears at the cap; no password or payment data is sent | |

## 5. Recruiter and company portal
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 5.1 | Company profile | Fill name, logo, description; save | Logo uploaded and shown on the company page | |
| 5.2 | Post a job | Form validates required fields; the **quality score and tips** appear while typing | `POST /api/jobs/quality-check` 200; job appears on the public list after publishing | |
| 5.3 | Quality tips | Empty skills shows "shown to fewer people"; a full post shows Good | Score never blocks publishing | |
| 5.4 | Save as draft | Draft is not public; can be edited and published later | | |
| 5.5 | Edit, clone, close, delete a job | Each works; closed jobs leave the public list | Deleting frees a posting slot | |
| 5.6 | Job limit on the free plan | Hitting the limit shows the upgrade message | Limit matches the plan (2 active jobs on Free) | |
| 5.7 | My Jobs `/company/jobs` | Cards show applicant counts; **[switch relevance]** "top candidates" panel opens | Top candidates returns at most 5, public fields only | |
| 5.8 | Applicants | List opens; open a resume (signed link); change status to shortlisted or rejected | Status saved; the student sees the new status | |
| 5.9 | Bulk applicant actions `/company/bulk-hiring` | Select several, change status | | |
| 5.10 | Candidate search `/company/candidates` | Search by skill and location; open a profile | Daily search limit enforced; **[switch relevance]** default order is by fit to the latest job, not A to Z | |
| 5.11 | AI matching `/company/ai-matching` | Score for a job's applicants | Cost stays reasonable; repeated clicks do not repeat the charge | |
| 5.12 | ATS pipeline `/company/ats-pipeline` | Move a candidate between stages | Stage saved | |
| 5.13 | Messaging and bulk messaging | Send one and a bulk message | Messages delivered; opt-out respected | |
| 5.14 | Interview scheduling and video interview | Schedule; open `/meeting/:id` | Time and link saved; both sides can join | |
| 5.15 | Team `/company/team`, `/company/team-roster` | Invite a member; they accept; permissions apply | A member cannot open pages they have no permission for | |
| 5.16 | Analytics `/company/analytics` | Charts load | Numbers match what you did (jobs, applicants) | |
| 5.17 | Drive requests `/company/drive-requests`, `/company/requests` | Open and respond | | |
| 5.18 | Company drive view `/company-drive/:token` | The shared link opens without login | Only that drive's students and resumes are visible | |
| 5.19 | Plan, unlocks, payment history | Pages open | **[blocked: Razorpay]** buying and renewing | |
| 5.20 | Reviews | Write a review for a company or candidate | Appears after admin approval if moderation is on | |

## 6. College portal (TPO)
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 6.1 | Register college | Form and KYC upload | Appears in the admin's college verification list | |
| 6.2 | Verification | Pending state shows until approved; after approval the full menu appears | Admin approval updates the status | |
| 6.3 | Students `/college/students` | Import a CSV (10 sample rows); list shows them | New students get **random** passwords; the credentials CSV has the Login Email/ID column; phone-only and email rows both work | |
| 6.4 | Existing student by email | Import a row for an email that already exists | No duplicate account; existing one is linked | |
| 6.5 | Drives `/college/drives`, `/college/drives/new` | Create a drive with department, year, minimum score | Eligible students are listed; "add all eligible" works | |
| 6.6 | Drive QR and `/join/:driveCode`, `/campus/:driveCode` | Scan on a phone; register; consent | Student is added to the drive once | |
| 6.7 | Campus skill test | Student takes the test from the QR flow; score and certificate show | Marked on the server; retake is blocked; certificate QR verifies | |
| 6.8 | Event check-in `/college-event-checkin/:token` | Check in a student | Attendance saved once per student | |
| 6.9 | Incharge invite `/incharge/accept/:driveId/:token` | Invitee accepts | Permission limited to that drive | |
| 6.10 | Reports `/college/reports` | Opens; download a report (resume and MoU links are signed) | Counts match the data | |
| 6.11 | Principal summary `/principal/executive-summary/:passkey` | Opens with the passkey; wrong passkey is refused | | |
| 6.12 | Placement tools, operations, settings | Each opens and saves | | |
| 6.13 | Subscription, payment history | Pages open | **[blocked: Razorpay]** purchase | |

## 7. Admin portal
| ID | Test | Frontend | Backend | Result |
|---|---|---|---|---|
| 7.1 | Login at `/admin/login` (and `admin.velaivaaipu.in` if you use that address) | New admin logs in; wrong password refused | Old test admins (`admin@ct.com`, `admin123@gmail.com`, `newadmin@example.com`) cannot log in | |
| 7.2 | Dashboard | Counts load | | |
| 7.3 | Manage users, companies, buyers | Search, view, suspend or reactivate | A suspended user cannot log in | |
| 7.4 | Manage jobs | Hide or remove a job | It leaves the public list | |
| 7.5 | College verification and KYC | Approve and reject; documents open (signed links) | Status change emails or notifications fire | |
| 7.6 | Requests, tickets, reviews | Reply to a ticket; approve or reject a review | | |
| 7.7 | Coupons | Create, use at checkout, expire | **[blocked: Razorpay]** use at checkout | |
| 7.8 | Subscriptions, renewals, refunds, pay-per | Pages open and list data | **[blocked: Razorpay]** refund action | |
| 7.9 | Recommendation summary | `GET /api/admin/recommendations/summary?days=30` shows shown, clicked, applied rates | Empty while the relevance switch is off | |
| 7.10 | Settings | Change a setting; it applies | | |
| 7.11 | Subadmin `/subadmin` | Subadmin sees only allowed pages | Direct API calls to other areas return 403 | |
| 7.12 | Audit | Run `node scripts/auditPrivilegedAccounts.js` on the VPS | Lists only the admins you expect | |

## 8. Security checks
| ID | Test | How | Expected | Result |
|---|---|---|---|---|
| 8.1 | Protected API without login | Open `https://api.velaivaaipu.in/api/jobs/matching` in a browser | 401 | |
| 8.2 | Documents | Open `https://api.velaivaaipu.in/uploads/anything.pdf` | 401 or 403, never the file | |
| 8.3 | Expired link | Wait for a signed link to expire (10 min), open again | Refused | |
| 8.4 | Other user's data | Student A tries a student B URL or id | 403 or 404 | |
| 8.5 | Role switch | A student calls a recruiter API (change the URL in the console) | 403 | |
| 8.6 | Rate limits | Wrong password 10 times fast | Blocked for a while | |
| 8.7 | HTTPS | `http://velaivaaipu.in` | Redirects to https; no certificate warning | |
| 8.8 | Secrets | View page source and JS files | No keys, passwords or database addresses | |
| 8.9 | Database port | From your PC: `Test-NetConnection 82.25.85.114 -Port 27017` | Closed | |
| 8.10 | File upload abuse | Upload a `.exe` or a 50 MB file | Refused with a clear message | |
| 8.11 | Input safety | Put `<script>alert(1)</script>` in a profile field | Shown as text, never runs | |

## 9. Email and notifications
| ID | Test | Expected | Result |
|---|---|---|---|
| 9.1 | OTP to Gmail, Outlook, Yahoo | Inbox (not Spam) within 2 min | |
| 9.2 | Reset password email | Link works once | |
| 9.3 | Application and status emails | Arrive with the right names and links | |
| 9.4 | Sender and reply-to | From "Velaivaaipu" `admin@bmtechx.in`; replies reach that mailbox | |
| 9.5 | DNS for `bmtechx.in` | SPF, DKIM and DMARC records exist (Hostinger DNS) | |
| 9.6 | **[switch lifecycle mails]** | One mail per person per day; unsubscribe works; capped at `LIFECYCLE_MAX_PER_RUN` | |
| 9.7 | **[switch WhatsApp]** | Template approved by Meta first; STOP reply stops messages | |
| 9.8 | In-app notifications | Appear and clear when read | |

## 10. Payments **[blocked: Razorpay until the account is active]**
| ID | Test | Expected | Result |
|---|---|---|---|
| 10.1 | Buy a plan with a small real payment | Payment succeeds; plan activates | |
| 10.2 | Webhook | Razorpay Dashboard shows the webhook delivered (200); purchase granted | |
| 10.3 | Receipt email | Arrives with GST details | |
| 10.4 | Request a refund | Button works within the allowed window; admin refunds; student is told | |
| 10.5 | Failed or cancelled payment | No plan granted; clear message | |
| 10.6 | Coupon | Discount applies correctly | |

## 11. Phone, speed and compatibility
| ID | Test | Expected | Result |
|---|---|---|---|
| 11.1 | Android Chrome and iPhone Safari | Every page fits, no sideways scrolling, buttons reachable | |
| 11.2 | Add to Home screen (PWA) | Installs, opens full screen, icon shows | |
| 11.3 | Offline | Turn on airplane mode, open the app | A friendly offline message, not a blank page | |
| 11.4 | After a new deploy | Hard refresh shows the new version; the app does not stay on the old one | |
| 11.5 | Speed | Home page usable in under 3 seconds on mobile data | |
| 11.6 | Browsers | Chrome, Edge, Firefox, Safari | |
| 11.7 | Tamil text | Tamil in profile, search and assistant displays correctly | |

## 12. Backend health (developer, on the VPS)
| ID | Check | Command | Expected | Result |
|---|---|---|---|---|
| 12.1 | Process | `pm2 list` | `online`, restarts not climbing | |
| 12.2 | Logs | `pm2 logs --lines 100` | No repeated errors | |
| 12.3 | Automated checks | `cd server && node --test "tests/**/*.test.js"` | All pass | |
| 12.4 | Live smoke test | `node scripts/liveSmokeTest.js` | 0 failures | |
| 12.5 | Mail | `node test-email.js` | Authenticated and sent | |
| 12.6 | Question bank | Skills endpoint count | Matches the number of reviewed skills | |
| 12.7 | Environment | Check `.env` | Production values set; `PROTECT_DOCUMENT_UPLOADS=true`; secrets not in git | |
| 12.8 | Backups | A recent database backup exists and can be restored | | |
| 12.9 | Firewall | Only ports 80, 443 and SSH are open to the world | | |
| 12.10 | Disk and memory | `df -h`, `free -m` have room | | |

---

## Sign-off
| Section | Passed | Failed | Blocked |
|---|---|---|---|
| 1 Public site | | | |
| 2 Free skill test | | | |
| 3 Sign up and login | | | |
| 4 Student | | | |
| 5 Recruiter and company | | | |
| 6 College | | | |
| 7 Admin | | | |
| 8 Security | | | |
| 9 Email | | | |
| 10 Payments | | | |
| 11 Phone and speed | | | |
| 12 Backend health | | | |

Tested by: ____________  Date: ____________  Version / commit: ____________

Launch rule: no open **F** in sections 1, 3, 8, or in the student, company and college happy paths (4.5, 5.2, 5.8, 6.3 to 6.7). Everything else can be logged and fixed after launch, as long as nothing in section 8 fails.
