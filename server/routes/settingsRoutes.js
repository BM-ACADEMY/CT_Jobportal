const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', getSettings);
router.patch('/', verifyToken, isAdmin, updateSettings);

module.exports = router;
