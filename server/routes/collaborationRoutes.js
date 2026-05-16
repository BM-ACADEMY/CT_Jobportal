const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  createGroup,
  getGroups,
  addMembers,
  sendGroupMessage,
  getGroupMessages,
  scheduleCall,
  getUpcomingCalls,
  clearMessages,
  deleteGroup,
  removeMember,
  deleteMessage
} = require('../controllers/collaborationController');

// All routes are protected
router.use(verifyToken);

// Groups
router.post('/groups', createGroup);
router.get('/groups', getGroups);
router.delete('/groups/:groupId', deleteGroup);
router.post('/groups/:groupId/members', addMembers);
router.delete('/groups/:groupId/members/:userId', removeMember);

// Messages
router.post('/messages', sendGroupMessage);
router.get('/groups/:groupId/messages', getGroupMessages);
router.delete('/groups/:groupId/messages', clearMessages);
router.delete('/messages/:messageId', deleteMessage);

// Calls
router.post('/calls/schedule', scheduleCall);
router.get('/calls/upcoming', getUpcomingCalls);

module.exports = router;
