'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft,
  Mic, 
  Users, 
  Heart,
  Sparkles,
  Clock,
  Check
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  name: string;
  preferVoice: boolean;
  dailyTime: string;
  primaryGoal: string;
  importantPeople: string[];
}

const STEPS = [
  'welcome',
  'name',
  'voice-preference',
  'daily-time',
  'goal',
  'people',
  'ready',
] as const;

type Step = typeof STEPS[number];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [data, setData] = useState<OnboardingData>({
    name: '',
    preferVoice: true,
    dailyTime: '09:00',
    primaryGoal: '',
    importantPeople: [],
  });

  const currentIndex = STEPS.indexOf(step);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEPS.length - 1;

  const goNext = () => {
    if (isLastStep) {
      onComplete(data);
    } else {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="onboarding">
      {/* Progress bar */}
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="onboarding-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="step-content"
          >
            {step === 'welcome' && <WelcomeStep onContinue={goNext} />}
            {step === 'name' && (
              <NameStep
                value={data.name}
                onChange={(name) => updateData({ name })}
                onContinue={goNext}
              />
            )}
            {step === 'voice-preference' && (
              <VoiceStep
                value={data.preferVoice}
                onChange={(preferVoice) => updateData({ preferVoice })}
                onContinue={goNext}
              />
            )}
            {step === 'daily-time' && (
              <TimeStep
                value={data.dailyTime}
                onChange={(dailyTime) => updateData({ dailyTime })}
                onContinue={goNext}
              />
            )}
            {step === 'goal' && (
              <GoalStep
                value={data.primaryGoal}
                onChange={(primaryGoal) => updateData({ primaryGoal })}
                onContinue={goNext}
              />
            )}
            {step === 'people' && (
              <PeopleStep
                value={data.importantPeople}
                onChange={(importantPeople) => updateData({ importantPeople })}
                onContinue={goNext}
              />
            )}
            {step === 'ready' && (
              <ReadyStep name={data.name} onContinue={goNext} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step !== 'welcome' && step !== 'ready' && (
        <div className="nav-buttons">
          <button className="nav-back" onClick={goBack}>
            <ChevronLeft size={20} />
            Back
          </button>
          <button className="nav-skip" onClick={goNext}>
            Skip
          </button>
        </div>
      )}

      <style jsx>{`
        .onboarding {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 20px;
          padding-top: calc(20px + env(safe-area-inset-top));
          padding-bottom: calc(20px + env(safe-area-inset-bottom));
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin-bottom: 40px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6f6fd2, #ec4899);
          border-radius: 2px;
        }

        .onboarding-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 500px;
          margin: 0 auto;
          width: 100%;
        }

        .step-content {
          width: 100%;
        }

        .nav-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }

        .nav-back,
        .nav-skip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .nav-back:hover,
        .nav-skip:hover {
          color: white;
        }
      `}</style>
    </div>
  );
}

// Step Components

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="welcome-step">
      <motion.div
        className="icon-container"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <Sparkles size={64} />
      </motion.div>

      <h1>Welcome to YoursTruly</h1>
      <p>
        A place to capture your stories, preserve your wisdom, and create
        messages that will last forever.
      </p>

      <button className="primary-btn" onClick={onContinue}>
        Let's Begin
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        .welcome-step {
          text-align: center;
        }

        .icon-container {
          display: inline-flex;
          padding: 24px;
          background: linear-gradient(135deg, rgba(111, 111, 210, 0.2), rgba(236, 72, 153, 0.2));
          border-radius: 50%;
          margin-bottom: 32px;
          color: #ec4899;
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin: 0 0 16px;
        }

        p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin: 0 0 40px;
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 18px 36px;
          background: linear-gradient(135deg, #6f6fd2, #5959a8);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(111, 111, 210, 0.4);
        }
      `}</style>
    </div>
  );
}

function NameStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (name: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="name-step">
      <h2>What should we call you?</h2>
      <p>Just your first name is fine.</p>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your name"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && value.trim() && onContinue()}
      />

      <button
        className="continue-btn"
        onClick={onContinue}
        disabled={!value.trim()}
      >
        Continue
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        .name-step {
          text-align: center;
        }

        h2 {
          font-size: 28px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }

        p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 32px;
        }

        input {
          width: 100%;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          color: white;
          font-size: 24px;
          text-align: center;
          margin-bottom: 24px;
          transition: border-color 0.2s;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        input:focus {
          outline: none;
          border-color: #6f6fd2;
        }

        .continue-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: #6f6fd2;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .continue-btn:hover:not(:disabled) {
          background: #5959a8;
        }

        .continue-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function VoiceStep({
  value,
  onChange,
  onContinue,
}: {
  value: boolean;
  onChange: (prefer: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="voice-step">
      <div className="icon-container">
        <Mic size={48} />
      </div>

      <h2>How do you prefer to share?</h2>
      <p>You can always switch between voice and text.</p>

      <div className="options">
        <button
          className={`option ${value ? 'selected' : ''}`}
          onClick={() => onChange(true)}
        >
          <Mic size={24} />
          <span className="option-title">Voice</span>
          <span className="option-desc">Speak naturally, we'll transcribe</span>
        </button>

        <button
          className={`option ${!value ? 'selected' : ''}`}
          onClick={() => onChange(false)}
        >
          <span className="keyboard-icon">⌨️</span>
          <span className="option-title">Typing</span>
          <span className="option-desc">Write at your own pace</span>
        </button>
      </div>

      <button className="continue-btn" onClick={onContinue}>
        Continue
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        .voice-step {
          text-align: center;
        }

        .icon-container {
          display: inline-flex;
          padding: 20px;
          background: rgba(111, 111, 210, 0.15);
          border-radius: 50%;
          margin-bottom: 24px;
          color: #6f6fd2;
        }

        h2 {
          font-size: 26px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }

        p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 32px;
        }

        .options {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .option.selected {
          border-color: #6f6fd2;
          background: rgba(111, 111, 210, 0.1);
        }

        .option-title {
          font-size: 18px;
          font-weight: 600;
        }

        .option-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .keyboard-icon {
          font-size: 24px;
        }

        .continue-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: #6f6fd2;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function TimeStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (time: string) => void;
  onContinue: () => void;
}) {
  const times = [
    { value: '07:00', label: '7 AM', icon: '🌅' },
    { value: '09:00', label: '9 AM', icon: '☀️' },
    { value: '12:00', label: '12 PM', icon: '🌤️' },
    { value: '18:00', label: '6 PM', icon: '🌆' },
    { value: '21:00', label: '9 PM', icon: '🌙' },
  ];

  return (
    <div className="time-step">
      <div className="icon-container">
        <Clock size={48} />
      </div>

      <h2>When's a good time for reflection?</h2>
      <p>We'll send a gentle daily reminder.</p>

      <div className="time-options">
        {times.map((time) => (
          <button
            key={time.value}
            className={`time-option ${value === time.value ? 'selected' : ''}`}
            onClick={() => onChange(time.value)}
          >
            <span className="time-icon">{time.icon}</span>
            <span className="time-label">{time.label}</span>
          </button>
        ))}
      </div>

      <button className="continue-btn" onClick={onContinue}>
        Continue
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        .time-step {
          text-align: center;
        }

        .icon-container {
          display: inline-flex;
          padding: 20px;
          background: rgba(16, 185, 129, 0.15);
          border-radius: 50%;
          margin-bottom: 24px;
          color: #10b981;
        }

        h2 {
          font-size: 26px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }

        p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 32px;
        }

        .time-options {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .time-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-option:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .time-option.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .time-icon {
          font-size: 24px;
        }

        .time-label {
          font-size: 14px;
          font-weight: 600;
        }

        .continue-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: #6f6fd2;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function GoalStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (goal: string) => void;
  onContinue: () => void;
}) {
  const goals = [
    { value: 'memories', label: 'Preserve my memories', icon: '📸' },
    { value: 'wisdom', label: 'Share my wisdom', icon: '🧠' },
    { value: 'family', label: 'Connect with family', icon: '👨‍👩‍👧‍👦' },
    { value: 'messages', label: 'Leave future messages', icon: '💌' },
    { value: 'all', label: 'All of the above', icon: '✨' },
  ];

  return (
    <div className="goal-step">
      <div className="icon-container">
        <Heart size={48} />
      </div>

      <h2>What matters most to you?</h2>
      <p>This helps us personalize your experience.</p>

      <div className="goal-options">
        {goals.map((goal) => (
          <button
            key={goal.value}
            className={`goal-option ${value === goal.value ? 'selected' : ''}`}
            onClick={() => onChange(goal.value)}
          >
            <span className="goal-icon">{goal.icon}</span>
            <span className="goal-label">{goal.label}</span>
          </button>
        ))}
      </div>

      <button
        className="continue-btn"
        onClick={onContinue}
        disabled={!value}
      >
        Continue
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        .goal-step {
          text-align: center;
        }

        .icon-container {
          display: inline-flex;
          padding: 20px;
          background: rgba(236, 72, 153, 0.15);
          border-radius: 50%;
          margin-bottom: 24px;
          color: #ec4899;
        }

        h2 {
          font-size: 26px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }

        p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 24px;
        }

        .goal-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .goal-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .goal-option:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .goal-option.selected {
          border-color: #ec4899;
          background: rgba(236, 72, 153, 0.1);
        }

        .goal-icon {
          font-size: 24px;
        }

        .goal-label {
          font-size: 16px;
          font-weight: 500;
        }

        .continue-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: #6f6fd2;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .continue-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function PeopleStep({
  value,
  onChange,
  onContinue,
}: {
  value: string[];
  onChange: (people: string[]) => void;
  onContinue: () => void;
}) {
  const [input, setInput] = useState('');

  const addPerson = () => {
    if (input.trim() && !value.includes(input.trim())) {
      onChange([...value, input.trim()]);
      setInput('');
    }
  };

  const removePerson = (name: string) => {
    onChange(value.filter((p) => p !== name));
  };

  return (
    <div className="people-step">
      <div className="icon-container">
        <Users size={48} />
      </div>

      <h2>Who are the important people in your life?</h2>
      <p>We'll help you capture memories with them.</p>

      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a name..."
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
        />
        <button className="add-btn" onClick={addPerson} disabled={!input.trim()}>
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="people-list">
          {value.map((name) => (
            <span key={name} className="person-tag">
              {name}
              <button onClick={() => removePerson(name)}>×</button>
            </span>
          ))}
        </div>
      )}

      <button className="continue-btn" onClick={onContinue}>
        Continue
        <ChevronRight size={20} />
      </button>

      <style jsx>{`
        .people-step {
          text-align: center;
        }

        .icon-container {
          display: inline-flex;
          padding: 20px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 50%;
          margin-bottom: 24px;
          color: #3b82f6;
        }

        h2 {
          font-size: 26px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }

        p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 24px;
        }

        .input-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        input {
          flex: 1;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: white;
          font-size: 16px;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        input:focus {
          outline: none;
          border-color: #6f6fd2;
        }

        .add-btn {
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
        }

        .add-btn:disabled {
          opacity: 0.5;
        }

        .people-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .person-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(111, 111, 210, 0.2);
          border-radius: 20px;
          color: white;
          font-size: 14px;
        }

        .person-tag button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          padding: 0;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }

        .continue-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: #6f6fd2;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function ReadyStep({ name, onContinue }: { name: string; onContinue: () => void }) {
  return (
    <div className="ready-step">
      <motion.div
        className="check-container"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <Check size={64} />
      </motion.div>

      <h1>You're all set, {name}!</h1>
      <p>
        Your story is ready to begin. We'll guide you every step of the way.
      </p>

      <button className="primary-btn" onClick={onContinue}>
        Start My Journey
        <Sparkles size={20} />
      </button>

      <style jsx>{`
        .ready-step {
          text-align: center;
        }

        .check-container {
          display: inline-flex;
          padding: 24px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2));
          border-radius: 50%;
          margin-bottom: 32px;
          color: #10b981;
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin: 0 0 16px;
        }

        p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin: 0 0 40px;
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 18px 36px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
