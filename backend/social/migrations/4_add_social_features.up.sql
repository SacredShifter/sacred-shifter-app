-- Add following/followers functionality
CREATE TABLE IF NOT EXISTS social_follows (
  follower_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Add notifications system
CREATE TABLE IF NOT EXISTS social_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'post_share')),
  actor_id TEXT REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  target_id TEXT, -- post_id, comment_id, etc.
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment threading support
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES social_comments(id) ON DELETE CASCADE;
ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;

-- Add post sharing functionality
CREATE TABLE IF NOT EXISTS social_post_shares (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES social_profiles(user_id) ON DELETE CASCADE,
  content TEXT, -- Optional comment when sharing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Add user profile enhancements
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS spiritual_path TEXT;
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'master'));
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add post enhancements
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS feeling TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_follows_follower ON social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following ON social_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user_unread ON social_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notifications_type ON social_notifications(type);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent ON social_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_depth ON social_comments(depth);
CREATE INDEX IF NOT EXISTS idx_social_post_shares_post ON social_post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_shares_user ON social_post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_tags ON social_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_social_posts_pinned ON social_posts(is_pinned, created_at DESC);

-- Update trigger functions for new features
CREATE OR REPLACE FUNCTION update_social_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Handle follows
    IF TG_TABLE_NAME = 'social_follows' THEN
      UPDATE social_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
      UPDATE social_profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;
      
      -- Create notification
      INSERT INTO social_notifications (user_id, type, actor_id, created_at)
      VALUES (NEW.following_id, 'follow', NEW.follower_id, NOW());
    END IF;
    
    -- Handle post reactions
    IF TG_TABLE_NAME = 'social_post_reactions' THEN
      IF NEW.kind = 'like' THEN
        UPDATE social_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        
        -- Create notification (only for likes, not other reactions to avoid spam)
        INSERT INTO social_notifications (user_id, type, actor_id, target_id, created_at)
        SELECT author_id, 'like', NEW.user_id, NEW.post_id, NOW()
        FROM social_posts 
        WHERE id = NEW.post_id AND author_id != NEW.user_id;
      END IF;
    END IF;
    
    -- Handle comments
    IF TG_TABLE_NAME = 'social_comments' THEN
      UPDATE social_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
      
      -- Create notification
      INSERT INTO social_notifications (user_id, type, actor_id, target_id, content, created_at)
      SELECT author_id, 'comment', NEW.author_id, NEW.post_id, LEFT(NEW.content, 100), NOW()
      FROM social_posts 
      WHERE id = NEW.post_id AND author_id != NEW.author_id;
    END IF;
    
    -- Handle post shares
    IF TG_TABLE_NAME = 'social_post_shares' THEN
      UPDATE social_posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
      
      -- Create notification
      INSERT INTO social_notifications (user_id, type, actor_id, target_id, content, created_at)
      SELECT author_id, 'post_share', NEW.user_id, NEW.post_id, NEW.content, NOW()
      FROM social_posts 
      WHERE id = NEW.post_id AND author_id != NEW.user_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Handle unfollows
    IF TG_TABLE_NAME = 'social_follows' THEN
      UPDATE social_profiles SET following_count = following_count - 1 WHERE user_id = OLD.follower_id;
      UPDATE social_profiles SET follower_count = follower_count - 1 WHERE user_id = OLD.following_id;
    END IF;
    
    -- Handle post reaction removal
    IF TG_TABLE_NAME = 'social_post_reactions' THEN
      IF OLD.kind = 'like' THEN
        UPDATE social_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
      END IF;
    END IF;
    
    -- Handle comment deletion
    IF TG_TABLE_NAME = 'social_comments' THEN
      UPDATE social_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;
    
    -- Handle post share removal
    IF TG_TABLE_NAME = 'social_post_shares' THEN
      UPDATE social_posts SET share_count = share_count - 1 WHERE id = OLD.post_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the new tables
DROP TRIGGER IF EXISTS trigger_update_social_follows ON social_follows;
CREATE TRIGGER trigger_update_social_follows
  AFTER INSERT OR DELETE ON social_follows
  FOR EACH ROW EXECUTE FUNCTION update_social_counts();

DROP TRIGGER IF EXISTS trigger_update_social_post_shares ON social_post_shares;
CREATE TRIGGER trigger_update_social_post_shares
  AFTER INSERT OR DELETE ON social_post_shares
  FOR EACH ROW EXECUTE FUNCTION update_social_counts();

-- Update existing triggers
DROP TRIGGER IF EXISTS trigger_update_reaction_count ON social_post_reactions;
CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT OR DELETE ON social_post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_social_counts();

DROP TRIGGER IF EXISTS trigger_update_comment_count ON social_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON social_comments
  FOR EACH ROW EXECUTE FUNCTION update_social_counts();

-- Insert sample data for enhanced profiles
UPDATE social_profiles SET 
  bio = CASE user_id
    WHEN '00000000-0000-0000-0000-000000000000' THEN 'Consciousness explorer and spiritual seeker on the path of transformation. Bridging ancient wisdom with modern understanding.'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'Quantum mystic exploring the intersection of science and spirituality. PhD in Physics, student of consciousness.'
    WHEN '00000000-0000-0000-0000-000000000003' THEN 'Dream weaver and lucid dreaming practitioner. Exploring the astral realms and collective unconscious.'
    WHEN '00000000-0000-0000-0000-000000000004' THEN 'Light worker and energy healer. Working with sacred geometry and crystalline frequencies.'
    WHEN '00000000-0000-0000-0000-000000000005' THEN 'Sound healing practitioner and vibrational medicine researcher. Frequency is everything.'
    ELSE bio
  END,
  interests = CASE user_id
    WHEN '00000000-0000-0000-0000-000000000000' THEN ARRAY['meditation', 'consciousness', 'spirituality', 'transformation']
    WHEN '00000000-0000-0000-0000-000000000002' THEN ARRAY['quantum physics', 'consciousness', 'science', 'mysticism']
    WHEN '00000000-0000-0000-0000-000000000003' THEN ARRAY['dreams', 'lucid dreaming', 'astral projection', 'jung']
    WHEN '00000000-0000-0000-0000-000000000004' THEN ARRAY['sacred geometry', 'light work', 'energy healing', 'crystals']
    WHEN '00000000-0000-0000-0000-000000000005' THEN ARRAY['sound healing', 'frequencies', 'vibrational medicine', 'music']
    ELSE interests
  END,
  spiritual_path = CASE user_id
    WHEN '00000000-0000-0000-0000-000000000000' THEN 'Non-dual Awareness'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'Scientific Mysticism'
    WHEN '00000000-0000-0000-0000-000000000003' THEN 'Dream Yoga'
    WHEN '00000000-0000-0000-0000-000000000004' THEN 'Light Body Activation'
    WHEN '00000000-0000-0000-0000-000000000005' THEN 'Sound Current Meditation'
    ELSE spiritual_path
  END,
  experience_level = CASE user_id
    WHEN '00000000-0000-0000-0000-000000000000' THEN 'intermediate'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'advanced'
    WHEN '00000000-0000-0000-0000-000000000003' THEN 'advanced'
    WHEN '00000000-0000-0000-0000-000000000004' THEN 'intermediate'
    WHEN '00000000-0000-0000-0000-000000000005' THEN 'advanced'
    ELSE experience_level
  END;

-- Add some sample follows
INSERT INTO social_follows (follower_id, following_id) VALUES
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Add some sample reactions to existing posts
INSERT INTO social_post_reactions (user_id, post_id, kind) 
SELECT 
  '00000000-0000-0000-0000-000000000002' as user_id,
  id as post_id,
  'like' as kind
FROM social_posts 
WHERE author_id = '00000000-0000-0000-0000-000000000000'
LIMIT 2
ON CONFLICT DO NOTHING;

INSERT INTO social_post_reactions (user_id, post_id, kind) 
SELECT 
  '00000000-0000-0000-0000-000000000003' as user_id,
  id as post_id,
  'insight' as kind
FROM social_posts 
WHERE author_id = '00000000-0000-0000-0000-000000000002'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add some threaded comments
INSERT INTO social_comments (post_id, author_id, content, parent_id, depth)
SELECT 
  p.id as post_id,
  '00000000-0000-0000-0000-000000000002' as author_id,
  'This resonates deeply with my own quantum consciousness research. The observer effect is indeed fundamental to reality creation.' as content,
  c.id as parent_id,
  1 as depth
FROM social_posts p
JOIN social_comments c ON c.post_id = p.id
WHERE p.author_id = '00000000-0000-0000-0000-000000000000'
AND c.depth = 0
LIMIT 1;

-- Update post counts to reflect the new data
UPDATE social_profiles SET 
  follower_count = (SELECT COUNT(*) FROM social_follows WHERE following_id = social_profiles.user_id),
  following_count = (SELECT COUNT(*) FROM social_follows WHERE follower_id = social_profiles.user_id),
  post_count = (SELECT COUNT(*) FROM social_posts WHERE author_id = social_profiles.user_id);

UPDATE social_posts SET 
  like_count = (SELECT COUNT(*) FROM social_post_reactions WHERE post_id = social_posts.id AND kind = 'like'),
  comment_count = (SELECT COUNT(*) FROM social_comments WHERE post_id = social_posts.id),
  share_count = (SELECT COUNT(*) FROM social_post_shares WHERE post_id = social_posts.id);
