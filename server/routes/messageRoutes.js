const express = require('express');
const router = express.Router();
const { getOrCreateConversation, getConversations, getMessages, sendMessage, uploadFile, sendBulkMessage } = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middleware/upload');

router.use(verifyToken);

router.get('/conversations', getConversations);
router.post('/conversation', getOrCreateConversation);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.post('/upload', upload.single('file'), uploadFile);
router.post('/bulk', sendBulkMessage);

module.exports = router;
