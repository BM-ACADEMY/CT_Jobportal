# Plan: turn the Velaivaaipu web app (PWA) into store apps

Status: PLAN. Nothing built. Order matters more than dates; Dev 2 can do most of the Android work in parallel with Sneha's sprints.

## 1. Approach
- **Android first, as a wrapper around the existing PWA.** A Trusted Web Activity (TWA) built with Google's Bubblewrap tool turns the web app we already built into a Play Store app. One code base, no rewrite, and every web fix reaches the app immediately.
- **iPhone second.** Apple is stricter. People can already install the PWA to the Home Screen (with the install prompt). A real App Store app needs a native wrapper (for example Capacitor) with native features, and has payment rules that need a decision first.
- **Both store apps are "use" apps.** Jobs, skill tests, applications, messages, alerts, campus drives. Plans and payments stay on the website until the payment decision below is made.

## 2. The decision that shapes everything: payments
- Google's own PWA-in-Play guide says: if the PWA sells digital goods covered by Google's payments policy, you must integrate **Google Play Billing** before launch ([source](https://chromeos.dev/en/publish/pwa-in-play)).
- Apple generally requires **Apple In-App Purchase** for digital goods sold inside iOS apps. Web links to outside checkout are allowed in the US under a recent ruling (0% for now, subject to the court process), and rules differ by country; the sources do not say what applies in India ([source](https://www.revenuecat.com/blog/engineering/app-to-web-purchase-guidelines/), updated 1 Oct 2026).
- Our paid items: company plans, college plans, pay-per features, student job alerts (Rs 49). Companies and colleges usually buy on a laptop.

**Recommendation:** in the store apps, show no purchase screens. Students use everything free in the app; plans and payments are bought on velaivaaipu.in. Before submitting, Sneha reads the current Google Play payments policy and Apple guidelines 3.1.1 and 3.1.3 and confirms this is allowed for each of our paid items (including whether the app may mention that plans are bought on the website). If either store requires its own billing for an item, that item is hidden in that store's app. Store billing adds a commission (Razorpay is not used for that item).

## 3. What Kamar provides (Afra Ventures, under a company mailbox)
1. A **Google Play Developer account** for Afra Ventures (one-time fee; organisation accounts are verified with business details; confirm the current rules on the Play Console sign-up page).
2. An **Apple Developer Program** account for Afra Ventures (yearly fee; organisations are verified, usually with a D-U-N-S number; confirm on Apple's enrollment page). Needed only for the iPhone step.
3. App name, short and long descriptions (English first, Tamil later), screenshots, and the approval of the payment decision.
4. Store the **signing key** safely (password manager). Losing it makes updates very hard.

## 4. Android steps (order)
1. Decide payments (section 2) and create the developer account.
2. **Account deletion:** Google requires apps that let people create an account to offer account deletion inside the app and on a web page. This is already item B in the review sheet; it moves up to "before the Android app".
3. **PWA check:** run Lighthouse on the live site; fix any installability issue; confirm the manifest, icons (512 px) and offline page we built.
4. Build with Bubblewrap (`@bubblewrap/cli`: init, build) to produce the app bundle.
5. **Digital Asset Links:** put the generated assetlinks.json on velaivaaipu.in at `/.well-known/assetlinks.json`, and make sure the Vercel config serves it. This removes the browser address bar inside the app.
6. Store listing: icon, feature graphic, phone screenshots, descriptions, privacy policy link (exists), content rating, the Data safety form, and a **reviewer test account** (clearly labelled, no real data).
7. **Testing track first:** invite 5 to 10 testers (students, a TPO, a recruiter). Google may require closed testing with a minimum number of testers for some new accounts before production; check the current rule on the Play Console.
8. Release to production; watch crash reports; add Play Console alerts to the admin control room.

## 5. iPhone steps (after Android)
1. Native wrapper (Capacitor) loading the same web app, with real native features so it is more than a website in a frame: native push notifications, share sheet for jobs and results, camera or file picker for resume upload.
2. If the app offers social sign-in (LinkedIn), check Apple's rule that requires an equivalent privacy-friendly login option such as Sign in with Apple.
3. TestFlight with testers, then App Store review. Expect questions about payments and about the app being "just a website".
4. Until the iPhone app is approved, the install prompt keeps telling iPhone users how to add the app to the Home Screen.

## 6. Push notifications in the apps
The web push plan (admin plan section 6) works in the Android app as in Chrome. The iPhone native app needs Apple's push service (APNs) through the wrapper. Build one notification service that can send to both.

## 7. Task list (owner)
- Kamar: payment decision, developer account(s), listing text and screenshots approval.
- Dev 2: Lighthouse check, Bubblewrap build, assetlinks.json, test track, listing assets.
- Sneha: account deletion (in app and on the web), payment-policy check, hide purchase screens inside the apps if required, Vercel config for assetlinks.json, push service.
- Kamar and Dev 2: testers, then production release.

## 8. Facts to verify (I could not confirm them from the sources I could open)
- Current Play and Apple fees, and the organisation verification steps.
- Whether new organisation accounts need closed testing before production.
- Exactly which of our paid items fall under each store's payments policy in India.
- Whether Apple guideline 4.8 (login options) applies to our sign-in methods.
