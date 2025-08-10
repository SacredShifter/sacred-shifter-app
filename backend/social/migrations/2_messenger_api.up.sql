-- Messenger tables
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  created_by TEXT REFERENCES social_profiles(user_id) ON DELETE SET NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS thread_members (
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  last_read_at timestamptz,
  joined_at timestamptz DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES social_profiles(user_id) ON DELETE SET NULL,
  body text,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  edited_at timestamptz,
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_members_user ON thread_members(user_id);
