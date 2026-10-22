# Velaivaaipu — Job Portal

A multi-role job platform connecting job seekers, companies/recruiters and colleges (campus placements), with subscriptions, pay-per-feature purchases and AI-assisted tools.

**Live:** https://velaivaaipu.in · Admin: https://admin.velaivaaipu.in

## Stack

| Layer | Tech |
|---|---|
| Client (`/client`) | React, Vite, Tailwind, Radix UI, Ant Design, framer-motion, Jitsi (video interviews) |
| Server (`/server`) | Node.js, Express 5, MongoDB (Mongoose), Socket.io, node-cron |
| Auth | Email + OTP, JWT, Google (Passport) and LinkedIn (OpenID Connect) |
| Payments | Razorpay (orders, subscriptions, webhooks) |
| AI | Google Gemini (resume review, candidate matching) |
| Hosting | Client on Vercel (`client/vercel.json`) |

## Roles

Job Seeker · Recruiter · Company · Org Employee · College (TPO) · Drive In-charge · Sub-Admin · Admin.
See `docs/features_and_flow.md` for the module-by-module feature list and flow diagram.

## Getting started

Requirements: Node 20+, MongoDB.

```bash
# server
cd server
cp .env.example .env        # fill in values (see below)
npm install
npm run dev                 # http://localhost:5000

# client
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Server environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | 32+ random characters; the server should refuse to start without it |
| `FRONTEND_URL`, `ALLOWED_ORIGINS` | CORS allowlist (comma-separated) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `GOOGLE_*`, `LINKEDIN_*` | OAuth client ids / secrets / callback URLs |
| `EMAIL_*` / SMTP settings | OTP and notification emails (see `utils/sendEmail.js`) |
| `GEMINI_API_KEY` | AI features |
| `WA_VERIFY_TOKEN` | WhatsApp webhook verification |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial admin account (recommended) |

### Client environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | e.g. `https://api.velaivaaipu.in/api` |
| `VITE_API_DOMAIN` | API origin, used for Socket.io and uploads |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key id |
| `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID` | GA4 and Meta Pixel (tracking is off when blank) |

Vercel also needs `API_BASE_URL` (e.g. `https://api.velaivaaipu.in/api`) at runtime for the SEO functions in `client/api`
(server-rendered job pages and the dynamic `sitemap.xml`).

## Project layout

```
client/src/
  pages/{admin,company,college,jobseeker,public,auth,...}
  components/  routes/  context/  layouts/
server/
  index.js            app, CORS, Socket.io, route mounting
  routes/ controllers/ models/ middlewares/ cron/ utils/ config/
  tests/              payments + notifications (node --test)
  scripts/            one-off seed / admin / migration scripts
docs/                 features, flow, enhancement plan, QA test cases
```

## API overview (`/api`)

| Prefix | Area |
|---|---|
| `/auth` | register, verify-otp, login, forgot/reset password, social login, `/me` |
| `/user`, `/recruiter`, `/company` | profiles, recruiter and company management |
| `/jobs`, `/applications` | job posting/search, applications, ATS pipeline |
| `/interviews`, `/messages`, `/collaboration` | scheduling, chat, team groups |
| `/college` | students, campus drives, reports, public drive pages |
| `/subscriptions`, `/payments`, `/pay-per`, `/coupons` | plans, Razorpay checkout, webhooks, refunds |
| `/assessments`, `/skill-tests` | assessments and certificates |
| `/tickets`, `/reviews`, `/notifications`, `/requests` | support, reviews, notifications, admin requests |
| `/admin`, `/settings` | admin operations and platform settings |
| `/public` | unauthenticated stats, companies, colleges, contact form |

Auth: send `Authorization: Bearer <jwt>`.

## Payments

Razorpay webhook: `POST /api/payments/razorpay/renewal-webhook` (signature verified against `RAZORPAY_WEBHOOK_SECRET`). Prices are always computed server-side.

## SEO and sharing

`client/api/job.js` serves every `/job/<slug>-<id>` page with the job's title, description, Open Graph tags and
`JobPosting` JSON-LD already in the HTML (so Google and WhatsApp previews work without running JavaScript).
`client/api/sitemap.js` builds `/sitemap.xml` from the live jobs list. Closed jobs stay reachable and are marked `noindex`.

## Campus QR registration

Students open `/join/<driveCode>` (older `/campus/<driveCode>` links still work), enter a name and WhatsApp number, and
go straight into the skill test and certificate. UTM parameters and the drive code are stored on the student record.

## Scripts

```bash
cd server && npm test        # payment, notification and auth tests
node --test client/api/__tests__/seo.test.mjs   # SEO functions
cd client && npm run build   # production build
cd client && npm run lint
```

## Deployment checklist

See `LAUNCH_READINESS.md` for the security fixes and launch checklist.
