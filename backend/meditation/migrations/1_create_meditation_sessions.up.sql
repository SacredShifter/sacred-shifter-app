-- Create the function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS meditation_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  soundscape TEXT NOT NULL,
  duration_seconds INTEGER,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_started_at ON meditation_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_completed ON meditation_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_soundscape ON meditation_sessions(soundscape);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_meditation_sessions_updated_at ON meditation_sessions;
CREATE TRIGGER update_meditation_sessions_updated_at
    BEFORE UPDATE ON meditation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
