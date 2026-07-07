const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getAllPayments,
  cancelSubscription,
  getRenewals,
  requestRefund,
  getRefunds,
  approveRefund,
  rejectRefund,
  getBuyers,
  getBuyerDetails,
  sendRenewalReminder
} = require('../controllers/paymentController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.post('/cancel-plan', verifyToken, cancelSubscription);
router.get('/history', verifyToken, getPaymentHistory);
router.post('/:paymentId/request-refund', verifyToken, requestRefund);

// Admin billing routes
router.get('/admin/all', verifyToken, isAdmin, getAllPayments);
router.get('/admin/renewals', verifyToken, isAdmin, getRenewals);
router.post('/admin/renewals/send-reminder', verifyToken, isAdmin, sendRenewalReminder);
router.get('/admin/refunds', verifyToken, isAdmin, getRefunds);
router.post('/admin/refunds/:paymentId/approve', verifyToken, isAdmin, approveRefund);
router.post('/admin/refunds/:paymentId/reject', verifyToken, isAdmin, rejectRefund);
router.get('/admin/buyers', verifyToken, isAdmin, getBuyers);
router.get('/admin/buyers/:userId', verifyToken, isAdmin, getBuyerDetails);

module.exports = router;
