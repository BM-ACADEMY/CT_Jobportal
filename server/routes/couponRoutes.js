const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  validateCoupon
} = require('../controllers/couponController');

// Public/User route
router.post('/validate', validateCoupon);

// Admin routes
router.use(verifyToken);
router.use(authorizeRoles('admin', 'subadmin'));
router.get('/', getCoupons);
router.post('/', createCoupon);
router.patch('/:id', updateCoupon);

module.exports = router;
