# Smoke test sheet (DEV_BRIEF section 8) - run on the live site

Use fresh test accounts and a real small payment. Record Pass/Fail and a note for each row. Routes below were checked to exist in `client/src/routes/AppRoutes.jsx` and `client/vercel.json`.

## A. Accounts
| # | Step | Expected | Result |
|---|---|---|---|
| 1 | `/register` as a job seeker with email, OTP from the real inbox | OTP arrives in inbox, account created, welcome tour shows once | |
| 2 | Same for a recruiter and a company | Same | |
| 3 | Log out, `/login` with email + password | Logged in, correct dashboard for the role | |
| 4 | Sign in with Google (each role you plan to support) | Returns to the site logged in | |
| 5 | Sign in with LinkedIn (jobseeker, recruiter, company) | Returns logged in. Not yet tested against a real LinkedIn app, so a failure here is likely a config issue (client id/secret, callback `https://<api-domain>/api/auth/linkedin/callback`) | |
| 6 | `/forgot-password` | Reset mail arrives, new password works, old one does not | |

## B. Jobs
| # | Step | Expected | Result |
|---|---|---|---|
| 7 | As company, post a job | Job saved, shown as active. Free plan limit enforced (see free-plan limit check) | |
| 8 | Open the public URL `/job/<title>-<city>-<id>` logged out | Page loads with title, canonical and OG tags in view-source (served by `client/api/job.js`) | |
| 9 | Paste that URL into the Google Rich Results Test | JobPosting detected | |
| 10 | As a job seeker, apply to it | Application recorded; under 60% profile shows the soft prompt "Complete profile / Apply anyway" and never blocks | |
| 11 | Company sees the applicant | Applicant listed | |
| 12 | Close the job, open its URL logged out | Shows "position filled", `noindex`, HTTP 200 not a hard 404 | |

## C. Payments
| # | Step | Expected | Result |
|---|---|---|---|
| 13 | Buy the cheapest plan with a real card (Razorpay live) | Checkout opens, payment succeeds, plan active | |
| 14 | Check email | Receipt with GST details arrives | |
| 15 | Within 24 hours, request a refund (API `POST /api/payments/:paymentId/request-refund`; there is no button until Day 9) | Accepted under the rules (24 h, once per account/email/phone). Approve in Manage Refunds, then return the money from the Razorpay dashboard (approving only updates our records) | |
| 16 | Razorpay dashboard > Webhooks | Deliveries to the renewal-webhook show 200 | |

## D. Campus QR
Use `docs/QR_TEST_SHEET.md` (14 steps). Minimum here: join with only name + WhatsApp, take the test, download the certificate, confirm a retake is blocked.

## E. Static pages
| # | URL | Expected | Result |
|---|---|---|---|
| 17 | `/for-colleges` | Loads with college content and no invented numbers | |
| 18 | `/privacy-policy` | Loads; names the AI providers; business name and address match the certificate | |
| 19 | `/refund-policy` | Loads; timelines match what you will keep (3 working days review, 5 to 7 working days money back) | |
| 20 | `/terms` | Loads; section 6 matches the refund rules | |
| 21 | `/sitemap.xml` | Lists static pages, jobs and companies | |

## F. Finish
Any Fail: note the URL, role, time and the browser console / server log line, and send it to me. Do not announce until every row passes.

## Refund button (added Day 9 to 10)
Payment history pages (`/candidate/payment-history`, `/company/payment-history`, `/college/payment-history`) now show a "Request refund" button on a paid, completed payment made in the last 24 hours (and on a likely duplicate charge). Test: make a small payment, open payment history, click it, add a reason, send. Expected: success message, status badge changes to "Refund requested", admin sees it in Manage Refunds. A second request on the same account, a payment older than 24 hours (not a duplicate), and a college plan each show the server's own message. Approving a refund in Manage Refunds only updates our records; return the money from the Razorpay dashboard.
