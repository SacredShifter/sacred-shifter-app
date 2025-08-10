ALTER TABLE call_history
ADD COLUMN recording_url TEXT,
ADD COLUMN session_type TEXT NOT NULL DEFAULT 'standard';

CREATE INDEX idx_call_history_session_type ON call_history(session_type);
