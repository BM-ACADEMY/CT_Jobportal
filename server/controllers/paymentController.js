const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');

const fetchGstPercentage = async () => {
  const settings = await Settings.findOne({ key: 'global' });
  return settings?.gstPercentage || 0;
};

const getPricingOption = (plan, quantity) => {
  if (plan.pricingOptions && plan.pricingOptions.length > 0) {
    const opt = plan.pricingOptions.find(o => o.quantity === quantity);
    if (opt) {
      return opt.price;
    }
  }
  
  // Default fallback calculation:
  const basePerUnit = plan.price || plan.cost || 0;
  const baseTotal = basePerUnit * quantity;
  let discountPercentage = 0;
  if (quantity >= 12) discountPercentage = 20;
  else if (quantity >= 6) discountPercentage = 10;
  else if (quantity >= 3) discountPercentage = 5;
  const discountAmount = Math.round(baseTotal * discountPercentage) / 100;
  return baseTotal - discountAmount;
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

    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);
    const gstPercentage = await fetchGstPercentage();
    
    // Look up pricing option configured by admin, with default fallback
    const baseAmount = getPricingOption(plan, quantity);
    const baseAmountPerUnit = plan.price || plan.cost || 0;

    const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(totalAmount * 100);
    const currency = 'INR';

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      isFree
    } = req.body;
    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);

    if (!isFree) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        return res.status(400).json({ msg: 'Invalid payment signature' });
      }
    }

    // Signature is valid, update user subscription
    const plan = await Subscription.findById(planId);
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }

    // Calculate expiry date (multiplied by quantity)
    let expiryDate = new Date();
    if (plan.duration === 'Monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + quantity);
    } else if (plan.duration === 'Quarterly') {
      expiryDate.setMonth(expiryDate.getMonth() + (3 * quantity));
    } else if (plan.duration === 'Yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + quantity);
    } else if (plan.duration === 'Lifetime') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
    }

    const { autoRenew } = req.body;

    const user = await User.findById(req.user.id);
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

    // Deactivate existing completed plans (supersede them)
    try {
      await Payment.updateMany(
        { user: req.user.id, status: 'completed' },
        { $set: { status: 'superseded' } }
      );
    } catch (deactivationErr) {
      console.error('Error deactivating old plans:', deactivationErr);
    }

    // Create payment record
    try {
      const gstPct = isFree ? 0 : await fetchGstPercentage();
      
      let baseAmt = 0;
      if (!isFree) {
        baseAmt = getPricingOption(plan, quantity);
      }

      const gstAmt = isFree ? 0 : Math.round(baseAmt * gstPct) / 100;
      const totalAmt = baseAmt + gstAmt;

      const paymentRecord = new Payment({
        user: req.user.id,
        plan: plan._id,
        amount: totalAmt,
        baseAmount: baseAmt,
        gstPercentage: gstPct,
        gstAmount: gstAmt,
        quantity: isFree ? 1 : quantity,
        currency: plan.currency || 'INR',
        razorpay_order_id: razorpay_order_id || 'FREE_ORDER',
        razorpay_payment_id: razorpay_payment_id || 'FREE_PAYMENT',
        razorpay_signature: razorpay_signature || '',
        status: 'completed',
        paymentMethod: isFree ? 'None' : 'Razorpay'
      });
      await paymentRecord.save();
    } catch (paymentErr) {
      console.error('Error saving payment record:', paymentErr);
      // We don't return error here because the subscription was already updated
    }

    res.json({ 
      success: true, 
      msg: 'Payment verified and subscription updated',
      user: {
        subscription: plan,
        subscriptionExpiry: expiryDate
      }
    });
  } catch (err) {
    console.error('Verify Payment Error:', err.message);
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
    user.subscriptionExpiry = null;
    user.autoRenew = false;
    user.downloadsUsed = 0;
    user.searchUsed = 0;
    user.jobsUsed = 0;
    user.messagesUsed = 0;
    user.counsellingSessionsUsed = 0;
    await user.save();

    res.json({ success: true, msg: 'Subscription cancelled. You are now on the Free plan.' });
  } catch (err) {
    console.error('Cancel Subscription Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getRenewals = async (req, res) => {
  try {
    const users = await User.find({ subscription: { $ne: null } })
      .populate('subscription')
      .select('name email role subscription subscriptionExpiry autoRenew display_id')
      .sort({ subscriptionExpiry: 1 });
    const renewals = users.filter(u => u.subscription && u.subscription.price > 0);
    res.json(renewals);
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
      } else {
        user.subscription = null;
      }
      user.subscriptionExpiry = null;
      user.autoRenew = false;
      await user.save();
    }

    res.json({ success: true, msg: 'Refund approved. Subscription revoked.' });
  } catch (err) {
    console.error('Approve Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const rejectRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'refund_pending') {
      return res.status(400).json({ msg: 'Refund is not pending' });
    }

    payment.status = 'completed';
    await payment.save();

    res.json({ success: true, msg: 'Refund request rejected' });
  } catch (err) {
    console.error('Reject Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getBuyers = async (req, res) => {
  try {
    const payments = await Payment.find({ status: { $in: ['completed', 'superseded', 'refunded'] } })
      .populate('user', 'name email role avatar display_id')
      .populate('plan', 'name price duration')
      .sort({ createdAt: -1 });

    const buyersMap = {};
    payments.forEach(p => {
      if (!p.user) return;
      const uid = p.user._id.toString();
      if (!buyersMap[uid]) {
        buyersMap[uid] = {
          user: p.user,
          totalSpent: 0,
          transactionsCount: 0,
          lastPurchase: null,
        };
      }
      if (p.status === 'completed' || p.status === 'superseded') {
        buyersMap[uid].totalSpent += p.amount || 0;
      }
      buyersMap[uid].transactionsCount += 1;
      if (!buyersMap[uid].lastPurchase || new Date(p.createdAt) > new Date(buyersMap[uid].lastPurchase.createdAt)) {
        buyersMap[uid].lastPurchase = p;
      }
    });

    const buyers = Object.values(buyersMap);
    res.json(buyers);
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

    const sendEmail = require('../utils/sendEmail');
    const users = await User.find({ _id: { $in: userIds } }).populate('subscription');
    
    if (users.length === 0) {
      return res.status(404).json({ msg: 'Selected users not found' });
    }

    const emailPromises = users.map(async (user) => {
      if (!user.email) return;
      
      const planName = user.subscription?.name || 'Premium';
      const expiryDate = user.subscriptionExpiry 
        ? new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'soon';
        
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

      return sendEmail({
        email: user.email,
        subject: `[Velaivaaipu] Renew Your ${planName} Subscription`,
        html: htmlContent
      });
    });

    await Promise.all(emailPromises);

    res.json({ success: true, msg: `Sent reminders to ${users.length} users successfully.` });
  } catch (err) {
    console.error('Send Renewal Reminder Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
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
  sendRenewalReminder
};
