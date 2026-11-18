# Admin autopilot check (for Sneha, with a test account)

The code and unit tests exist. This list proves it works with real data. Tick each one and tell Kamar what failed.

1. **Needs-action inbox** (Admin > Needs action): create one of each with test accounts: a help request, a counselling request, a flagged job (post a job that says "pay Rs 500 to apply"), a college waiting for verification. Each must show up in the inbox within a minute, with a clear title.
2. **Auto-assign**: with a counsellor staff account set up, send a counselling request. It must be assigned within 15 minutes (the job runs every 15 minutes). Check Admin > Staff rules (needs-action rules) for who gets what.
3. **Reminders**: leave one request unanswered. After 24 hours the assignee gets a reminder, after 48 hours the Super Admin gets an escalation. (Set the clock forward in the database to test faster.)
4. **Daily summary**: at 9:00 India time the Super Admin gets the daily digest. It must list the open items and match the inbox.
5. **Failed payment alert**: make a failed test payment in Razorpay test mode. The alert must arrive within 30 minutes.
6. **Feedback**: send feedback from a test account (Admin > Feedback). It must appear, and marking it done must stick.
7. **Notifications bell**: the number must go down when items are done.
8. **Switch**: set ADMIN_FOLLOWUP_ENABLED=false in a test run and confirm the reminders stop.

If anything fails, Sneha fixes it or sends the failure to Kamar. Government jobs watcher: after deploying, add one official recruitment page in Admin > Government jobs and check it says "Last checked" with no error.
