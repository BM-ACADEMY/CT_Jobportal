const PayPerFeature = require('../models/PayPerFeature');
const getRazorpay = require('../config/razorpay');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { fetchGstPercentage, getPricingOption } = require('../utils/pricing');
const { fulfillPayPerPayment } = require('../utils/paymentFulfillment');
const { isValidSignature, isDuplicateKeyError, findPaymentByRazorpayId, checkoutNotes } = require('../utils/paymentGuards');

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

// Prices a pay-per purchase the way the checkout does: quantity price, then GST.
const computePayPerCharge = async (feature, quantity) => {
  const baseAmount = getPricingOption(feature, quantity);
  const gstPercentage = await fetchGstPercentage();
  const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount;
  return { baseAmount, gstPercentage, gstAmount, totalAmount, amountInPaise: Math.round(totalAmount * 100) };
};

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

    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);
    const { baseAmount, gstPercentage, gstAmount, totalAmount, amountInPaise } = await computePayPerCharge(feature, quantity);

    const originalCost = (feature.cost || 0) * quantity;
    const discountAmount = Math.max(0, originalCost - baseAmount);
    const discountPercentage = originalCost > 0 ? Math.round((discountAmount / originalCost) * 100) : 0;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `payper_${Date.now()}`,
      // Razorpay keeps these with the order, so purchaseVerify can trust which feature, user and
      // quantity were paid for instead of taking them from the client again.
      notes: checkoutNotes({ userId: req.user.id, featureId: feature._id, quantity })
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      featureId: feature._id,
      featureName: feature.name,
      quantity,
      baseAmount,
      discountPercentage,
      discountAmount,
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, featureId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !featureId) {
      return res.status(400).json({ msg: 'Missing payment verification fields' });
    }

    if (!isValidSignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature)) {
      return res.status(400).json({ msg: 'Invalid payment signature' });
    }

    const feature = await PayPerFeature.findById(featureId);
    if (!feature) {
      return res.status(404).json({ msg: 'Feature not found' });
    }

    // A Razorpay payment can only ever grant its feature once: a repeated verify (double-click,
    // retry after a timeout, replay) or one already granted by the webhook is answered as a success
    // without adding the credits again.
    const alreadyProcessed = payment => {
      if (String(payment.user) !== String(req.user.id)) {
        return res.status(409).json({ msg: 'This payment has already been used.' });
      }
      return res.json({ success: true, alreadyProcessed: true, msg: `${feature.name} was already added to your account` });
    };
    const existing = await findPaymentByRazorpayId(razorpay_payment_id);
    if (existing) return alreadyProcessed(existing);

    // The signature only proves that this order was paid. Check the order really is for this user
    // and this feature, so a cheap order cannot be used to claim an expensive one.
    const order = await getRazorpay().orders.fetch(razorpay_order_id);
    const notes = order.notes || {};
    let quantity;
    if (notes.userId) {
      if (notes.userId !== String(req.user.id) || notes.featureId !== String(feature._id)) {
        return res.status(400).json({ msg: 'This payment was made for a different feature or account.' });
      }
      quantity = Math.max(1, parseInt(notes.quantity) || 1);
    } else {
      // Order created before checkout notes existed: use the request, but only if what was
      // charged matches what this feature costs.
      quantity = Math.max(1, parseInt(req.body.quantity) || 1);
      const expected = await computePayPerCharge(feature, quantity);
      if (expected.amountInPaise !== order.amount) {
        return res.status(400).json({ msg: 'The amount paid does not match the selected feature.' });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const result = await fulfillPayPerPayment({
      user,
      feature,
      quantity,
      paidAmount: order.amount / 100,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
    if (result.duplicate) return alreadyProcessed(result.payment);

    res.json({
      success: true,
      msg: `${feature.name} purchased successfully!`,
      purchasedFeature: result.purchasedFeature,
    });
  } catch (err) {
    console.error('PayPer Verify Payment Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
