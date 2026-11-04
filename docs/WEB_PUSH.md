# Web push notifications (browser and installed app)

Status: built, **OFF until VAPID keys are set**. No per-message cost (unlike WhatsApp); works with the PWA already
shipped. Branch `web-push`.

## Switch on (5 minutes, developer)

1. Generate keys once: `cd server && node scripts/generateVapidKeys.js`. Put the three lines in the server `.env`
   (`WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`). Never change the keys later:
   every device subscription is tied to the public key.
2. Deploy server and client together (the service worker is now `v2`; browsers pick it up after the person taps
   Refresh on the "new version" prompt, as before).
3. `GET https://<api>/api/push/config` must return `{"enabled":true,"publicKey":"..."}`.
4. Run rows 18 to 24 of `docs/PWA_DEVICE_TEST_SHEET.md` on a real Android phone and a desktop browser.
5. To pause sending without losing anything: `WEB_PUSH_ENABLED=false` and restart.

## What a person sees

- **Settings** (student, team member, company, recruiter, college pages): a card "Notifications on this device"
  with one switch for the device and one switch per category (new jobs, applications, interviews and sessions,
  messages, plan and payments, team, everything else), plus "Send me a test notification". The card is hidden
  entirely while push is off on the server.
- **Dashboard home**: a small banner "Want to know the moment something happens?" with Turn on / Not now. Shown
  from the **second** visit only, never when the browser already answered, never on iPhone Safari outside the
  installed app, hidden for 30 days on Not now.
- **iPhone / iPad**: push works only from the Home Screen app (iOS 16.4+). The card says so and the switch is
  disabled until the app is installed.

## Rules (server, `utils/webPush.js`)

- Push rides on the existing in-app notifications: `notifyUsers()` saves the bell notification, emails as before,
  and now also calls `sendPush()`. Nothing else had to change, so every existing notification type is covered.
- **Quiet hours 21:00 to 08:00 IST**: no push, except the `interviews` and `messages` categories. The push is
  **dropped, not queued**: the same event already reached the person as the in-app bell notification and the
  email at the moment it happened, so an 08:00 replay would be a second copy of old news (and a queue would need
  its own storage, retry and de-duplication). If a morning digest is wanted later, the right place is a
  scheduled job that sends one "while you were away" push built from the unread bell notifications.
- **Daily cap**: at most `WEB_PUSH_MAX_PER_DAY` pushes (default 2) per person per IST day across all categories.
  The slot is taken with an atomic counter (`PushDailyCounter`, one row per person per day, upsert with
  `count < max`), so two notifications arriving at the same moment cannot both get through on the last slot.
  Interviews are exempt from the cap (a mute still applies). A slot is given back if no device accepted the push.
- **New-jobs cap**: on top of that, at most one `jobs` push per person per day.
- **Consent is per device**; the per-category mute list is per person (`user.pushPrefs.mutedCategories`).
- Dead devices are removed on a 404/410 from the push service, or after 5 failures in a row.
- The payload is only title (60 chars), body (140 chars), link and type. The service worker fetches nothing on
  its own, so a push never pulls personal data into the cache.
- Signing in to another account in the same browser moves that device's subscription to the new account.
- **Endpoint allowlist**: a subscription is stored only if its endpoint is an https URL on a known push service
  (`fcm.googleapis.com`, `updates.push.services.mozilla.com`, `web.push.apple.com`, `*.notify.windows.com`,
  `*.push.apple.com`; constant `PUSH_ENDPOINT_HOSTS` in `utils/webPush.js`). Anything else gets 400, because the
  server POSTs to that URL. Add a host there if a browser you support uses another service.

## API

| Method | Path | Who | Body / result |
|---|---|---|---|
| GET | `/api/push/config` | public | `{ enabled, publicKey, categories }` |
| POST | `/api/push/subscribe` | signed in | `{ subscription: PushSubscriptionJSON, standalone }` |
| DELETE | `/api/push/subscribe` | signed in | `{ endpoint }` |
| GET / PUT | `/api/push/prefs` | signed in | `{ mutedCategories: [...] }` (GET also returns `devices`) |
| POST | `/api/push/test` | signed in | sends one test push to the caller's devices |

New collections `PushSubscription` (user, endpoint, keys, userAgent, failures) and `PushDailyCounter` (user, day,
count; rows expire after two days). New User field `pushPrefs`.

## Not included (decide later)

- Admin-team alerts (KYC queue, failed webhook, cron health) from the admin panel plan: the plumbing is the
  same `notifyRoles()` call, so they can be added per alert when the admin panel work starts.
- Tamil copy for push text: the title and body are whatever the existing notification says.
- A delivery counter on the admin Command Center.

## Tests

`server/tests/auth/webPush.test.js` (categories, quiet hours, daily cap, mute list, delivery to every device,
cleanup on 410 and after repeated failures, off without keys). The in-app notification tests still pass with the
push hook in place because push is a no-op without keys.
