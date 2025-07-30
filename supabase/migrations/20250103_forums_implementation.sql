-- Forums Implementation for FloBoats
-- Reddit-style forum with reputation system

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS forum_thread_likes CASCADE;
DROP TABLE IF EXISTS forum_reply_likes CASCADE;
DROP TABLE IF EXISTS forum_replies CASCADE;
DROP TABLE IF EXISTS forum_thread_tags CASCADE;
DROP TABLE IF EXISTS forum_threads CASCADE;
DROP TABLE IF EXISTS forum_tags CASCADE;
DROP TABLE IF EXISTS forum_categories CASCADE;

-- Create forum categories table
CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon class
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create forum tags table
CREATE TABLE forum_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create forum threads table
CREATE TABLE forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL,
    content TEXT NOT NULL,
    thread_type VARCHAR(20) DEFAULT 'discussion' CHECK (thread_type IN ('question', 'discussion', 'announcement', 'poll')),
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ DEFAULT now(),
    last_reply_by UUID REFERENCES auth.users(id),
    
    -- Moderation
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    report_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ,
    
    UNIQUE(category_id, slug)
);

-- Create forum replies table
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE, -- for nested replies
    content TEXT NOT NULL,
    
    -- Stats
    like_count INTEGER DEFAULT 0,
    
    -- Moderation
    is_hidden BOOLEAN DEFAULT false,
    report_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ
);

-- Create thread tags junction table
CREATE TABLE forum_thread_tags (
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES forum_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (thread_id, tag_id)
);

-- Create thread likes table
CREATE TABLE forum_thread_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(thread_id, user_id)
);

-- Create reply likes table
CREATE TABLE forum_reply_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reply_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX idx_forum_threads_created ON forum_threads(created_at DESC);
CREATE INDEX idx_forum_threads_last_reply ON forum_threads(last_reply_at DESC);
CREATE INDEX idx_forum_threads_slug ON forum_threads(slug);

CREATE INDEX idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX idx_forum_replies_parent ON forum_replies(parent_reply_id);
CREATE INDEX idx_forum_replies_created ON forum_replies(created_at);

CREATE INDEX idx_forum_thread_likes_thread ON forum_thread_likes(thread_id);
CREATE INDEX idx_forum_thread_likes_user ON forum_thread_likes(user_id);

CREATE INDEX idx_forum_reply_likes_reply ON forum_reply_likes(reply_id);
CREATE INDEX idx_forum_reply_likes_user ON forum_reply_likes(user_id);

-- Enable RLS
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_thread_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Everyone can read
CREATE POLICY "Anyone can view forum categories" ON forum_categories
    FOR SELECT USING (is_active = true);

-- Tags: Everyone can read
CREATE POLICY "Anyone can view forum tags" ON forum_tags
    FOR SELECT USING (true);

-- Threads: Read public, write authenticated
CREATE POLICY "Anyone can view public threads" ON forum_threads
    FOR SELECT USING (is_hidden = false);

CREATE POLICY "Authenticated users can create threads" ON forum_threads
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own threads" ON forum_threads
    FOR UPDATE USING (auth.uid() = author_id AND is_locked = false);

-- Replies: Read public, write authenticated
CREATE POLICY "Anyone can view public replies" ON forum_replies
    FOR SELECT USING (is_hidden = false);

CREATE POLICY "Authenticated users can create replies" ON forum_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own replies" ON forum_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- Thread tags: Everyone can read
CREATE POLICY "Anyone can view thread tags" ON forum_thread_tags
    FOR SELECT USING (true);

CREATE POLICY "Thread authors can manage tags" ON forum_thread_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM forum_threads 
            WHERE id = thread_id AND author_id = auth.uid()
        )
    );

-- Likes: Anyone can view, authenticated can manage their own
CREATE POLICY "Anyone can view thread likes" ON forum_thread_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own thread likes" ON forum_thread_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reply likes" ON forum_reply_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reply likes" ON forum_reply_likes
    FOR ALL USING (auth.uid() = user_id);

-- Functions for reputation points

-- Function to calculate and update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER := 0;
    thread_points INTEGER := 0;
    reply_points INTEGER := 0;
    like_points INTEGER := 0;
BEGIN
    -- Points for threads created (1 point per thread)
    SELECT COUNT(*) INTO thread_points
    FROM forum_threads
    WHERE author_id = user_id_param AND is_hidden = false;
    
    -- Points for replies (1 point per reply)
    SELECT COUNT(*) INTO reply_points
    FROM forum_replies
    WHERE author_id = user_id_param AND is_hidden = false;
    
    -- Points for likes received on threads (2 points per like)
    SELECT COUNT(*) * 2 INTO like_points
    FROM forum_thread_likes tl
    JOIN forum_threads t ON tl.thread_id = t.id
    WHERE t.author_id = user_id_param;
    
    -- Points for likes received on replies (1 point per like)
    SELECT COUNT(*) + like_points INTO like_points
    FROM forum_reply_likes rl
    JOIN forum_replies r ON rl.reply_id = r.id
    WHERE r.author_id = user_id_param;
    
    -- Bonus points for threads with 5+ replies (5 points per thread)
    SELECT COUNT(*) * 5 + thread_points INTO thread_points
    FROM forum_threads
    WHERE author_id = user_id_param 
    AND is_hidden = false 
    AND reply_count >= 5;
    
    total_points := thread_points + reply_points + like_points;
    
    -- Update the user's reputation score in profiles
    UPDATE profiles
    SET reputation_score = total_points
    WHERE id = user_id_param;
    
    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update counts and reputation

-- Update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads 
        SET 
            reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_by = NEW.author_id
        WHERE id = NEW.thread_id;
        
        -- Update author reputation
        PERFORM update_user_reputation(NEW.author_id);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads 
        SET reply_count = reply_count - 1
        WHERE id = OLD.thread_id;
        
        -- Update author reputation
        PERFORM update_user_reputation(OLD.author_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_reply_count_trigger
AFTER INSERT OR DELETE ON forum_replies
FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- Update thread like count
CREATE OR REPLACE FUNCTION update_thread_like_count()
RETURNS TRIGGER AS $$
DECLARE
    thread_author UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads 
        SET like_count = like_count + 1
        WHERE id = NEW.thread_id
        RETURNING author_id INTO thread_author;
        
        -- Update author reputation
        PERFORM update_user_reputation(thread_author);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads 
        SET like_count = like_count - 1
        WHERE id = OLD.thread_id
        RETURNING author_id INTO thread_author;
        
        -- Update author reputation
        PERFORM update_user_reputation(thread_author);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_like_count_trigger
AFTER INSERT OR DELETE ON forum_thread_likes
FOR EACH ROW EXECUTE FUNCTION update_thread_like_count();

-- Update reply like count
CREATE OR REPLACE FUNCTION update_reply_like_count()
RETURNS TRIGGER AS $$
DECLARE
    reply_author UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_replies 
        SET like_count = like_count + 1
        WHERE id = NEW.reply_id
        RETURNING author_id INTO reply_author;
        
        -- Update author reputation
        PERFORM update_user_reputation(reply_author);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_replies 
        SET like_count = like_count - 1
        WHERE id = OLD.reply_id
        RETURNING author_id INTO reply_author;
        
        -- Update author reputation
        PERFORM update_user_reputation(reply_author);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reply_like_count_trigger
AFTER INSERT OR DELETE ON forum_reply_likes
FOR EACH ROW EXECUTE FUNCTION update_reply_like_count();

-- Update thread timestamp on edit
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF OLD.content != NEW.content OR OLD.title != NEW.title THEN
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_timestamp_trigger
BEFORE UPDATE ON forum_threads
FOR EACH ROW EXECUTE FUNCTION update_thread_timestamp();

-- Update reply timestamp on edit
CREATE OR REPLACE FUNCTION update_reply_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF OLD.content != NEW.content THEN
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reply_timestamp_trigger
BEFORE UPDATE ON forum_replies
FOR EACH ROW EXECUTE FUNCTION update_reply_timestamp();

-- Generate slug for threads
CREATE OR REPLACE FUNCTION generate_thread_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from title
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Limit length
    IF length(base_slug) > 100 THEN
        base_slug := substring(base_slug from 1 for 100);
        base_slug := trim(both '-' from base_slug);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for duplicates and add counter if needed
    WHILE EXISTS (
        SELECT 1 FROM forum_threads 
        WHERE slug = final_slug 
        AND category_id = NEW.category_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_thread_slug_trigger
BEFORE INSERT OR UPDATE OF title ON forum_threads
FOR EACH ROW EXECUTE FUNCTION generate_thread_slug();

-- Views for easier querying

-- Thread list view with author info
CREATE OR REPLACE VIEW forum_threads_with_author AS
SELECT 
    t.*,
    p.username as author_username,
    p.avatar_url as author_avatar,
    COALESCE(CONCAT(p.first_name, ' ', p.last_name), p.username) as author_name,
    lp.username as last_reply_username,
    COALESCE(CONCAT(lp.first_name, ' ', lp.last_name), lp.username) as last_reply_name
FROM forum_threads t
JOIN profiles p ON t.author_id = p.id
LEFT JOIN profiles lp ON t.last_reply_by = lp.id;

-- Reply view with author info
CREATE OR REPLACE VIEW forum_replies_with_author AS
SELECT 
    r.*,
    p.username as author_username,
    p.avatar_url as author_avatar,
    COALESCE(CONCAT(p.first_name, ' ', p.last_name), p.username) as author_name,
    p.reputation_score as author_reputation
FROM forum_replies r
JOIN profiles p ON r.author_id = p.id;

-- User forum activity view (for profile transparency)
CREATE OR REPLACE VIEW user_forum_activity AS
SELECT 
    'thread' as activity_type,
    t.id as item_id,
    t.title as title,
    t.slug as slug,
    t.category_id,
    c.name as category_name,
    c.slug as category_slug,
    t.created_at,
    t.author_id as user_id
FROM forum_threads t
JOIN forum_categories c ON t.category_id = c.id
WHERE t.is_hidden = false

UNION ALL

SELECT 
    'reply' as activity_type,
    r.id as item_id,
    t.title as title,
    t.slug as slug,
    t.category_id,
    c.name as category_name,
    c.slug as category_slug,
    r.created_at,
    r.author_id as user_id
FROM forum_replies r
JOIN forum_threads t ON r.thread_id = t.id
JOIN forum_categories c ON t.category_id = c.id
WHERE r.is_hidden = false AND t.is_hidden = false;

-- Grant permissions on views
GRANT SELECT ON forum_threads_with_author TO authenticated, anon;
GRANT SELECT ON forum_replies_with_author TO authenticated, anon;
GRANT SELECT ON user_forum_activity TO authenticated, anon;

-- Insert default categories
INSERT INTO forum_categories (name, slug, description, icon, sort_order) VALUES
    ('General Discussion', 'general', 'General boating topics and community chat', '💬', 1),
    ('Technical & Maintenance', 'technical', 'Engine, hull, electronics, and maintenance discussions', '🔧', 2),
    ('Buying & Selling Advice', 'marketplace', 'Tips and advice for buying or selling boats', '💰', 3),
    ('Sailing', 'sailing', 'All things sailing - techniques, destinations, and experiences', '⛵', 4),
    ('Power Boats', 'powerboats', 'Discussions about motor boats and yachts', '🚤', 5),
    ('Fishing', 'fishing', 'Fishing techniques, spots, and equipment', '🎣', 6),
    ('Destinations & Cruising', 'destinations', 'Share and discover boating destinations', '🗺️', 7),
    ('Safety & Regulations', 'safety', 'Safety equipment, procedures, and maritime law', '⚠️', 8),
    ('Events & Meetups', 'events', 'Organize and discuss boating events', '📅', 9),
    ('New Members', 'newbies', 'Welcome new members and beginner questions', '👋', 10);

-- Insert some starter tags
INSERT INTO forum_tags (name, slug) VALUES
    ('maintenance', 'maintenance'),
    ('engine', 'engine'),
    ('electronics', 'electronics'),
    ('safety', 'safety'),
    ('buying-advice', 'buying-advice'),
    ('selling-advice', 'selling-advice'),
    ('destinations', 'destinations'),
    ('weather', 'weather'),
    ('regulations', 'regulations'),
    ('diy', 'diy'),
    ('reviews', 'reviews'),
    ('troubleshooting', 'troubleshooting');