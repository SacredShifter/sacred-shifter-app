CREATE TABLE echo_glyph_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  resonance_type TEXT NOT NULL,
  linked_nodes TEXT[],
  glyph_image_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_echo_glyph_records_resonance_type ON echo_glyph_records(resonance_type);
CREATE INDEX idx_echo_glyph_records_timestamp ON echo_glyph_records(timestamp);
