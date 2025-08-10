-- Users table for social network profiles
CREATE TABLE social_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE social_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  reply_to_id TEXT REFERENCES social_posts(id) ON DELETE SET NULL,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE social_follows (
  follower_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Reactions table
CREATE TABLE social_post_reactions (
  user_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id, kind)
);

-- Comments table
CREATE TABLE social_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  reply_to_id TEXT REFERENCES social_comments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circles table
CREATE TABLE social_circles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle members table
CREATE TABLE social_circle_members (
  circle_id TEXT NOT NULL REFERENCES social_circles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (circle_id, user_id)
);

-- Notifications table
CREATE TABLE social_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'message')),
  actor_id TEXT REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  target_id TEXT, -- post_id, comment_id, etc.
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_social_posts_author ON social_posts(author_id, created_at DESC);
CREATE INDEX idx_social_posts_visibility ON social_posts(visibility, created_at DESC);
CREATE INDEX idx_social_follows_follower ON social_follows(follower_id);
CREATE INDEX idx_social_follows_following ON social_follows(following_id);
CREATE INDEX idx_social_post_reactions_post ON social_post_reactions(post_id);
CREATE INDEX idx_social_comments_post ON social_comments(post_id, created_at);
CREATE INDEX idx_social_notifications_user ON social_notifications(user_id, created_at DESC);

-- Triggers for updating counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'social_post_reactions' AND NEW.kind = 'like' THEN
      UPDATE social_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'social_comments' THEN
      UPDATE social_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'social_post_reactions' AND OLD.kind = 'like' THEN
      UPDATE social_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'social_comments' THEN
      UPDATE social_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT OR DELETE ON social_post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON social_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Trigger for updating follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    UPDATE social_profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_profiles SET following_count = following_count - 1 WHERE user_id = OLD.follower_id;
    UPDATE social_profiles SET follower_count = follower_count - 1 WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON social_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Insert default profile for Sacred Seeker
INSERT INTO social_profiles (user_id, username, display_name, bio, location)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'sacred_seeker',
  'Sacred Seeker',
  'Consciousness explorer and spiritual seeker on the path of transformation.',
  'The Quantum Field'
);

-- Insert some sample users
INSERT INTO social_profiles (user_id, username, display_name, bio, location) VALUES
('00000000-0000-0000-0000-000000000002', 'quantum_mystic', 'Quantum Mystic', 'Bridging science and spirituality through quantum consciousness.', 'Everywhere & Nowhere'),
('00000000-0000-0000-0000-000000000003', 'dream_weaver', 'Dream Weaver', 'Lucid dreaming practitioner and dream interpreter.', 'The Astral Plane'),
('00000000-0000-0000-0000-000000000004', 'light_worker', 'Light Worker', 'Healing with light frequencies and sacred geometry.', 'Fifth Dimension'),
('00000000-0000-0000-0000-000000000005', 'frequency_healer', 'Frequency Healer', 'Sound healing and vibrational medicine practitioner.', 'Resonance Field');

-- Insert some sample posts
INSERT INTO social_posts (author_id, content, visibility) VALUES
('00000000-0000-0000-0000-000000000000', 'Just had an incredible meditation session with the new quantum frequencies. The resonance was off the charts! 🌟 #meditation #quantum #consciousness', 'public'),
('00000000-0000-0000-0000-000000000002', 'Synchronicity alert: Saw 11:11, 2:22, and 3:33 all in the same day. The universe is definitely speaking! What patterns are you noticing? #synchronicity #awakening', 'public'),
('00000000-0000-0000-0000-000000000003', 'Last night''s lucid dream was incredible. I was able to maintain awareness for over 20 minutes and explore the astral realm. Anyone else working on dream consciousness? #luciddreaming #astral', 'public'),
('00000000-0000-0000-0000-000000000004', 'Working with sacred geometry today. The flower of life pattern is revealing new layers of understanding about the mathematical nature of reality. #sacredgeometry #mathematics #consciousness', 'public'),
('00000000-0000-0000-0000-000000000005', 'Sound healing session this morning was transformative. The 528Hz frequency really opened up the heart chakra. Feeling so much love and gratitude! #soundhealing #frequencies #heartchakra', 'public');

-- Insert some sample circles
INSERT INTO social_circles (name, description, owner_id, is_public) VALUES
('Quantum Consciousness', 'Exploring the intersection of quantum physics and consciousness', '00000000-0000-0000-0000-000000000002', TRUE),
('Dream Explorers', 'Lucid dreaming and dream work community', '00000000-0000-0000-0000-000000000003', TRUE),
('Sacred Geometry', 'Mathematical patterns in spiritual practice', '00000000-0000-0000-0000-000000000004', TRUE),
('Frequency Healers', 'Sound healing and vibrational medicine', '00000000-0000-0000-0000-000000000005', TRUE);

-- Add members to circles
INSERT INTO social_circle_members (circle_id, user_id, role) VALUES
((SELECT id FROM social_circles WHERE name = 'Quantum Consciousness'), '00000000-0000-0000-0000-000000000002', 'owner'),
((SELECT id FROM social_circles WHERE name = 'Quantum Consciousness'), '00000000-0000-0000-0000-000000000000', 'member'),
((SELECT id FROM social_circles WHERE name = 'Dream Explorers'), '00000000-0000-0000-0000-000000000003', 'owner'),
((SELECT id FROM social_circles WHERE name = 'Dream Explorers'), '00000000-0000-0000-0000-000000000000', 'member'),
((SELECT id FROM social_circles WHERE name = 'Sacred Geometry'), '00000000-0000-0000-0000-000000000004', 'owner'),
((SELECT id FROM social_circles WHERE name = 'Frequency Healers'), '00000000-0000-0000-0000-000000000005', 'owner');

-- Update circle member counts
UPDATE social_circles SET member_count = (
  SELECT COUNT(*) FROM social_circle_members WHERE circle_id = social_circles.id
);
