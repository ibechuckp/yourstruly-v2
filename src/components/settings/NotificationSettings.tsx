'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  Moon, 
  Calendar, 
  Cake, 
  Users, 
  Trophy,
  MessageCircle,
  ChevronRight,
  Check
} from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Toggle } from '@/components/ui/Toggle';
import { TimePicker } from '@/components/ui/TimePicker';

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleChange = (key: string, value: any) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updatePreferences(localPrefs);
    setHasChanges(false);
  };

  if (isLoading || !localPrefs) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="notification-settings">
      <header className="settings-header">
        <Bell size={24} />
        <div>
          <h2>Notifications</h2>
          <p>Choose how and when we reach out</p>
        </div>
      </header>

      {/* Master toggle */}
      <section className="settings-section">
        <div className="setting-row master-toggle">
          <div className="setting-info">
            <span className="setting-label">Enable Notifications</span>
            <span className="setting-description">
              Receive reminders to capture memories
            </span>
          </div>
          <Toggle
            checked={localPrefs.enabled}
            onChange={(checked) => handleChange('enabled', checked)}
          />
        </div>
      </section>

      {localPrefs.enabled && (
        <>
          {/* Timing */}
          <section className="settings-section">
            <h3 className="section-title">
              <Clock size={18} />
              Timing
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Daily Reflection Time</span>
                <span className="setting-description">
                  When should we send your daily prompt?
                </span>
              </div>
              <TimePicker
                value={localPrefs.dailyReflectionTime}
                onChange={(time) => handleChange('dailyReflectionTime', time)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Quiet Hours</span>
                <span className="setting-description">
                  No notifications during these hours
                </span>
              </div>
              <div className="time-range">
                <TimePicker
                  value={localPrefs.quietHoursStart}
                  onChange={(time) => handleChange('quietHoursStart', time)}
                />
                <span className="time-separator">to</span>
                <TimePicker
                  value={localPrefs.quietHoursEnd}
                  onChange={(time) => handleChange('quietHoursEnd', time)}
                />
              </div>
            </div>
          </section>

          {/* Notification types */}
          <section className="settings-section">
            <h3 className="section-title">
              <MessageCircle size={18} />
              Notification Types
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <Bell size={18} className="setting-icon" />
                <div>
                  <span className="setting-label">Daily Reflection</span>
                  <span className="setting-description">
                    Your daily memory prompt
                  </span>
                </div>
              </div>
              <Toggle
                checked={localPrefs.dailyReflection}
                onChange={(checked) => handleChange('dailyReflection', checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <Trophy size={18} className="setting-icon" />
                <div>
                  <span className="setting-label">Streak Reminders</span>
                  <span className="setting-description">
                    Don't break your streak!
                  </span>
                </div>
              </div>
              <Toggle
                checked={localPrefs.streakReminders}
                onChange={(checked) => handleChange('streakReminders', checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <Calendar size={18} className="setting-icon" />
                <div>
                  <span className="setting-label">Anniversaries</span>
                  <span className="setting-description">
                    Memories from this day in past years
                  </span>
                </div>
              </div>
              <Toggle
                checked={localPrefs.anniversaries}
                onChange={(checked) => handleChange('anniversaries', checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <Cake size={18} className="setting-icon" />
                <div>
                  <span className="setting-label">Birthday Reminders</span>
                  <span className="setting-description">
                    Upcoming birthdays of your contacts
                  </span>
                </div>
              </div>
              <Toggle
                checked={localPrefs.birthdays}
                onChange={(checked) => handleChange('birthdays', checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <Users size={18} className="setting-icon" />
                <div>
                  <span className="setting-label">Family Activity</span>
                  <span className="setting-description">
                    Weekly digest of family engagement
                  </span>
                </div>
              </div>
              <Toggle
                checked={localPrefs.familyDigest}
                onChange={(checked) => handleChange('familyDigest', checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <Trophy size={18} className="setting-icon" />
                <div>
                  <span className="setting-label">Milestone Celebrations</span>
                  <span className="setting-description">
                    When you hit achievements
                  </span>
                </div>
              </div>
              <Toggle
                checked={localPrefs.milestones}
                onChange={(checked) => handleChange('milestones', checked)}
              />
            </div>
          </section>

          {/* Frequency */}
          <section className="settings-section">
            <h3 className="section-title">
              <Moon size={18} />
              Frequency
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Max notifications per day</span>
                <span className="setting-description">
                  We'll never send more than this
                </span>
              </div>
              <select
                value={localPrefs.maxPerDay}
                onChange={(e) => handleChange('maxPerDay', parseInt(e.target.value))}
                className="select-input"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
          </section>
        </>
      )}

      {/* Save button */}
      {hasChanges && (
        <motion.div
          className="save-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button className="save-btn" onClick={handleSave}>
            <Check size={18} />
            Save Changes
          </button>
        </motion.div>
      )}

      <style jsx>{`
        .notification-settings {
          max-width: 600px;
          padding-bottom: 100px;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .settings-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }

        .settings-header p {
          margin: 4px 0 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .settings-section {
          margin-bottom: 32px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .setting-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .setting-row:first-child {
          padding-top: 0;
        }

        .master-toggle {
          padding: 0;
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .setting-info > div {
          display: flex;
          flex-direction: column;
        }

        .setting-icon {
          color: rgba(255, 255, 255, 0.5);
          flex-shrink: 0;
        }

        .setting-label {
          font-size: 15px;
          font-weight: 500;
          color: white;
        }

        .setting-description {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }

        .time-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .time-separator {
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }

        .select-input {
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }

        .save-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          background: rgba(20, 20, 30, 0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: center;
          z-index: 100;
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: #6f6fd2;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .save-btn:hover {
          background: #5959a8;
        }

        @media (min-width: 640px) {
          .save-bar {
            left: var(--sidebar-collapsed);
          }
        }

        @media (min-width: 1024px) {
          .save-bar {
            left: var(--sidebar-width);
          }
        }
      `}</style>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="settings-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-section">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
      <style jsx>{`
        .settings-skeleton {
          max-width: 600px;
        }
        .skeleton-header {
          height: 60px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .skeleton-section {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }
        .skeleton-row {
          height: 60px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .skeleton-row:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
