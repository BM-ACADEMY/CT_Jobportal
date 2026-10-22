// Refund rules (kept in one place so the Terms page, the Refund page and the API agree).
//   1. Self-serve refund requests are accepted within 24 hours of the payment.
//   2. One refund per account / email / phone number.
//   3. A duplicate charge (same item paid twice within 24h) is always refundable, at any time.
//   4. College (campus) plans are handled by our team: the request is not self-serve.
//   5. An admin still approves every refund and confirms that nothing was used.
const REFUND_WINDOW_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

/**
 * @param {object} payment  Payment document (plain object or doc) belonging to the requester
 * @param {object} deps     { Payment, User, now } - injected for tests
 * @param {object} context  { user, planRole }
 * @returns {Promise<{eligible:boolean, code?:string, msg?:string, duplicate?:boolean}>}
 */
const checkRefundEligibility = async (payment, deps, context = {}) => {
  const { Payment, User } = deps;
  const now = deps.now ? deps.now() : Date.now();
  const { user, planRole } = context;

  if (payment.status !== 'completed') {
    return { eligible: false, code: 'not_completed', msg: 'Only completed payments can be refunded' };
  }
  if (!(Number(payment.amount) > 0)) {
    return { eligible: false, code: 'free', msg: 'Free plans have nothing to refund' };
  }

  // 3. duplicate charge: the same item bought again by the same user within 24h of this payment
  const created = new Date(payment.createdAt).getTime();
  const sameItem = payment.plan
    ? { plan: payment.plan }
    : payment.payPerFeature ? { payPerFeature: payment.payPerFeature } : null;
  if (sameItem) {
    const twin = await Payment.findOne({
      _id: { $ne: payment._id },
      user: payment.user,
      status: { $in: ['completed', 'refund_pending', 'refunded'] },
      isRenewal: { $ne: true },
      ...sameItem,
      createdAt: { $gte: new Date(created - 24 * HOUR_MS), $lte: new Date(created + 24 * HOUR_MS) },
    }).select('_id');
    if (twin && !payment.isRenewal) return { eligible: true, duplicate: true };
  }

  // 4. campus plans are contact-only
  if (planRole === 'college') {
    return { eligible: false, code: 'contact_support', msg: 'College plans are reviewed by our team. Please raise a support ticket or email support so we can help you.' };
  }

  // 1. window
  if (now - created > REFUND_WINDOW_HOURS * HOUR_MS) {
    return { eligible: false, code: 'window_closed', msg: `Refund requests must be made within ${REFUND_WINDOW_HOURS} hours of payment. See the Refund & Cancellation policy.` };
  }

  // 2. one refund per account / email / phone
  const phone = (context.phone || '').replace(/\D/g, '').slice(-10);
  const sameIdentity = [{ _id: payment.user }];
  if (user?.email) sameIdentity.push({ email: String(user.email).toLowerCase() });
  if (phone.length === 10) {
    sameIdentity.push({ 'profile.phone': new RegExp(`${phone}$`) });
    sameIdentity.push({ 'recruiterProfile.phone': new RegExp(`${phone}$`) });
    sameIdentity.push({ 'companyProfile.phone': new RegExp(`${phone}$`) });
  }
  const ids = (await User.find({ $or: sameIdentity }).select('_id')).map((u) => u._id);
  const earlier = await Payment.findOne({
    user: { $in: ids.length ? ids : [payment.user] },
    _id: { $ne: payment._id },
    status: { $in: ['refund_pending', 'refunded'] },
  }).select('_id');
  if (earlier) {
    return { eligible: false, code: 'already_refunded', msg: 'A refund has already been requested or issued for this account. Each account, email and phone number is eligible once.' };
  }

  return { eligible: true };
};

module.exports = { checkRefundEligibility, REFUND_WINDOW_HOURS };
