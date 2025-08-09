CREATE TABLE shared_learnings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shared_learnings_user_id ON shared_learnings(user_id);
CREATE INDEX idx_shared_learnings_created_at ON shared_learnings(created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
