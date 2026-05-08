const Subscription = require('../models/Subscription');

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (err) {
    console.error('Get Subscriptions Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a new subscription
const createSubscription = async (req, res) => {
  try {
    const newSubscription = new Subscription(req.body);
    const subscription = await newSubscription.save();
    res.json(subscription);
  } catch (err) {
    console.error('Create Subscription Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Update a subscription
const updateSubscription = async (req, res) => {
  try {
    const { 
      name, price, duration, roles, 
      jobPostingLimit, applicationDownloadLimit, hasVerifiedBadge,
      hasCareerGuidance, hasResumePrep, hasExamAccess, hasProfileViewAccess,
      isActive 
    } = req.body;

    let subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    subscription.name = name || subscription.name;
    subscription.price = price !== undefined ? price : subscription.price;
    Object.assign(subscription, req.body);
    await subscription.save();
    res.json(subscription);
  } catch (err) {
    console.error('Update Subscription Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Subscription removed' });
  } catch (err) {
    console.error('Delete Subscription Error:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription
};
