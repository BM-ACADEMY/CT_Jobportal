# Velaivaaipu (CT_Jobportal) — Launch Readiness Audit

Repo: BM-ACADEMY/CT_Jobportal @ 7ba33a5 · Audited 21 Oct 2026 · Read-only review (nothing was changed or pushed)

## Verdict

**Not safe to launch publicly yet, but close.** Features and the payment flow are in good shape. There are 8 security blockers (P0), all small fixes (about 1 day of work). Fix those, rotate the credentials listed below, and you can launch.

> The repository is **public**. Anyone can read the default admin password and every weakness below. Treat P0 items 1 and 2 as urgent even if you are not launching today.

---

## P0 — Fix before launch (account takeover / data exposure)

### 1. Anyone can become admin (Google/GitHub login) — CRITICAL
`routes/auth.js` passes `?role=` from the URL into OAuth state, and `config/passport.js` (lines ~50-66 and ~134-150) creates the user with whatever role name is sent, as long as that role exists. `admin` and `subadmin` exist.
Visiting `/api/auth/google?role=admin` creates an account whose JWT has `role: 'admin'`, and `isAdmin` only checks that JWT claim. That gives full admin API access.

**Fix** (passport.js, both strategies):
```js
const SELF_SERVE_ROLES = ['jobseeker', 'recruiter', 'company', 'college'];
if (!SELF_SERVE_ROLES.includes(intendedRole)) intendedRole = 'jobseeker';
```

### 2. Same hole in email registration and social profile completion
`registerUser` and `completeSocialProfile` in `controllers/authController.js` do `Role.findOne({ name: role })` on the request body. Anyone can POST `role: "admin"`.

**Fix**: put the allowlist above in a shared constant and reject anything else:
```js
if (!SELF_SERVE_ROLES.includes(role)) return res.status(400).json({ msg: 'Invalid role specified' });
```

### 3. `completeSocialProfile` has no authentication
It trusts `userId` from the request body. Anyone who knows or guesses a user id with `isSocialIncomplete: true` can set that account's password and role, which is account takeover.

**Fix**: make the OAuth callback issue a short-lived token (15 min, scope `complete-profile`), require it on this route with `verifyToken`, and use `req.user.id` instead of `req.body.userId`.

### 4. Default admin `admin@ct.com / admin123`
`config/seedAdmin.js` creates this account on any empty database and the password is in the public repo.

**Fix**: read `ADMIN_EMAIL` and `ADMIN_PASSWORD` from env and skip seeding if they are unset. **Also check your production database now**: if `admin@ct.com` exists, change its password immediately.

### 5. JWT secret falls back to `'fallback_secret'` (7 places)
`authMiddleware.js`, `authController.js`, `adminController.js`, `userController.js`, `collegeController.js` (x2), `index.js` (socket + session). If `JWT_SECRET` is ever missing in production, anyone can forge an admin token. `genToken.js` in the repo root does exactly that.

**Fix**: fail fast at boot, and delete the fallbacks:
```js
// top of index.js
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET missing or too short'); process.exit(1);
}
```
Also: tokens last **365 days** and `isAdminBlocked` is only checked at login, so a blocked user keeps full access. Use 7-30 days, and check the user's blocked state in `verifyToken` (one cached DB lookup).

### 6. Password-reset / OTP flow is brute-forceable and injectable
- `forgotPassword` and `resetPassword` use `User.findOne({ email })` with the raw body value. Sending `{"email": {"$ne": null}}` matches the first user in the database (NoSQL operator injection). Email is also not lowercased there.
- OTPs are 6 digits from `Math.random()`, with **no attempt limit and no rate limit**, so they can be guessed in minutes.
- `forgot-password` returns 404 for unknown emails (account enumeration).

**Fix**: coerce `String(email).toLowerCase()`, use `crypto.randomInt(100000, 1000000)`, add `express-rate-limit` on `/api/auth/*` (e.g. 10 requests/15 min per IP) and an `otpAttempts` counter that invalidates the OTP after 5 wrong tries. Return the same message whether or not the email exists.

### 7. Socket.io has no authorization
`index.js`: any client can `join_room` / `join_group` for any id and `send_message` into any room, even with no token. Messages and group chats can be read and spoofed.

**Fix**: reject connections without a valid token (`io.use(...)`), take the user id from the token only, and on `join_room` / `join_group` check membership in the Conversation / CollaborationGroup. Drop the client-driven `send_message` relay; emit from the REST controllers (which already attach `req.io`).

### 8. Uploaded files are public and committed to git
`app.use('/uploads', express.static(...))` serves resumes, MoUs and college reports to anyone with the URL. 21 uploaded files (resumes, "DEMO" MoUs/reports) are **tracked in git**, which is a candidate-data leak in a public repo.

**Fix**: stop tracking `server/uploads/`, add it to `.gitignore`, and serve resumes / MoUs / reports through an authenticated route (or signed URLs). Only public assets (avatars, company logos, cover images) should stay static. Also make sure your host has a persistent disk or object storage; most platforms wipe local disk on redeploy.

---

## P1 — Fix in the first week

| # | Issue | Fix |
|---|---|---|
| 1 | Internal errors leak to clients: `res.status(500).json({ msg: err.message, stack: err.stack })` in auth controllers | Return a generic message and log server-side |
| 2 | OTPs printed to server logs (`[AUTH DEBUG] ... OTP FOR ...`) | Remove the `console.log` lines |
| 3 | No `helmet`, no rate limiting anywhere (login, register, contact form, public drive register, skill-test, AI endpoints) | `npm i helmet express-rate-limit`; stricter limits on auth, contact and AI routes |
| 4 | `express-session` uses the default MemoryStore with `saveUninitialized: true` (leaks memory in prod, creates a session per visitor) | Set `saveUninitialized: false`, `cookie: { secure: true, sameSite: 'lax' }`, or drop sessions and use signed `state` for OAuth |
| 5 | OAuth callback puts the JWT in the URL query string (history, logs, referrers) | Redirect with a one-time code and exchange it via POST |
| 6 | Server starts listening even if MongoDB fails to connect (`.catch` only logs) | `process.exit(1)` on connection failure so the host restarts it |
| 7 | `seedRoles`, `seedAdmin`, `seedSubscriptions`, `migrateUsersToFreePlan` run on every boot | Move migrations to scripts; keep seedRoles only |
| 8 | CORS rejections throw an Error (returns a 500) | Return `callback(null, false)` |
| 9 | Public tokens/passkeys (`principalPasskey`, company-drive tokens, incharge invite tokens) guard reports with student data | Confirm they are long random values (`crypto.randomBytes(24)`), have expiry, and are not guessable |
| 10 | No automated tests for auth, role checks or object-level access | Add a few (see "Tests worth adding") |

## P2 — Cleanup / quality

- **Repo hygiene**: delete committed junk: `client/build_error.txt` (UTF-16 build log), 16 loose scripts in `server/` root (`test-*.js`, `checkUser.js`, `deleteMocks.js`, `fix_salaries.js`, `genToken.js`, ...), `server/scratch/`, `server/dummy.pdf`, and the duplicated `where-to-advertise-job-vacancy-pondicherry (1).html`. Move one-off scripts to `server/scripts/` or delete them.
- **`client/.env` is tracked** (contains `rzp_live_...` key ID, which is public by design, and API URLs). Untrack it and add `.env` to the root `.gitignore`; keep a `.env.example`.
- **Client bundle**: the main JS chunk is 906 kB (287 kB gzip) despite `lazy()` on 20 routes. Add `build.rollupOptions.output.manualChunks` (react, antd, framer-motion, jspdf/html2canvas) to improve first load on mobile.
- **SEO**: `sitemap.xml` lists only 9 URLs. Add the blog pages and, ideally, generate job and company URLs. The four standalone blog `.html` files in the repo root are not served by the Vercel build, so confirm they are reachable.
- **API URL fallbacks** to `http://localhost:5000` exist in 4 client files; fine in dev, but make production builds fail if `VITE_API_BASE_URL` is unset.
- **WhatsApp webhook** `POST /api/whatsapp/webhook` is unauthenticated and logs full payloads (personal data); verify the Meta signature or remove it until used.
- Large files to split over time: `collegeController.js` (~3,000 lines), `paymentController.js` (1,055), `authController.js` (726).

---

## What is already good

- **Payments are solid**: prices computed server-side, Razorpay order notes bind plan/user/quantity, amount paid is re-checked against the plan, signatures verified, replayed verifications and duplicate webhook events handled, webhook uses raw body + `timingSafeEqual`, and it has real tests.
- Admin and most role routes are protected at router level (`router.use(verifyToken, ...)`); admin payment routes use `isAdmin`.
- bcrypt password hashing; CORS allowlist from env; upload size (10 MB) and file-type filters; graceful shutdown; Mongo credentials masked in logs.
- No `dangerouslySetInnerHTML` in the client.
- Feature coverage is broad: seekers, recruiters/ATS, colleges/campus drives, subscriptions, pay-per-feature, coupons, tickets, reviews, AI resume/candidate tools, interviews with video.

## Not verified in this audit

I could not install client dependencies here (npm crashed), so I did **not** re-run the client build, the server tests, or `npm audit`. Run those on your machine before launch:
```
cd server && npm test && npm audit
cd ../client && npm run build && npm audit
```
I also did not review per-object authorization (e.g. can recruiter A open recruiter B's applicants, or user A read user B's messages by changing an id), the AI/Gemini endpoints, or most of `collegeController.js`. Those are the next review targets after the P0 fixes.

---

## Launch checklist

**Today**
1. Check production DB for `admin@ct.com`; change its password / remove it.
2. Confirm `JWT_SECRET` is set in prod and is 32+ random characters; **rotate it** (this signs out everyone, which is fine).
3. Check Users in prod for unexpected accounts with role `admin` / `subadmin` / `drive_incharge`.
4. Apply P0 fixes 1-6 (about 2-3 hours).

**Before launch**
5. Apply P0 fixes 7-8; untrack `server/uploads/`.
6. Add helmet + rate limits (P1-3).
7. Set env vars on the host: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, `RAZORPAY_KEY_ID/SECRET`, `RAZORPAY_WEBHOOK_SECRET` (set it separately from the key secret), email SMTP, Google/GitHub OAuth, `GEMINI_API_KEY`, `ADMIN_EMAIL/PASSWORD`.
8. Register the Razorpay webhook URL: `https://<api-domain>/api/payments/razorpay/renewal-webhook`.
9. Turn on MongoDB Atlas backups; set up uptime monitoring on `/`.
10. Smoke test with a real small payment (refund it): signup → OTP email → subscribe → job post → apply → admin approve.

## Tests worth adding (small, high value)
- Registering with `role: admin` / `subadmin` returns 400.
- `/api/auth/google?role=admin` yields a jobseeker.
- `forgot-password` with `{"email":{"$ne":null}}` returns 400, not a match.
- A blocked user's existing token is rejected.
- A jobseeker token gets 403 on `/api/admin/*` and on another user's application/message ids.
