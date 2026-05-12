const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  togglePlanFeature,
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
} = require('../controllers/subscriptionController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ── Plans ─────────────────────────────────────────────────────────────────────
router.get('/', getSubscriptions);
router.post('/', verifyToken, isAdmin, createSubscription);
router.put('/:id', verifyToken, isAdmin, updateSubscription);
router.delete('/:id', verifyToken, isAdmin, deleteSubscription);

// Toggle a single dynamic feature inside a plan (isActive + value)
router.patch('/:planId/features/:featureName', verifyToken, isAdmin, togglePlanFeature);

// ── Feature Catalog ───────────────────────────────────────────────────────────
router.get('/features', getFeatures);
router.post('/features', verifyToken, isAdmin, createFeature);
router.put('/features/:id', verifyToken, isAdmin, updateFeature);
router.delete('/features/:id', verifyToken, isAdmin, deleteFeature);

module.exports = router;
