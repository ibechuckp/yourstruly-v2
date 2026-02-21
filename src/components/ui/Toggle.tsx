'use client';

import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
}: ToggleProps) {
  const sizes = {
    sm: { width: 36, height: 20, knob: 16 },
    md: { width: 48, height: 26, knob: 22 },
    lg: { width: 56, height: 32, knob: 28 },
  };

  const { width, height, knob } = sizes[size];
  const padding = (height - knob) / 2;

  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${height / 2}px`,
      }}
    >
      <motion.div
        className="toggle-knob"
        animate={{
          x: checked ? width - knob - padding : padding,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        style={{
          width: `${knob}px`,
          height: `${knob}px`,
        }}
      />

      <style jsx>{`
        .toggle {
          position: relative;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .toggle:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .toggle.checked {
          background: #6f6fd2;
        }

        .toggle.checked:hover:not(.disabled) {
          background: #5959a8;
        }

        .toggle.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle:focus-visible {
          outline: 3px solid rgba(111, 111, 210, 0.5);
          outline-offset: 2px;
        }

        .toggle-knob {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </button>
  );
}
