const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const RECRUITER_ROLES = ['recruiter', 'company', 'org_employee'];

// @desc    Get or create conversation
// @route   POST /api/messages/conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (conversation) return res.json(conversation);

    // New conversation — enforce message count for jobseekers messaging recruiters/orgs
    const senderRole = req.user.role;
    if (senderRole === 'jobseeker') {
      const recipient = await User.findById(recipientId).populate('role', 'name');
      const recipientRole = recipient?.role?.name;

      if (RECRUITER_ROLES.includes(recipientRole)) {
        const sender = await User.findById(senderId).populate('subscription');
        const limit = sender?.subscription?.messageRecruitersCount ?? 0;

        if (limit > 0 && (sender.messagesUsed || 0) >= limit) {
          return res.status(403).json({
            msg: `You can only message ${limit} recruiter(s) on your current plan. Please upgrade to message more.`,
            limitReached: true
          });
        }

        // Increment counter on new conversation with recruiter/org
        await User.findByIdAndUpdate(senderId, { $inc: { messagesUsed: 1 } });
      }
    }

    conversation = new Conversation({ participants: [senderId, recipientId] });
    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get user conversations
// @route   GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'name avatar role',
      populate: {
        path: 'role',
        select: 'name'
      }
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Aggregate unread counts for all conversations in one query
    const mongoose = require('mongoose');
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map(c => c._id) },
          sender: { $ne: new mongoose.Types.ObjectId(userId) },
          isRead: false
        }
      },
      { $group: { _id: '$conversation', count: { $sum: 1 } } }
    ]);

    const unreadMap = {};
    unreadAgg.forEach(item => { unreadMap[item._id.toString()] = item.count; });

    const result = conversations.map(c => {
      const conv = c.toObject();
      if (conv.participants) {
        conv.participants = conv.participants.map(p => ({
          ...p,
          role: p.role?.name || 'User'
        }));
      }
      return {
        ...conv,
        unreadCount: unreadMap[c._id.toString()] || 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversation: conversationId
    }).sort({ createdAt: 1 });

    // Mark all unread messages from the other participant as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Send a message (HTTP fallback/init)
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, attachment } = req.body;
    const senderId = req.user.id;

    const newMessage = new Message({
      conversation: conversationId,
      sender: senderId,
      content,
      attachment
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      updatedAt: Date.now()
    });

    // Optional: Emit socket event from here if needed
    // req.io.to(conversationId).emit('receive_message', newMessage);

    res.json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    // Assuming upload middleware puts file in a static directory and provides path
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      name: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Upload error' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  uploadFile
};
