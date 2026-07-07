const express = require('express');
const router = express.Router();
const { getFeatures, createFeature, updateFeature, deleteFeature, purchaseCreateOrder, purchaseVerify } = require('../controllers/payPerController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Public route for authenticated users
router.get('/features', getFeatures);

// Purchase flow (authenticated users)
router.post('/purchase/create-order', purchaseCreateOrder);
router.post('/purchase/verify', purchaseVerify);

// Admin only routes
router.post('/features', authorizeRoles('admin'), createFeature);
router.put('/features/:id', authorizeRoles('admin'), updateFeature);
router.delete('/features/:id', authorizeRoles('admin'), deleteFeature);

module.exports = router;
