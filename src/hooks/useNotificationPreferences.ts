'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NotificationPreferences {
  enabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyReflectionTime: string;
  maxPerDay: number;
  
  // Notification types
  dailyReflection: boolean;
  streakReminders: boolean;
  anniversaries: boolean;
  birthdays: boolean;
  familyDigest: boolean;
  milestones: boolean;
  
  // Prompt types (legacy)
  promptTypes: {
    photoBackstory: boolean;
    tagPerson: boolean;
    missingInfo: boolean;
    memoryPrompt: boolean;
    knowledge: boolean;
    connectDots: boolean;
    highlight: boolean;
    quickQuestion: boolean;
  };
  
  // Channels
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  dailyReflectionTime: '09:00',
  maxPerDay: 5,
  
  dailyReflection: true,
  streakReminders: true,
  anniversaries: true,
  birthdays: true,
  familyDigest: true,
  milestones: true,
  
  promptTypes: {
    photoBackstory: true,
    tagPerson: true,
    missingInfo: true,
    memoryPrompt: true,
    knowledge: true,
    connectDots: true,
    highlight: true,
    quickQuestion: true,
  },
  channels: {
    push: true,
    email: false,
    sms: false,
  },
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (data?.notification_preferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.notification_preferences });
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const merged = { ...preferences, ...newPrefs };
      
      await supabase
        .from('profiles')
        .update({ notification_preferences: merged })
        .eq('id', user.id);

      setPreferences(merged);
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
      throw err;
    }
  }, [preferences, supabase]);

  return {
    preferences,
    isLoading,
    updatePreferences,
  };
}
