ALTER TABLE forum_thread_likes DROP CONSTRAINT IF EXISTS forum_thread_likes_user_id_fkey;
ALTER TABLE forum_reply_likes DROP CONSTRAINT IF EXISTS forum_reply_likes_user_id_fkey;
