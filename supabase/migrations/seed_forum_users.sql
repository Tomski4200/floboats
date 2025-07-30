-- Seed ~80 user profiles for the forums
-- Note: These are just profiles, not auth users. We will use their generated UUIDs.

INSERT INTO profiles (id, username, first_name, last_name, email, bio, location, phone, website, avatar_url, is_dealer, created_at) VALUES
-- Batch 1: More complete profiles
(gen_random_uuid(), 'SaltyDog', 'Dave', 'Jones', 'dave.jones@example.com', 'Retired Navy captain, been sailing the Keys for 40 years. If it floats, I''ve probably fixed it.', 'Key West, FL', '305-555-1234', 'https://saltydogcharters.com', 'https://i.pravatar.cc/150?u=SaltyDog', false, now() - interval '175 days'),
(gen_random_uuid(), 'MarinaMama', 'Isabella', 'Garcia', 'isabella.garcia@example.com', 'Marina manager in Fort Lauderdale. I''ve seen it all. Ask me anything about dock life.', 'Fort Lauderdale, FL', '954-555-5678', 'https://lauderdalemarinas.com', 'https://i.pravatar.cc/150?u=MarinaMama', false, now() - interval '160 days'),
(gen_random_uuid(), 'EngineGuru', 'Mike', 'Chen', 'mike.chen@example.com', 'Certified Mercury and Yamaha mechanic. If your outboard is sputtering, I''m your guy.', 'Tampa, FL', '813-555-8765', '', 'https://i.pravatar.cc/150?u=EngineGuru', false, now() - interval '155 days'),
(gen_random_uuid(), 'SailorSue', 'Susan', 'Miller', 'susan.miller@example.com', 'Just a girl and her Catalina 22. Learning the ropes and loving the journey.', 'Sarasota, FL', '', '', 'https://i.pravatar.cc/150?u=SailorSue', false, now() - interval '140 days'),
(gen_random_uuid(), 'FishinFrank', 'Frank', 'Rizzo', 'frank.rizzo@example.com', 'Weekend warrior on my 21-foot center console. Always chasing the next big catch.', 'Jacksonville, FL', '904-555-4321', '', 'https://i.pravatar.cc/150?u=FishinFrank', false, now() - interval '130 days'),
(gen_random_uuid(), 'YachtLife', 'Chad', 'Bradford', 'chad.bradford@example.com', 'Life''s better on a 60-foot Azimut. Summering in the Bahamas.', 'Palm Beach, FL', '', 'https://yachtlife.com', 'https://i.pravatar.cc/150?u=YachtLife', false, now() - interval '125 days'),
(gen_random_uuid(), 'DIYDiver', 'Kevin', 'Smith', 'kevin.smith@example.com', 'Restoring a classic 1978 Mako. More bondo than boat at this point.', 'St. Augustine, FL', '', '', 'https://i.pravatar.cc/150?u=DIYDiver', false, now() - interval '110 days'),
(gen_random_uuid(), 'PontoonParty', 'Brenda', 'Williams', 'brenda.williams@example.com', 'Lake life is the best life. Our pontoon is the neighborhood hotspot every weekend.', 'Orlando, FL', '', '', 'https://i.pravatar.cc/150?u=PontoonParty', false, now() - interval '100 days'),
(gen_random_uuid(), 'TheSurveyor', 'George', 'Costanza', 'george.costanza@example.com', 'Marine surveyor with 20 years of experience. I find the things sellers try to hide.', 'Miami, FL', '786-555-1122', 'https://floridamarinesurvey.com', 'https://i.pravatar.cc/150?u=TheSurveyor', false, now() - interval '95 days'),
(gen_random_uuid(), 'NewbieNavigator', 'Emily', 'Johnson', 'emily.johnson@example.com', 'Just bought our first family boat, a 24-foot bowrider. Terrified and excited!', 'Boca Raton, FL', '', '', 'https://i.pravatar.cc/150?u=NewbieNavigator', false, now() - interval '90 days'),

-- Batch 2: Less complete profiles, more casual users
(gen_random_uuid(), 'TackleBoxTom', 'Tom', '', 'tom@example.com', 'Fishing is life.', 'Panama City, FL', '', '', 'https://i.pravatar.cc/150?u=TackleBoxTom', false, now() - interval '85 days'),
(gen_random_uuid(), 'JustAddWater', 'Jessica', 'B', 'jessica.b@example.com', '', 'Naples, FL', '', '', 'https://i.pravatar.cc/150?u=JustAddWater', false, now() - interval '80 days'),
(gen_random_uuid(), 'ReelDeal', 'Marco', '', 'marco@example.com', 'Charter captain.', 'Destin, FL', '850-555-9999', '', 'https://i.pravatar.cc/150?u=ReelDeal', false, now() - interval '75 days'),
(gen_random_uuid(), 'KnotTyingPro', 'Alex', '', 'alex@example.com', '', 'Vero Beach, FL', '', '', 'https://i.pravatar.cc/150?u=KnotTyingPro', false, now() - interval '70 days'),
(gen_random_uuid(), 'WaveRider', 'Chris', 'P.', 'chris.p@example.com', 'Surfs up when the boat''s down.', 'Cocoa Beach, FL', '', '', 'https://i.pravatar.cc/150?u=WaveRider', false, now() - interval '65 days'),
(gen_random_uuid(), 'DockMasterDan', 'Dan', '', 'dan@example.com', 'I run the docks at Clearwater Marina.', 'Clearwater, FL', '', '', 'https://i.pravatar.cc/150?u=DockMasterDan', false, now() - interval '60 days'),
(gen_random_uuid(), 'SailAway', 'Maria', '', 'maria@example.com', 'Dreaming of a circumnavigation.', 'St. Petersburg, FL', '', 'https://sailaway.blog', 'https://i.pravatar.cc/150?u=SailAway', false, now() - interval '55 days'),
(gen_random_uuid(), 'BoatBrokerBen', 'Ben', 'Carter', 'ben.carter@example.com', 'I can get you a deal.', 'Fort Myers, FL', '239-555-0101', 'https://boatbrokerben.com', 'https://i.pravatar.cc/150?u=BoatBrokerBen', true, now() - interval '50 days'),
(gen_random_uuid(), 'IslandHopper', 'Jen', '', 'jen@example.com', 'Bahamas and back.', 'West Palm Beach, FL', '', '', 'https://i.pravatar.cc/150?u=IslandHopper', false, now() - interval '45 days'),
(gen_random_uuid(), 'TheMechanic', 'Carlos', 'R.', 'carlos.r@example.com', 'Mobile marine mechanic.', 'Kissimmee, FL', '321-555-2345', '', 'https://i.pravatar.cc/150?u=TheMechanic', false, now() - interval '40 days'),

-- Batch 3: Minimalist profiles
(gen_random_uuid(), 'user123', 'A', 'B', 'a.b@example.com', '', 'FL', '', '', 'https://i.pravatar.cc/150?u=user123', false, now() - interval '38 days'),
(gen_random_uuid(), 'boater_gal', 'Sarah', '', 'sarah@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=boater_gal', false, now() - interval '36 days'),
(gen_random_uuid(), 'floridafisher', 'Mike', '', 'mike@example.com', '', 'Florida', '', '', 'https://i.pravatar.cc/150?u=floridafisher', false, now() - interval '34 days'),
(gen_random_uuid(), 'saltylife', 'Derek', '', 'derek@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=saltylife', false, now() - interval '32 days'),
(gen_random_uuid(), 'catamaran_dreamer', 'Laura', '', 'laura@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=catamaran_dreamer', false, now() - interval '30 days'),
(gen_random_uuid(), 'go_fast_guy', 'Rich', '', 'rich@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=go_fast_guy', false, now() - interval '28 days'),
(gen_random_uuid(), 'trolling_pro', 'Kevin', '', 'kevin@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=trolling_pro', false, now() - interval '26 days'),
(gen_random_uuid(), 'liveaboard_life', 'Angela', '', 'angela@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=liveaboard_life', false, now() - interval '24 days'),
(gen_random_uuid(), 'weekend_sailor', 'Brian', '', 'brian@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=weekend_sailor', false, now() - interval '22 days'),
(gen_random_uuid(), 'first_mate_kate', 'Kate', '', 'kate@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=first_mate_kate', false, now() - interval '20 days'),

-- Batch 4
(gen_random_uuid(), 'CaptJack', 'Jack', 'Sparrow', 'jack.sparrow@example.com', 'Not the pirate.', 'Tortuga', '', '', 'https://i.pravatar.cc/150?u=CaptJack', false, now() - interval '19 days'),
(gen_random_uuid(), 'PropellerHead', 'Gary', 'V.', 'gary.v@example.com', 'Obsessed with prop pitch.', 'Gainesville, FL', '', '', 'https://i.pravatar.cc/150?u=PropellerHead', false, now() - interval '18 days'),
(gen_random_uuid(), 'AnchorDown', 'Beth', 'S.', 'beth.s@example.com', 'Love a good sandbar.', 'Islamorada, FL', '', '', 'https://i.pravatar.cc/150?u=AnchorDown', false, now() - interval '17 days'),
(gen_random_uuid(), 'RiggingMaster', 'Tom', 'Brady', 'tom.brady@example.com', 'No, not that one.', 'Newport, RI', '', '', 'https://i.pravatar.cc/150?u=RiggingMaster', false, now() - interval '16 days'),
(gen_random_uuid(), 'GelcoatGenius', 'Maria', 'Lopez', 'maria.lopez@example.com', 'I make old boats shine.', 'Hialeah, FL', '', '', 'https://i.pravatar.cc/150?u=GelcoatGenius', false, now() - interval '15 days'),
(gen_random_uuid(), 'TheWrench', 'Eddie', 'F.', 'eddie.f@example.com', 'If it''s broke, I can fix it.', 'Ocala, FL', '', '', 'https://i.pravatar.cc/150?u=TheWrench', false, now() - interval '14 days'),
(gen_random_uuid(), 'ChartPlotter', 'Susan', 'W.', 'susan.w@example.com', 'Navionics nerd.', 'Pompano Beach, FL', '', '', 'https://i.pravatar.cc/150?u=ChartPlotter', false, now() - interval '13 days'),
(gen_random_uuid(), 'KnotSoFast', 'Tim', 'Allen', 'tim.allen@example.com', 'Also not that one.', 'Fort Pierce, FL', '', '', 'https://i.pravatar.cc/150?u=KnotSoFast', false, now() - interval '12 days'),
(gen_random_uuid(), 'WakeMaker', 'Tiffany', 'Jones', 'tiffany.jones@example.com', 'Mastercraft for life.', 'Lake Placid, FL', '', '', 'https://i.pravatar.cc/150?u=WakeMaker', false, now() - interval '11 days'),
(gen_random_uuid(), 'DeepSee', 'Diana', 'Prince', 'diana.prince@example.com', 'Diving and fishing.', 'Key Largo, FL', '', '', 'https://i.pravatar.cc/150?u=DeepSee', false, now() - interval '10 days'),

-- Batch 5
(gen_random_uuid(), 'user007', 'James', 'B.', 'james.b@example.com', '', 'London', '', '', 'https://i.pravatar.cc/150?u=user007', false, now() - interval '9 days'),
(gen_random_uuid(), 'SailorMoon', 'Serena', '', 'serena@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=SailorMoon', false, now() - interval '9 days'),
(gen_random_uuid(), 'floridaman', 'Larry', '', 'larry@example.com', '', 'Florida', '', '', 'https://i.pravatar.cc/150?u=floridaman', false, now() - interval '8 days'),
(gen_random_uuid(), 'saltlife_2', 'Jenna', '', 'jenna@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=saltlife_2', false, now() - interval '8 days'),
(gen_random_uuid(), 'pontoon_captain', 'Bob', '', 'bob@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=pontoon_captain', false, now() - interval '7 days'),
(gen_random_uuid(), 'go_slow_guy', 'Walter', '', 'walter@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=go_slow_guy', false, now() - interval '7 days'),
(gen_random_uuid(), 'casting_queen', 'Ashley', '', 'ashley@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=casting_queen', false, now() - interval '6 days'),
(gen_random_uuid(), 'liveaboard_dream', 'Mark', '', 'mark@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=liveaboard_dream', false, now() - interval '6 days'),
(gen_random_uuid(), 'weekend_warrior', 'Steve', '', 'steve@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=weekend_warrior', false, now() - interval '5 days'),
(gen_random_uuid(), 'first_mate_dave', 'Dave', '', 'dave@example.com', '', '', '', '', 'https://i.pravatar.cc/150?u=first_mate_dave', false, now() - interval '5 days'),

-- Batch 6
(gen_random_uuid(), 'BiminiTopBill', 'Bill', 'Johnson', 'bill.johnson@example.com', 'Shade is everything.', 'The Villages, FL', '', '', 'https://i.pravatar.cc/150?u=BiminiTopBill', false, now() - interval '4 days'),
(gen_random_uuid(), 'OutboardAndy', 'Andy', 'Garcia', 'andy.garcia@example.com', 'Two-stroke for life.', 'Miami, FL', '', '', 'https://i.pravatar.cc/150?u=OutboardAndy', false, now() - interval '4 days'),
(gen_random_uuid(), 'TrawlerLife', 'Grace', 'O''Malley', 'grace.omalley@example.com', 'Slow and steady.', 'Stuart, FL', '', '', 'https://i.pravatar.cc/150?u=TrawlerLife', false, now() - interval '3 days'),
(gen_random_uuid(), 'JetSkiJess', 'Jessica', 'Rabbit', 'jessica.rabbit@example.com', 'Not the cartoon.', 'Daytona Beach, FL', '', '', 'https://i.pravatar.cc/150?u=JetSkiJess', false, now() - interval '3 days'),
(gen_random_uuid(), 'VHF_Guru', 'Victor', 'Frankenstein', 'victor.frankenstein@example.com', 'Radio check!', 'Melbourne, FL', '', '', 'https://i.pravatar.cc/150?u=VHF_Guru', false, now() - interval '2 days'),
(gen_random_uuid(), 'TheDetailer', 'Monica', 'Geller', 'monica.geller@example.com', 'It''s not clean unless it''s Monica clean.', 'New York, NY', '', '', 'https://i.pravatar.cc/150?u=TheDetailer', false, now() - interval '2 days'),
(gen_random_uuid(), 'BottomPaintPro', 'Walter', 'White', 'walter.white@example.com', 'It''s all about the prep.', 'Albuquerque, NM', '', '', 'https://i.pravatar.cc/150?u=BottomPaintPro', false, now() - interval '1 day'),
(gen_random_uuid(), 'KnottyBuoy', 'Chandler', 'Bing', 'chandler.bing@example.com', 'Could this BE any more knots?', 'Tulsa, OK', '', '', 'https://i.pravatar.cc/150?u=KnottyBuoy', false, now() - interval '1 day'),
(gen_random_uuid(), 'ReefRunner', 'Rachel', 'Green', 'rachel.green@example.com', 'Just here for the sandbar.', 'Long Island, NY', '', '', 'https://i.pravatar.cc/150?u=ReefRunner', false, now()),
(gen_random_uuid(), 'TheCaptain', 'Jean-Luc', 'Picard', 'jean-luc.picard@example.com', 'Make it so.', 'La Barre, France', '', '', 'https://i.pravatar.cc/150?u=TheCaptain', false, now());
