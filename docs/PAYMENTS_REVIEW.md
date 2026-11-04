# Payments review (branch `payments-review`)

Scope: `server/controllers/paymentController.js`, `routes/paymentRoutes.js`, `utils/paymentFulfillment.js`,
`paymentGuards.js`, `pricing.js`, `refundPolicy.js`, `refundGateway.js`, `webhookRawBody.js`, `models/Payment.js`,
`models/Coupon.js`. Read-only review of 5 Nov 2026 plus three small fixes (marked FIXED).

**Not verified by running code.** The review session could not install npm packages, so the payment test
suite (`node --test tests/payments/*.test.js`) was NOT run against these fixes. Run it before merging.

Prices, GST (18%) and the Razorpay setup were not changed.

## What is solid

- Checkout signatures are checked with a constant-time HMAC (`isValidSignature`).
- The order/subscription `notes` written by the server decide which user, plan, quantity and coupon were paid for,
  so a cheap order cannot be used to claim a dearer plan.
- A Razorpay payment id can only become one Payment row (unique index + claim-before-grant), so double-clicks,
  retries and "browser verify + webhook" races grant a purchase once. A failed grant releases the claim.
- Webhook is signed over the raw bytes, redelivered events are de-duplicated by event id, and errors return 500
  so Razorpay retries.
- Refund approval calls Razorpay first and changes nothing locally if Razorpay refuses.

## Bugs fixed on this branch (second commit, small and separate)

1. **Cancelling a plan also cancelled pay-per-feature payments** (`cancelSubscription`). It set every
   `completed` payment to `cancelled`, including consumable pay-per purchases the user still holds. That removed
   their refund eligibility and dropped them from the admin "buyers / total spent" figures. It now touches plan
   payments only, the same rule `fulfillPlanPayment` already uses when superseding.
2. **Refunding a pay-per-feature payment downgraded the user's plan to Free** (`approveRefund`). The revoke step
   ran for every refund. It now runs only when the refunded payment has a `plan`. The approval message no longer
   says "moved to the Free plan" for pay-per refunds.
3. **Recurring checkout recorded a coupon that was never applied** (`createSubscriptionOrder`). The raw request
   `couponCode` went into the Razorpay subscription notes even when the coupon was inactive or used up (the
   one-time `createOrder` already only sets it when applied). It now matches `createOrder`.

## Bugs and risks NOT fixed (need a decision or a test environment)

### High

- **Cancel does not stop recurring billing.** `cancelSubscription` never calls Razorpay to cancel the mandate
  (no `subscriptions.cancel` anywhere in the server) and never clears `razorpaySubscriptionId` /
  `autoRenewEnabled` on the College or Company doc. A college or company that cancels is moved to Free locally
  but Razorpay keeps charging, and the next `subscription.charged` webhook finds the doc by subscription id and
  renews it. Affects college and company plans only (candidate plans are one-time). Needs
  `razorpay.subscriptions.cancel(id)` plus clearing the doc, with tests. Do not ship recurring company/college
  plans for sale until this is handled.
- **No check that a plan belongs to the buyer's role.** `createOrder` / `verifyPayment` only block org team
  members from company plans. A candidate can pay for or "select" a recruiter, company or college plan, and a
  free plan of another role (price 0) can be activated through `verify-payment`. If any non-candidate free plan
  has bigger limits than the Free candidate plan, that is a free upgrade. Needs a role rule (note recruiters may
  legitimately buy company plans, so this is a product decision).
- **Inactive plans can be bought.** `createOrder` loads the plan by id and never checks `plan.isActive`.

### Medium

- **Duplicate-charge rule is dead for plan payments.** `checkRefundEligibility` looks for a twin payment with
  status `completed`, `refund_pending` or `refunded`, but buying a plan marks the user's earlier plan payments
  `superseded`, so the first of two identical plan payments is never found. The "duplicate charge is refundable
  at any time" rule therefore only works for pay-per purchases. Likely fix: include `superseded` in the twin
  statuses (the existing unit test fakes the database, so it would not catch this).
- **Refund of a duplicate still revokes the plan.** For a flagged duplicate (`refundDuplicate`) the user paid
  twice for one plan, yet approval moves them to Free. Likely the admin should refund the extra payment and keep
  the plan.
- **Refund of an old payment can downgrade a newer plan.** Approval always resets the user to Free, even if they
  have bought a different plan since.
- **Refunded pay-per purchases keep working.** Nothing removes the matching entry from
  `user.purchasedFeatures` on refund (the entry has no link to the payment id).
- **Recurring plan price is cached forever.** `Subscription.razorpayPlanId` is created with the price + GST at
  that moment and never cleared. After any price or GST change, recurring customers are still charged the old
  amount.
- **Coupons can be over-redeemed.** The discount is applied when the order is created, but the use is counted
  only after payment. Many orders created before the first payment can exceed `totalUses`. There is also no
  expiry date, per-user limit or per-plan scope on coupons.
- **A 100% coupon cannot be paid.** The order amount becomes 0, Razorpay rejects it, and the user sees a generic
  500. Decide whether to support it (activate like a free plan) or block it.
- **Webhook only handles `order.paid`, `subscription.charged`, `.halted`, `.pending`.** A mandate cancelled or
  completed from the Razorpay Dashboard (`subscription.cancelled` / `completed`) is not reflected locally.
- **Payment capture mode.** The verify step trusts the checkout signature. If the Razorpay account is on manual
  capture, uncaptured payments are auto-refunded after about 5 days while the plan stays active. Confirm
  auto-capture is on when Razorpay is approved.

### Low

- **Refund re-requests after rejection.** Rejecting sets the payment back to `completed`, so the user can
  re-request again inside the 24 h window and re-notify admins each time.
- **Month-end expiry overflow.** `computeExpiry` uses `setMonth`, so a Monthly plan bought on 31 Jan expires on
  3 Mar instead of 28 Feb.
- **Invoice figures drift.** The Payment row stores base / GST recomputed from today's GST setting and coupon,
  while `amount` is what was really charged. They only differ if settings changed between order and verify.
- **500 responses include `error: err.message`** from `createOrder` / `createSubscriptionOrder`, which can echo
  Razorpay error text to the browser.
- **Payment history exposes** `razorpay_signature` and order ids to the owner (not secret, but unnecessary).
- **Admin lists are unpaginated** (`getAllPayments`) and `sendRenewalReminder` puts `user.name` into HTML
  unescaped (admin-only).
- **Secrets in repo files.** `server/deleteMocks.js` and `server/setPriority.js` contain a hard-coded database
  connection string with a username and password. Rotate that password, move the scripts to read the connection
  from the environment, and remove the values from the repo history. (Also check that `.env.example` files hold
  placeholders only; they were not opened.)

## Suggested order after launch

1. Cancel/mandate handling (High, before selling recurring plans).
2. Role and `isActive` checks on purchase.
3. Duplicate-charge twin statuses and the refund side effects (duplicate, newer plan, pay-per credits).
4. Recurring plan cache invalidation on price/GST change.
5. Coupon limits and 100% coupon handling.
