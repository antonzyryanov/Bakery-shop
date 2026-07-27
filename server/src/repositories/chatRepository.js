import { db } from '../config/db.js';
import { generateId } from '../utils/ids.js';

export const findConversationByCustomer = async (customerId) => {
  const [rows] = await db.execute(
    `SELECT id, customer_id AS customerId, created_at AS createdAt, updated_at AS updatedAt
     FROM conversations
     WHERE customer_id = ?
     LIMIT 1`,
    [customerId]
  );
  return rows[0] || null;
};

export const createConversation = async (customerId) => {
  const id = generateId();
  await db.execute(
    'INSERT INTO conversations (id, customer_id) VALUES (?, ?)',
    [id, customerId]
  );
  return findConversationByCustomer(customerId);
};

export const getOrCreateConversationForCustomer = async (customerId) => {
  const existing = await findConversationByCustomer(customerId);
  if (existing) {
    return existing;
  }
  return createConversation(customerId);
};

export const listMessages = async (conversationId) => {
  const [rows] = await db.execute(
    `SELECT m.id,
            m.conversation_id AS conversationId,
            m.sender_id AS senderId,
            c.email AS senderEmail,
            c.role AS senderRole,
            m.body,
            m.created_at AS createdAt
     FROM messages m
     INNER JOIN customers c ON c.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    [conversationId]
  );
  return rows;
};

export const insertMessage = async ({ conversationId, senderId, body }) => {
  const id = generateId();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'INSERT INTO messages (id, conversation_id, sender_id, body) VALUES (?, ?, ?, ?)',
      [id, conversationId, senderId, body]
    );
    await connection.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [rows] = await db.execute(
    `SELECT m.id,
            m.conversation_id AS conversationId,
            m.sender_id AS senderId,
            c.email AS senderEmail,
            c.role AS senderRole,
            m.body,
            m.created_at AS createdAt
     FROM messages m
     INNER JOIN customers c ON c.id = m.sender_id
     WHERE m.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0];
};

export const listConversationsForAdmin = async () => {
  const [rows] = await db.execute(
    `SELECT c.id,
            c.customer_id AS customerId,
            cust.email AS customerEmail,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt,
            (
              SELECT m.body
              FROM messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS lastMessage,
            (
              SELECT m.created_at
              FROM messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS lastMessageAt
     FROM conversations c
     INNER JOIN customers cust ON cust.id = c.customer_id
     ORDER BY COALESCE(
       (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
       c.updated_at
     ) DESC`
  );
  return rows;
};

export const getConversationById = async (conversationId) => {
  const [rows] = await db.execute(
    `SELECT c.id,
            c.customer_id AS customerId,
            cust.email AS customerEmail,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt
     FROM conversations c
     INNER JOIN customers cust ON cust.id = c.customer_id
     WHERE c.id = ?
     LIMIT 1`,
    [conversationId]
  );
  return rows[0] || null;
};
