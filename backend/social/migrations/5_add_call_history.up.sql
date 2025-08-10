CREATE TYPE call_status AS ENUM ('dialing', 'answered', 'missed', 'declined', 'ended');
CREATE TYPE call_type AS ENUM ('voice', 'video');

CREATE TABLE call_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id uuid REFERENCES threads(id) ON DELETE SET NULL,
  caller_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  status call_status NOT NULL DEFAULT 'dialing',
  type call_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds INTEGER,
  CHECK (caller_id != receiver_id)
);

CREATE INDEX idx_call_history_caller ON call_history(caller_id, created_at DESC);
CREATE INDEX idx_call_history_receiver ON call_history(receiver_id, created_at DESC);
CREATE INDEX idx_call_history_thread ON call_history(thread_id);
