'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Briefcase, Sparkles, BookOpen, Brain, Target, MapPin, Quote } from 'lucide-react';

type QuestionCategory = 'family' | 'career' | 'love' | 'memories' | 'wisdom' | 'life-goals' | 'spirituality';

interface UserProfile {
  interests?: string[];
  hobbies?: string[];
  skills?: string[];
  lifeGoals?: string[];
  personalityTraits?: string[];
  religion?: string;
  background?: string;
  favoriteQuote?: string;
}

interface HeartfeltQuestionProps {
  userProfile: UserProfile;
  onComplete: (answer: string) => void;
  onSkip?: () => void;
}

interface GeneratedQuestion {
  category: QuestionCategory;
  question: string;
  context: string;
}

const CATEGORY_CONFIG: Record<QuestionCategory, { 
  label: string; 
  icon: React.ReactNode;
  colorClass: string;
  description: string;
}> = {
  family: {
    label: 'Family',
    icon: <Users size={18} />,
    colorClass: 'heartfelt-category-family',
    description: 'The bonds that shape who we are'
  },
  career: {
    label: 'Career',
    icon: <Briefcase size={18} />,
    colorClass: 'heartfelt-category-career',
    description: 'Your journey and achievements'
  },
  love: {
    label: 'Love',
    icon: <Heart size={18} />,
    colorClass: 'heartfelt-category-love',
    description: 'Relationships that matter most'
  },
  memories: {
    label: 'Memories',
    icon: <Sparkles size={18} />,
    colorClass: 'heartfelt-category-memories',
    description: 'Moments that defined you'
  },
  wisdom: {
    label: 'Wisdom',
    icon: <Brain size={18} />,
    colorClass: 'heartfelt-category-wisdom',
    description: 'Lessons learned along the way'
  },
  'life-goals': {
    label: 'Life Goals',
    icon: <Target size={18} />,
    colorClass: 'heartfelt-category-career',
    description: 'What you aspire to achieve'
  },
  spirituality: {
    label: 'Spirituality',
    icon: <Sparkles size={18} />,
    colorClass: 'heartfelt-category-love',
    description: 'Faith and meaning'
  }
};

// Questions organized by category and personalization triggers
const QUESTION_TEMPLATES: Record<QuestionCategory, {
  triggers: string[];
  questions: string[];
}> = {
  family: {
    triggers: ['family', 'home', 'parent', 'children', 'legacy', 'family-legacy'],
    questions: [
      "What's a tradition from your family that you hope will continue for generations?",
      "Who in your family has shaped who you are today, and what did they teach you?",
      "What's the most important lesson about love that you learned from your family?",
      "If you could preserve one family memory forever, which would it be and why?",
      "What do you want future generations of your family to know about where you came from?",
      "What family story do you wish had been told to you earlier?",
      "How has being part of your family shaped your values?",
    ]
  },
  career: {
    triggers: ['career', 'work', 'business', 'leadership', 'professional', 'career-success'],
    questions: [
      "What moment in your career made you feel most proud of who you've become?",
      "If you could share one piece of advice about work with your younger self, what would it be?",
      "What dream did you have for your career that actually came true?",
      "Who believed in you when you didn't believe in yourself professionally?",
      "What would you want others to remember about your professional legacy?",
      "What challenge at work taught you the most about yourself?",
      "How has your definition of professional success evolved over time?",
    ]
  },
  love: {
    triggers: ['love', 'relationship', 'romance', 'marriage', 'strong-relationships', 'nurturing', 'empathetic'],
    questions: [
      "How did you know when you found something real, and what did that feel like?",
      "What's the bravest thing you've ever done for love?",
      "If you could relive one perfect moment with someone you love, which would you choose?",
      "What has love taught you that nothing else could?",
      "How has your understanding of love evolved throughout your life?",
      "What's the most important thing you've learned about being a good partner/friend?",
      "Who taught you what unconditional love looks like?",
    ]
  },
  memories: {
    triggers: ['memories', 'travel', 'adventure', 'adventurous', 'photography', 'collecting'],
    questions: [
      "What memory instantly brings a smile to your face, no matter what?",
      "If you could bottle one moment from your life to experience again, which would it be?",
      "What seemingly small moment turned out to be incredibly significant?",
      "What's a memory that feels like it happened yesterday, even though years have passed?",
      "What experience changed the course of your life in ways you didn't expect?",
      "What adventure taught you the most about who you really are?",
      "What place holds the most meaningful memories for you, and why?",
    ]
  },
  wisdom: {
    triggers: ['wisdom', 'teaching', 'mentor', 'learn', 'reflective', 'analytical', 'learn-grow'],
    questions: [
      "What's the hardest truth you've learned that you wish someone had told you sooner?",
      "If you could only pass down one lesson to the next generation, what would it be?",
      "What mistake taught you the most valuable lesson of your life?",
      "How has your definition of success changed over time?",
      "What do you know now about happiness that you didn't understand when you were younger?",
      "What piece of wisdom would you want to share with someone going through what you went through?",
      "What beliefs have you held onto, and which have you let go of?",
    ]
  },
  'life-goals': {
    triggers: ['driven', 'goals', 'achievement', 'help-others', 'financial-freedom', 'creative-work', 'adventure'],
    questions: [
      "What's one dream you're still working toward, and why does it matter to you?",
      "Looking back, which of your accomplishments surprised you the most?",
      "What goal seemed impossible when you were younger but you achieved anyway?",
      "How have your priorities in life shifted as you've grown older?",
      "What impact do you hope to have made on the world by the end of your life?",
      "What's something you want to do before it's too late, and what's holding you back?",
      "If you could be remembered for one thing, what would you want it to be?",
    ]
  },
  spirituality: {
    triggers: ['spiritual', 'spirituality', 'religion', 'faith', 'christianity', 'islam', 'judaism', 'hinduism', 'buddhism', 'spiritual-growth', 'peace'],
    questions: [
      "What gives your life the deepest sense of meaning and purpose?",
      "How has your faith or spirituality shaped the decisions you've made?",
      "What moment made you reflect most deeply on life's bigger questions?",
      "What do you believe happens after we're gone, and how does that belief affect how you live?",
      "What practices help you find peace or connection to something greater?",
      "How has your spiritual journey evolved throughout your life?",
      "What would you want your loved ones to know about what you believe?",
    ]
  }
};

function generatePersonalizedQuestion(userProfile: UserProfile): GeneratedQuestion {
  // Gather all user signals into a single list
  const signals: string[] = [
    ...(userProfile.interests || []),
    ...(userProfile.hobbies || []),
    ...(userProfile.skills || []),
    ...(userProfile.lifeGoals || []),
    ...(userProfile.personalityTraits || []),
    userProfile.religion || '',
    userProfile.background || '',
  ].map(s => s.toLowerCase()).filter(Boolean);

  // Score each category based on how many triggers match
  const categoryScores: Record<QuestionCategory, number> = {
    family: 0,
    career: 0,
    love: 0,
    memories: 0,
    wisdom: 0,
    'life-goals': 0,
    spirituality: 0,
  };

  for (const [category, config] of Object.entries(QUESTION_TEMPLATES)) {
    for (const trigger of config.triggers) {
      if (signals.some(s => s.includes(trigger) || trigger.includes(s))) {
        categoryScores[category as QuestionCategory] += 1;
      }
    }
  }

  // Check specific conditions for extra weight
  if (userProfile.religion && userProfile.religion !== 'prefer-not' && userProfile.religion !== 'agnostic' && userProfile.religion !== 'atheist') {
    categoryScores.spirituality += 2;
  }
  
  if (signals.includes('family-legacy') || signals.includes('family')) {
    categoryScores.family += 2;
  }

  if (userProfile.favoriteQuote) {
    categoryScores.wisdom += 1;
  }

  // Find the highest-scoring category
  let selectedCategory: QuestionCategory = 'memories'; // default
  let maxScore = 0;
  
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      selectedCategory = category as QuestionCategory;
    }
  }

  // If no clear winner, pick based on what we know
  if (maxScore === 0) {
    if (userProfile.background?.includes('family') || userProfile.background?.includes('child')) {
      selectedCategory = 'family';
    } else if (userProfile.background?.includes('career') || userProfile.background?.includes('work')) {
      selectedCategory = 'career';
    } else if (userProfile.background?.includes('moment') || userProfile.background?.includes('change')) {
      selectedCategory = 'memories';
    }
  }

  // Pick a random question from the selected category
  const questions = QUESTION_TEMPLATES[selectedCategory].questions;
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  // Generate context message
  let context = 'We want to hear your story';
  if (userProfile.interests && userProfile.interests.length > 0) {
    context = `Since you're interested in ${userProfile.interests[0].replace('-', ' ')}`;
  } else if (userProfile.lifeGoals && userProfile.lifeGoals.length > 0) {
    context = `Based on what matters most to you`;
  } else if (userProfile.background) {
    context = `Based on what brought you here`;
  }

  return {
    category: selectedCategory,
    question: randomQuestion,
    context: context
  };
}

export function HeartfeltQuestion({ userProfile, onComplete, onSkip }: HeartfeltQuestionProps) {
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Generate personalized question on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const question = generatePersonalizedQuestion(userProfile);
      setGeneratedQuestion(question);
      setIsGenerating(false);
      
      // Start typewriter effect after a brief delay
      setTimeout(() => {
        setIsTyping(true);
      }, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect for the question
  useEffect(() => {
    if (!isTyping || !generatedQuestion) return;

    const text = generatedQuestion.question;
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        setIsTyping(false);
        // Show input field after question is fully typed
        setTimeout(() => {
          setShowInput(true);
        }, 400);
        clearInterval(typeInterval);
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [isTyping, generatedQuestion]);

  const handleSubmit = useCallback(() => {
    if (answer.trim()) {
      onComplete(answer);
    }
  }, [answer, onComplete]);

  const config = generatedQuestion ? CATEGORY_CONFIG[generatedQuestion.category] : null;

  return (
    <div className="glass-card glass-card-strong p-8 max-w-2xl mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#406A56]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#D9C61A]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#406A56]/10 mb-4">
            <BookOpen size={28} className="text-[#406A56]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#2d2d2d] mb-2 font-playfair">
            A Question Just for You
          </h2>
          <p className="text-gray-500 text-sm">
            Based on what you've shared, we'd love to hear more...
          </p>
        </motion.div>

        {/* Generating state */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="generating"
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-12 h-12 border-4 border-[#406A56]/20 border-t-[#406A56] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-4 text-gray-500 text-lg" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>
                Crafting your question...
              </p>
            </motion.div>
          ) : generatedQuestion && config ? (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Category Badge */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#406A56]/10 text-[#406A56] text-sm font-medium`}>
                  {config.icon}
                  {config.label}
                </span>
              </motion.div>

              {/* The Question with Typewriter Effect */}
              <div className="mb-8 text-center">
                <motion.h3 
                  className="text-xl md:text-2xl font-medium text-[#2d2d2d] leading-relaxed font-playfair"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {displayedText}
                  {isTyping && <span className="inline-block w-0.5 h-6 bg-[#406A56] ml-1 animate-pulse" />}
                </motion.h3>
              </div>

              {/* Answer Input */}
              <AnimatePresence>
                {showInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Share your thoughts... This becomes your first memory."
                      className="w-full p-4 rounded-xl bg-white/80 border border-[#406A56]/20 
                                 text-[#2d2d2d] placeholder-gray-400 resize-none
                                 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 focus:border-[#406A56]/40
                                 transition-all"
                      rows={5}
                      autoFocus
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                      {onSkip && (
                        <button
                          onClick={onSkip}
                          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Skip for now
                        </button>
                      )}
                      
                      <button
                        onClick={handleSubmit}
                        disabled={!answer.trim()}
                        className="ml-auto flex items-center gap-2 px-6 py-2.5 
                                   bg-[#406A56] text-white rounded-xl font-medium
                                   hover:bg-[#355a48] disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all"
                      >
                        <Sparkles size={16} />
                        Save & Continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category description */}
              {!showInput && (
                <motion.p 
                  className="text-center text-gray-400 text-sm mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {config.description}
                </motion.p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
