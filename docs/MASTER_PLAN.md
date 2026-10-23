# Velaivaaipu master plan (owner: Sneha; Kamar decides, does not create accounts)

Rule for accounts: Sneha creates and configures every account and key. Register them under a company-owned mailbox (hello@velaivaaipu.in or a tech@ alias on the same domain), never a personal email, so the company keeps control if people change. Some steps legally need the owner: a payment card, KYC or OTP in the company's name, and the CA's answer. For those, Sneha prepares everything and Kamar only approves or enters the OTP.

## Phase 0. Done and verified by Sneha
Refund rules, legal pages, GST receipts, campus QR test with server-side scoring, onboarding (tour, checklists, banners), lifecycle mails (off), WhatsApp follow-up (off). Smoke test passed on the patch up to the onboarding release. Re-run it on the newest patch (onboarding, section 9 of DEV_BRIEF).

## Phase 1. Go-live blockers (Sneha, this week)
1. Apply the latest patch, run payment tests and client build, deploy server and client together.
2. OpenRouter credit, then seed the question bank, then one full QR test (register, test, score, certificate, WhatsApp).
3. Accounts and keys from the HANDOFF checklist: Razorpay live, Google, LinkedIn, SES or Brevo with DNS, Meta template, GA4, Pixel, Search Console.
4. Switch OTP and receipts to the mail service. Then lifecycle mails at 20 a day.
5. Soft launch with one friendly college (50 to 100 students) for one week.
Needs Kamar only for: footer phone, sender names, festival dates and price, CA answer on GST invoice, payment card / KYC / OTP where required.

## Phase 2. PWA (installable app), about 3 days
Today: `manifest.webmanifest` exists but is not linked in `index.html`; its only icon is 512x263 (not square), so the browser will not offer install; there is no service worker, no theme-color or Apple touch icon, no install button, no offline page.
Build:
- Square icons 192 and 512, plus a maskable 512; fix the manifest (`id`, `scope`, `start_url=/?source=pwa`, `display=standalone`, `theme_color`, `lang`, shortcuts to Jobs, Skill tests, My applications); link it and add `theme-color`, `apple-touch-icon` and Apple web-app meta tags.
- Service worker with `vite-plugin-pwa` (Workbox). Cache the app shell and static assets only. Never cache `/api`, login, payments or personal data. Offline page for page loads that fail. `sw.js` served with no-cache in `vercel.json`.
- Update flow: when a new deploy is ready show "New version available. Refresh". Must work with the existing chunk-reload code in `main.jsx` so users never get stuck on an old build.
- Install button (Chrome / Android `beforeinstallprompt`) and a short "Add to Home Screen" guide for iPhone Safari. Show after the person's second visit or after finishing a profile step. Never on the first screen of the campus QR flow; offer it on the result screen instead.
- Track `pwa_install_prompt`, `pwa_installed`, and standalone sessions in GA4.
Phase 2b (later, optional): web push for job alerts (needs VAPID keys, separate consent, unsubscribe; on iPhone it works only after install).
Must test (real devices, latest patch): Android Chrome, iPhone Safari 16.4 or newer, desktop Chrome and Edge. Cases: install and launch; Razorpay checkout inside the installed app; Google and LinkedIn login returning to the installed app (iPhone often opens the system browser, so check the session survives); resume upload from camera and files; `wa.me` links; offline page; update after a new deploy; Lighthouse PWA and performance run.

## Phase 3. Relevance engine, about 4 to 5 days
See `RELEVANCE_AND_AI_ASSISTANT_PLAN.md` section 2. Sneha estimates first, Kamar approves.

## Phase 4. AI assistant (OpenAI), about 3 days after Kamar answers 3 questions
See section 4 of the same file. Includes Privacy Policy and Terms update naming OpenAI.

## Phase 5. Hardening backlog
Free assessment page still exposes answers; request-refund button; mail bounce handling and TLS certificate check; random passwords for CSV-imported students; protect `/uploads`; confirm free-plan limits in code; LinkedIn login test; CoreTalents text in old blog data.

## Order and gates
Phase 1 must finish before any promotion. Phase 2 can run in parallel with the soft launch. Phases 3 and 4 start after one clean week of soft launch. Every phase ends with the smoke test (DEV_BRIEF section 8) plus its own tests, run on the real devices above.
