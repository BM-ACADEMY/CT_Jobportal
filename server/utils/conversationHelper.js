const Conversation = require('../models/Conversation');

const getOrCreateConversation = async (userIdA, userIdB) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userIdA, userIdB] }
  });
  if (!conversation) {
    conversation = new Conversation({ participants: [userIdA, userIdB] });
    await conversation.save();
  }
  return conversation;
};

module.exports = { getOrCreateConversation };
