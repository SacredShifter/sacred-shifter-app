CREATE TABLE meditation_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  soundscape TEXT NOT NULL,
  duration_seconds INTEGER,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_meditation_sessions_started_at ON meditation_sessions(started_at);
CREATE INDEX idx_meditation_sessions_completed ON meditation_sessions(completed);
