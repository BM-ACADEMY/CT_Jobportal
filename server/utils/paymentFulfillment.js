// Turns a paid Razorpay payment into what the customer bought (a plan, a recurring subscription or
// pay-per-feature credits). Both the verify endpoints (the customer's browser reporting back) and
// the Razorpay webhook (Razorpay reporting directly, which still works if the browser was closed
// mid-payment) call these, so a purchase is fulfilled the same way whichever arrives first — and,
// because each records the Payment row before granting anything, only once.
const Payment = require('../models/Payment');
const College = require('../models/College');
const Company = require('../models/Company');
const User = require('../models/User');
const sendEmail = require('./sendEmail');
const { emailWrapper } = require('./emailTemplates');
const { generateMouPdf } = require('./pdfGenerator');
const { saveBufferToUploads } = require('./fileStorage');
const { reconcileTeamSeats } = require('./teamMembership');
const { notifyRoles } = require('./inAppNotifications');
const { fetchGstPercentage, getPricingOption, computeExpiry, computeNextRenewalDate } = require('./pricing');
const { isDuplicateKeyError, findPaymentByRazorpayId, findCoupon, countCouponUse } = require('./paymentGuards');

const STUDENT_LIMIT_UNLIMITED = 100000;
const COLLEGE_TIER_MAP = {
  'Campus Free': 'campus_free',
  'Campus Lite': 'campus_lite',
  'Campus Pro': 'campus_pro',
  'Campus Elite': 'campus_elite'
};

// Only the actual org owner may buy a company-tier plan — a delegated team member (a recruiter
// added by the org admin, or an org_employee) manages recruiting only and never billing,
// regardless of what the client UI shows/hides.
const canPurchasePlan = (user, plan, roleName) =>
  !(plan.role === 'company' && (user.isTeamManaged || roleName === 'org_employee'));

// Creates the Payment row that claims a Razorpay payment id. Resolves to { payment } for the caller
// that won the claim, or { duplicate: existingPayment } if that payment was already recorded
// (sequentially or by a concurrent request — the unique index on razorpay_payment_id decides).
const claimPayment = async fields => {
  try {
    return { payment: await Payment.create(fields) };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const existing = await findPaymentByRazorpayId(fields.razorpay_payment_id);
      if (existing) return { duplicate: existing };
    }
    throw err;
  }
};

// Releases a claim when the purchase could not be granted, so a retry (client or webhook) can succeed.
const releaseClaim = async (payment, label) => {
  console.error(`${label}: purchase could not be granted, releasing Razorpay payment ${payment.razorpay_payment_id}`);
  await Payment.deleteOne({ _id: payment._id }).catch(() => {});
};

const notifyAdminsOfPurchase = ({ io, message, metadata }) => notifyRoles({
  io,
  roles: ['admin', 'subadmin'],
  title: 'Plan purchased',
  message,
  type: 'plan_purchased',
  link: '/admin/payment-history',
  metadata
}).catch(err => console.error('Plan purchase notification failed:', err.message));

// One-time plan purchase (or a switch to a free plan when `paymentId` is absent).
// Resolves to { duplicate } when already recorded, else { expiryDate }.
const fulfillPlanPayment = async ({ user, plan, quantity = 1, couponCode = '', paidAmount = 0, orderId, paymentId, signature = '', autoRenew, io }) => {
  const isFree = plan.price === 0;

  // Already on this free plan: nothing to change, and re-selecting it must not reset usage counters.
  if (isFree && user.subscription && String(user.subscription) === String(plan._id)) {
    return { duplicate: true, alreadyOnPlan: true, expiryDate: user.subscriptionExpiry };
  }

  const expiryDate = computeExpiry(plan, quantity);
  const gstPercentage = isFree ? 0 : await fetchGstPercentage();
  const coupon = isFree ? null : await findCoupon(couponCode);

  let baseAmount = 0;
  if (!isFree) {
    baseAmount = getPricingOption(plan, quantity);
    if (coupon) baseAmount = baseAmount - (baseAmount * coupon.percentage) / 100;
  }
  const gstAmount = isFree ? 0 : Math.round(baseAmount * gstPercentage) / 100;

  const paymentFields = {
    user: user._id,
    plan: plan._id,
    amount: paidAmount,
    baseAmount,
    gstPercentage,
    gstAmount,
    quantity: isFree ? 1 : quantity,
    currency: plan.currency || 'INR',
    razorpay_order_id: orderId || 'FREE_ORDER',
    razorpay_payment_id: paymentId || 'FREE_PAYMENT',
    razorpay_signature: signature,
    status: 'completed',
    paymentMethod: isFree ? 'None' : 'Razorpay',
    couponApplied: coupon?._id || null
  };

  // Record the payment BEFORE granting anything: the loser of a race never reaches the plan update.
  let claim = null;
  if (!isFree) {
    const result = await claimPayment(paymentFields);
    if (result.duplicate) return { duplicate: true, payment: result.duplicate, expiryDate: user.subscriptionExpiry };
    claim = result.payment;
    await countCouponUse(coupon);
  }

  try {
    user.subscription = plan._id;
    user.subscriptionDetails = plan.toObject();
    user.subscriptionExpiry = expiryDate;
    if (autoRenew !== undefined) user.autoRenew = !!autoRenew;

    // Reset usage stats on new subscription
    user.downloadsUsed = 0;
    user.candidateDBExportsUsed = 0;
    user.searchUsed = 0;
    user.jobsUsed = 0;
    user.messagesUsed = 0;
    user.counsellingSessionsUsed = 0;

    await user.save();

    // This self-service (non-recurring) purchase path only updates the owner's own User doc.
    // For a company-tier plan, also sync the Company doc — team members resolve their effective
    // plan from Company.subscription (see authController.js), not the owner's User doc, so
    // without this a team member would never see a plan the owner just paid for.
    if (plan.role === 'company' && user.company) {
      await Company.findByIdAndUpdate(user.company, {
        subscription: plan._id,
        subscriptionExpiry: expiryDate
      }).catch(err => console.error('Company Subscription Sync Error:', err.message));
    }
  } catch (applyErr) {
    if (claim) await releaseClaim(claim, 'Plan purchase');
    throw applyErr;
  }

  // Plan just changed (upgrade/downgrade) — trim any active team seats that now exceed
  // the new plan's limit. Upgrades are a no-op here since the count never exceeds a higher limit.
  await reconcileTeamSeats(user, plan).catch(err => console.error('Seat Reconciliation Error:', err.message));

  // Supersede the user's earlier plan payments (never the new one, and never pay-per-feature
  // purchases, which are consumable add-ons rather than plans).
  try {
    await Payment.updateMany(
      { user: user._id, status: 'completed', paymentType: { $ne: 'pay-per-feature' }, ...(claim && { _id: { $ne: claim._id } }) },
      { $set: { status: 'superseded' } }
    );
  } catch (deactivationErr) {
    console.error('Error deactivating old plans:', deactivationErr);
  }

  if (isFree) {
    await Payment.create(paymentFields).catch(err => console.error('Error saving payment record:', err.message));
  } else if (user.email) {
    sendEmail({
      email: user.email,
      subject: `Payment Receipt — ${plan.name}`,
      html: emailWrapper('Payment Successful', `
        <p>Hi ${user.name || 'there'},</p>
        <p>Your payment for <strong>${plan.name}</strong> was successful.</p>
        <p>Amount Paid: <strong>Rs ${paidAmount.toLocaleString('en-IN')}</strong></p>
        <p>Valid Until: <strong>${plan.duration === 'Lifetime' ? 'Lifetime' : expiryDate.toLocaleDateString('en-IN')}</strong></p>
        <p>Payment ID: ${paymentId || '—'}</p>
      `)
    }).catch(() => {});
  }

  notifyAdminsOfPurchase({
    io,
    message: `${user.name || 'A user'} purchased the ${plan.name} plan.`,
    metadata: { userId: user._id, planId: plan._id }
  });

  return { duplicate: false, expiryDate };
};

// First charge of a recurring College/Company subscription.
// Resolves to { duplicate } when already recorded, else { record, nextRenewalDate }.
const fulfillRecurringPayment = async ({ user, plan, couponCode = '', subscriptionId, paymentId, signature = '', io }) => {
  const nextRenewalDate = computeNextRenewalDate(plan.duration);

  const coupon = await findCoupon(couponCode);
  let baseAmount = plan.price;
  if (coupon) baseAmount = baseAmount - (baseAmount * coupon.percentage) / 100;
  const gstPercentage = await fetchGstPercentage();
  const gstAmount = Math.round(baseAmount * gstPercentage) / 100;

  const result = await claimPayment({
    user: user._id,
    plan: plan._id,
    amount: baseAmount + gstAmount,
    baseAmount,
    gstPercentage,
    gstAmount,
    quantity: 1,
    currency: plan.currency || 'INR',
    razorpay_order_id: subscriptionId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    status: 'completed',
    paymentMethod: 'Razorpay',
    couponApplied: coupon?._id || null
  });
  if (result.duplicate) return { duplicate: true, payment: result.duplicate, nextRenewalDate: user.subscriptionExpiry };
  const claim = result.payment;
  await countCouponUse(coupon);

  let record = null;
  try {
    user.subscription = plan._id;
    user.subscriptionDetails = plan.toObject();
    user.subscriptionExpiry = nextRenewalDate;
    user.autoRenew = true;
    await user.save();

    await reconcileTeamSeats(user, plan).catch(err => console.error('Seat Reconciliation Error:', err.message));

    if (plan.role === 'college') {
      const college = await College.findOne({ tpoUser: user._id })
        || (user.collegeProfile?.college && await College.findById(user.collegeProfile.college));

      if (college) {
        college.subscriptionTier = COLLEGE_TIER_MAP[plan.name] || college.subscriptionTier;
        college.subscription = plan._id;
        const studentLimitFeature = plan.features?.find(f => f.name === 'Student Capacity');
        if (studentLimitFeature) {
          college.studentLimit = studentLimitFeature.value > 0 ? studentLimitFeature.value : STUDENT_LIMIT_UNLIMITED;
        }
        college.razorpaySubscriptionId = subscriptionId;
        college.nextRenewalDate = nextRenewalDate;
        college.subscriptionExpiry = nextRenewalDate;
        college.autoRenewEnabled = true;
        college.renewalFailureCount = 0;

        // Automated MoU Generation is a Pro/Elite perk per the Campus plan matrix — checked
        // against the plan's own feature flag rather than a hardcoded tier list.
        const hasAutoMoU = plan.features?.find(f => f.name === 'Automated MoU Generation')?.isActive;
        if (hasAutoMoU) {
          try {
            const pdfBuffer = await generateMouPdf(college, plan);
            college.mouDocument = saveBufferToUploads(pdfBuffer, `mou-${college.code || 'campus'}`);
            college.mouSignedAt = new Date();
          } catch (mouErr) {
            console.error('MoU auto-generation failed:', mouErr.message);
          }
        }

        await college.save();
        record = college;
      }
    } else if (plan.role === 'company') {
      const company = user.company && await Company.findById(user.company);
      if (company) {
        company.subscription = plan._id;
        company.subscriptionExpiry = nextRenewalDate;
        company.nextRenewalDate = nextRenewalDate;
        company.razorpaySubscriptionId = subscriptionId;
        company.autoRenewEnabled = true;
        company.renewalFailureCount = 0;
        await company.save();
        record = company;
      }
    }
  } catch (applyErr) {
    await releaseClaim(claim, 'Subscription purchase');
    throw applyErr;
  }

  notifyAdminsOfPurchase({
    io,
    message: `${record?.name || user.name || 'An organization'} activated the ${plan.name} subscription.`,
    metadata: { planId: plan._id, subscriberId: record?._id || user._id }
  });

  return { duplicate: false, record, nextRenewalDate };
};

// Pay-per-feature purchase. Resolves to { duplicate } when already recorded, else { purchasedFeature }.
const fulfillPayPerPayment = async ({ user, feature, quantity = 1, paidAmount, orderId, paymentId, signature = '' }) => {
  const baseAmount = getPricingOption(feature, quantity);
  const gstPercentage = await fetchGstPercentage();
  const gstAmount = Math.round(baseAmount * gstPercentage) / 100;

  const result = await claimPayment({
    user: user._id,
    payPerFeature: feature._id,
    paymentType: 'pay-per-feature',
    amount: paidAmount,
    baseAmount,
    gstPercentage,
    gstAmount,
    quantity,
    currency: 'INR',
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    status: 'completed',
    paymentMethod: 'Razorpay'
  });
  if (result.duplicate) return { duplicate: true, payment: result.duplicate };
  const claim = result.payment;

  // Calculate expiry (extended by quantity)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (feature.days * quantity));
  const usageLeft = feature.usageCount > 0 ? (feature.usageCount * quantity) : 0;

  try {
    user.purchasedFeatures.push({
      featureId: feature._id,
      featureKey: feature.featureKey,
      isActive: true,
      usageLeft,
      expiresAt,
      purchasedAt: new Date()
    });
    await user.save();
  } catch (grantErr) {
    await releaseClaim(claim, 'Pay-per purchase');
    throw grantErr;
  }

  return { duplicate: false, purchasedFeature: user.purchasedFeatures[user.purchasedFeatures.length - 1] };
};

// The person a College/Company's billing belongs to: the TPO for a college, the account owner for a company.
const findSubscriberUser = (subscriberModel, doc) => {
  if (subscriberModel === 'College') return doc.tpoUser ? User.findById(doc.tpoUser) : null;
  return doc.admin_email ? User.findOne({ email: String(doc.admin_email).toLowerCase() }) : null;
};

// A later charge of an auto-renewing subscription (the first charge is recorded by
// fulfillRecurringPayment). Writes it to the payer's payment history like any other payment.
// Resolves to false if that Razorpay payment was already recorded.
const recordRenewalPayment = async ({ subscriberModel, doc, plan, paymentEntity, subscriptionId }) => {
  const user = await findSubscriberUser(subscriberModel, doc);
  if (!user) {
    console.error(`[Renewal] No user found to attribute payment ${paymentEntity.id} for ${subscriberModel} ${doc.name}`);
    return false;
  }

  // Razorpay charges the GST-inclusive total, so split it back into base + GST.
  const amount = paymentEntity.amount / 100;
  const gstPercentage = await fetchGstPercentage();
  const baseAmount = Math.round((amount / (1 + gstPercentage / 100)) * 100) / 100;

  const result = await claimPayment({
    user: user._id,
    plan: doc.subscription,
    amount,
    baseAmount,
    gstPercentage,
    gstAmount: Math.round((amount - baseAmount) * 100) / 100,
    quantity: 1,
    currency: paymentEntity.currency || 'INR',
    razorpay_order_id: subscriptionId,
    razorpay_payment_id: paymentEntity.id,
    razorpay_signature: '',
    status: 'completed',
    paymentMethod: 'Razorpay',
    isRenewal: true
  });
  if (result.duplicate) return false;

  // The previous cycle's payment for this plan is no longer the live one.
  await Payment.updateMany(
    { user: user._id, status: 'completed', paymentType: { $ne: 'pay-per-feature' }, _id: { $ne: result.payment._id } },
    { $set: { status: 'superseded' } }
  ).catch(err => console.error('Error deactivating previous cycle payment:', err.message));
  return true;
};

module.exports = {
  canPurchasePlan,
  fulfillPlanPayment,
  fulfillRecurringPayment,
  fulfillPayPerPayment,
  recordRenewalPayment
};
