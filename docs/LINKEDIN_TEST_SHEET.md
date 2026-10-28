# LinkedIn login: setup check and per-role test

Code reviewed: `server/controllers/linkedinAuth.js` against LinkedIn's "Sign In with LinkedIn using OpenID Connect" flow. Authorization URL `linkedin.com/oauth/v2/authorization`, token URL `linkedin.com/oauth/v2/accessToken`, userinfo `api.linkedin.com/v2/userinfo`, scopes `openid profile email`: all match LinkedIn's documented endpoints. State is a signed 10-minute token tied to the browser by an httpOnly nonce cookie. Privileged roles in the query fall back to jobseeker. Not yet run against a real LinkedIn app.

## App setup (see docs/EXTERNAL_REQUESTS_PACK.md section 3)
- Developer app with the product "Sign In with LinkedIn using OpenID Connect".
- Redirect URL exactly `https://<api-domain>/api/auth/linkedin/callback` (same as `LINKEDIN_CALLBACK_URL`; no trailing slash differences).
- Server env: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_CALLBACK_URL`, `NODE_ENV=production`, `FRONTEND_URL`.
- Fixed in this review: login now reports "not available" if the callback URL is missing, instead of sending LinkedIn `redirect_uri=undefined`.

## Test per role (use a LinkedIn account whose email is verified)
| # | Step | Expected | Result |
|---|---|---|---|
| 1 | `/register`, role Job seeker, Continue with LinkedIn | LinkedIn consent screen, back on the site at `/social-auth-success`, then logged in as jobseeker; profile completion asked once (`isSocialIncomplete`) | |
| 2 | Same with role Recruiter (new LinkedIn email) | Account created with role recruiter | |
| 3 | Same with role Company | Account created with role company | |
| 4 | Log out, log in again with LinkedIn | Same account, same role, no duplicate user | |
| 5 | Use an email that already has an email/password or Google account | Linked to the existing account (matched by verified email); role stays as it was | |
| 6 | Cancel on the LinkedIn screen | Back at `/login?error=LinkedIn sign-in was cancelled` | |
| 7 | Wait over 10 minutes on the LinkedIn screen, then approve | "Sign-in session expired" message | |
| 8 | Open the callback URL in another browser with a copied `state` | "session could not be verified" (nonce cookie missing) | |
| 9 | Blocked user logs in with LinkedIn | "Account blocked" | |
| 10 | Installed PWA on Android and iPhone | Login returns to the app; session survives (iPhone may use the system browser) | |

## Failure hints
- `redirect_uri` mismatch from LinkedIn: the app's redirect URL differs from `LINKEDIN_CALLBACK_URL`.
- Server log `LinkedIn login error:` prints LinkedIn's own response; read it first.
- "no verified email address": the LinkedIn account has no verified primary email.

## Known notes (not changed)
- After login the server redirects with the session token and user data in the URL query (`/social-auth-success?token=...`). Google login works the same way. The token can end up in browser history and logs; moving it to a one-time code exchange is a later hardening item.
