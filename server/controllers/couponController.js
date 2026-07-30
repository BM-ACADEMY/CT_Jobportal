const Coupon = require('../models/Coupon');

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Create a new coupon (Admin)
// @route   POST /api/coupons
const createCoupon = async (req, res) => {
  try {
    const { code, name, percentage, totalUses, isActive } = req.body;
    let existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ msg: 'Coupon code already exists' });
    }
    const coupon = new Coupon({
      code: code.toUpperCase(),
      name,
      percentage,
      totalUses,
      isActive: isActive !== undefined ? isActive : true
    });
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Update a coupon (Admin)
// @route   PATCH /api/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const { name, percentage, totalUses, isActive } = req.body;
    let coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
    
    if (name !== undefined) coupon.name = name;
    if (percentage !== undefined) coupon.percentage = percentage;
    if (totalUses !== undefined) coupon.totalUses = totalUses;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Validate a coupon code (Public/User)
// @route   POST /api/coupons/validate
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ msg: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ msg: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ msg: 'Coupon is inactive' });
    if (coupon.totalUses > 0 && coupon.currentUses >= coupon.totalUses) {
      return res.status(400).json({ msg: 'Coupon usage limit reached' });
    }

    res.json({
      code: coupon.code,
      name: coupon.name,
      percentage: coupon.percentage
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  validateCoupon
};
