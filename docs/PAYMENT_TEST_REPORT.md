# Live payment test report (7 Nov 2026)

Times are UTC; India time (IST) is 5 hours 30 minutes later. No secret or key is in this file.

## Result in one line
A real payment of Rs 588.82 (Job seeker Plus, 1 month) worked end to end: checkout, plan activation, webhook, refund from our own admin screen, and the refund reached Razorpay.

## The test
| Item | Value |
|---|---|
| Plan | Job seeker Plus, 1 month |
| Amount | Rs 499 + 18% GST Rs 89.82 = **Rs 588.82** |
| Razorpay order | `order_TxBt5lHI8JX8vA` |
| Razorpay payment | `pay_TxBtDvuzpymBlg` (UPI, captured) |
| Razorpay refund | `rfnd_TxCNJecgmiGapg` (full Rs 588.82, now processed) |
| Account | live key `rzp_live_TvirrnkNGDpCFK` (Afra Ventures account) |

## Timeline
| Time (UTC) | Event |
|---|---|
| 06:44:03 | Order created by the site |
| 06:44:10 | Payment captured by Razorpay |
| 06:44:33 | Razorpay called our webhook (POST /api/payments/razorpay/renewal-webhook, from Razorpay's servers, user agent Razorpay-Webhook/v1). **Our reply: 200.** The payment record was created at the same second. |
| 06:44:48 | Buyer's browser confirmed the payment; plan activated (the record was already saved by the webhook) |
| 06:46:02 | Buyer pressed Cancel plan (moved to Free, payment marked cancelled) |
| 07:01:44 | Refund requested in Payment History |
| after 07:01 | Admin approved it in Subscriptions > Refunds; our server sent a full refund to Razorpay; payment marked refunded; plan Free |
| later | Razorpay refund status: pending, then processed |

## Webhook set-up (from the Razorpay dashboard)
URL `https://api.velaivaaipu.in/api/payments/razorpay/renewal-webhook`, Enabled, secret set, events: order.paid, subscription.pending, subscription.halted, subscription.charged. Last updated 7 Nov 12:12 pm IST by bm.kamardn4@gmail.com.
Razorpay account has 0 subscriptions and 0 plans (checked through the API).

## Problems found in the test, and fixed
1. **Payments blocked: "website does not match registered website(s)".** Cause: the site was using a key from a different Razorpay account from the one where velaivaaipu.in was approved. Fixed by switching the server and the site to the key of the account where the website is approved. The old settings are saved on the server.
2. **Cancel plan made a paid payment non-refundable.** Fixed: a payment cancelled after paying stays refundable inside the refund window. Test added.
3. **Auto-Pay box showed for one-time plans** and the site saved "auto-renew on" for a plan that never renews. Fixed: the box is hidden for one-time plans and the server records auto-renew off for them. Test added.
4. **Refund status**: Payment History now shows "Refund accepted" and Razorpay's own status (Pending, Processed, Failed).
5. Refund window is now **10 days** (was 24 hours) everywhere, and the Cancel plan dialog says cancelling does not refund and points to Payment History.
6. Earlier outage (a few minutes of 403) after a rebuild with wrong file permissions; fixed, and the cause is understood.

## Still open
- Razorpay dashboard screenshot of the webhook delivery (the dashboard shows no Logs tab on the webhook page); the server log above is the proof of the 200 reply.
- Auto-renewal (autopay) is for college and company plans only and is not tested with real money. Razorpay's shortest repeat is 7 days. Recurring plans stay switched off until that test passes.
- Old payments (from the previous Razorpay account) can only be refunded in that account's dashboard.
- Regenerate the Razorpay key secret after launch (it was shown in the chat).
- Another project's webhook (teampulse...) shares this Razorpay account; its address ends with a stray comma.
