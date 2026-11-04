# Platform staff roles (item 5): support, counsellor, college verifier

Branch `team-permissions`, second commit (the first is the recruiter-team gate, see TEAM_PERMISSIONS.md).

## Model

- A staff member is an ordinary account with the existing **`subadmin`** role (the Role enum is unchanged) plus
  `user.staff = { role, permissions, grantedBy, grantedAt }`. Staff never get the `admin` role; the Super Admin
  stays in the separate Admin collection exactly as before.
- Permission keys and the three presets live in `server/config/staffPermissions.js` (mirrored in
  `client/src/config/staffPermissions.js`; a test checks the lists match):

| Preset | Permissions |
|---|---|
| Support | tickets_view, tickets_update, users_view |
| Counsellor | requests_view, requests_update, requests_assign |
| College verifier | colleges_view, colleges_verify |

The Super Admin can add or remove single permissions per person after picking a preset.

## What each permission opens (server, `middlewares/staffPermission.js: requireAdminOr`)

| API | Was | Now |
|---|---|---|
| `GET /tickets/admin/all` | admin | admin or tickets_view |
| `PATCH /tickets/admin/:id` | admin | admin or tickets_update |
| `GET /admin/users`, `GET /admin/users/:id`, `GET /admin/users/:id/applications`, `GET /admin/roles` | admin | admin or users_view (read only; block, edit, delete, verification stay admin) |
| `GET /requests/admin` | admin | admin or requests_view; staff see counselling, mock interview and AI resume review requests only |
| `PATCH /requests/admin/:id` | admin | admin or requests_update; staff refused (403) on a website request |
| `GET /requests/admin/assignees`, `PATCH /requests/admin/:id/assign` | admin | admin or requests_assign; same type scope |
| `GET /college/admin/all-colleges`, `GET /college/admin/colleges/:id` | admin | admin or colleges_view |
| `PUT /college/admin/verify/:id` | admin | admin or colleges_verify |
| `/coupons/*` | admin or subadmin | **admin only** (tightened; no staff role needs coupons) |

Every other admin route is untouched and still answers 403 to staff. `admin` passes every gate with no lookup.

## Managing staff (Super Admin only)

Admin > **Staff** (`/admin/staff`, API `GET/POST/PUT/DELETE /api/admin/staff` behind `authorizeRoles('admin')`).
Add by the email of an existing **job seeker** account (companies, colleges, recruiters and existing staff are
refused with a message), pick a preset, tick permissions. Removing turns the account back into a job seeker.
The person must sign out and in once after being added (their token carries the role); permission edits apply on
the next request.

## What staff see

- Sign in with the normal login. Home is `/subadmin`: a plain page listing the granted areas (the old mock
  "Operational Dashboard" with invented queue items is gone).
- Sidebar: Home, one entry per granted area, Help & Support.
- The admin pages they can open hide the actions they lack: ticket status and conclusion are read-only without
  tickets_update; Assign / Update buttons on requests follow requests_assign / requests_update; Verify / Reject /
  Reset on colleges follow colleges_verify; the user list and user page hide block, delete and verification
  changes for staff. The server refuses the same calls anyway.

## Tests

`server/tests/auth/staffRoles.test.js`: the middleware (admin passes without a lookup, normal users get the old
"Admin only" 403 without a lookup, staff pass only with a listed key); for **every route in the table** the five
callers are run through the real gate found in the router stack: that staff role with the permission passes, the
same role without it gets 403, another staff role gets 403, a job seeker and a recruiter get 403, admin passes;
the admin router keeps its admin-only gate ahead of every write; coupons refuse a staff member holding every
permission; request scoping; the staff management controller (presets, explicit lists, refusals, reset to job
seeker). Full server run: 306 pass.

## Manual check before merging

1. As Super Admin: Admin > Staff, add a job seeker as **Support**. Sign in as them in another browser: Home shows
   Support tickets and Users; Support Tickets opens; status is editable; Users opens read-only (no block or delete);
   `/admin/payment-history` redirects away; `GET /api/payments/admin/all` answers 403.
2. Change them to **Counsellor** and save. Reload as them: the menu changes without re-login; Requests shows only
   counselling, mock interview and resume review rows; Assign and Update work; `PATCH /api/requests/admin/<website
   request id>` answers 403.
3. **College verifier**: College Verification opens, Verify / Reject work; everything else is hidden.
4. Remove them: they are a job seeker again on next login.
