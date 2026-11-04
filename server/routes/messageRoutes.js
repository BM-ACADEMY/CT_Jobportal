const express = require('express');
const router = express.Router();
const { getOrCreateConversation, getConversations, getMessages, sendMessage, uploadFile, sendBulkMessage } = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireTeamPermission } = require('../middlewares/teamPermission');
const upload = require('../middleware/upload');

router.use(verifyToken);
// Team-managed recruiters: bulk sending needs the Bulk Messaging permission, chat needs Messages
// (middlewares/teamPermission.js). Job seekers and everyone else are not affected.
router.post('/bulk', requireTeamPermission('bulk_messaging'), sendBulkMessage);
router.use(requireTeamPermission('messages'));

router.get('/conversations', getConversations);
router.post('/conversation', getOrCreateConversation);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.post('/upload', upload.single('file'), upload.convertImagesToWebp, uploadFile);

module.exports = router;
