-- Main resonant codex entries table
CREATE TABLE IF NOT EXISTS resonant_codex_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id TEXT NOT NULL DEFAULT 'default-user',
  mode TEXT NOT NULL CHECK (mode IN ('codex', 'register')),
  title TEXT,
  content JSONB NOT NULL,
  entry_type TEXT,
  tags TEXT[] DEFAULT '{}',
  resonance_rating NUMERIC(3,2) CHECK (resonance_rating >= 0.00 AND resonance_rating <= 1.00),
  resonance_signature TEXT,
  resonance_channels TEXT[] DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE,
  context JSONB DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  ai_labels TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
  is_verified BOOLEAN DEFAULT FALSE,
  parent_id TEXT REFERENCES resonant_codex_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Shares table for explicit per-user sharing
CREATE TABLE IF NOT EXISTS resonant_codex_shares (
  entry_id TEXT REFERENCES resonant_codex_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (entry_id, user_id)
);

-- Reactions/engagement table
CREATE TABLE IF NOT EXISTS resonant_codex_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entry_id TEXT REFERENCES resonant_codex_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('star', 'support', 'witness')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rc_entries_owner_created ON resonant_codex_entries(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rc_entries_tags ON resonant_codex_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_rc_entries_mode_occurred ON resonant_codex_entries(mode, occurred_at);
CREATE INDEX IF NOT EXISTS idx_rc_entries_visibility ON resonant_codex_entries(visibility);
CREATE INDEX IF NOT EXISTS idx_rc_entries_parent ON resonant_codex_entries(parent_id);
CREATE INDEX IF NOT EXISTS idx_rc_shares_user ON resonant_codex_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_reactions_entry ON resonant_codex_reactions(entry_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END$$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_rc_updated_at ON resonant_codex_entries;
CREATE TRIGGER trg_rc_updated_at
  BEFORE UPDATE ON resonant_codex_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
