-- Add foreign key for author_id in forum_threads
ALTER TABLE public.forum_threads
ADD CONSTRAINT fk_forum_threads_author
FOREIGN KEY (author_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key for last_reply_by in forum_threads
ALTER TABLE public.forum_threads
ADD CONSTRAINT fk_forum_threads_last_reply_by
FOREIGN KEY (last_reply_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Add foreign key for author_id in forum_replies
ALTER TABLE public.forum_replies
ADD CONSTRAINT fk_forum_replies_author
FOREIGN KEY (author_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key for user_id in forum_thread_likes
ALTER TABLE public.forum_thread_likes
ADD CONSTRAINT fk_forum_thread_likes_user
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key for user_id in forum_reply_likes
ALTER TABLE public.forum_reply_likes
ADD CONSTRAINT fk_forum_reply_likes_user
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
