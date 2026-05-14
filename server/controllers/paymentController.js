const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

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

    // Amount in paise (1 INR = 100 paise)
    const amount = plan.price * 100;
    const currency = 'INR';

    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan._id
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

    // Calculate expiry date
    let expiryDate = new Date();
    if (plan.duration === 'Monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan.duration === 'Quarterly') {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else if (plan.duration === 'Yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (plan.duration === 'Lifetime') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
    }

    const { autoRenew } = req.body;

    const user = await User.findById(req.user.id);
    user.subscription = plan._id;
    user.subscriptionExpiry = expiryDate;
    if (autoRenew !== undefined) user.autoRenew = !!autoRenew;

    // Reset usage stats on new subscription
    user.downloadsUsed = 0;
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
      const paymentRecord = new Payment({
        user: req.user.id,
        plan: plan._id,
        amount: isFree ? 0 : plan.price,
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

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getAllPayments,
  cancelSubscription
};
