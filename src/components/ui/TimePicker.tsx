'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string; // "09:00" format
  onChange: (time: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value
  const [hours, minutes] = value.split(':').map(Number);
  const isPM = hours >= 12;
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeChange = (newHours: number, newMinutes: number, newIsPM: boolean) => {
    let h = newHours;
    if (newIsPM && h !== 12) h += 12;
    if (!newIsPM && h === 12) h = 0;
    
    const timeString = `${h.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  const formatDisplay = () => {
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };

  // Quick time options
  const quickTimes = [
    { label: '6:00 AM', value: '06:00' },
    { label: '7:00 AM', value: '07:00' },
    { label: '8:00 AM', value: '08:00' },
    { label: '9:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '6:00 PM', value: '18:00' },
    { label: '8:00 PM', value: '20:00' },
    { label: '9:00 PM', value: '21:00' },
    { label: '10:00 PM', value: '22:00' },
  ];

  return (
    <div className="time-picker" ref={containerRef}>
      <button
        className="time-picker-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Clock size={16} />
        <span>{formatDisplay()}</span>
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="time-picker-dropdown">
          {/* Quick select */}
          <div className="quick-times">
            {quickTimes.map((time) => (
              <button
                key={time.value}
                className={`quick-time ${value === time.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(time.value);
                  setIsOpen(false);
                }}
              >
                {time.label}
              </button>
            ))}
          </div>

          {/* Manual select */}
          <div className="manual-time">
            <div className="time-spinners">
              <select
                value={displayHours}
                onChange={(e) => handleTimeChange(parseInt(e.target.value), minutes, isPM)}
              >
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span>:</span>
              <select
                value={minutes}
                onChange={(e) => handleTimeChange(displayHours, parseInt(e.target.value), isPM)}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <select
                value={isPM ? 'PM' : 'AM'}
                onChange={(e) => handleTimeChange(displayHours, minutes, e.target.value === 'PM')}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .time-picker {
          position: relative;
        }

        .time-picker-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-picker-trigger:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .time-picker-trigger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .time-picker-trigger .rotated {
          transform: rotate(180deg);
        }

        .time-picker-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          padding: 12px;
          background: rgba(30, 30, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          backdrop-filter: blur(12px);
          z-index: 50;
          min-width: 200px;
        }

        .quick-times {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quick-time {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid transparent;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-time:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .quick-time.selected {
          background: rgba(111, 111, 210, 0.2);
          border-color: rgba(111, 111, 210, 0.5);
          color: white;
        }

        .manual-time {
          padding-top: 4px;
        }

        .time-spinners {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .time-spinners select {
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }

        .time-spinners span {
          color: rgba(255, 255, 255, 0.5);
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
