-- Seed replies for the forum threads
-- I will need to get the user IDs and thread IDs from the database to create these replies.
-- For now, I will use placeholders and then replace them with the actual IDs.

-- To get user IDs: SELECT id, username FROM profiles;
-- To get thread IDs: SELECT id, title FROM forum_threads;

INSERT INTO forum_replies (id, thread_id, author_id, content, created_at) VALUES
-- Replies for 'Winterizing a Yamaha 250 - Best Practices?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Winterizing a Yamaha 250 - Best Practices?'), (SELECT id FROM profiles WHERE username = 'SaltyDog'), 'Good question. I always use Sta-Bil in the fuel, run it for a bit, then change the lower unit oil. Never had a problem.', '2025-01-10 11:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Winterizing a Yamaha 250 - Best Practices?'), (SELECT id FROM profiles WHERE username = 'TheMechanic'), 'Don''t forget to fog the engine!', '2025-01-10 12:30:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Winterizing a Yamaha 250 - Best Practices?'), (SELECT id FROM profiles WHERE username = 'EngineGuru'), 'Thanks for the tips, guys. I''ll be sure to do all of that.', '2025-01-11 09:00:00'),

-- Replies for 'Best sandbar spot in the Keys?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best sandbar spot in the Keys?'), (SELECT id FROM profiles WHERE username = 'AnchorDown'), 'Matecumbe sandbar is always a good time.', '2025-01-15 15:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best sandbar spot in the Keys?'), (SELECT id FROM profiles WHERE username = 'IslandHopper'), 'Second Matecumbe. Also check out the Islamorada sandbar.', '2025-01-15 16:30:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best sandbar spot in the Keys?'), (SELECT id FROM profiles WHERE username = 'SaltyDog'), 'Thanks for the suggestions! I''ll check them out.', '2025-01-16 10:00:00'),

-- Replies for 'First solo sail - a comedy of errors'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'First solo sail - a comedy of errors'), (SELECT id FROM profiles WHERE username = 'TheCaptain'), 'We''ve all been there. The most important thing is to stay calm and think through the problem.', '2025-01-25 19:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'First solo sail - a comedy of errors'), (SELECT id FROM profiles WHERE username = 'SailorSue'), 'Thanks, Captain. I''ll try to remember that next time!', '2025-01-26 08:00:00'),

-- Replies for 'Fiberglass repair - what''s your go-to epoxy?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Fiberglass repair - what''s your go-to epoxy?'), (SELECT id FROM profiles WHERE username = 'GelcoatGenius'), 'West System is the gold standard for a reason. It''s a bit pricey, but it''s worth it.', '2025-02-05 12:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Fiberglass repair - what''s your go-to epoxy?'), (SELECT id FROM profiles WHERE username = 'DIYDiver'), 'Thanks! I''ll pick some up this weekend.', '2025-02-06 09:00:00'),

-- Replies for 'Best speakers for a pontoon boat?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best speakers for a pontoon boat?'), (SELECT id FROM profiles WHERE username = 'WakeMaker'), 'JL Audio all the way. They''re expensive, but you get what you pay for.', '2025-02-18 21:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best speakers for a pontoon boat?'), (SELECT id FROM profiles WHERE username = 'PontoonParty'), 'Thanks! I''ll check them out.', '2025-02-19 10:00:00'),

-- Replies for 'Prop pitch question'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Prop pitch question'), (SELECT id FROM profiles WHERE username = 'EngineGuru'), 'If you''re only getting 5500rpm at WOT, you''re definitely over-propped. I''d try a 17p before jumping all the way to a 21p.', '2025-03-05 20:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Prop pitch question'), (SELECT id FROM profiles WHERE username = 'PropellerHead'), 'Good call. I''ll give that a shot.', '2025-03-06 09:00:00'),

-- Replies for 'Docking in a crosswind - HELP!'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Docking in a crosswind - HELP!'), (SELECT id FROM profiles WHERE username = 'SaltyDog'), 'Use the wind to your advantage. Approach the dock from downwind and let the wind push you in.', '2025-03-12 18:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Docking in a crosswind - HELP!'), (SELECT id FROM profiles WHERE username = 'NewbieNavigator'), 'That makes sense. I''ll try that next time. Thanks!', '2025-03-13 10:00:00'),

-- Replies for 'Best bait for tarpon?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best bait for tarpon?'), (SELECT id FROM profiles WHERE username = 'FishinFrank'), 'Live mullet, hands down.', '2025-03-18 16:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Best bait for tarpon?'), (SELECT id FROM profiles WHERE username = 'ReelDeal'), 'I''ve had a lot of luck with live crabs, especially around the bridges.', '2025-03-18 17:00:00'),

-- Replies for 'What''s a realistic budget for a full-time cruiser?'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'What''s a realistic budget for a full-time cruiser?'), (SELECT id FROM profiles WHERE username = 'liveaboard_life'), 'It really depends on your lifestyle, but a good starting point is $2,000/month for a couple.', '2025-03-25 12:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'What''s a realistic budget for a full-time cruiser?'), (SELECT id FROM profiles WHERE username = 'SailAway'), 'Thanks! That''s helpful.', '2025-03-26 09:00:00'),

-- Replies for 'Red flags to look for when buying a used boat'
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Red flags to look for when buying a used boat'), (SELECT id FROM profiles WHERE username = 'BoatBrokerBen'), 'Great list. I''d also add a seller who is hesitant to let you do a sea trial.', '2025-03-30 11:00:00'),
(gen_random_uuid(), (SELECT id FROM forum_threads WHERE title = 'Red flags to look for when buying a used boat'), (SELECT id FROM profiles WHERE username = 'TheSurveyor'), 'Good one. A sea trial is a must.', '2025-03-31 09:00:00');
