'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft,
  User,
  Heart,
  Sparkles,
  BookOpen,
  Briefcase,
  Users,
  Brain,
  ArrowRight,
  Check
} from 'lucide-react';
import { HeartfeltQuestion } from './HeartfeltQuestion';
import { CongratulationsAnimation } from './CongratulationsAnimation';

interface OnboardingData {
  name: string;
  interests: string[];
  background: string;
  values: string[];
  heartfeltAnswer?: string;
}

type OnboardingStep = 
  | 'welcome'
  | 'name'
  | 'interests'
  | 'background'
  | 'heartfelt-question'
  | 'celebration';

interface EnhancedOnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export function EnhancedOnboardingFlow({ onComplete }: EnhancedOnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [data, setData] = useState<OnboardingData>({
    name: '',
    interests: [],
    background: '',
    values: [],
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const goToStep = (newStep: OnboardingStep) => {
    setStep(newStep);
  };

  const handleHeartfeltComplete = (answer: string) => {
    updateData({ heartfeltAnswer: answer });
    goToStep('celebration');
  };

  const handleFinalComplete = () => {
    onComplete(data);
  };

  // Calculate progress percentage
  const getProgress = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'name', 'interests', 'background', 'heartfelt-question', 'celebration'];
    const currentIndex = stepOrder.indexOf(step);
    return ((currentIndex) / (stepOrder.length - 1)) * 100;
  };

  return (
    <div className="min-h-screen home-background flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="home-blob home-blob-1" />
      <div className="home-blob home-blob-2" />

      {/* Progress bar - only show before celebration */}
      {step !== 'celebration' && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200/50 z-50">
          <motion.div 
            className="h-full bg-[#406A56]"
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeStep 
              key="welcome"
              onContinue={() => goToStep('name')} 
            />
          )}

          {step === 'name' && (
            <NameStep
              key="name"
              value={data.name}
              onChange={(name) => updateData({ name })}
              onBack={() => goToStep('welcome')}
              onContinue={() => goToStep('interests')}
            />
          )}

          {step === 'interests' && (
            <InterestsStep
              key="interests"
              selected={data.interests}
              onChange={(interests) => updateData({ interests })}
              onBack={() => goToStep('name')}
              onContinue={() => goToStep('background')}
            />
          )}

          {step === 'background' && (
            <BackgroundStep
              key="background"
              value={data.background}
              onChange={(background) => updateData({ background })}
              onBack={() => goToStep('interests')}
              onContinue={() => goToStep('heartfelt-question')}
            />
          )}

          {step === 'heartfelt-question' && (
            <motion.div
              key="heartfelt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <HeartfeltQuestion
                userProfile={{
                  interests: data.interests,
                  background: data.background,
                  values: data.values
                }}
                onComplete={handleHeartfeltComplete}
                onSkip={() => goToStep('celebration')}
              />
            </motion.div>
          )}

          {step === 'celebration' && (
            <CongratulationsAnimation
              key="celebration"
              onComplete={handleFinalComplete}
              title={`Welcome, ${data.name || 'Friend'}!`}
              message="You've taken the first step in preserving your story for generations to come. Your journey of capturing memories, sharing wisdom, and connecting with loved ones begins now."
              delay={3000}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card glass-card-strong p-8 text-center"
    >
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-[#406A56] to-[#D9C61A] 
                   flex items-center justify-center mx-auto mb-6"
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Sparkles size={40} className="text-white" />
      </motion.div>

      <h1 className="text-3xl font-bold text-[#2d2d2d] mb-4 font-playfair">
        Welcome to YoursTruly
      </h1>

      <p className="text-gray-600 mb-6 leading-relaxed">
        A place to capture your life&apos;s precious moments, share your wisdom, 
        and create a lasting legacy for generations to come.
      </p>

      <div className="space-y-3 mb-8">
        {[
          { icon: '📸', text: 'Preserve your memories' },
          { icon: '💭', text: 'Share your stories' },
          { icon: '👨‍👩‍👧‍👦', text: 'Connect with family' },
          { icon: '📚', text: 'Build your legacy' },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            className="flex items-center gap-3 text-left px-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-gray-700">{item.text}</span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 
                   bg-[#406A56] text-white rounded-xl font-medium
                   hover:bg-[#355a48] transition-all"
      >
        Let&apos;s Begin
        <ArrowRight size={18} />
      </button>
    </motion.div>
  );
}

// Name Step
function NameStep({ 
  value, 
  onChange, 
  onBack, 
  onContinue 
}: { 
  value: string; 
  onChange: (name: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass-card glass-card-strong p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={32} className="text-[#406A56]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2d2d2d] font-playfair">
          What should we call you?
        </h2>
        <p className="text-gray-500 mt-2">
          This is how you&apos;ll appear to family members
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 
                     text-[#2d2d2d] placeholder-gray-400 
                     focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 
                     focus:border-[#406A56]/40 transition-all text-center text-lg"
          placeholder="Enter your name"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onContinue();
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 
                     hover:text-[#406A56] transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!value.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white 
                     rounded-xl font-medium hover:bg-[#355a48] 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Interests Step
function InterestsStep({ 
  selected, 
  onChange, 
  onBack, 
  onContinue 
}: { 
  selected: string[]; 
  onChange: (interests: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const interestOptions = [
    { id: 'family', label: 'Family', icon: <Users size={20} /> },
    { id: 'career', label: 'Career', icon: <Briefcase size={20} /> },
    { id: 'travel', label: 'Travel', icon: <BookOpen size={20} /> },
    { id: 'love', label: 'Relationships', icon: <Heart size={20} /> },
    { id: 'wisdom', label: 'Life Lessons', icon: <Brain size={20} /> },
    { id: 'memories', label: 'Memories', icon: <Sparkles size={20} /> },
  ];

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass-card glass-card-strong p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#D9C61A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-[#D9C61A]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2d2d2d] font-playfair">
          What matters most to you?
        </h2>
        <p className="text-gray-500 mt-2">
          Select the areas you&apos;d like to focus on
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {interestOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleInterest(option.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
              ${selected.includes(option.id)
                ? 'border-[#406A56] bg-[#406A56]/10 text-[#406A56]'
                : 'border-gray-200 bg-white/50 text-gray-600 hover:border-[#406A56]/30'
              }`}
          >
            {option.icon}
            <span className="font-medium text-sm">{option.label}</span>
            {selected.includes(option.id) && (
              <Check size={16} className="ml-auto" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 
                     hover:text-[#406A56] transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white 
                     rounded-xl font-medium hover:bg-[#355a48] transition-all"
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Background Step
function BackgroundStep({ 
  value, 
  onChange, 
  onBack, 
  onContinue 
}: { 
  value: string; 
  onChange: (background: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const quickOptions = [
    "I'm starting a family and want to capture these precious moments",
    "I'm reflecting on my career and what I've learned",
    "I want to preserve my parents' stories before they're lost",
    "I'm at a transitional moment and processing big changes",
    "I want to create something meaningful for my children",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass-card glass-card-strong p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#8DACAB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-[#8DACAB]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2d2d2d] font-playfair">
          Tell us a bit about yourself
        </h2>
        <p className="text-gray-500 mt-2">
          This helps us personalize your experience
        </p>
      </div>

      {/* Quick options */}
      <div className="space-y-2 mb-4">
        {quickOptions.map((option, i) => (
          <button
            key={i}
            onClick={() => onChange(option)}
            className={`w-full text-left p-3 rounded-lg text-sm transition-all
              ${value === option
                ? 'bg-[#406A56]/10 text-[#406A56] border border-[#406A56]/30'
                : 'bg-white/30 text-gray-600 hover:bg-white/50'
              }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
          Or share in your own words
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 
                     text-[#2d2d2d] placeholder-gray-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 
                     focus:border-[#406A56]/40 transition-all"
          placeholder="I'm here because..."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 
                     hover:text-[#406A56] transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!value.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white 
                     rounded-xl font-medium hover:bg-[#355a48] 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
