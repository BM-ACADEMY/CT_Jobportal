// Public blog API, mounted at /api/blogs.
const express = require('express');
const { listPublic, getPublic } = require('../controllers/blogController');
const router = express.Router();
router.get('/', listPublic);
router.get('/:slug', getPublic);
module.exports = router;
