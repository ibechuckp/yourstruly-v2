-- ============================================================================
-- Fill Missing Life Chapter Prompts
-- Purpose: Add prompts ONLY for under-represented life chapters
-- Created: 2026-03-14
-- Note: We already have 571 templates. This adds targeted gaps only.
-- ============================================================================

-- ============================================================================
-- TEENAGE (only 1 exists, add 11 more)
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

('teenage_identity_001', 'memory_prompt', 'teenage', 'What was the biggest way you changed during your teenage years?', 12, TRUE),
('teenage_music_001', 'memory_prompt', 'teenage', 'What music defined your teenage years? What did those songs mean to you?', 10, TRUE),
('teenage_friends_001', 'memory_prompt', 'teenage', 'Who was in your friend group as a teenager? What did you do together?', 12, TRUE),
('teenage_style_001', 'memory_prompt', 'teenage', 'How would you describe your style as a teenager? What were you trying to express?', 8, TRUE),
('teenage_discovered_001', 'memory_prompt', 'teenage', 'What passion or interest did you discover as a teenager?', 10, TRUE),
('teenage_crush_001', 'memory_prompt', 'teenage', 'Tell me about your first crush or first love', 10, TRUE),
('teenage_rebellion_001', 'memory_prompt', 'teenage', 'What did you rebel against as a teenager?', 8, TRUE),
('teenage_learned_001', 'knowledge', 'teenage', 'What is the most important lesson you learned in your teenage years?', 12, TRUE),
('teenage_dream_001', 'memory_prompt', 'teenage', 'What did you dream about doing or becoming when you were a teen?', 10, TRUE),
('teenage_hangout_001', 'memory_prompt', 'teenage', 'Where did you and your friends hang out? What was a typical weekend like?', 10, TRUE),
('teenage_realized_001', 'memory_prompt', 'teenage', 'What did you realize about yourself during your teen years?', 10, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- HIGH SCHOOL (0 exist, add 12)
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

('highschool_favorite_class_001', 'memory_prompt', 'high_school', 'What was your favorite class in high school and why?', 10, TRUE),
('highschool_teacher_001', 'memory_prompt', 'high_school', 'Which high school teacher had the biggest impact on you? What did they teach you?', 12, TRUE),
('highschool_activities_001', 'memory_prompt', 'high_school', 'What clubs, sports, or activities were you involved in?', 10, TRUE),
('highschool_achievement_001', 'memory_prompt', 'high_school', 'What achievement in high school are you most proud of?', 12, TRUE),
('highschool_lunch_001', 'memory_prompt', 'high_school', 'Where did you eat lunch? Who did you sit with?', 6, TRUE),
('highschool_prom_001', 'memory_prompt', 'high_school', 'Tell me about prom or another memorable school dance', 8, TRUE),
('highschool_graduation_001', 'memory_prompt', 'high_school', 'Describe your high school graduation. How did you feel about what came next?', 12, TRUE),
('highschool_summer_001', 'memory_prompt', 'high_school', 'What was your best summer during high school? What did you do?', 10, TRUE),
('highschool_challenge_001', 'memory_prompt', 'high_school', 'What was your biggest challenge in high school? How did you handle it?', 10, TRUE),
('highschool_performance_001', 'memory_prompt', 'high_school', 'Did you ever perform on stage? Concert, play, sports competition?', 8, TRUE),
('highschool_project_001', 'memory_prompt', 'high_school', 'Tell me about a school project you were proud of', 8, TRUE),
('highschool_wisdom_001', 'knowledge', 'high_school', 'What would you tell your high school self?', 12, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- COLLEGE (only 1 exists, add 11 more)
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

('college_choice_001', 'memory_prompt', 'college', 'What made you choose your college? What were you hoping for?', 12, TRUE),
('college_move_in_001', 'memory_prompt', 'college', 'What do you remember about moving into your dorm or first college place?', 10, TRUE),
('college_major_001', 'memory_prompt', 'college', 'How did you choose your major? Did it turn out the way you expected?', 10, TRUE),
('college_professor_001', 'memory_prompt', 'college', 'Tell me about a professor who changed the way you think', 12, TRUE),
('college_changed_001', 'memory_prompt', 'college', 'How did college change you? Who were you when you arrived vs when you left?', 15, TRUE),
('college_friends_001', 'memory_prompt', 'college', 'Tell me about your college friend group. What brought you together?', 10, TRUE),
('college_adventure_001', 'memory_prompt', 'college', 'What was your craziest college adventure or road trip?', 10, TRUE),
('college_challenge_001', 'memory_prompt', 'college', 'What was your biggest challenge in college? How did you overcome it?', 12, TRUE),
('college_graduation_001', 'memory_prompt', 'college', 'Describe your college graduation day. What were you feeling?', 12, TRUE),
('college_study_abroad_001', 'memory_prompt', 'college', 'Did you study abroad or take a semester somewhere else? Tell me about it', 10, TRUE),
('college_lessons_001', 'knowledge', 'college', 'What did college teach you beyond academics?', 15, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- TRAVEL (0 exist, add 12)
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

('travel_first_trip_001', 'memory_prompt', 'travel', 'Tell me about your first big trip away from home', 12, TRUE),
('travel_favorite_place_001', 'memory_prompt', 'travel', 'What is your favorite place you've ever visited? What made it special?', 15, TRUE),
('travel_changed_perspective_001', 'memory_prompt', 'travel', 'What place or trip changed your perspective on life?', 15, TRUE),
('travel_unexpected_001', 'memory_prompt', 'travel', 'Tell me about an unexpected adventure while traveling', 12, TRUE),
('travel_local_connection_001', 'memory_prompt', 'travel', 'Describe a meaningful interaction with a local person while traveling', 10, TRUE),
('travel_best_meal_001', 'memory_prompt', 'travel', 'What is the best meal you've ever had while traveling?', 10, TRUE),
('travel_mishap_001', 'memory_prompt', 'travel', 'Tell me about a travel mishap that makes you laugh now', 10, TRUE),
('travel_solo_001', 'memory_prompt', 'travel', 'Have you ever traveled alone? What did you learn about yourself?', 12, TRUE),
('travel_bucket_list_001', 'memory_prompt', 'travel', 'What place is still on your bucket list? Why do you want to go there?', 10, TRUE),
('travel_return_001', 'memory_prompt', 'travel', 'What place would you love to return to? What draws you back?', 10, TRUE),
('travel_taught_001', 'knowledge', 'travel', 'What has travel taught you about the world and yourself?', 15, TRUE),
('travel_home_001', 'knowledge', 'travel', 'How has travel changed what "home" means to you?', 12, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- WISDOM & LEGACY (0 exist, add 12)
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

('wisdom_biggest_lesson_001', 'knowledge', 'wisdom_legacy', 'What is the most important lesson life has taught you?', 20, TRUE),
('wisdom_values_001', 'knowledge', 'wisdom_legacy', 'What values guide your life? Where did they come from?', 15, TRUE),
('wisdom_success_001', 'knowledge', 'wisdom_legacy', 'How do you define a successful life?', 15, TRUE),
('wisdom_remembered_001', 'knowledge', 'wisdom_legacy', 'What do you want to be remembered for?', 20, TRUE),
('wisdom_pass_on_001', 'knowledge', 'wisdom_legacy', 'What wisdom do you want to pass on to future generations?', 20, TRUE),
('wisdom_proud_of_001', 'knowledge', 'wisdom_legacy', 'What are you most proud of in your life?', 15, TRUE),
('wisdom_changed_mind_001', 'knowledge', 'wisdom_legacy', 'What have you changed your mind about as you've gotten older?', 12, TRUE),
('wisdom_happiness_001', 'knowledge', 'wisdom_legacy', 'What have you learned about happiness?', 15, TRUE),
('wisdom_meaning_001', 'knowledge', 'wisdom_legacy', 'What gives your life meaning?', 18, TRUE),
('wisdom_mistake_learned_001', 'knowledge', 'wisdom_legacy', 'What mistake taught you the most?', 12, TRUE),
('wisdom_courage_001', 'knowledge', 'wisdom_legacy', 'What does courage mean to you?', 12, TRUE),
('wisdom_aging_001', 'knowledge', 'wisdom_legacy', 'What has getting older taught you?', 12, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 'Added targeted prompts for missing life chapters!' as status;
