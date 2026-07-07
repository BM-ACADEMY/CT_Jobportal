const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const {
  submitReview,
  getMyReview,
  getAllReviews,
  updateReviewStatus,
  getApprovedReviews
} = require('../controllers/reviewController');

// Public route for homepage
router.get('/approved', getApprovedReviews);

// Protected routes for users
router.post('/', verifyToken, submitReview);
router.get('/my', verifyToken, getMyReview);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAllReviews);
router.patch('/admin/:id', verifyToken, isAdmin, updateReviewStatus);

module.exports = router;
