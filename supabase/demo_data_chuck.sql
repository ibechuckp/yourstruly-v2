-- Demo Data Injection for chuckp7@gmail.com
-- This script populates the account with rich demo data showcasing all features

-- First, get the user ID for chuckp7@gmail.com
DO $$
DECLARE
  v_user_id UUID;
  v_contact_mom UUID;
  v_contact_dad UUID;
  v_contact_sarah UUID;
  v_contact_mike UUID;
  v_contact_emma UUID;
  v_contact_james UUID;
  v_circle_family UUID;
  v_circle_friends UUID;
BEGIN
  -- Get user ID from profiles by email
  SELECT id INTO v_user_id FROM profiles WHERE email = 'chuckp7@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User chuckp7@gmail.com not found in profiles table';
  END IF;

  RAISE NOTICE 'Found user ID: %', v_user_id;

  -- ============================================
  -- 1. UPDATE PROFILE WITH RICH DATA
  -- ============================================
  UPDATE profiles SET
    full_name = 'Chuck Patel',
    date_of_birth = '1985-06-15',
    gender = 'Male',
    city = 'Raleigh',
    state = 'NC',
    country = 'United States',
    occupation = 'Software Entrepreneur',
    biography = 'Building the future of digital legacy. Father of two, husband, and eternal optimist. I believe technology should bring families closer together.',
    personal_motto = 'Leave the world better than you found it.',
    personality_type = 'ENTJ',
    personality_traits = ARRAY['Driven', 'Creative', 'Empathetic', 'Analytical', 'Optimistic', 'Leadership'],
    interests = ARRAY['Technology', 'Family', 'Travel', 'Photography', 'Reading', 'Cooking', 'Entrepreneurship'],
    hobbies = ARRAY['Hiking', 'Photography', 'Cooking', 'Chess', 'Guitar', 'Reading'],
    skills = ARRAY['Leadership', 'Problem Solving', 'Communication', 'Technical Skills', 'Mentoring', 'Storytelling'],
    life_goals = ARRAY['Leave a family legacy', 'Build meaningful products', 'Travel the world', 'Continuous learning'],
    favorite_quote = 'The best time to plant a tree was 20 years ago. The second best time is now.',
    favorite_books = ARRAY['Sapiens', 'The Alchemist', 'Man''s Search for Meaning', 'Start with Why'],
    favorite_movies = ARRAY['The Shawshank Redemption', 'Interstellar', 'The Pursuit of Happyness'],
    favorite_music = ARRAY['Jazz', 'Classical', 'Indie Rock'],
    favorite_foods = ARRAY['Indian cuisine', 'Thai food', 'Italian'],
    religion = 'Spiritual but not religious',
    values = ARRAY['Family', 'Integrity', 'Growth', 'Compassion'],
    onboarding_completed = true,
    background = 'I want to create something meaningful for my children'
  WHERE id = v_user_id;

  RAISE NOTICE 'Profile updated';

  -- ============================================
  -- 2. ADD CONTACTS (idempotent - lookup or create)
  -- ============================================
  
  -- Mom
  SELECT id INTO v_contact_mom FROM contacts WHERE user_id = v_user_id AND full_name = 'Priya Patel' LIMIT 1;
  IF v_contact_mom IS NULL THEN
    INSERT INTO contacts (id, user_id, full_name, nickname, relationship_type, date_of_birth, city, state, country, notes)
    VALUES (gen_random_uuid(), v_user_id, 'Priya Patel', 'Mom', 'Mother', '1955-03-22', 'Edison', 'NJ', 'United States', 
            'Best cook in the family. Taught me everything about perseverance.')
    RETURNING id INTO v_contact_mom;
  END IF;
  
  -- Dad
  SELECT id INTO v_contact_dad FROM contacts WHERE user_id = v_user_id AND full_name = 'Raj Patel' LIMIT 1;
  IF v_contact_dad IS NULL THEN
    INSERT INTO contacts (id, user_id, full_name, nickname, relationship_type, date_of_birth, city, state, country, notes)
    VALUES (gen_random_uuid(), v_user_id, 'Raj Patel', 'Dad', 'Father', '1952-11-08', 'Edison', 'NJ', 'United States',
            'Engineer and dreamer. Immigrated from India in 1978. Built everything from scratch.')
    RETURNING id INTO v_contact_dad;
  END IF;
  
  -- Wife
  SELECT id INTO v_contact_sarah FROM contacts WHERE user_id = v_user_id AND full_name = 'Sarah Patel' LIMIT 1;
  IF v_contact_sarah IS NULL THEN
    INSERT INTO contacts (id, user_id, full_name, nickname, relationship_type, date_of_birth, anniversary, city, state, notes)
    VALUES (gen_random_uuid(), v_user_id, 'Sarah Patel', 'Sarah', 'Spouse', '1987-09-14', '2012-06-20', 'Raleigh', 'NC',
            'My partner in everything. Met at Duke in 2008. She makes every day an adventure.')
    RETURNING id INTO v_contact_sarah;
  END IF;
  
  -- Son
  SELECT id INTO v_contact_mike FROM contacts WHERE user_id = v_user_id AND full_name = 'Michael Patel' LIMIT 1;
  IF v_contact_mike IS NULL THEN
    INSERT INTO contacts (id, user_id, full_name, nickname, relationship_type, date_of_birth, city, state, notes)
    VALUES (gen_random_uuid(), v_user_id, 'Michael Patel', 'Mikey', 'Son', '2015-04-12', 'Raleigh', 'NC',
            'Our curious little scientist. Loves dinosaurs and building Legos.')
    RETURNING id INTO v_contact_mike;
  END IF;
  
  -- Daughter
  SELECT id INTO v_contact_emma FROM contacts WHERE user_id = v_user_id AND full_name = 'Emma Patel' LIMIT 1;
  IF v_contact_emma IS NULL THEN
    INSERT INTO contacts (id, user_id, full_name, nickname, relationship_type, date_of_birth, city, state, notes)
    VALUES (gen_random_uuid(), v_user_id, 'Emma Patel', 'Em', 'Daughter', '2018-08-03', 'Raleigh', 'NC',
            'Our little artist. Always singing and dancing. Has her mom''s spirit.')
    RETURNING id INTO v_contact_emma;
  END IF;
  
  -- Best Friend
  SELECT id INTO v_contact_james FROM contacts WHERE user_id = v_user_id AND full_name = 'James Chen' LIMIT 1;
  IF v_contact_james IS NULL THEN
    INSERT INTO contacts (id, user_id, full_name, nickname, relationship_type, city, state, notes)
    VALUES (gen_random_uuid(), v_user_id, 'James Chen', 'James', 'Best Friend', 'San Francisco', 'CA',
            'Known since college. Co-founded our first startup together. Brothers by choice.')
    RETURNING id INTO v_contact_james;
  END IF;

  RAISE NOTICE 'Contacts created/verified';

  -- ============================================
  -- 3. ADD MEMORIES
  -- ============================================
  
  INSERT INTO memories (user_id, title, description, memory_date, memory_type, location_name, is_favorite, tags)
  VALUES 
    (v_user_id, 'Our Wedding Day', 
     'The happiest day of my life. Sarah walked down the aisle at Duke Chapel, and in that moment, I knew every struggle had led me here. Dad cried for the first time I''d ever seen. Mom''s speech about finding home in a person still echoes in my heart.',
     '2012-06-20', 'milestone', 'Duke Chapel, Durham NC', true, ARRAY['wedding', 'family', 'milestone', 'love']),
    
    (v_user_id, 'Michael''s First Steps',
     'He took his first steps right here in our living room. Sarah was on one side, I was on the other. Three wobbly steps and the biggest smile. Emma wasn''t born yet, but we recorded it to show her someday.',
     '2016-03-15', 'milestone', 'Home, Raleigh NC', true, ARRAY['children', 'milestone', 'family']),
    
    (v_user_id, 'Dad''s 70th Birthday',
     'We surprised him with the whole family - 42 people! He thought it was just dinner. When he walked in and saw everyone, he couldn''t speak for a full minute. Mom said she''d never seen him so happy.',
     '2022-11-08', 'celebration', 'Edison, NJ', true, ARRAY['family', 'celebration', 'dad', 'birthday']),
    
    (v_user_id, 'Costa Rica Family Trip',
     'Two weeks in paradise. Michael saw a sloth for the first time. Emma learned to boogie board. Sarah and I renewed our vows on the beach at sunset. This trip reminded us what matters most.',
     '2023-07-10', 'trip', 'Manuel Antonio, Costa Rica', true, ARRAY['travel', 'family', 'adventure', 'vacation']),
    
    (v_user_id, 'Mom''s Secret Recipe',
     'Finally got Mom to teach me her dal recipe. The one she learned from her mother in Gujarat. We spent the whole afternoon in her kitchen, and she told me stories I''d never heard about my grandmother.',
     '2024-01-15', 'everyday', 'Edison, NJ', false, ARRAY['cooking', 'family', 'tradition', 'mom']),
    
    (v_user_id, 'Emma''s First Painting',
     'She painted our family as superheroes. Dad is "Captain Code", Mom is "Wonder Writer", Michael is "Dino Boy", and she''s "Rainbow Girl". It''s hanging in my office now.',
     '2023-09-20', 'everyday', 'Home, Raleigh NC', true, ARRAY['art', 'children', 'family', 'emma']),
    
    (v_user_id, 'Launching YoursTruly',
     'The day we launched. James, Sarah, and I stayed up until 3am. When we got our first signup, we just stared at the screen. All those late nights, all that doubt - worth it.',
     '2024-06-01', 'milestone', 'Home Office, Raleigh NC', true, ARRAY['work', 'startup', 'milestone', 'achievement']);

  RAISE NOTICE 'Memories created';

  -- ============================================
  -- 4. ADD KNOWLEDGE ENTRIES (wisdom)
  -- ============================================
  
  INSERT INTO knowledge_entries (user_id, category, prompt_text, response_text, related_interest)
  VALUES
    (v_user_id, 'life_lessons', 'What did your father teach you about work?',
     'Dad worked 60-hour weeks for 30 years so we could have opportunities he never did. But he never missed a single school play or parent-teacher conference. He taught me that hard work isn''t about hours—it''s about priorities. "Work hard on what matters," he''d say. "Everything else is just noise."',
     'family'),
    
    (v_user_id, 'life_lessons', 'Tell me about a time you learned from failure.',
     'My first startup failed spectacularly in 2010. Lost everything. James and I sat in a Denny''s at 2am eating pancakes in silence. Then he said, "Well, now we know one way that doesn''t work." That reframe changed my life. Failure is just feedback.',
     'career'),
    
    (v_user_id, 'practical', 'What''s a family recipe you treasure?',
     '1 cup toor dal, washed\n6 cups water\n1/2 tsp turmeric\n2 tomatoes, chopped\n\nTadka: 2 tbsp ghee, 1 tsp mustard seeds, 1 tsp cumin, 2 dried red chilies, pinch hing, curry leaves\n\nBoil dal until soft. Mash lightly. Add tomatoes and salt. For tadka, heat ghee, add spices until they pop, pour over dal. The secret: add a spoon of jaggery at the end. This is Mom''s dal recipe from Gujarat.',
     'cooking'),
    
    (v_user_id, 'relationships', 'What marriage advice would you give?',
     '1. Fight fair - no name calling, no bringing up old stuff\n2. Date nights aren''t optional\n3. Say "thank you" more than you think necessary\n4. Your spouse isn''t a mind reader - communicate\n5. Grow together or grow apart - there''s no standing still\n6. Laugh every single day\n7. When in doubt, choose kindness',
     'family');

  RAISE NOTICE 'Knowledge entries created';

  -- ============================================
  -- 5. ADD POSTSCRIPTS
  -- ============================================
  
  INSERT INTO postscripts (user_id, recipient_contact_id, recipient_name, title, message, delivery_type, delivery_date, status)
  VALUES
    (v_user_id, v_contact_mike, 'Michael Patel', 'For Your 18th Birthday',
     'Dear Mikey,\n\nToday you become an adult, at least legally. But you''ve been teaching me about growing up since the day you were born.\n\nI want you to know: every Lego set we built, every dinosaur fact you shared, every bedtime story - those weren''t just activities. They were me falling more in love with being your dad.\n\nYou''re going to make mistakes. Big ones. That''s not failure - that''s learning. Your old man has made plenty, and each one taught me something valuable.\n\nThree things I hope you remember:\n1. Kindness is never weakness\n2. Ask questions - always\n3. Call your mother\n\nI''m so proud of who you''re becoming.\n\nLove,\nDad',
     'date', '2033-04-12', 'scheduled'),
    
    (v_user_id, v_contact_emma, 'Emma Patel', 'For Your Wedding Day',
     'My dearest Rainbow Girl,\n\nI''ve been dreading and looking forward to this day since I first held you. Dreading because it means you don''t need me the same way. Looking forward because I get to see you choose your own adventure.\n\nThat painting you made of us as superheroes? I still have it. You saw us as heroes before we did anything heroic. That''s your gift - you see the best in people.\n\nYour partner is lucky. Not because of what you do, but because of who you are. Kind. Creative. Fierce. Full of light.\n\nDance at your wedding. Laugh loudly. Cry if you need to. And know that wherever I am, I''m dancing too.\n\nI love you infinity,\nDaddy',
     'event', NULL, 'scheduled'),
    
    (v_user_id, v_contact_sarah, 'Sarah Patel', 'If I Go First',
     'My love,\n\nIf you''re reading this, I went first. I''m sorry - I wanted to be the one taking care of you in our old age.\n\nFirst: the practical stuff. All passwords are in the vault. James has copies of everything. The life insurance should be enough.\n\nBut that''s not why I''m writing.\n\nI''m writing to tell you that meeting you was the turning point of my life. Everything good came after. The kids. The adventures. Even the hard parts - we made them good together.\n\nDon''t spend too long being sad. I want you to travel. Learn something new. Maybe even love again, when you''re ready. You have too much love to give to stop.\n\nThank you for choosing me. Every day, you chose me. What a gift.\n\nYours truly, always,\nChuck',
     'passing', NULL, 'scheduled');

  RAISE NOTICE 'PostScripts created';

  -- ============================================
  -- 6. CREATE CIRCLES (idempotent)
  -- Note: create_circle_owner_trigger auto-creates owner membership
  -- ============================================
  
  -- Family Circle - check if exists first
  SELECT id INTO v_circle_family FROM circles 
  WHERE created_by = v_user_id AND name = 'The Patel Family' LIMIT 1;
  
  IF v_circle_family IS NULL THEN
    INSERT INTO circles (id, name, description, created_by)
    VALUES (gen_random_uuid(), 'The Patel Family', 'Our immediate family circle for sharing memories and planning gatherings', v_user_id)
    RETURNING id INTO v_circle_family;
    -- Owner membership created automatically by trigger
  END IF;
  
  -- Close Friends Circle - check if exists first
  SELECT id INTO v_circle_friends FROM circles 
  WHERE created_by = v_user_id AND name = 'Close Friends' LIMIT 1;
  
  IF v_circle_friends IS NULL THEN
    INSERT INTO circles (id, name, description, created_by)
    VALUES (gen_random_uuid(), 'Close Friends', 'The inner circle - people who''ve seen the real me', v_user_id)
    RETURNING id INTO v_circle_friends;
    -- Owner membership created automatically by trigger
  END IF;

  RAISE NOTICE 'Circles created/verified';

  -- ============================================
  -- 7. ADD ENGAGEMENT STATS
  -- ============================================
  
  INSERT INTO engagement_stats (user_id, total_prompts_shown, total_prompts_answered, total_prompts_skipped, total_knowledge_entries, current_streak_days, longest_streak_days)
  VALUES (v_user_id, 45, 32, 8, 4, 7, 14)
  ON CONFLICT (user_id) DO UPDATE SET
    total_prompts_shown = 45,
    total_prompts_answered = 32,
    total_prompts_skipped = 8,
    total_knowledge_entries = 4,
    current_streak_days = 7,
    longest_streak_days = 14;

  RAISE NOTICE 'Engagement stats created';

  RAISE NOTICE 'Demo data injection complete for user %', v_user_id;

END $$;
