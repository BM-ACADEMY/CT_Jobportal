const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { toUploadPath, signUploadPath } = require('../utils/signedUploads');

// @route   POST /api/files/sign   body: { url }
// Returns a short-lived signed link for one uploaded document. Sign-in required.
router.post('/sign', verifyToken, (req, res) => {
  const filePath = toUploadPath(req.body && req.body.url);
  if (!filePath) return res.status(400).json({ msg: 'Not an uploaded file' });
  res.set('Cache-Control', 'no-store');
  res.json({ url: signUploadPath(filePath) });
});

module.exports = router;
