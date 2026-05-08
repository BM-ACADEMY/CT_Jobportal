const express = require('express');
const router = express.Router();
const { 
  getSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription 
} = require('../controllers/subscriptionController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Public or User routes (if needed) - For now, we'll keep them for admin management
// In a real app, users might GET subscriptions to buy them.

router.get('/', getSubscriptions);

// Admin only routes
router.post('/', verifyToken, isAdmin, createSubscription);
router.put('/:id', verifyToken, isAdmin, updateSubscription);
router.delete('/:id', verifyToken, isAdmin, deleteSubscription);

module.exports = router;
