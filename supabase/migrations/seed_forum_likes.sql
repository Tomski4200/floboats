-- Seed likes for the forum threads and replies
-- I will need to get the user IDs, thread IDs, and reply IDs from the database to create these likes.
-- For now, I will use placeholders and then replace them with the actual IDs.

-- To get user IDs: SELECT id, username FROM profiles;
-- To get thread IDs: SELECT id, title FROM forum_threads;
-- To get reply IDs: SELECT id, content FROM forum_replies;

INSERT INTO forum_thread_likes (id, thread_id, user_id, created_at) VALUES
-- Likes for 'Winterizing a Yamaha 250 - Best Practices?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Winterizing a Yamaha 250 - Best Practices?'), (SELECT id FROM profiles WHERE username = 'SaltyDog'), '2025-01-10 11:05:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Winterizing a Yamaha 250 - Best Practices?'), (SELECT id FROM profiles WHERE username = 'TheMechanic'), '2025-01-10 12:35:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Winterizing a Yamaha 250 - Best Practices?'), (SELECT id FROM profiles WHERE username = 'DIYDiver'), '2025-01-11 09:05:00'),

-- Likes for 'Best sandbar spot in the Keys?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best sandbar spot in the Keys?'), (SELECT id FROM profiles WHERE username = 'AnchorDown'), '2025-01-15 15:05:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best sandbar spot in the Keys?'), (SELECT id FROM profiles WHERE username = 'IslandHopper'), '2025-01-15 16:35:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best sandbar spot in the Keys?'), (SELECT id FROM profiles WHERE username = 'ReefRunner'), '2025-01-16 10:05:00'),

-- Likes for 'First solo sail - a comedy of errors'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'First solo sail - a comedy of errors'), (SELECT id FROM profiles WHERE username = 'TheCaptain'), '2025-01-25 19:05:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'First solo sail - a comedy of errors'), (SELECT id FROM profiles WHERE username = 'SailorSue'), '2025-01-26 08:05:00'),

-- Likes for 'Fiberglass repair - what''s your go-to epoxy?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Fiberglass repair - what''s your go-to epoxy?'), (SELECT id FROM profiles WHERE username = 'GelcoatGenius'), '2025-02-05 12:05:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Fiberglass repair - what''s your go-to epoxy?'), (SELECT id FROM profiles WHERE username = 'TheWrench'), '2025-02-06 09:05:00');

INSERT INTO forum_reply_likes (id, reply_id, user_id, created_at) VALUES
-- Likes for replies in 'Winterizing a Yamaha 250 - Best Practices?'
(gen_random_uuid(), (SELECT id FROM forum_replies WHERE content = 'Good question. I always use Sta-Bil in the fuel, run it for a bit, then change the lower unit oil. Never had a problem.'), (SELECT id FROM profiles WHERE username = 'EngineGuru'), '2025-01-10 11:10:00'),
(gen_random_uuid(), (SELECT id FROM forum_replies WHERE content = 'Don''t forget to fog the engine!'), (SELECT id FROM profiles WHERE username = 'SaltyDog'), '2025-01-10 12:35:00'),

-- Likes for replies in 'Best sandbar spot in the Keys?'
(gen_random_uuid(), (SELECT id FROM forum_replies WHERE content = 'Matecumbe sandbar is always a good time.'), (SELECT id FROM profiles WHERE username = 'SaltyDog'), '2025-01-15 15:10:00'),
(gen_random_uuid(), (SELECT id FROM forum_replies WHERE content = 'Second Matecumbe. Also check out the Islamorada sandbar.'), (SELECT id FROM profiles WHERE username = 'AnchorDown'), '2025-01-15 16:35:00'),

-- Likes for replies in 'First solo sail - a comedy of errors'
(gen_random_uuid(), (SELECT id FROM forum_replies WHERE content = 'We''ve all been there. The most important thing is to stay calm and think through the problem.'), (SELECT id FROM profiles WHERE username = 'SailorSue'), '2025-01-25 19:10:00'),

-- Likes for replies in 'Fiberglass repair - what''s your go-to epoxy?'
(gen_random_uuid(), (SELECT id FROM forum_replies WHERE content = 'West System is the gold standard for a reason. It''s a bit pricey, but it''s worth it.'), (SELECT id FROM profiles WHERE username = 'DIYDiver'), '2025-02-05 12:10:00');
