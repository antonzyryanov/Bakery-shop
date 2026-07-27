import { db } from '../src/config/db.js';

const run = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT uq_conversations_customer UNIQUE (customer_id),
      CONSTRAINT fk_conversations_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      body VARCHAR(2000) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES customers(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )
  `);

  try {
    await db.query('CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at)');
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME') throw error;
  }

  try {
    await db.query('CREATE INDEX idx_conversations_updated ON conversations(updated_at)');
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME') throw error;
  }

  try {
    await db.query('CREATE INDEX idx_orders_status ON orders(status)');
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME') throw error;
  }

  const [tables] = await db.query("SHOW TABLES LIKE 'conversations'");
  const [messages] = await db.query("SHOW TABLES LIKE 'messages'");
  console.log({ conversations: tables, messages });
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
