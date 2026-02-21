# Notification System — Daily Reflection & Engagement

*Spec v1.0 — 2026-02-20*

---

## Overview

Push notifications that gently encourage users to capture memories and wisdom, without being annoying. The goal is to build a daily reflection habit — 3-5 minutes of meaningful engagement that compounds over time.

**Principles:**
- Respectful, never pushy
- Personalized timing
- Varied content (not repetitive)
- Easy to snooze or disable
- Celebrates progress, doesn't guilt-trip

---

## Notification Types

### 1. 🌅 Daily Reflection Prompt
The core daily notification — a gentle nudge to spend a few minutes reflecting.

**Timing:** User-configurable (default 9:00 AM local time)

**Examples:**
- "Good morning, Chuck. Got 3 minutes for a memory?"
- "☕ Coffee time? Here's a quick question for you."
- "Your story matters. Ready to add a chapter?"

**Content:** Rotates through prompt types:
- Memory prompt (40%)
- Knowledge/wisdom prompt (30%)
- Photo review (15%)
- Quick question (15%)

### 2. 🔥 Streak Reminder
Sent when user is about to break a streak (evening of a day they haven't engaged).

**Timing:** 8:00 PM if no engagement that day

**Examples:**
- "7 day streak! Keep it going with one quick question?"
- "Don't break your 14-day streak — tap for a 30-second prompt"

**Behavior:**
- Only sent for streaks > 3 days
- Max once per day
- Respects "do not disturb" settings

### 3. 📅 Anniversary/Milestone Prompts
Triggered on anniversaries of captured memories.

**Timing:** Morning of the anniversary

**Examples:**
- "5 years ago today: Your wedding at The Umstead 💒"
- "This day in 2018: Emma was born 🎂"
- "Remember this? [Photo thumbnail] Barcelona, 2007"

**Actions:**
- View the memory
- Add more details
- Share with family

### 4. 🎂 Contact Birthday Reminders
Reminds user of upcoming birthdays in their contacts.

**Timing:** 3 days before, morning of

**Examples:**
- "Sarah's birthday is in 3 days! Record a message?"
- "Happy Birthday to Marcus! Want to send a TimeDrop?"

### 5. 👨‍👩‍👧 Family Activity Digest
Weekly summary of family engagement with the user's content.

**Timing:** Sunday morning

**Examples:**
- "This week: Sarah listened to 3 of your stories 💜"
- "Emma saved your career advice to her favorites ⭐"

### 6. 🎯 Milestone Celebrations
Celebrates user achievements without prompting action.

**Timing:** Immediately upon achievement

**Examples:**
- "🎉 50 memories captured! Your story is growing."
- "🔥 30-day streak! You're building something special."
- "🧠 10 pieces of wisdom shared. Future generations will thank you."

### 7. 💤 Gentle Re-engagement
For users who haven't engaged in 7+ days.

**Timing:** Morning, once per week max

**Examples:**
- "We miss you, Chuck. Your story is waiting."
- "3 minutes to capture a memory? No pressure."
- "Emma asked about your college days. Got a story to share?"

**Behavior:**
- Stops after 3 attempts
- Option to pause notifications

---

## Notification Schedule

### Default Schedule

| Time | Type | Frequency |
|------|------|-----------|
| 9:00 AM | Daily Reflection | Daily |
| 8:00 PM | Streak Reminder | Daily (if needed) |
| 9:00 AM | Anniversary | On date |
| 9:00 AM | Birthday (3 days) | As needed |
| 9:00 AM | Birthday (day of) | As needed |
| 10:00 AM | Sunday Digest | Weekly |
| Instant | Milestone | On achievement |
| 10:00 AM | Re-engagement | Weekly (if inactive) |

### User Controls

```typescript
interface NotificationPreferences {
  enabled: boolean;
  
  // Timing
  dailyReflectionTime: string;  // "09:00"
  timezone: string;             // "America/New_York"
  
  // Types
  dailyReflection: boolean;
  streakReminders: boolean;
  anniversaries: boolean;
  birthdays: boolean;
  familyDigest: boolean;
  milestones: boolean;
  reEngagement: boolean;
  
  // Quiet hours
  quietHoursStart: string;      // "22:00"
  quietHoursEnd: string;        // "07:00"
  
  // Frequency limits
  maxPerDay: number;            // Default: 3
}
```

---

## Data Model

### `notification_preferences` Table

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Timing
  daily_reflection_time TIME DEFAULT '09:00',
  timezone TEXT DEFAULT 'UTC',
  
  -- Types
  daily_reflection BOOLEAN DEFAULT TRUE,
  streak_reminders BOOLEAN DEFAULT TRUE,
  anniversaries BOOLEAN DEFAULT TRUE,
  birthdays BOOLEAN DEFAULT TRUE,
  family_digest BOOLEAN DEFAULT TRUE,
  milestones BOOLEAN DEFAULT TRUE,
  re_engagement BOOLEAN DEFAULT TRUE,
  
  -- Quiet hours
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  
  -- Limits
  max_per_day INTEGER DEFAULT 3,
  
  -- Tracking
  last_daily_sent_at TIMESTAMPTZ,
  last_streak_sent_at TIMESTAMPTZ,
  last_reengagement_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `notifications_sent` Table

```sql
CREATE TABLE notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- 'daily_reflection', 'streak', 'anniversary', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Delivery
  platform TEXT, -- 'ios', 'android', 'web'
  push_token TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  
  -- Related content
  prompt_id UUID REFERENCES engagement_prompts(id),
  memory_id UUID REFERENCES memories(id),
  contact_id UUID REFERENCES contacts(id),
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_notifications_user ON notifications_sent(user_id, sent_at DESC);
CREATE INDEX idx_notifications_type ON notifications_sent(user_id, type, sent_at DESC);
```

### `push_tokens` Table

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios', 'android', 'web'
  device_name TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, token)
);
```

---

## Implementation

### Push Notification Service

```typescript
// lib/notifications/push.ts

import * as admin from 'firebase-admin';
import webpush from 'web-push';

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export async function sendPushNotification(notification: PushNotification) {
  const supabase = createServiceClient();
  
  // Check user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', notification.userId)
    .single();
  
  if (!prefs?.enabled) return;
  if (!prefs[notification.type]) return;
  if (isQuietHours(prefs)) return;
  if (await exceedsDailyLimit(notification.userId, prefs.max_per_day)) return;
  
  // Get user's push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('user_id', notification.userId)
    .eq('is_active', true);
  
  if (!tokens?.length) return;
  
  // Send to each platform
  for (const token of tokens) {
    try {
      if (token.platform === 'ios' || token.platform === 'android') {
        await sendFCM(token.token, notification);
      } else if (token.platform === 'web') {
        await sendWebPush(token.token, notification);
      }
    } catch (error) {
      // Mark token as inactive if it fails
      await handlePushError(token.id, error);
    }
  }
  
  // Log notification
  await supabase.from('notifications_sent').insert({
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    metadata: notification.data,
  });
}

async function sendFCM(token: string, notification: PushNotification) {
  const message = {
    token,
    notification: {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
    },
    data: {
      type: notification.type,
      actionUrl: notification.actionUrl || '',
      ...notification.data,
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
    android: {
      notification: {
        channelId: 'daily-reflection',
        priority: 'high',
      },
    },
  };
  
  await admin.messaging().send(message);
}
```

### Scheduled Jobs (Cron)

```typescript
// jobs/daily-reflection.ts
// Runs every minute, checks which users need notifications

export async function processDailyReflections() {
  const supabase = createServiceClient();
  const now = new Date();
  
  // Find users whose daily time has arrived
  const { data: users } = await supabase
    .from('notification_preferences')
    .select('user_id, daily_reflection_time, timezone')
    .eq('enabled', true)
    .eq('daily_reflection', true)
    .is('last_daily_sent_at', null)
    .or(`last_daily_sent_at.lt.${startOfDay(now).toISOString()}`);
  
  for (const user of users || []) {
    // Check if it's the right time in user's timezone
    const userTime = getCurrentTimeInTimezone(user.timezone);
    const targetTime = user.daily_reflection_time;
    
    if (isWithinWindow(userTime, targetTime, 5)) { // 5 minute window
      // Generate a personalized prompt
      const prompt = await generateDailyPrompt(user.user_id);
      
      await sendPushNotification({
        userId: user.user_id,
        title: getDailyTitle(),
        body: prompt.promptText,
        type: 'daily_reflection',
        data: { promptId: prompt.id },
        actionUrl: `/app/engage?prompt=${prompt.id}`,
      });
      
      // Update last sent
      await supabase
        .from('notification_preferences')
        .update({ last_daily_sent_at: now })
        .eq('user_id', user.user_id);
    }
  }
}

// Randomized friendly titles
function getDailyTitle(): string {
  const titles = [
    "Good morning! ☀️",
    "3 minutes for a memory?",
    "Your story awaits",
    "Quick reflection?",
    "Got a minute?",
    "Time to remember",
  ];
  return titles[Math.floor(Math.random() * titles.length)];
}
```

### Anniversary Job

```typescript
// jobs/anniversaries.ts

export async function processAnniversaries() {
  const supabase = createServiceClient();
  const today = new Date();
  const monthDay = format(today, 'MM-dd');
  
  // Find memories with today's anniversary
  const { data: memories } = await supabase
    .from('memories')
    .select(`
      *,
      profiles!inner(id, full_name),
      notification_preferences!inner(anniversaries, timezone)
    `)
    .filter('date', 'ilike', `%-${monthDay}`)
    .eq('notification_preferences.anniversaries', true);
  
  for (const memory of memories || []) {
    const yearsAgo = today.getFullYear() - new Date(memory.date).getFullYear();
    if (yearsAgo <= 0) continue; // Skip this year's memories
    
    await sendPushNotification({
      userId: memory.user_id,
      title: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today`,
      body: memory.title,
      type: 'anniversary',
      data: { memoryId: memory.id },
      imageUrl: memory.media_url,
      actionUrl: `/app/memories/${memory.id}`,
    });
  }
}
```

---

## API Endpoints

### `GET /api/notifications/preferences`
Get current user's notification preferences.

### `PATCH /api/notifications/preferences`
Update notification preferences.

```typescript
// Request body
{
  dailyReflectionTime: "08:00",
  streakReminders: false,
  quietHoursStart: "23:00"
}
```

### `POST /api/notifications/register`
Register a push token.

```typescript
// Request body
{
  token: "ExponentPushToken[xxx]",
  platform: "ios",
  deviceName: "Chuck's iPhone"
}
```

### `DELETE /api/notifications/unregister`
Remove a push token.

### `GET /api/notifications/history`
Get notification history with open/delivery status.

---

## React Native Integration

### Expo Push Notifications

```typescript
// hooks/useNotifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  
  useEffect(() => {
    registerForPushNotifications();
  }, []);
  
  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications require physical device');
      return;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    setExpoPushToken(token);
    
    // Register with backend
    await fetch('/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName,
      }),
    });
    
    // Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('daily-reflection', {
        name: 'Daily Reflection',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }
  
  // Handle notification received
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Handle foreground notification
    });
    
    return () => subscription.remove();
  }, []);
  
  // Handle notification tapped
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data.promptId) {
        // Navigate to engagement prompt
        router.push(`/engage?prompt=${data.promptId}`);
      } else if (data.memoryId) {
        // Navigate to memory
        router.push(`/memories/${data.memoryId}`);
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  return { expoPushToken };
}
```

---

## Notification Content Guidelines

### Tone
- Warm, not corporate
- Conversational, not robotic
- Encouraging, not guilt-tripping
- Personal (use their name sparingly)

### Length
- Title: Max 50 characters
- Body: Max 100 characters
- Clear call-to-action implied

### Good Examples ✅
- "Good morning! Got 2 minutes for a quick memory?"
- "☕ Your daily reflection is ready"
- "5 years ago: Your wedding day 💒"
- "🔥 14 day streak! One quick question to keep it going?"

### Bad Examples ❌
- "You haven't opened the app in 3 days!" (guilt)
- "COMPLETE YOUR DAILY TASK NOW" (aggressive)
- "Your streak will be lost if you don't engage today" (threatening)
- "Open the app to see what's new!" (generic)

---

## Metrics to Track

| Metric | Description |
|--------|-------------|
| Send rate | Notifications sent per day |
| Delivery rate | % successfully delivered |
| Open rate | % opened (tapped) |
| Engagement rate | % that led to a completed action |
| Opt-out rate | % who disabled notifications |
| Time to engage | Time from notification to action |
| Streak impact | Correlation between reminders and streaks |

---

## Future Enhancements

1. **Smart Timing** — ML model to learn best time for each user based on engagement patterns

2. **Contextual Prompts** — Use calendar/location to suggest relevant prompts ("Looks like you're traveling — capture a memory?")

3. **Family Nudges** — "Mom hasn't shared a story in 2 weeks. Send her encouragement?"

4. **Voice Notifications** — Option to receive audio prompts in their cloned voice (premium)

5. **Widget Integration** — iOS/Android widgets showing daily prompt without opening app

---

*This spec defines the notification system. Update as we build and learn from user feedback.*
