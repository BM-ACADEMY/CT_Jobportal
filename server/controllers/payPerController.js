const PayPerFeature = require('../models/PayPerFeature');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');

const fetchGstPercentage = async () => {
  const settings = await Settings.findOne({ key: 'global' });
  return settings?.gstPercentage || 0;
};

// @desc    Get all pay-per features (Admin sees all, Users see active for their role)
exports.getFeatures = async (req, res) => {
  try {
    const role = req.user.role;
    let query = {};
    if (role !== 'admin') {
      const roleName = req.user.role;
      query = { roles: roleName, isActive: true };
    }
    const features = await PayPerFeature.find(query).sort({ createdAt: -1 });
    res.json(features);
  } catch (err) {
    console.error('Get PayPerFeatures Error:', err);
    res.status(500).json({ msg: 'Server error while fetching features' });
  }
};

// @desc    Create a new pay-per feature (Admin only)
exports.createFeature = async (req, res) => {
  try {
    const { name, featureKey, roles, cost, days, usageCount, description, isActive } = req.body;
    
    if (!name || !featureKey || !roles || !roles.length || cost === undefined || days === undefined) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    const feature = new PayPerFeature({
      name, featureKey, roles, cost, days, usageCount: usageCount || 0, description, isActive
    });

    await feature.save();
    res.status(201).json({ msg: 'Feature created successfully', feature });
  } catch (err) {
    console.error('Create PayPerFeature Error:', err);
    res.status(500).json({ msg: 'Server error while creating feature' });
  }
};

// @desc    Update a pay-per feature (Admin only)
exports.updateFeature = async (req, res) => {
  try {
    const feature = await PayPerFeature.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!feature) {
      return res.status(404).json({ msg: 'Feature not found' });
    }
    res.json({ msg: 'Feature updated successfully', feature });
  } catch (err) {
    console.error('Update PayPerFeature Error:', err);
    res.status(500).json({ msg: 'Server error while updating feature' });
  }
};

// @desc    Delete a pay-per feature (Admin only)
exports.deleteFeature = async (req, res) => {
  try {
    const feature = await PayPerFeature.findByIdAndDelete(req.params.id);
    if (!feature) {
      return res.status(404).json({ msg: 'Feature not found' });
    }
    res.json({ msg: 'Feature deleted successfully' });
  } catch (err) {
    console.error('Delete PayPerFeature Error:', err);
    res.status(500).json({ msg: 'Server error while deleting feature' });
  }
};

// ─── Pay-Per Purchase Flow ───────────────────────────────────────────────────

// @desc    Create Razorpay order for a pay-per feature
// @route   POST /api/pay-per/purchase/create-order
exports.purchaseCreateOrder = async (req, res) => {
  try {
    const { featureId } = req.body;
    if (!featureId) {
      return res.status(400).json({ msg: 'featureId is required' });
    }

    const feature = await PayPerFeature.findById(featureId);
    if (!feature || !feature.isActive) {
      return res.status(404).json({ msg: 'Feature not found or inactive' });
    }

    const gstPercentage = await fetchGstPercentage();
    const baseAmount = feature.cost;
    const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;
    const amountInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `payper_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      featureId: feature._id,
      featureName: feature.name,
      baseAmount,
      gstPercentage,
      gstAmount,
      totalAmount,
    });
  } catch (err) {
    console.error('PayPer Create Order Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Verify Razorpay payment and activate purchased feature
// @route   POST /api/pay-per/purchase/verify
exports.purchaseVerify = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      featureId
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: 'Invalid payment signature' });
    }

    const feature = await PayPerFeature.findById(featureId);
    if (!feature) {
      return res.status(404).json({ msg: 'Feature not found' });
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + feature.days);

    // Add to user's purchasedFeatures
    const user = await User.findById(req.user.id);
    user.purchasedFeatures.push({
      featureId: feature._id,
      featureKey: feature.featureKey,
      isActive: true,
      usageLeft: feature.usageCount || 0,
      expiresAt,
    });
    await user.save();

    // Save payment record
    const gstPct = await fetchGstPercentage();
    const baseAmt = feature.cost;
    const gstAmt = Math.round(baseAmt * gstPct) / 100;
    const totalAmt = baseAmt + gstAmt;

    const paymentRecord = new Payment({
      user: req.user.id,
      payPerFeature: feature._id,
      paymentType: 'pay-per-feature',
      amount: totalAmt,
      baseAmount: baseAmt,
      gstPercentage: gstPct,
      gstAmount: gstAmt,
      quantity: 1,
      currency: 'INR',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: 'completed',
      paymentMethod: 'Razorpay'
    });
    await paymentRecord.save();

    res.json({
      success: true,
      msg: `${feature.name} purchased successfully!`,
      purchasedFeature: user.purchasedFeatures[user.purchasedFeatures.length - 1],
    });
  } catch (err) {
    console.error('PayPer Verify Payment Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
