const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory, getAllPayments, cancelSubscription } = require('../controllers/paymentController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.post('/cancel-plan', verifyToken, cancelSubscription);
router.get('/history', verifyToken, getPaymentHistory);
router.get('/admin/all', verifyToken, isAdmin, getAllPayments);

module.exports = router;
