-- Seed some example codex entries
INSERT INTO resonant_codex_entries (
  mode, title, content, entry_type, tags, resonance_rating, resonance_signature, resonance_channels, occurred_at, visibility, created_at
) VALUES
(
  'codex',
  'Sacred Geometry Meditation Insights',
  '{"body": "During today''s meditation on the Flower of Life pattern, I experienced a profound sense of interconnectedness. The geometric forms seemed to pulse with living energy, revealing the mathematical foundation underlying all creation.", "highlights": ["interconnectedness", "mathematical foundation"], "attachments": [], "metrics": {"duration_sec": 1800}, "prompts": ["What patterns am I noticing in my spiritual practice?"], "links": []}',
  'insight',
  ARRAY['sacred geometry', 'meditation', 'interconnectedness'],
  NULL,
  NULL,
  NULL,
  NULL,
  'private',
  NOW() - INTERVAL '3 days'
),
(
  'register',
  'Triple Number Synchronicity - 333',
  '{"body": "Saw 333 on clock, receipt total, and license plate within 2 hours. Felt strong pull toward new creative project immediately after the third sighting.", "highlights": ["creative project", "strong pull"], "attachments": [], "metrics": {}, "prompts": [], "links": []}',
  'synchronicity',
  ARRAY['numbers', 'creativity', 'guidance', '333'],
  0.85,
  'Sol-333:A3',
  ARRAY['vision', 'intuition'],
  NOW() - INTERVAL '2 days',
  'private',
  NOW() - INTERVAL '2 days'
),
(
  'codex',
  'Breathwork Practice Evolution',
  '{"body": "My daily breathwork practice has evolved significantly over the past month. Starting with simple 4-7-8 breathing, I''ve now incorporated Wim Hof techniques and pranayama. The combination creates a powerful state of expanded awareness.", "highlights": ["expanded awareness", "combination"], "attachments": [], "metrics": {"breath": "4-7-8, Wim Hof", "duration_sec": 1200}, "prompts": ["How has my practice changed?", "What new techniques am I drawn to?"], "links": []}',
  'practice',
  ARRAY['breathwork', 'pranayama', 'awareness'],
  NULL,
  NULL,
  NULL,
  NULL,
  'private',
  NOW() - INTERVAL '1 day'
),
(
  'register',
  'Meditation Vision - Golden Light',
  '{"body": "During morning meditation, experienced vivid vision of golden light emanating from heart center, expanding to encompass entire room. Felt profound sense of unity and love.", "highlights": ["golden light", "heart center", "unity"], "attachments": [], "metrics": {"duration_sec": 2400}, "prompts": [], "links": []}',
  'vision',
  ARRAY['light', 'heart chakra', 'expansion', 'unity'],
  0.95,
  'Aur-528:H7',
  ARRAY['vision', 'somatic', 'energy'],
  NOW() - INTERVAL '5 hours',
  'private',
  NOW() - INTERVAL '5 hours'
),
(
  'codex',
  'Dream Journal Patterns',
  '{"body": "Reviewing my dream journal from the past month, I notice recurring themes of flying, water, and ancient symbols. The flying dreams always occur during periods of creative breakthrough. Water dreams seem connected to emotional processing.", "highlights": ["recurring themes", "creative breakthrough", "emotional processing"], "attachments": [], "metrics": {}, "prompts": ["What patterns emerge in my dreams?", "How do dreams connect to waking life?"], "links": []}',
  'analysis',
  ARRAY['dreams', 'patterns', 'symbols', 'creativity'],
  NULL,
  NULL,
  NULL,
  NULL,
  'private',
  NOW() - INTERVAL '6 hours'
);

-- Add some AI summaries and labels
UPDATE resonant_codex_entries SET
  ai_summary = 'Meditation on sacred geometry reveals interconnectedness and mathematical foundations of reality.',
  ai_labels = ARRAY['sacred_geometry', 'meditation', 'interconnectedness', 'mathematics']
WHERE title = 'Sacred Geometry Meditation Insights';

UPDATE resonant_codex_entries SET
  ai_summary = 'Synchronistic appearance of 333 triggers creative inspiration and guidance.',
  ai_labels = ARRAY['synchronicity', 'numbers', 'creativity', 'guidance', 'manifestation']
WHERE title = 'Triple Number Synchronicity - 333';

UPDATE resonant_codex_entries SET
  ai_summary = 'Evolution of breathwork practice combining multiple techniques for expanded awareness.',
  ai_labels = ARRAY['breathwork', 'practice_evolution', 'awareness', 'techniques']
WHERE title = 'Breathwork Practice Evolution';

UPDATE resonant_codex_entries SET
  ai_summary = 'Heart-centered meditation vision of golden light expanding into unity consciousness.',
  ai_labels = ARRAY['meditation_vision', 'heart_chakra', 'golden_light', 'unity_consciousness']
WHERE title = 'Meditation Vision - Golden Light';

UPDATE resonant_codex_entries SET
  ai_summary = 'Analysis of dream patterns reveals connections between symbols and life experiences.',
  ai_labels = ARRAY['dream_analysis', 'patterns', 'symbols', 'creativity', 'emotional_processing']
WHERE title = 'Dream Journal Patterns';
