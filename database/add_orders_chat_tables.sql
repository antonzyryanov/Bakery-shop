USE bakery_shop;

-- Allow admin acceptance before fulfilment (customer cannot cancel after ACCEPTED)
ALTER TABLE orders
  MODIFY COLUMN status ENUM('PLACED', 'ACCEPTED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'PLACED';

-- One conversation per customer (3NF: conversation depends only on customer)
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_conversations_customer UNIQUE (customer_id),
  CONSTRAINT fk_conversations_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Messages depend on conversation + sender (both in customers table)
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
);

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);
CREATE INDEX idx_orders_status ON orders(status);
