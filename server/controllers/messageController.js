const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');
const { logTeamActivity } = require('../utils/teamActivityLog');

const RECRUITER_ROLES = ['recruiter', 'company', 'org_employee'];
const FRONTEND_URL = process.env.FRONTEND_URL;

// @desc    Get or create conversation
// @route   POST /api/messages/conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    // Check if conversation already exists — always allow continuing existing chats
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (conversation) return res.json(conversation);

    // ── Ticket gate: non-admin messaging an admin ────────────────────────────
    if (senderRole !== 'admin') {
      const recipient = await User.findById(recipientId).select('role');
      const recipientRoleName =
        typeof recipient?.role === 'string'
          ? recipient.role
          : (await recipient?.populate('role', 'name'))?.role?.name;

      if (recipientRoleName === 'admin') {
        // User must have at least one open or in_progress ticket
        const activeTicket = await Ticket.findOne({
          user: senderId,
          status: { $in: ['open', 'in_progress'] }
        });

        if (!activeTicket) {
          return res.status(403).json({
            msg: 'You can only chat with support when you have an active (open or in-progress) support ticket. Please raise a ticket first.',
            noActiveTicket: true
          });
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // New conversation — enforce message count for jobseekers messaging recruiters/orgs
    if (senderRole === 'jobseeker') {
      const recipientUser = await User.findById(recipientId).populate('role', 'name');
      const recipientRoleName = recipientUser?.role?.name;

      if (RECRUITER_ROLES.includes(recipientRoleName)) {
        const sender = await User.findById(senderId).populate('subscription');
        const limit = sender?.subscription?.messageRecruitersCount ?? 0;

        if (limit > 0 && (sender.messagesUsed || 0) >= limit) {
          return res.status(403).json({
            msg: `You can only message ${limit} recruiter(s) on your current plan. Please upgrade to message more.`,
            limitReached: true
          });
        }

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
    const mongoose = require('mongoose');
    const Admin = require('../models/Admin');
    
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .lean();

    if (conversations.length === 0) return res.json([]);

    // Extract all unique participant IDs
    const participantIds = [...new Set(conversations.flatMap(c => c.participants.map(p => p.toString())))];

    // Fetch users and admins
    const users = await User.find({ _id: { $in: participantIds } }).populate('role', 'name').lean();
    const admins = await Admin.find({ _id: { $in: participantIds } }).lean();

    const participantMap = {};
    users.forEach(u => {
      participantMap[u._id.toString()] = {
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        role: u.role?.name || 'User'
      };
    });
    admins.forEach(a => {
      participantMap[a._id.toString()] = {
        _id: a._id,
        name: a.name || 'Velaivaaipu Support',
        avatar: '',
        role: 'admin'
      };
    });

    // Aggregate unread counts
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

    // Map the results
    const result = conversations.map(c => {
      return {
        ...c,
        participants: c.participants.map(p => participantMap[p.toString()] || p),
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

    // If the recipient wasn't already sitting on unread messages from this sender, this message
    // starts a new "unread" streak worth emailing about — avoids re-emailing on every message
    // of an active back-and-forth.
    const priorUnreadCount = await Message.countDocuments({ conversation: conversationId, sender: senderId, isRead: false });

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

    if (req.user.role === 'recruiter') {
      const actingUser = await User.findById(senderId).select('name company').lean();
      logTeamActivity({
        actor: { _id: actingUser._id, name: actingUser.name, company: actingUser.company, role: req.user.role },
        action: 'message_sent',
        description: 'Sent a message to a candidate',
        entity: newMessage._id,
        entityModel: 'Message'
      });
    }

    // Optional: Emit socket event from here if needed
    // req.io.to(conversationId).emit('receive_message', newMessage);

    if (priorUnreadCount === 0) {
      const [conversation, sender] = await Promise.all([
        Conversation.findById(conversationId).populate('participants', 'name email profile.phone recruiterProfile.phone companyProfile.phone'),
        User.findById(senderId).select('name')
      ]);
      const recipient = conversation?.participants.find(p => p._id?.toString() !== senderId);
      if (recipient?.email) {
        sendEmail({
          email: recipient.email,
          subject: `New message from ${sender?.name || 'a user'}`,
          html: emailWrapper('New Message', `
            <p>Hi ${recipient.name || 'there'},</p>
            <p><strong>${sender?.name || 'Someone'}</strong> sent you a message on Velaivaaipu:</p>
            <blockquote style="border-left:3px solid #10b981;padding-left:12px;color:#475569;margin-left:0;">${content || '📎 Attachment'}</blockquote>
            <p><a href="${FRONTEND_URL}" style="color:#059669;">Log in to reply</a></p>
          `)
        }).catch(() => {});
      }
      const recipientPhone = getUserPhone(recipient);
      if (recipientPhone) {
        sendWhatsAppTemplate({
          to: recipientPhone,
          template: 'off_platform_chat_bridge',
          params: [recipient.name || 'there', sender?.name || 'Someone', 'your conversation', content || 'Sent an attachment', FRONTEND_URL]
        }).catch(() => {});
      }
    }

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

// @desc    Bulk message multiple candidates (recruiter only)
// @route   POST /api/messages/bulk
const sendBulkMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const sender = await User.findById(senderId).populate('subscription');
    if (!sender) return res.status(404).json({ msg: 'User not found' });

    let hasAccess = sender.subscription?.hasBulkMessaging;
    let payPerFeatureIndex = -1;

    // Fallback: Check Pay-Per System
    if (!hasAccess && sender.purchasedFeatures && sender.purchasedFeatures.length > 0) {
      const now = new Date();
      payPerFeatureIndex = sender.purchasedFeatures.findIndex(
        f => f.featureKey === 'hasBulkMessaging' &&
             f.isActive &&
             (!f.expiresAt || new Date(f.expiresAt) > now)
      );
      if (payPerFeatureIndex !== -1) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ msg: 'Bulk messaging requires a paid plan or feature purchase.', requiresUpgrade: true });
    }

    const { recipientIds, subject, content } = req.body;
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ msg: 'No recipients provided' });
    }
    if (!content) return res.status(400).json({ msg: 'Message content is required' });

    // Ensure they have enough pay-per credits if it's a limited feature
    if (payPerFeatureIndex !== -1) {
      const feature = sender.purchasedFeatures[payPerFeatureIndex];
      // usageLeft > 0 means it is a limited pack (unlimited is stored as 0)
      if (feature.usageLeft > 0 && feature.usageLeft < recipientIds.length) {
        return res.status(400).json({ msg: `You only have ${feature.usageLeft} messages left in your pay-per plan. Please select fewer candidates or upgrade.` });
      }
    }

    const results = { sent: 0, failed: 0 };
    const recipientUsers = await User.find({ _id: { $in: recipientIds } }).select('name email profile.phone recruiterProfile.phone companyProfile.phone');
    const recipientMap = new Map(recipientUsers.map(u => [u._id.toString(), u]));

    for (const recipientId of recipientIds) {
      try {
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, recipientId] }
        });

        if (!conversation) {
          conversation = new Conversation({ participants: [senderId, recipientId] });
          await conversation.save();
        }

        const messageContent = subject ? `**${subject}**\n\n${content}` : content;
        const msg = new Message({ conversation: conversation._id, sender: senderId, content: messageContent });
        await msg.save();

        await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: msg._id, updatedAt: Date.now() });
        results.sent++;

        const recipientUser = recipientMap.get(String(recipientId));
        if (recipientUser?.email) {
          sendEmail({
            email: recipientUser.email,
            subject: subject ? `New message: ${subject}` : `New message from ${sender.name || 'a recruiter'}`,
            html: emailWrapper('New Message', `
              <p>Hi ${recipientUser.name || 'there'},</p>
              <p><strong>${sender.name || 'A recruiter'}</strong> sent you a message${subject ? `: <strong>${subject}</strong>` : ''}.</p>
              <blockquote style="border-left:3px solid #10b981;padding-left:12px;color:#475569;margin-left:0;">${content}</blockquote>
              <p><a href="${FRONTEND_URL}" style="color:#059669;">Log in to reply</a></p>
            `)
          }).catch(() => {});
        }

        const bulkRecipientPhone = getUserPhone(recipientUser);
        if (bulkRecipientPhone) {
          sendWhatsAppTemplate({
            to: bulkRecipientPhone,
            template: 'bulk_candidate_communication',
            params: [
              recipientUser?.name || 'there',
              sender.name || 'a recruiter',
              subject || 'an update',
              new Date().toLocaleDateString('en-IN'),
              FRONTEND_URL,
              FRONTEND_URL
            ]
          }).catch(() => {});
        }
      } catch {
        results.failed++;
      }
    }

    // Deduct usages if applicable
    if (payPerFeatureIndex !== -1 && results.sent > 0) {
      const feature = sender.purchasedFeatures[payPerFeatureIndex];
      if (feature.usageLeft > 0) {
        feature.usageLeft -= results.sent;
        if (feature.usageLeft <= 0) {
          feature.usageLeft = 0;
          feature.isActive = false;
        }
        await sender.save();
      }
    }

    res.json({ msg: `Messages sent to ${results.sent} candidate(s).`, ...results });
  } catch (err) {
    console.error('Bulk message error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  uploadFile,
  sendBulkMessage
};
