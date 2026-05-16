const CollaborationGroup = require('../models/CollaborationGroup');
const Message = require('../models/Message');
const User = require('../models/User');
const CallSchedule = require('../models/CallSchedule');

// @desc    Create a new collaboration group
// @route   POST /api/collaboration/groups
const createGroup = async (req, res) => {
  try {
    const { name, members, description, avatar } = req.body;
    const adminId = req.user.id;

    // Get user's company
    const user = await User.findById(adminId);
    const companyId = user.company || user.employerCompany;

    if (!companyId) {
      return res.status(400).json({ msg: 'You must be associated with a company to create a group.' });
    }

    const group = new CollaborationGroup({
      name,
      company: companyId,
      admin: adminId,
      members: [...new Set([adminId, ...(members || [])])],
      description,
      avatar
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all groups for the user
// @route   GET /api/collaboration/groups
const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await CollaborationGroup.find({
      members: userId
    })
    .populate({
      path: 'members',
      select: 'name avatar role',
      populate: {
        path: 'role',
        select: 'name'
      }
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Add members to a group
// @route   POST /api/collaboration/groups/:groupId/members
const addMembers = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const { groupId } = req.params;
    const adminId = req.user.id;

    const group = await CollaborationGroup.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Check if requester is admin or member
    if (!group.members.includes(adminId)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    group.members = [...new Set([...group.members, ...memberIds])];
    await group.save();

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Send a group message
// @route   POST /api/collaboration/messages
const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, content, type, attachment, voiceUrl, stickerId } = req.body;
    const senderId = req.user.id;

    const group = await CollaborationGroup.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ msg: 'Not authorized to send messages in this group' });
    }

    const newMessage = new Message({
      collaborationGroup: groupId,
      sender: senderId,
      content,
      type: type || 'text',
      attachment,
      voiceUrl,
      stickerId
    });

    await newMessage.save();

    await CollaborationGroup.findByIdAndUpdate(groupId, {
      lastMessage: newMessage._id,
      updatedAt: Date.now()
    });

    // Populate sender info for the frontend
    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');

    // Emit socket event if io is available
    if (req.io) {
      req.io.to(groupId).emit('receive_group_message', populatedMessage);
    }

    res.json(populatedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get messages for a group
// @route   GET /api/collaboration/groups/:groupId/messages
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await CollaborationGroup.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    if (!group.members.includes(userId)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const messages = await Message.find({ collaborationGroup: groupId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Schedule a call
// @route   POST /api/collaboration/calls/schedule
const scheduleCall = async (req, res) => {
  try {
    const { title, description, groupId, startTime, duration, meetingLink } = req.body;
    const userId = req.user.id;

    const schedule = new CallSchedule({
      title,
      description,
      group: groupId,
      scheduledBy: userId,
      startTime,
      duration,
      meetingLink
    });

    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get upcoming calls
// @route   GET /api/collaboration/calls/upcoming
const getUpcomingCalls = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find groups the user is in
    const groups = await CollaborationGroup.find({ members: userId }).select('_id');
    const groupIds = groups.map(g => g._id);

    const calls = await CallSchedule.find({
      group: { $in: groupIds },
      startTime: { $gte: new Date() },
      status: 'scheduled'
    })
    .populate('group', 'name')
    .populate('scheduledBy', 'name avatar')
    .sort({ startTime: 1 });

    res.json(calls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Clear messages in a group
// @route   DELETE /api/collaboration/groups/:groupId/messages
const clearMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    await Message.deleteMany({ collaborationGroup: groupId });
    res.json({ msg: 'Messages cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete a collaboration group
// @route   DELETE /api/collaboration/groups/:groupId
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await CollaborationGroup.findByIdAndDelete(groupId);
    await Message.deleteMany({ collaborationGroup: groupId });
    await CallSchedule.deleteMany({ group: groupId });
    res.json({ msg: 'Group deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Remove a member from a group
// @route   DELETE /api/collaboration/groups/:groupId/members/:userId
const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user.id;

    const group = await CollaborationGroup.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Only admin can remove members
    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ msg: 'Only the group admin can remove members' });
    }

    if (userId === adminId) {
      return res.status(400).json({ msg: 'Admin cannot be removed from the group' });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete a single message
// @route   DELETE /api/collaboration/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ msg: 'Message not found' });

    // Check if user is sender or group admin
    const group = await CollaborationGroup.findById(message.collaborationGroup);
    const isSender = message.sender.toString() === userId;
    const isGroupAdmin = group?.admin?.toString() === userId;

    if (!isSender && !isGroupAdmin) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await Message.findByIdAndDelete(messageId);
    
    // Emit socket event for real-time deletion
    if (req.io) {
      req.io.to(message.collaborationGroup.toString()).emit('message_deleted', messageId);
    }

    res.json({ msg: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  createGroup,
  getGroups,
  addMembers,
  removeMember,
  sendGroupMessage,
  getGroupMessages,
  scheduleCall,
  getUpcomingCalls,
  clearMessages,
  deleteGroup,
  deleteMessage
};
