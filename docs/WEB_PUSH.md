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
- **Quiet hours 21:00 to 08:00 IST**: no push, except the `interviews` and `messages` categories. The bell and
  email still go out at once; the push is skipped, not queued.
- **New-jobs cap**: at most one `jobs` push per person per day.
- **Consent is per device**; the per-category mute list is per person (`user.pushPrefs.mutedCategories`).
- Dead devices are removed on a 404/410 from the push service, or after 5 failures in a row.
- The payload is only title (60 chars), body (140 chars), link and type. The service worker fetches nothing on
  its own, so a push never pulls personal data into the cache.
- Signing in to another account in the same browser moves that device's subscription to the new account.

## API

| Method | Path | Who | Body / result |
|---|---|---|---|
| GET | `/api/push/config` | public | `{ enabled, publicKey, categories }` |
| POST | `/api/push/subscribe` | signed in | `{ subscription: PushSubscriptionJSON, standalone }` |
| DELETE | `/api/push/subscribe` | signed in | `{ endpoint }` |
| GET / PUT | `/api/push/prefs` | signed in | `{ mutedCategories: [...] }` (GET also returns `devices`) |
| POST | `/api/push/test` | signed in | sends one test push to the caller's devices |

New collection `PushSubscription` (user, endpoint, keys, userAgent, failures). New User field `pushPrefs`.

## Not included (decide later)

- Admin-team alerts (KYC queue, failed webhook, cron health) from the admin panel plan: the plumbing is the
  same `notifyRoles()` call, so they can be added per alert when the admin panel work starts.
- Tamil copy for push text: the title and body are whatever the existing notification says.
- A delivery counter on the admin Command Center.

## Tests

`server/tests/auth/webPush.test.js` (categories, quiet hours, daily cap, mute list, delivery to every device,
cleanup on 410 and after repeated failures, off without keys). The in-app notification tests still pass with the
push hook in place because push is a no-op without keys.
