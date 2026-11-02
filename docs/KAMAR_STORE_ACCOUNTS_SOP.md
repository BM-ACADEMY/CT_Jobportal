# Your step-by-step guide: get the Velaivaaipu app into Google Play (and later the App Store)

For: Kamar. Do these in parallel with the developers' work. The long wait is the D-U-N-S number, so start with Step 1 today.

Sources: [Google Play organisation account guide](https://www.choicely.com/tutorials/how-to-create-a-google-play-developer-account-for-your-organization) and [Apple enrolment requirements](https://developer.apple.com/support/enrollment/). Check the amounts and rules on the Google and Apple screens as you go, because they change.

## Part A. Start today (these take the longest)

**Step 1. Get a D-U-N-S number for Afra Ventures Private Limited.**
- It is a free 9-digit business ID from Dun & Bradstreet. Google needs it for a company account, and Apple needs it too, so one number serves both.
- Request it on Dun & Bradstreet's official D-U-N-S request page. It can arrive almost instantly or take up to 30 days. Never pay an agent for it.
- Use exactly the company name, address and phone that are on the incorporation certificate.

**Step 2. Make one folder for the documents** (on your computer, and a copy in your password manager notes):
- Certificate of incorporation, company PAN, and the company address proof.
- The ID of the director or authorised person who will register (passport or driving licence, as Google's form accepts; check the form for India).
- The registrant must be a director or someone with written authority to sign for Afra Ventures. If the company is in your wife's name, she is the registrant, or she gives you a written authority letter.

**Step 3. Create a Google Account for the company.**
- Not your personal Gmail. Use a company email on velaivaaipu.in, such as `play@velaivaaipu.in`. A shared mailbox works.
- On the Google sign-up page choose "Use my existing email address" and enter it.
- Save the password in your password manager. Turn on 2-step verification.

**Step 4. Claim velaivaaipu.in in Google Search Console** (using the same Google Account).
- Play asks you to prove you own the website. Search Console is also needed for SEO later, so this is not wasted.
- Add the domain, copy the DNS record Google shows, and ask Sneha to add it at the domain provider. Press Verify.

**Step 5. Arrange the payment card.** A card that works for international payments (the fee is 25 US dollars, one time, not refunded if verification fails). Ask your bank to enable international online payments if needed.

## Part B. Create the Google Play developer account (when you have the D-U-N-S number)
1. Open play.google.com/console and sign in with the company Google Account.
2. Choose **Organisation** as the account type.
3. Developer name: **Velaivaaipu** (can be changed later; this is the name users see).
4. Create or select the payments profile, enter the D-U-N-S number, and confirm the company details shown match the incorporation certificate.
5. Enter organisation details: number of employees, phone, website (velaivaaipu.in), and the public contact details (use the support email and number you decided).
6. Enter the admin contact: a company email, different from the Google Account email. A shared mailbox is fine.
7. Accept the Google Play Developer Distribution Agreement and pay the 25 dollar fee.
8. **Verify the website:** in Play Console press "Request verification", then approve it in Search Console.
9. **Verify the organisation and yourself:** upload the incorporation certificate and your ID, and enter name, country and address exactly as on the documents. Google replies by email, usually within a few days.
10. Organisation accounts are exempt from the 14-day, 12-tester test that new personal accounts must run, but check this on the screen.
11. Play Console also rolls out "developer verification" for new accounts; follow whatever it asks.

**Tip:** if any name or address differs between the D-U-N-S record, the documents and the form, verification fails. Keep them identical.

## Part C. Decisions only you can make (tell Sneha and Dev 2)
1. **Payments in the store apps.** Recommended: no purchase screens in the apps. Students use everything free; company and college plans and the Rs 49 job alerts are bought on the website. Reply "approve" or "change".
2. **Store contact:** the support email and phone number shown on the listing (the same as the website footer).
3. **App name:** "Velaivaaipu: Jobs & Skill Tests" (or your choice; the name can have up to 30 characters).

## Part D. Safe keeping
- In the Play Console use **Play App Signing** (Google keeps the main signing key). Dev 2 keeps the upload key.
- Put every login in your password manager. Never send passwords in WhatsApp.
- Give Dev 2 and Sneha access through **Users and permissions** in Play Console (invite their emails with limited rights). Do not share your login.

## Part E. Prepare the listing content (draft text you can edit)
- **Short description (80 characters):** Find jobs, take free skill tests and join campus drives.
- **Full description:** Velaivaaipu helps students and job seekers in Tamil Nadu find jobs and get hired. Search jobs, take free skill tests and earn a skill badge, build a resume, get an AI review of your resume, apply in one tap, and join campus placement drives from your college. Companies and recruiters can post jobs, find candidates and manage hiring. Colleges can run placement drives and track results. (Do not add "AI matching" or "AI assistant" until they are live.)
- **Graphics:** app icon 512 x 512 (we have the logo), a feature graphic 1024 x 500, and at least 2 phone screenshots (take 6: home, jobs, skill test, result, applications, college drive).
- **Privacy policy link:** the Privacy Policy page on velaivaaipu.in.
- **Account deletion link:** the page Sneha builds (needed before submission).
- **Content rating:** answer the questionnaire honestly (no violence, no gambling).
- **Data safety form:** the data we collect: name, email, phone, resume and profile details, skill test results, device info for analytics. Sneha prepares the exact answers.
- **Reviewer test account:** a clearly labelled test login (no real student data) that Google's reviewers use.

## Part F. The iPhone app (do after Android is live)
- Apple Developer Program: **99 US dollars a year** (shown in local currency).
- Needs: Afra Ventures as the legal entity (not a trade name), the **same D-U-N-S number**, a working public website on the company domain, a company-domain email, and someone with legal authority to sign. Apple may ask for notarised company documents.
- **In India, enrolment goes through the Apple Developer app on an iPhone**; the page doesn't say whether the organisation path is offered there, so check the app or contact Apple Developer Support.
- An Apple Account with two-factor authentication.

## Part G. Your checklist
- [ ] D-U-N-S requested
- [ ] Documents folder ready
- [ ] Company Google Account created, 2-step on
- [ ] velaivaaipu.in verified in Search Console
- [ ] Card ready for the 25 dollar fee
- [ ] Play developer account created and verified
- [ ] Payment decision sent to Sneha
- [ ] Dev 2 and Sneha invited to Play Console
- [ ] Support email and phone decided
- [ ] Screenshots, feature graphic and texts approved
- [ ] (Later) Apple Developer account

## Part H. Mistakes to avoid
- Using a personal Gmail for the account.
- Names or addresses that do not match across the D-U-N-S record, certificate and form.
- Paying an agent for the D-U-N-S number or for the account.
- Sharing the Play login instead of inviting users.
- Putting "AI matching" or "AI assistant" in the description before they are live.
