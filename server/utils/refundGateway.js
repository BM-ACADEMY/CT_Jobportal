// Sends an approved refund to Razorpay. Approving in our admin screen used to change only our own records;
// the customer was told the money was coming back but nothing was sent. This is the missing call.
//
// The full captured amount is refunded (no amount sent), so there is no rounding to get wrong.
const describeError = (err) => {
  const text = err?.error?.description || err?.message;
  if (text) return String(text);
  // The Razorpay SDK sometimes rejects with only a status code, for example 404 for a payment id it does not know.
  if (err?.statusCode === 404) return 'payment not found at Razorpay (check that the live or test keys match the payment)';
  if (err?.statusCode) return `Razorpay answered with status ${err.statusCode}`;
  return 'unknown error';
};

// Razorpay says this when the payment was already refunded (for example, someone refunded it in the Dashboard
// first, or an admin double-clicked). The money is already on its way, so approval can finish.
const isAlreadyRefunded = (err) => /already\s+(been\s+)?(fully\s+)?refunded|refunded\s+already/i.test(describeError(err));

/**
 * @param {object} razorpay  Razorpay client (has payments.refund)
 * @param {object} payment   Payment record (razorpay_payment_id, _id, refundReason)
 * @returns {Promise<{ refundId: string|null, alreadyRefunded: boolean, skipped?: boolean }>}
 * @throws  with err.userMessage when Razorpay refuses, so nothing is changed on our side
 */
const refundAtGateway = async (razorpay, payment) => {
  if (!payment.razorpay_payment_id) return { refundId: null, alreadyRefunded: false, skipped: true }; // free item: nothing was charged
  try {
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      speed: 'normal',
      receipt: `refund_${payment._id}`,
      notes: { paymentRecord: String(payment._id), reason: String(payment.refundReason || '').slice(0, 200) },
    });
    return { refundId: refund?.id || null, status: String(refund?.status || '').toLowerCase(), alreadyRefunded: false };
  } catch (err) {
    if (isAlreadyRefunded(err)) return { refundId: null, alreadyRefunded: true };
    const wrapped = new Error(describeError(err));
    wrapped.userMessage = `Razorpay could not process the refund: ${describeError(err)}. Nothing was changed. Try again, or refund it in the Razorpay Dashboard first.`;
    throw wrapped;
  }
};

module.exports = { refundAtGateway, isAlreadyRefunded, describeError };
