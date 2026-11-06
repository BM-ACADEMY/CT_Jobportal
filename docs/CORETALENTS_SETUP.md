# CoreTalents account: step by step (for Ilayapallavan)

Goal: CoreTalents posts about 150 openings on Velaivaaipu. We create one company account, one recruiter account, then raise the job limit for the one account that will post.
Do not share passwords in chat or a group. Send them to the account owner privately.

## 1. Create the company account (about 5 minutes)
1. Open https://velaivaaipu.in/register?role=company in a private (incognito) window.
2. Fill in the CoreTalents company name, a real email that CoreTalents can read, a phone number and a strong password. Tick the terms box and create the account.
3. A 6-digit code arrives by email (sent from hello@velaivaaipu.in). Enter it. If it does not arrive in a minute, check Spam and tell the dev team.
4. Log in at https://velaivaaipu.in/login. You land on the company dashboard.
5. Go to **Company Profile** and fill in the logo, about text, website, address and size. A complete profile is shown on every job.

## 2. Create the recruiter account (the person who will post)
Option A (simple): register one more account with role recruiter at https://velaivaaipu.in/register?role=recruiter, using the CoreTalents recruiter's own email.
Option B: from the company account open **Team** (My Team) and invite the recruiter, so the jobs sit under the company.
Tell the dev team which account will post (the exact login email). The limit is raised for that one account only.

## 3. Post the first job
1. Log in as the posting account.
2. Open **Post a Job** (https://velaivaaipu.in/company/jobs/new).
3. Fill in the title, location (city), job type, salary range, experience, skills and a clear description. Use the tips panel on the right to improve the quality score.
4. Submit. New jobs may wait for admin approval. Check **My Jobs** (https://velaivaaipu.in/company/jobs).
5. Open the public job page to check it looks right and the title and company are correct.
6. Post only the first job until the dev team has raised the limit. A free account may be limited to a few active jobs.

## 4. Dev team: raise the limit for that one account (after step 2)
From the server folder, as the dev team (not Ilayapallavan):
1. Dry run (changes nothing):
   `node scripts/grantJobPostings.js --email <posting account email> --limit 150 --by "<who asked>" --note "CoreTalents, about 150 openings"`
2. Check the printed account, plan limit and new total. It must show this one account only.
3. Apply: the same command plus `--apply`. It adds an extra allowance (default 365 days). The plan is not changed. A record of who asked and when is saved in the `joblimitgrants` collection.
4. Ask the account to post a few jobs and confirm no "limit reached" message appears.

## 5. If something goes wrong
- No OTP email: tell the dev team (check Brevo and the server mail log).
- "Limit reached" when posting: the dev team has not run step 4 yet.
- Wrong account got the limit: the dev team can set the extra allowance's `isActive` to false for that user and the plan limit applies again.
