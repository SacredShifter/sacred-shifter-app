ALTER TABLE social_posts
ADD COLUMN circle_id TEXT REFERENCES social_circles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_circle_id ON social_posts(circle_id);
