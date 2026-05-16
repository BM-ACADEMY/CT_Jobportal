const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: function() { return !this.collaborationGroup; }
  },
  collaborationGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollaborationGroup',
    required: function() { return !this.conversation; }
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'document', 'sticker', 'voice'],
    default: 'text'
  },
  content: {
    type: String,
    required: function() { 
      return !this.attachment && !this.voiceUrl && !this.stickerId; 
    }
  },
  attachment: {
    url: String,
    name: String,
    fileType: String
  },
  voiceUrl: {
    type: String
  },
  stickerId: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
