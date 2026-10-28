# Onboarding test sheet (DEV_BRIEF section 9) - run on the live site

Use a fresh account per role (jobseeker/student, company, college). Use a private window per role, or fully log out and reload the page between roles.

Code facts used to write this sheet (`client/src/context/OnboardingContext.jsx`, `server/controllers/onboardingController.js`):
- The tour opens automatically only when the server says `enabled` and `tourSeen` is false. Skip, Done and closing the dialog all call `POST /api/onboarding/tour-seen` (stored as `user.onboarding.tourSeenAt`).
- A failed `tour-seen` call is ignored silently, so a network error at that moment makes the tour appear again on the next visit.
- The checklist is fetched on sign-in and again when the browser tab regains focus (at most every 30 seconds).
- Admin, subadmin and drive_incharge get `enabled: false` (no tour, no checklist).
- The provider is mounted separately inside `DashboardLayout` and in the home-page strip, so tour state lives per page group; the server flag is what keeps it to once.

## Per role
| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Sign up as a **student** and log in | Welcome tour opens on first login, "Hi <first name>", Step 1 of N | |
| 2 | Click Skip (or finish with "Start my checklist") | Dialog closes; Network shows `POST /onboarding/tour-seen` 200 | |
| 3 | Reload the page, log out and in again | Tour does NOT open again | |
| 4 | Dashboard home | Checklist card with 9 steps (photo, headline+bio, phone+location, skills, education, resume, job preferences, skill test, first application), percent and next step | |
| 5 | Open any other dashboard page | Slim "incomplete profile" banner; "hide for a day" works | |
| 6 | Logged-in home page (outside the dashboard) | Onboarding strip shown | |
| 7 | Complete a step (e.g. upload photo), return to the tab | Percent rises within about 30 s of focus; finishing all steps removes card and banner | |
| 8 | "Take the tour" on the card | Replays the tour; does not reset `tourSeen` | |
| 9 | Apply to a job with a profile under 60% | Soft prompt "Complete profile / Apply anyway"; Apply anyway works | |
| 10 | Repeat 1 to 8 as a **company** | Steps: details, logo, company description, first job, invite teammate | |
| 11 | Repeat as a **recruiter** | Same, without "invite teammate" | |
| 12 | Repeat as a **college** | Steps: details, verification, first drive, first students, 50 students; "how this page works" banners on all six college pages | |
| 13 | Log in as an **admin** | No tour, no card, no banner | |

## Edge cases
| # | Case | Expected | Result |
|---|---|---|---|
| 14 | Switch roles in the same browser tab by logging out then in as another new user (no reload) | Tour should open for the new user. If it does not, reload and report it: the `autoOpened` flag is per provider mount | |
| 15 | Go offline right at Skip | Tour reappears next visit (known, silent failure of the `tour-seen` call) | |
| 16 | Mobile width (360 px) | Tour dialog and card fit without horizontal scroll | |

## Emails (stay OFF until `LIFECYCLE_EMAILS_ENABLED=true`)
Job seeker nudges at day 2, day 7 and monthly while under 70%; company page nudge (missing logo or description, day 3 to 30); college verify (day 3), first drive (day 4), share QR when a drive has no students (day 7). One lifecycle mail per person per day. Check these only after switching lifecycle mail on at 20 a day.
