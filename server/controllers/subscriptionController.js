const Subscription = require('../models/Subscription');
const Feature = require('../models/Feature');

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

// @desc    Create a new subscription — dynamic features from catalog auto-seeded
// @route   POST /api/subscriptions
const createSubscription = async (req, res) => {
  try {
    const body = { ...req.body };

    // Seed all existing global features for this role into the plan (disabled by default)
    const roleFeatures = await Feature.find({ role: body.role, isActive: true });
    const incomingFeatureNames = new Set((body.features || []).map(f => f.name));
    for (const gf of roleFeatures) {
      if (!incomingFeatureNames.has(gf.name)) {
        if (!body.features) body.features = [];
        body.features.push({ name: gf.name, isActive: false, value: gf.defaultValue ?? null });
      }
    }

    const newSubscription = new Subscription(body);
    const subscription = await newSubscription.save();
    res.json(subscription);
  } catch (err) {
    console.error('Create Subscription Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Update a subscription
// @route   PUT /api/subscriptions/:id
const updateSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ msg: 'Subscription not found' });

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
    if (!subscription) return res.status(404).json({ msg: 'Subscription not found' });
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Subscription removed' });
  } catch (err) {
    console.error('Delete Subscription Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Toggle a single dynamic feature within a specific plan
// @route   PATCH /api/subscriptions/:planId/features/:featureName
const togglePlanFeature = async (req, res) => {
  try {
    const { planId, featureName } = req.params;
    const { isActive, value } = req.body;

    const plan = await Subscription.findById(planId);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const existing = plan.features.find(f => f.name === featureName);
    if (existing) {
      existing.isActive = isActive !== undefined ? isActive : !existing.isActive;
      if (value !== undefined) existing.value = value;
    } else {
      plan.features.push({ name: featureName, isActive: isActive ?? true, value: value ?? null });
    }

    await plan.save();
    res.json(plan);
  } catch (err) {
    console.error('Toggle Plan Feature Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
};

// ── FEATURE CATALOG ──────────────────────────────────────────────────────────

// @desc    Get all global features
// @route   GET /api/subscriptions/features
const getFeatures = async (req, res) => {
  try {
    const features = await Feature.find().sort({ createdAt: -1 });
    res.json(features);
  } catch (err) {
    console.error('Get Features Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a global feature and auto-add it (disabled) to all existing plans
// @route   POST /api/subscriptions/features
const createFeature = async (req, res) => {
  try {
    const { name, role, type, unit, defaultValue } = req.body;

    if (!name || !role) return res.status(400).json({ msg: 'name and role are required' });

    const newFeature = new Feature({ name, role, type, unit, defaultValue });
    const feature = await newFeature.save();

    // Auto-propagate to all existing plans for this role (disabled by default)
    const plans = await Subscription.find({ role });
    const bulkOps = plans.map(plan => {
      const alreadyHas = plan.features.some(f => f.name === name);
      if (!alreadyHas) {
        plan.features.push({ name, isActive: false, value: defaultValue ?? null });
        return plan.save();
      }
      return Promise.resolve();
    });
    await Promise.all(bulkOps);

    res.json(feature);
  } catch (err) {
    console.error('Create Feature Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Update a global feature (name, type, unit, defaultValue, isActive)
// @route   PUT /api/subscriptions/features/:id
const updateFeature = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ msg: 'Feature not found' });

    const { name, type, unit, defaultValue, isActive } = req.body;
    const oldName = feature.name;

    if (name !== undefined) feature.name = name;
    if (type !== undefined) feature.type = type;
    if (unit !== undefined) feature.unit = unit;
    if (defaultValue !== undefined) feature.defaultValue = defaultValue;
    if (isActive !== undefined) feature.isActive = isActive;

    await feature.save();

    // If name changed, rename in all plans
    if (name && name !== oldName) {
      await Subscription.updateMany(
        { 'features.name': oldName },
        { $set: { 'features.$[elem].name': name } },
        { arrayFilters: [{ 'elem.name': oldName }] }
      );
    }

    res.json(feature);
  } catch (err) {
    console.error('Update Feature Error:', err.message);
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Delete a global feature (also removed from all plans)
// @route   DELETE /api/subscriptions/features/:id
const deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ msg: 'Feature not found' });

    const name = feature.name;
    await Feature.findByIdAndDelete(req.params.id);

    // Remove from all plans
    await Subscription.updateMany(
      {},
      { $pull: { features: { name } } }
    );

    res.json({ msg: 'Feature removed from catalog and all plans' });
  } catch (err) {
    console.error('Delete Feature Error:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  togglePlanFeature,
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
};
