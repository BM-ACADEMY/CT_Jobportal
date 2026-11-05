// Cancelling a college or company plan must also stop the Razorpay mandate (the automatic monthly or yearly charge).
// Before this, a cancelled plan moved to Free in our database but Razorpay kept charging, and the next
// subscription.charged webhook renewed the plan again (docs/PAYMENTS_REVIEW.md, High).
//
// The mandate is cancelled at Razorpay FIRST. If Razorpay refuses, an error with userMessage is thrown and the caller
// changes nothing, so we never show "cancelled" while money can still be taken. Only after Razorpay accepts do we
// clear the mandate on the College or Company record.
const College = require('../models/College');
const Company = require('../models/Company');

const describeError = (err) => err?.error?.description || err?.message || (err?.statusCode ? `Razorpay answered with status ${err.statusCode}` : 'unknown error');

// Razorpay says this when the mandate is already cancelled or finished. Money cannot be taken, so cancelling can finish.
const isAlreadyStopped = (err) => /(already|cannot be cancelled).*(cancel|complet|expir)|status\s+(is\s+)?(cancelled|completed|expired)/i.test(describeError(err));

// Finds the College or Company records of this user that hold a mandate.
const findMandateHolders = async (user) => {
  const holders = [];
  const college = await College.findOne({ tpoUser: user._id });
  if (college?.razorpaySubscriptionId) holders.push(college);
  if (user.company) {
    const company = await Company.findById(user.company);
    if (company?.razorpaySubscriptionId) holders.push(company);
  }
  return holders;
};

/**
 * @param {object} razorpay  Razorpay client (has subscriptions.cancel)
 * @param {object} user      User document (needs _id, optional company)
 * @returns {Promise<{ cancelled: string[] }>} ids of the mandates that were stopped
 * @throws  with err.userMessage when Razorpay refuses (nothing has been changed)
 */
const cancelRecurringMandates = async (razorpay, user) => {
  const holders = await findMandateHolders(user);
  const cancelled = [];
  for (const doc of holders) {
    const id = doc.razorpaySubscriptionId;
    try {
      await razorpay.subscriptions.cancel(id, false); // false = stop now, not at the end of the cycle
    } catch (err) {
      if (!isAlreadyStopped(err)) {
        const wrapped = new Error(describeError(err));
        wrapped.userMessage = `Razorpay could not cancel the automatic payment: ${describeError(err)}. Your plan was not changed. Please try again or contact support.`;
        throw wrapped;
      }
    }
    doc.razorpaySubscriptionId = '';
    doc.autoRenewEnabled = false;
    doc.nextRenewalDate = null;
    await doc.save();
    cancelled.push(id);
  }
  return { cancelled };
};

module.exports = { cancelRecurringMandates, isAlreadyStopped };
