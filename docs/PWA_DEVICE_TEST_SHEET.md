# PWA real-device test sheet (DEV_BRIEF section 10)

Test the PRODUCTION build on the live domain (service workers only register in production builds, over https). Use real phones.

## Code review done (no changes needed)
- Icons are square and correct: 192, 512, maskable 512, Apple touch 180 (checked pixel sizes).
- `index.html` links the manifest, theme-color and Apple tags. `manifest.webmanifest`: `id /`, `scope /`, `start_url /?source=pwa`, `display standalone`, 3 shortcuts. `offline.html` is in the build output.
- `client/public/sw.js` follows its safety rules: ignores non-GET, other origins, `/api`, `/auth`, `/sw.js` and range requests; never stores HTML; navigations always go to the network and show `offline.html` only on failure; caches only `/assets/`, `/icons/`, `/images/` (200 same-origin responses). The new version waits for the person to tap Refresh and the page reloads only after that tap.
- `vercel.json`: `sw.js` is no-cache with `Service-Worker-Allowed /`, the manifest is served as `application/manifest+json`, hashed assets are immutable, and these files are excluded from the SPA rewrite.
- The API, uploads, Razorpay, Google and LinkedIn are all cross-origin or `/api`, so the worker never touches payments or login.

## Things to know
- `/images/` and `/icons/` use fixed file names and are cached first with no expiry. If you replace an image or icon later, bump `VERSION` in `sw.js` (`v1` to `v2`), otherwise returning users keep the old picture. Hashed `/assets/` files are not affected.
- `pwa_check.py` (12 automated checks) was not run here: Python and playwright are not installed on this machine. To run it elsewhere: `pip install playwright && playwright install chromium`, then `ESBUILD=node_modules/.bin/esbuild python3 client/scripts/pwa_check.py`.

## Tests
Record device, OS, browser version and Pass/Fail.

| # | Case | Expected | Result |
|---|---|---|---|
| 1 | Android Chrome: visit twice on different sessions, open the dashboard home | Install banner appears after the second visit; Install button opens the native prompt | |
| 2 | Install, launch from the home screen | Opens full screen (no browser bar), green theme colour, lands on the app | |
| 3 | Campus QR flow on a fresh phone | No install banner on the first screen; offered on the test result screen | |
| 4 | iPhone Safari 16.4 or newer | Banner explains "Share, then Add to Home Screen"; adding works; icon is the 180 px Apple icon | |
| 5 | Razorpay checkout inside the installed app (small real payment, then refund) | Checkout opens, pays, returns to the app, plan active | |
| 6 | Google login in the installed app | Returns to the app logged in | |
| 7 | LinkedIn login in the installed app | Returns logged in. On iPhone the system browser may open; confirm the session survives | |
| 8 | Resume upload from camera and from files | Both work | |
| 9 | `wa.me` WhatsApp links | Open WhatsApp | |
| 10 | Airplane mode, open the app | Offline page appears (not a browser error); reconnect and reload works | |
| 11 | Logged in, airplane mode, open a dashboard page | Offline page; no personal data shown from cache | |
| 12 | Deploy twice (any small change), open the app after each | "A new version is ready" with Refresh; page reloads only after tapping Refresh; never reloads on first install | |
| 13 | Desktop Chrome and Edge | Install icon in the address bar; installs and launches | |
| 14 | Lighthouse (Chrome DevTools, mobile) on `/` | PWA installable checks pass; note Performance score and fix list | |
| 15 | Chrome DevTools > Application > Cache Storage | Only `vv-static-v1`, containing assets, icons, images and offline page; no `/api` responses and no HTML | |
| 16 | GA4 DebugView | `pwa_install_prompt`, `pwa_install_accepted` or `pwa_install_dismissed`, `pwa_installed`, `pwa_standalone_session` arrive | |
| 17 | Dismiss the install banner | Hidden for 14 days | |
