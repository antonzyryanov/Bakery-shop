import {
  getConversationById,
  getOrCreateConversationForCustomer,
  insertMessage,
  listConversationsForAdmin,
  listMessages
} from '../repositories/chatRepository.js';

const normalizeBody = (body) => String(body || '').trim();

export const getCustomerChat = async (customerId) => {
  const conversation = await getOrCreateConversationForCustomer(customerId);
  const messages = await listMessages(conversation.id);
  return { conversation, messages };
};

export const sendCustomerMessage = async ({ customerId, body }) => {
  const text = normalizeBody(body);
  if (!text) {
    const error = new Error('Message body is required.');
    error.status = 400;
    throw error;
  }
  if (text.length > 2000) {
    const error = new Error('Message is too long.');
    error.status = 400;
    throw error;
  }

  const conversation = await getOrCreateConversationForCustomer(customerId);
  const message = await insertMessage({
    conversationId: conversation.id,
    senderId: customerId,
    body: text
  });

  return { conversation, message };
};

export const getAdminConversations = async () => listConversationsForAdmin();

export const getAdminConversation = async (conversationId) => {
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  const messages = await listMessages(conversationId);
  return { conversation, messages };
};

export const sendAdminMessage = async ({ conversationId, adminId, body }) => {
  const text = normalizeBody(body);
  if (!text) {
    const error = new Error('Message body is required.');
    error.status = 400;
    throw error;
  }
  if (text.length > 2000) {
    const error = new Error('Message is too long.');
    error.status = 400;
    throw error;
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  const message = await insertMessage({
    conversationId,
    senderId: adminId,
    body: text
  });

  return { conversation, message };
};
