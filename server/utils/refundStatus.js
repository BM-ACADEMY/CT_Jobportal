// Keeps our copy of a refund's status the same as Razorpay's own (pending, processed or failed), so the buyer sees what
// Razorpay shows. A refund Razorpay has finished with (processed or failed) is never asked about again.
const FINAL = ['processed', 'failed'];
const RECHECK_AFTER_MS = 2 * 60 * 1000;   // do not ask Razorpay about the same refund more than once every 2 minutes
const MAX_PER_CALL = 5;                    // and never more than 5 refunds in one page load

const needsCheck = (p, now) =>
  p.status === 'refunded' && p.razorpay_refund_id && !FINAL.includes(p.refundGatewayStatus) &&
  (!p.refundStatusCheckedAt || now - new Date(p.refundStatusCheckedAt).getTime() > RECHECK_AFTER_MS);

/**
 * @param {object} razorpay  Razorpay client (has refunds.fetch)
 * @param {Array}  payments  Payment documents (Mongoose docs with save())
 * Updates the documents in place and saves the ones that changed. Never throws: Razorpay being slow must not break the page.
 */
const syncRefundStatuses = async (razorpay, payments, now = Date.now()) => {
  const due = payments.filter((p) => needsCheck(p, now)).slice(0, MAX_PER_CALL);
  for (const p of due) {
    try {
      const refund = await razorpay.refunds.fetch(p.razorpay_refund_id);
      const status = String(refund?.status || '').toLowerCase();
      if (status) p.refundGatewayStatus = status;
      p.refundStatusCheckedAt = new Date(now);
      await p.save();
    } catch (err) {
      console.error('Refund status check failed for', String(p._id), err?.error?.description || err?.message || err);
    }
  }
};

module.exports = { syncRefundStatuses, needsCheck, FINAL };
