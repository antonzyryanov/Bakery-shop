import {
  getAdminConversation,
  getAdminConversations,
  getCustomerChat,
  sendAdminMessage,
  sendCustomerMessage
} from '../services/chatService.js';

export const getMyChat = async (req, res, next) => {
  try {
    const data = await getCustomerChat(req.user.sub);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const postMyChatMessage = async (req, res, next) => {
  try {
    const data = await sendCustomerMessage({
      customerId: req.user.sub,
      body: req.body.body
    });
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
};

export const listAdminChats = async (req, res, next) => {
  try {
    const conversations = await getAdminConversations();
    return res.json({ conversations });
  } catch (error) {
    return next(error);
  }
};

export const getAdminChat = async (req, res, next) => {
  try {
    const data = await getAdminConversation(req.params.id);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const postAdminChatMessage = async (req, res, next) => {
  try {
    const data = await sendAdminMessage({
      conversationId: req.params.id,
      adminId: req.user.sub,
      body: req.body.body
    });
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
};
