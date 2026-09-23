const crypto = require('crypto');
const getRazorpay = require('../config/razorpay');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Role = require('../models/Role');
const PayPerFeature = require('../models/PayPerFeature');
const College = require('../models/College');
const Company = require('../models/Company');
const RenewalLog = require('../models/RenewalLog');
const { sendWhatsAppMessage, triggerN8nWebhook } = require('../utils/notifications');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const Coupon = require('../models/Coupon');
const { reconcileTeamSeats } = require('../utils/teamMembership');
const { fetchGstPercentage, getPricingOption, computeNextRenewalDate } = require('../utils/pricing');
const { canPurchasePlan, fulfillPlanPayment, fulfillRecurringPayment, fulfillPayPerPayment, recordRenewalPayment } = require('../utils/paymentFulfillment');
const { notifyUser, notifyRoles } = require('../utils/inAppNotifications');
const { isValidSignature, isDuplicateKeyError, findPaymentByRazorpayId, checkoutNotes, findCoupon, countCouponUse } = require('../utils/paymentGuards');

const RECURRING_ROLES = ['college', 'company'];
const paymentHistoryLink = role => role === 'college'
  ? '/college/payment-history'
  : ['company', 'recruiter', 'org_employee'].includes(role)
    ? '/company/payment-history'
    : '/candidate/payment-history';
const MAX_RENEWAL_FAILURES = 3;

// Prices a purchase exactly as the checkout does: plan/quantity price, optional coupon, then GST.
const computeCharge = async (plan, quantity, couponCode) => {
  let baseAmount = getPricingOption(plan, quantity);
  let discountPercentage = 0;
  let couponApplied = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && (coupon.totalUses === 0 || coupon.currentUses < coupon.totalUses)) {
      discountPercentage = coupon.percentage;
      couponApplied = coupon._id;
      baseAmount = baseAmount - (baseAmount * discountPercentage) / 100;
    }
  }
  const gstPercentage = await fetchGstPercentage();
  const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount;
  return {
    baseAmount,
    gstPercentage,
    gstAmount,
    totalAmount,
    amountInPaise: Math.round(totalAmount * 100),
    discountPercentage,
    couponApplied
  };
};

// A verify request whose Razorpay payment was already turned into a Payment row: answer as a
// success without granting anything a second time (double-click, retry after a timeout, replay).
const replyAlreadyProcessed = (res, payment, userId, extra = {}) => {
  if (String(payment.user) !== String(userId)) {
    return res.status(409).json({ msg: 'This payment has already been used.' });
  }
  return res.json({ success: true, alreadyProcessed: true, msg: 'This payment was already processed', ...extra });
};

// @desc    Create a Razorpay order
// @route   POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ msg: 'planId is required' });
    }

    const plan = await Subscription.findById(planId);

    if (!plan) {
      return res.status(404).json({ msg: 'Subscription plan not found' });
    }

    // Razorpay doesn't allow 0 amount orders
    if (plan.price === 0) {
      return res.status(400).json({ msg: 'Free plans do not require a Razorpay order' });
    }

    // Block before money changes hands — a delegated team member paying for an org-tier plan
    // here would still get rejected at verifyPayment, but only after being charged with no refund.
    if (plan.role === 'company' && req.user.role === 'org_employee') {
      return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
    }
    if (plan.role === 'company') {
      const requestingUser = await User.findById(req.user.id).select('isTeamManaged');
      if (requestingUser?.isTeamManaged) {
        return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
      }
    }

    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);
    const { couponCode } = req.body;
    const baseAmountPerUnit = plan.price || plan.cost || 0;
    const { baseAmount, gstPercentage, gstAmount, totalAmount, amountInPaise, discountPercentage, couponApplied } =
      await computeCharge(plan, quantity, couponCode);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      // Razorpay keeps these with the order, so verifyPayment can trust which plan, user, quantity
      // and coupon were paid for instead of taking them from the client again.
      notes: checkoutNotes({
        userId: req.user.id,
        planId: plan._id,
        quantity,
        couponCode: couponApplied ? couponCode.toUpperCase() : ''
      })
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan._id,
      quantity,
      baseAmountPerUnit,
      baseAmount,
      gstPercentage,
      gstAmount,
      totalAmount,
      discountPercentage,
      couponApplied
    });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, autoRenew } = req.body;
    if (!planId) return res.status(400).json({ msg: 'planId is required' });

    const plan = await Subscription.findById(planId);
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }

    // Whether a plan is free is decided by the plan itself, never by the request. A price of 0 on a
    // custom-priced plan is only a placeholder, so those can't be self-activated.
    if (plan.price === 0 && plan.isCustomPrice) {
      return res.status(400).json({ msg: 'This plan is priced on request. Please contact us to activate it.' });
    }
    const isFree = plan.price === 0;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!canPurchasePlan(user, plan, req.user.role)) {
      return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
    }

    let quantity = 1;
    let paidAmount = 0;
    let couponCode = '';

    if (!isFree) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ msg: 'Missing payment verification fields' });
      }
      if (!isValidSignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature)) {
        return res.status(400).json({ msg: 'Invalid payment signature' });
      }

      // Replayed verify (double-click, retry) or already granted by the webhook: skip the Razorpay lookup.
      const existing = await findPaymentByRazorpayId(razorpay_payment_id);
      if (existing) {
        return replyAlreadyProcessed(res, existing, req.user.id, {
          user: { subscription: plan, subscriptionExpiry: user.subscriptionExpiry }
        });
      }

      // The signature only proves that this order was paid. Check the order really is for this
      // user and this plan, so a cheap order cannot be used to claim an expensive plan.
      const order = await getRazorpay().orders.fetch(razorpay_order_id);
      const notes = order.notes || {};
      if (notes.userId) {
        if (notes.userId !== String(req.user.id) || notes.planId !== String(plan._id)) {
          return res.status(400).json({ msg: 'This payment was made for a different plan or account.' });
        }
        quantity = Math.max(1, parseInt(notes.quantity) || 1);
        couponCode = notes.couponCode || '';
      } else {
        // Order created before checkout notes existed: use the request, but only if what was
        // charged matches what this plan costs.
        quantity = Math.max(1, parseInt(req.body.quantity) || 1);
        couponCode = req.body.couponCode || '';
        const expected = await computeCharge(plan, quantity, couponCode);
        if (expected.amountInPaise !== order.amount) {
          return res.status(400).json({ msg: 'The amount paid does not match the selected plan.' });
        }
      }
      paidAmount = order.amount / 100;
    }

    const result = await fulfillPlanPayment({
      user,
      plan,
      quantity,
      couponCode,
      paidAmount,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      autoRenew,
      io: req.io
    });

    if (result.duplicate) {
      if (result.payment) return replyAlreadyProcessed(res, result.payment, req.user.id, { user: { subscription: plan, subscriptionExpiry: result.expiryDate } });
      return res.json({
        success: true,
        alreadyProcessed: true,
        msg: 'You are already on this plan',
        user: { subscription: plan, subscriptionExpiry: result.expiryDate }
      });
    }

    res.json({
      success: true,
      msg: 'Payment verified and subscription updated',
      user: {
        subscription: plan,
        subscriptionExpiry: result.expiryDate
      }
    });
  } catch (err) {
    console.error('Verify Payment Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Create a recurring Razorpay subscription (mandate) for College/Company plans (spec 9.2)
// @route   POST /api/payments/create-subscription
const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId, couponCode } = req.body;
    if (!planId) return res.status(400).json({ msg: 'planId is required' });

    const plan = await Subscription.findById(planId);
    if (!plan) return res.status(404).json({ msg: 'Subscription plan not found' });
    if (plan.price === 0) return res.status(400).json({ msg: 'Free plans do not require billing' });
    if (!RECURRING_ROLES.includes(plan.role)) {
      return res.status(400).json({ msg: 'Recurring subscriptions are only available for college and company plans' });
    }

    // Only the actual org owner may purchase a company-tier plan — same rule as the one-time
    // purchase path in verifyPayment.
    if (plan.role === 'company') {
      const requestingUser = await User.findById(req.user.id).select('isTeamManaged');
      if (requestingUser?.isTeamManaged || req.user.role === 'org_employee') {
        return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
      }
    }

    let baseAmount = plan.price;
    let discountPercentage = 0;
    let couponApplied = null;
    
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (coupon.totalUses === 0 || coupon.currentUses < coupon.totalUses)) {
        discountPercentage = coupon.percentage;
        couponApplied = coupon._id;
        const discountVal = (baseAmount * discountPercentage) / 100;
        baseAmount = baseAmount - discountVal;
      }
    }

    const gstPercentage = await fetchGstPercentage();
    const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;
    const amountInPaise = Math.round(totalAmount * 100);

    // Lazily create (and cache) the Razorpay recurring Plan backing this Subscription doc
    let razorpayPlanId = plan.razorpayPlanId;
    
    // If a coupon is applied, we must create a custom plan for this specific discounted price
    if (couponApplied || !razorpayPlanId) {
      const periodMap = {
        Monthly: { period: 'monthly', interval: 1 },
        Quarterly: { period: 'monthly', interval: 3 },
        Yearly: { period: 'yearly', interval: 1 }
      };
      const { period, interval } = periodMap[plan.duration] || { period: 'yearly', interval: 1 };

      const razorpayPlan = await getRazorpay().plans.create({
        period,
        interval,
        item: {
          name: `${plan.name} (${plan.role})`,
          amount: amountInPaise,
          currency: 'INR'
        }
      });
      razorpayPlanId = razorpayPlan.id;
      
      // Only cache the planId on the model if no coupon was applied
      if (!couponApplied) {
        plan.razorpayPlanId = razorpayPlanId;
        await plan.save();
      }
    }

    const totalCountMap = { Monthly: 240, Quarterly: 80, Yearly: 20 };
    const totalCount = totalCountMap[plan.duration] || 20;

    const subscription = await getRazorpay().subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: totalCount,
      notes: { 
        planId: String(plan._id), 
        userId: String(req.user.id),
        couponCode: couponCode || ''
      }
    });

    res.json({
      subscriptionId: subscription.id,
      planId: plan._id,
      amount: amountInPaise,
      totalAmount,
      gstPercentage,
      gstAmount,
      discountPercentage,
      couponApplied,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create Subscription Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Verify first charge of a recurring Razorpay subscription and complete registration (spec 8.7 / 9.2)
// @route   POST /api/payments/verify-subscription
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planId } = req.body;
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !planId) {
      return res.status(400).json({ msg: 'Missing payment verification fields' });
    }

    if (!isValidSignature(`${razorpay_payment_id}|${razorpay_subscription_id}`, razorpay_signature)) {
      return res.status(400).json({ msg: 'Invalid payment signature' });
    }

    const plan = await Subscription.findById(planId);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const alreadyProcessed = payment => replyAlreadyProcessed(res, payment, req.user.id, {
      nextRenewalDate: user.subscriptionExpiry
    });
    const existing = await findPaymentByRazorpayId(razorpay_payment_id);
    if (existing) return alreadyProcessed(existing);

    // The signature only proves this subscription was paid. createSubscriptionOrder stored the user
    // and plan on the Razorpay subscription, so check them instead of trusting the request body.
    const razorpaySubscription = await getRazorpay().subscriptions.fetch(razorpay_subscription_id);
    const notes = razorpaySubscription.notes || {};
    if (notes.userId !== String(req.user.id) || notes.planId !== String(plan._id)) {
      return res.status(400).json({ msg: 'This payment was made for a different plan or account.' });
    }

    const result = await fulfillRecurringPayment({
      user,
      plan,
      couponCode: notes.couponCode,
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      io: req.io
    });
    if (result.duplicate) return alreadyProcessed(result.payment);

    res.json({ success: true, msg: 'Subscription active and registration completed', nextRenewalDate: result.nextRenewalDate, record: result.record });
  } catch (err) {
    console.error('Verify Subscription Payment Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Get payment history for the logged-in user
// @route   GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('plan', 'name price duration')
      .populate('payPerFeature', 'name cost days usageCount')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get Payment History Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Get all payment history (Admin only)
// @route   GET /api/payments/admin/all
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email role')
      .populate('plan', 'name price duration')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get All Payments Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Cancel current subscription and revert to free plan
// @route   POST /api/payments/cancel-plan
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    const userRole = user?.role?.name || 'jobseeker';

    const freePlan = await Subscription.findOne({ price: 0, isActive: true, role: userRole });
    if (!freePlan) {
      return res.status(404).json({ msg: 'Free plan not found for this role' });
    }

    // Mark existing completed/active payments as cancelled
    await Payment.updateMany(
      { user: req.user.id, status: 'completed' },
      { $set: { status: 'cancelled' } }
    );

    // Downgrade to free plan
    user.subscription = freePlan._id;
    user.subscriptionDetails = freePlan.toObject();
    user.subscriptionExpiry = null;
    user.autoRenew = false;
    user.downloadsUsed = 0;
    user.searchUsed = 0;
    user.jobsUsed = 0;
    user.messagesUsed = 0;
    user.counsellingSessionsUsed = 0;
    await user.save();

    await reconcileTeamSeats(user, freePlan).catch(err => console.error('Seat Reconciliation Error:', err.message));

    res.json({ success: true, msg: 'Subscription cancelled. You are now on the Free plan.' });
  } catch (err) {
    console.error('Cancel Subscription Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getRenewals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const paidPlanIds = await Subscription.find({ price: { $gt: 0 } }).distinct('_id');
    const baseFilter = { subscription: { $in: paidPlanIds } };
    const filter = { ...baseFilter };

    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 86400000);
    if (status === 'expired') filter.subscriptionExpiry = { $lt: now };
    else if (status === 'expiring_soon') filter.subscriptionExpiry = { $gte: now, $lte: sevenDaysOut };
    else if (status === 'active') filter.subscriptionExpiry = { $gt: sevenDaysOut };

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingPlanIds = await Subscription.find({ name: regex }).distinct('_id');
      filter.$or = [{ name: regex }, { email: regex }, { subscription: { $in: matchingPlanIds } }];
    }

    const [renewals, total, activeCount, expiringCount, expiredCount, autoRenewCount] = await Promise.all([
      User.find(filter)
        .populate('subscription')
        .select('name email role subscription subscriptionExpiry autoRenew display_id')
        .sort({ subscriptionExpiry: 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(filter),
      User.countDocuments({ ...baseFilter, subscriptionExpiry: { $gt: sevenDaysOut } }),
      User.countDocuments({ ...baseFilter, subscriptionExpiry: { $gte: now, $lte: sevenDaysOut } }),
      User.countDocuments({ ...baseFilter, subscriptionExpiry: { $lt: now } }),
      User.countDocuments({ ...baseFilter, autoRenew: true })
    ]);

    res.json({
      renewals, total, page: parseInt(page), pages: Math.max(Math.ceil(total / parseInt(limit)), 1),
      stats: { active: activeCount, expiringSoon: expiringCount, expired: expiredCount, autoRenew: autoRenewCount }
    });
  } catch (err) {
    console.error('Get Renewals Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ _id: paymentId, user: req.user.id });
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'completed') {
      return res.status(400).json({ msg: 'Only completed payments can be refunded' });
    }
    payment.status = 'refund_pending';
    await payment.save();
    notifyRoles({
      io: req.io,
      roles: ['admin', 'subadmin'],
      title: 'New refund request',
      message: `A refund was requested for payment ${payment._id}.`,
      type: 'refund_requested',
      link: '/admin/subscriptions/refunds',
      metadata: { paymentId: payment._id, userId: req.user.id }
    }).catch(err => console.error('Refund request notification failed:', err.message));
    res.json({ success: true, msg: 'Refund request submitted successfully' });
  } catch (err) {
    console.error('Request Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getRefunds = async (req, res) => {
  try {
    const payments = await Payment.find({ status: { $in: ['refund_pending', 'refunded'] } })
      .populate('user', 'name email role')
      .populate('plan', 'name price duration')
      .sort({ updatedAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('Get Refunds Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const approveRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'refund_pending') {
      return res.status(400).json({ msg: 'Refund is not pending' });
    }

    payment.status = 'refunded';
    await payment.save();

    // Revoke the user's subscription
    const user = await User.findById(payment.user._id).populate('role');
    if (user) {
      const userRoleName = user.role?.name || 'jobseeker';
      const freePlan = await Subscription.findOne({ price: 0, isActive: true, role: userRoleName });
      if (freePlan) {
        user.subscription = freePlan._id;
        user.subscriptionDetails = freePlan.toObject();
      } else {
        user.subscription = null;
        user.subscriptionDetails = null;
      }
      user.subscriptionExpiry = null;
      user.autoRenew = false;
      await user.save();

      if (freePlan) {
        await reconcileTeamSeats(user, freePlan).catch(err => console.error('Seat Reconciliation Error:', err.message));
      }
    }

    notifyUser({
      io: req.io,
      recipientId: payment.user._id,
      title: 'Refund approved',
      message: 'Your refund request was approved and your subscription was updated.',
      type: 'refund_status',
      link: paymentHistoryLink(user?.role?.name),
      metadata: { paymentId: payment._id, status: 'refunded' }
    }).catch(err => console.error('Refund approval notification failed:', err.message));

    res.json({ success: true, msg: 'Refund approved. Subscription revoked.' });
  } catch (err) {
    console.error('Approve Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const rejectRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate({ path: 'user', populate: { path: 'role', select: 'name' } });
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'refund_pending') {
      return res.status(400).json({ msg: 'Refund is not pending' });
    }

    payment.status = 'completed';
    await payment.save();

    notifyUser({
      io: req.io,
      recipientId: payment.user,
      title: 'Refund request rejected',
      message: 'Your refund request was reviewed and rejected. The payment remains active.',
      type: 'refund_status',
      link: paymentHistoryLink(payment.user?.role?.name),
      metadata: { paymentId: payment._id, status: 'rejected' }
    }).catch(err => console.error('Refund rejection notification failed:', err.message));

    res.json({ success: true, msg: 'Refund request rejected' });
  } catch (err) {
    console.error('Reject Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const pipeline = [
      { $match: { status: { $in: ['completed', 'superseded', 'refunded'] } } },
      // Sorted before $group so $first below reliably picks each buyer's most recent payment
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$user',
          totalSpent: { $sum: { $cond: [{ $in: ['$status', ['completed', 'superseded']] }, '$amount', 0] } },
          transactionsCount: { $sum: 1 },
          lastPurchase: { $first: '$$ROOT' }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'roles', localField: 'user.role', foreignField: '_id', as: 'user.roleDoc' } },
      { $unwind: { path: '$user.roleDoc', preserveNullAndEmptyArrays: true } },
      { $addFields: { 'user.role': '$user.roleDoc.name' } },
      { $lookup: { from: 'subscriptions', localField: 'lastPurchase.plan', foreignField: '_id', as: 'lastPurchase.plan' } },
      { $unwind: { path: '$lastPurchase.plan', preserveNullAndEmptyArrays: true } }
    ];

    if (role && role !== 'all') {
      pipeline.push({ $match: { 'user.role': role === 'employer' ? { $in: ['recruiter', 'company'] } : role } });
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      pipeline.push({ $match: { $or: [{ 'user.name': regex }, { 'user.email': regex }, { 'user.display_id': regex }] } });
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: { 'lastPurchase.createdAt': -1 } },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          { $project: {
              _id: 0,
              user: { _id: 1, name: 1, email: 1, role: 1, avatar: 1, display_id: 1 },
              totalSpent: 1, transactionsCount: 1,
              lastPurchase: { _id: 1, createdAt: 1, paymentMethod: 1, razorpay_payment_id: 1, plan: { name: 1 } }
            }
          }
        ],
        summary: [{ $group: { _id: null, count: { $sum: 1 }, totalSpentAll: { $sum: '$totalSpent' } } }]
      }
    });

    const [result] = await Payment.aggregate(pipeline);
    const buyers = result.data;
    const total = result.summary[0]?.count || 0;
    const totalSpentAll = result.summary[0]?.totalSpentAll || 0;

    res.json({
      buyers, total, page: parseInt(page), pages: Math.max(Math.ceil(total / parseInt(limit)), 1),
      stats: { totalUniquePayers: total, totalSpentAll, avgOrderVal: total > 0 ? totalSpentAll / total : 0 }
    });
  } catch (err) {
    console.error('Get Buyers Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getBuyerDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('subscription')
      .select('name email role avatar display_id subscriptionExpiry autoRenew');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const payments = await Payment.find({ user: userId })
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json({
      user,
      payments
    });
  } catch (err) {
    console.error('Get Buyer Details Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const sendRenewalReminder = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ msg: 'No users selected' });
    }

    const users = await User.find({ _id: { $in: userIds } }).populate('subscription');

    if (users.length === 0) {
      return res.status(404).json({ msg: 'Selected users not found' });
    }

    const emailPromises = users.map(async (user) => {
      const planName = user.subscription?.name || 'Premium';
      const expiryDate = user.subscriptionExpiry
        ? new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'soon';

      if (user.email) {
        const htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #334155; line-height: 1.6;">
            <h2 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Subscription Renewal Reminder</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>This is a friendly reminder that your active subscription plan <strong>${planName}</strong> is expiring on <strong>${expiryDate}</strong>.</p>
            <p>To continue enjoying uninterrupted access to premium resume templates, job search tools, bulk recruiter messaging, and other premium features, please renew your subscription package at your earliest convenience.</p>
            <p>If you have any questions or require support, please reply directly to this email.</p>
            <br/>
            <p>Warm regards,<br/><strong>Velaivaaipu Support Team</strong></p>
          </div>
        `;

        await sendEmail({
          email: user.email,
          subject: `[Velaivaaipu] Renew Your ${planName} Subscription`,
          html: htmlContent
        });
      }

      const userPhone = getUserPhone(user);
      if (userPhone) {
        sendWhatsAppTemplate({
          to: userPhone,
          template: 'auto_renewal_billing_reminder',
          params: [user.name || 'there', planName, expiryDate, planName, `${process.env.FRONTEND_URL}/jobseeker/settings`]
        }).catch(() => {});
      }
    });

    await Promise.all(emailPromises);

    res.json({ success: true, msg: `Sent reminders to ${users.length} users successfully.` });
  } catch (err) {
    console.error('Send Renewal Reminder Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Locates the College or Company doc holding this Razorpay subscription mandate
const findSubscriberBySubscriptionId = async (subscriptionId) => {
  const college = await College.findOne({ razorpaySubscriptionId: subscriptionId });
  if (college) return { subscriberModel: 'College', doc: college };
  const company = await Company.findOne({ razorpaySubscriptionId: subscriptionId });
  if (company) return { subscriberModel: 'Company', doc: company };
  return null;
};

const downgradeToFreePlan = async (subscriberModel, doc) => {
  const freePlan = await Subscription.findOne({ price: 0, isActive: true, role: subscriberModel === 'College' ? 'college' : 'company' });
  if (subscriberModel === 'College') {
    doc.subscriptionTier = 'campus_free';
    doc.studentLimit = 100; // matches the Campus Free plan's Student Capacity
  }
  if (freePlan) doc.subscription = freePlan._id;
  doc.autoRenewEnabled = false;
  doc.razorpaySubscriptionId = '';
  doc.nextRenewalDate = null;
};

// Writes the RenewalLog row for a webhook event. Returns 'duplicate' when this event id was already
// logged, i.e. Razorpay is redelivering an event that has already been applied.
const logRenewalEvent = async entry => {
  try {
    await RenewalLog.create(entry);
    return 'logged';
  } catch (err) {
    if (isDuplicateKeyError(err)) return 'duplicate';
    throw err;
  }
};

// order.paid: a one-time plan or pay-per-feature order was paid. The customer's browser normally
// reports this itself through verify-payment; this grants it when the browser never got there
// (tab closed, connection lost after paying). Whichever arrives second sees the recorded Payment
// row and does nothing, so the purchase is granted once.
const fulfillPaidOrder = async (payload, io) => {
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;
  if (!paymentEntity?.id || !orderEntity?.id) return;

  // createOrder / purchaseCreateOrder always attach these notes (with a quantity). Orders without
  // them — from before the notes existed, or subscription invoices — are left to the verify request.
  const notes = orderEntity.notes || {};
  if (!notes.userId || !notes.quantity) {
    console.log(`[Webhook] order.paid for ${orderEntity.id} has no checkout notes, skipping`);
    return;
  }

  const user = await User.findById(notes.userId);
  if (!user) {
    console.error(`[Webhook] order.paid ${orderEntity.id}: user ${notes.userId} not found — payment ${paymentEntity.id} needs manual reconciliation`);
    return;
  }
  const quantity = Math.max(1, parseInt(notes.quantity) || 1);
  const paidAmount = (orderEntity.amount_paid || orderEntity.amount || paymentEntity.amount) / 100;

  if (notes.planId) {
    const plan = await Subscription.findById(notes.planId);
    const roleDoc = await Role.findById(user.role).select('name');
    if (!plan || plan.price === 0 || !canPurchasePlan(user, plan, roleDoc?.name)) {
      console.error(`[Webhook] order.paid ${orderEntity.id}: plan ${notes.planId} cannot be granted to user ${user._id} — payment ${paymentEntity.id} needs manual reconciliation`);
      return;
    }
    await fulfillPlanPayment({
      user, plan, quantity, couponCode: notes.couponCode, paidAmount,
      orderId: orderEntity.id, paymentId: paymentEntity.id, io
    });
  } else if (notes.featureId) {
    const feature = await PayPerFeature.findById(notes.featureId);
    if (!feature) {
      console.error(`[Webhook] order.paid ${orderEntity.id}: feature ${notes.featureId} not found — payment ${paymentEntity.id} needs manual reconciliation`);
      return;
    }
    await fulfillPayPerPayment({
      user, feature, quantity, paidAmount,
      orderId: orderEntity.id, paymentId: paymentEntity.id
    });
  }
};

// First charge of a recurring subscription whose College/Company doesn't hold the mandate yet —
// i.e. the customer paid but their browser never called verify-subscription. Grants it from here.
const fulfillFirstSubscriptionCharge = async (payload, io) => {
  const subscriptionEntity = payload.payload?.subscription?.entity;
  const paymentEntity = payload.payload?.payment?.entity;
  const notes = subscriptionEntity?.notes || {};
  // paid_count is 1 only for the first charge; later charges are renewals of an already-set-up subscription.
  if (Number(subscriptionEntity?.paid_count) !== 1 || !paymentEntity?.id || !notes.userId || !notes.planId) return;

  const [user, plan] = await Promise.all([User.findById(notes.userId), Subscription.findById(notes.planId)]);
  if (!user || !plan || !RECURRING_ROLES.includes(plan.role)) {
    console.error(`[Webhook] subscription ${subscriptionEntity.id}: cannot grant plan ${notes.planId} to user ${notes.userId} — payment ${paymentEntity.id} needs manual reconciliation`);
    return;
  }
  await fulfillRecurringPayment({
    user, plan, couponCode: notes.couponCode,
    subscriptionId: subscriptionEntity.id, paymentId: paymentEntity.id, io
  });
};

// @desc    Razorpay recurring subscription webhook — success extends the period, repeated failure
//          auto-downgrades to the Free tier per spec 9.2 (graceful, not an abrupt cutoff)
// @route   POST /api/payments/razorpay/renewal-webhook
const handleRenewalWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return res.status(400).send('Missing signature');

    // The exact bytes Razorpay sent (captured in index.js, since express.json() parses the body first).
    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : null);
    if (!rawBody) return res.status(400).send('Missing body');

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(rawBody)
      .digest('hex');

    const received = Buffer.from(String(signature));
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    // Razorpay retries webhooks (and can deliver one twice); this id is the same on every delivery.
    const eventId = req.headers['x-razorpay-event-id'];
    if (event === 'order.paid') {
      await fulfillPaidOrder(payload, req.io);
      return res.json({ status: 'ok' });
    }

    const subscriptionEntity = payload.payload?.subscription?.entity;
    if (!subscriptionEntity) return res.json({ status: 'ignored' });

    const subscriptionId = subscriptionEntity.id;
    const found = await findSubscriberBySubscriptionId(subscriptionId);
    if (!found) {
      if (event === 'subscription.charged') {
        await fulfillFirstSubscriptionCharge(payload, req.io);
      } else {
        console.log(`[Webhook] No College/Company found for subscription ${subscriptionId}`);
      }
      return res.json({ status: 'ok' });
    }

    const { subscriberModel, doc } = found;
    const plan = doc.subscription ? await Subscription.findById(doc.subscription) : null;
    const contactEmail = subscriberModel === 'College' ? doc.principalEmail : doc.admin_email;
    const notifyPhone = subscriberModel === 'College' ? null : null; // WhatsApp contact numbers aren't modeled on Company/College yet

    if (event === 'subscription.charged') {
      const paymentEntity = payload.payload?.payment?.entity;

      // The first charge of a subscription is verified and recorded as a Payment by
      // verifySubscriptionPayment, which already set the period and sent the receipt — it is not a renewal.
      if (paymentEntity?.id && await Payment.exists({ razorpay_payment_id: paymentEntity.id, isRenewal: { $ne: true } })) {
        return res.json({ status: 'ok' });
      }

      // Record the charge in the payer's payment history. Idempotent on the Razorpay payment id, and
      // done before the event is logged so that a redelivery after a failure here still records it.
      if (paymentEntity?.id) {
        await recordRenewalPayment({ subscriberModel, doc, plan, paymentEntity, subscriptionId });
      }

      // Log first: the unique eventId means a redelivered event stops here instead of being applied twice.
      if (await logRenewalEvent({
        subscriberModel,
        subscriber: doc._id,
        subscription: doc.subscription,
        razorpaySubscriptionId: subscriptionId,
        status: 'success',
        amount: paymentEntity ? paymentEntity.amount / 100 : 0,
        eventId
      }) === 'duplicate') return res.json({ status: 'ok' });

      doc.nextRenewalDate = computeNextRenewalDate(plan?.duration || 'Yearly');
      doc.subscriptionExpiry = doc.nextRenewalDate;
      doc.renewalFailureCount = 0;
      await doc.save();

      if (contactEmail) {
        sendEmail({
          email: contactEmail,
          subject: '[Velaivaaipu] Subscription renewed successfully',
          html: emailWrapper('Renewal Successful', `
            <p>Hi ${doc.principalName || doc.name || 'there'},</p>
            <p>Your subscription for <strong>${doc.name}</strong> was renewed successfully.</p>
            ${paymentEntity ? `<p>Amount Charged: <strong>Rs ${(paymentEntity.amount / 100).toLocaleString('en-IN')}</strong></p>` : ''}
            <p>Next Renewal Date: <strong>${doc.nextRenewalDate.toLocaleDateString('en-IN')}</strong></p>
          `)
        }).catch(() => {});
      }
      if (notifyPhone) sendWhatsAppMessage({ to: notifyPhone, template: 'renewal_success', variables: { name: doc.name } }).catch(() => {});
      console.log(`[Webhook] Subscription charged successfully for ${subscriptionId} (${subscriberModel} ${doc.name})`);
    } else if (event === 'subscription.halted' || event === 'subscription.pending') {
      const failureCount = (doc.renewalFailureCount || 0) + 1;

      if (await logRenewalEvent({
        subscriberModel,
        subscriber: doc._id,
        subscription: doc.subscription,
        razorpaySubscriptionId: subscriptionId,
        status: 'failed',
        failureReason: event,
        failureCountAtEvent: failureCount,
        eventId
      }) === 'duplicate') return res.json({ status: 'ok' });

      doc.renewalFailureCount = failureCount;

      if (doc.renewalFailureCount >= MAX_RENEWAL_FAILURES && event === 'subscription.halted') {
        await downgradeToFreePlan(subscriberModel, doc);
        await doc.save();

        console.error(`[Webhook] ${subscriberModel} ${doc.name} downgraded to Free plan after ${MAX_RENEWAL_FAILURES} consecutive renewal failures — admin attention needed.`);
        if (contactEmail) {
          sendEmail({
            email: contactEmail,
            subject: '[Velaivaaipu] Your subscription has been downgraded to the Free plan',
            html: emailWrapper('Downgraded to Free Plan', `<p>We were unable to renew your subscription after ${MAX_RENEWAL_FAILURES} attempts, so your account has been moved to the Free plan. Please renew manually to restore full access.</p>`)
          }).catch(() => {});
        }
        triggerN8nWebhook('admin-subscription-alert', { subscriberModel, subscriberId: doc._id, name: doc.name, reason: 'max_renewal_failures' }).catch(() => {});
      } else {
        await doc.save();
        if (contactEmail) {
          sendEmail({
            email: contactEmail,
            subject: '[Velaivaaipu] Subscription renewal payment failed',
            html: emailWrapper('Renewal Payment Failed', `
              <p>Your latest renewal payment attempt failed (attempt ${doc.renewalFailureCount}/${MAX_RENEWAL_FAILURES}). Please update your payment method to avoid losing access.</p>
              <p><a href="${process.env.FRONTEND_URL}/${subscriberModel === 'College' ? 'college' : 'company'}/subscription" style="color:#059669;">Renew now</a></p>
            `)
          }).catch(() => {});
        }
        if (notifyPhone) sendWhatsAppMessage({ to: notifyPhone, template: 'renewal_failed', variables: { name: doc.name, attempt: doc.renewalFailureCount } }).catch(() => {});
      }

      console.log(`[Webhook] Subscription ${event} for ${subscriptionId} (${subscriberModel} ${doc.name}), failure count ${doc.renewalFailureCount}`);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(500).send('Webhook Error');
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getPaymentHistory,
  getAllPayments,
  cancelSubscription,
  getRenewals,
  requestRefund,
  getRefunds,
  approveRefund,
  rejectRefund,
  getBuyers,
  getBuyerDetails,
  sendRenewalReminder,
  handleRenewalWebhook
};
