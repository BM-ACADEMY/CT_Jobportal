// The checks made on every real payment after it happens (scripts/paymentWatch.js runs them every 2 minutes):
//   1. the money Razorpay captured has a payment record on our side
//   2. for a plan payment: the plan is active on the buyer's account
//   3. the invoice amounts are right: GST is the site's GST percentage (18) and base + GST = the amount charged
//   4. there is no Razorpay subscription (no automatic renewal) behind it
//   5. only job seeker and recruiter plans are bought while recurring (company and college) plans are closed
// Pure function: pass in what was read, get back the problems. No database or network here, so it is easy to test.
const RECORDED = ['completed', 'refund_pending', 'refunded', 'cancelled', 'superseded'];
const CLOSED_PLAN_ROLES = ['company', 'college'];
const CENT = 0.011;

const planIsActiveFor = (user, plan, now) => {
  if (!user || !plan) return false;
  const onPlan = String(user.subscription?._id || user.subscription || '') === String(plan._id)
    || (user.subscriptionDetails && user.subscriptionDetails.name === plan.name);
  if (!onPlan) return false;
  if (plan.duration === 'Lifetime' || plan.price === 0) return true;
  return !user.subscriptionExpiry || new Date(user.subscriptionExpiry).getTime() > now;
};

/**
 * @param {object} i
 * @param {object} i.rzp            the payment as Razorpay reports it (id, amount in paise, status, subscription_id)
 * @param {object|null} i.record    our Payment record for that Razorpay payment id (or null)
 * @param {object|null} i.user      the buyer (subscription, subscriptionDetails, subscriptionExpiry)
 * @param {object|null} i.plan      the plan that was bought (null for a pay-per-feature purchase)
 * @param {number} i.gstPercentage  the site's GST percentage from Admin > Settings
 * @param {number} [i.now]          ms timestamp, for tests
 * @returns {{ ok: boolean, problems: string[], summary: object }}
 */
const evaluatePayment = ({ rzp, record, user, plan, gstPercentage, now = Date.now() }) => {
  const problems = [];

  if (rzp.subscription_id) problems.push(`The payment belongs to a Razorpay subscription (${rzp.subscription_id}), which means automatic renewal. None should exist.`);

  if (!record) {
    problems.push('Razorpay captured the money but there is NO payment record on our side.');
    return { ok: false, problems, summary: { payment: rzp.id, amount: rzp.amount / 100 } };
  }
  if (!RECORDED.includes(record.status)) problems.push(`The payment record has status "${record.status}" although Razorpay captured the money.`);

  const total = Number(record.amount);
  const base = Number(record.baseAmount);
  const gst = Number(record.gstPercentage);
  if (Math.abs(rzp.amount / 100 - total) > CENT) problems.push(`Razorpay charged Rs ${rzp.amount / 100} but our record says Rs ${total}.`);
  if (gst !== Number(gstPercentage)) problems.push(`The invoice shows ${gst}% GST but the site setting is ${gstPercentage}%.`);
  else if (Math.abs(base * (1 + gst / 100) - total) > CENT) problems.push(`Base Rs ${base} plus ${gst}% GST is not Rs ${total}.`);

  let activated = null;
  if (plan) {
    if (CLOSED_PLAN_ROLES.includes(plan.role)) problems.push(`A ${plan.role} plan ("${plan.name}") was bought while recurring plans are closed.`);
    if (record.status === 'completed') {
      activated = planIsActiveFor(user, plan, now);
      if (!activated) problems.push(`The plan "${plan.name}" is NOT active on the buyer's account although the payment is complete.`);
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    summary: {
      payment: rzp.id, order: rzp.order_id, amount: total, base, gstPercentage: gst,
      plan: plan?.name || '(pay-per feature)', status: record.status, planActive: activated, subscription: Boolean(rzp.subscription_id),
    },
  };
};

module.exports = { evaluatePayment, planIsActiveFor, RECORDED };
