const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

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

    const user = await User.findById(req.user.id);
    user.subscription = plan._id;
    user.subscriptionExpiry = expiryDate;
    
    // Reset usage stats if needed
    user.downloadsUsed = 0;
    user.searchUsed = 0;
    user.jobsUsed = 0;

    await user.save();

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

module.exports = {
  createOrder,
  verifyPayment,
};
