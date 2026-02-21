/**
 * YoursTruly v2 — Analytics Events Schema
 * 
 * All trackable events with their properties.
 * Use with any analytics provider (Mixpanel, Amplitude, PostHog, etc.)
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export type AnalyticsEvent =
  // Onboarding
  | OnboardingStarted
  | OnboardingStepCompleted
  | OnboardingCompleted
  | OnboardingAbandoned
  
  // Authentication
  | SignUpCompleted
  | SignInCompleted
  | SignOutCompleted
  
  // Engagement Bubbles
  | BubbleViewed
  | BubbleExpanded
  | BubbleAnswered
  | BubbleSkipped
  | BubbleDismissed
  | BubblesShuffled
  
  // Memories
  | MemoryCreated
  | MemoryViewed
  | MemoryEdited
  | MemoryDeleted
  | MemoryShared
  
  // Knowledge
  | KnowledgeEntryCreated
  | KnowledgeEntryViewed
  | KnowledgeEntryEdited
  
  // Contacts
  | ContactCreated
  | ContactViewed
  | ContactEdited
  | ContactDeleted
  | ContactTagged
  
  // Media
  | PhotoUploaded
  | PhotoBackstoryAdded
  | VoiceRecorded
  | VoiceTranscribed
  
  // TimeDrops / PostScripts
  | TimeDropCreated
  | TimeDropScheduled
  | TimeDropDelivered
  | TimeDropOpened
  
  // Engagement
  | DailyReflectionStarted
  | DailyReflectionCompleted
  | StreakAchieved
  | MilestoneReached
  
  // Notifications
  | NotificationReceived
  | NotificationOpened
  | NotificationSettingsChanged
  
  // Navigation
  | PageViewed
  | FeatureUsed
  
  // Errors
  | ErrorOccurred;

// ============================================================================
// ONBOARDING EVENTS
// ============================================================================

interface OnboardingStarted {
  event: 'onboarding_started';
  properties: {
    source: 'organic' | 'invite' | 'ad' | 'referral';
    platform: 'web' | 'ios' | 'android';
  };
}

interface OnboardingStepCompleted {
  event: 'onboarding_step_completed';
  properties: {
    step: 'welcome' | 'name' | 'voice_preference' | 'daily_time' | 'goal' | 'people' | 'ready';
    stepNumber: number;
    totalSteps: number;
    timeSpentSeconds: number;
    skipped: boolean;
  };
}

interface OnboardingCompleted {
  event: 'onboarding_completed';
  properties: {
    totalTimeSeconds: number;
    stepsCompleted: number;
    stepsSkipped: number;
    preferVoice: boolean;
    dailyTime: string;
    primaryGoal: string;
    importantPeopleCount: number;
  };
}

interface OnboardingAbandoned {
  event: 'onboarding_abandoned';
  properties: {
    lastStep: string;
    stepsCompleted: number;
    timeSpentSeconds: number;
  };
}

// ============================================================================
// AUTH EVENTS
// ============================================================================

interface SignUpCompleted {
  event: 'sign_up_completed';
  properties: {
    method: 'email' | 'google' | 'apple' | 'phone';
    platform: 'web' | 'ios' | 'android';
  };
}

interface SignInCompleted {
  event: 'sign_in_completed';
  properties: {
    method: 'email' | 'google' | 'apple' | 'phone';
    platform: 'web' | 'ios' | 'android';
  };
}

interface SignOutCompleted {
  event: 'sign_out_completed';
  properties: {
    sessionDurationMinutes: number;
  };
}

// ============================================================================
// ENGAGEMENT BUBBLE EVENTS
// ============================================================================

interface BubbleViewed {
  event: 'bubble_viewed';
  properties: {
    bubbleId: string;
    bubbleType: string;
    category?: string;
    position: number;
    isPersonalized: boolean;
    personalizationContext?: string;
  };
}

interface BubbleExpanded {
  event: 'bubble_expanded';
  properties: {
    bubbleId: string;
    bubbleType: string;
    category?: string;
    timeToExpandSeconds: number;
  };
}

interface BubbleAnswered {
  event: 'bubble_answered';
  properties: {
    bubbleId: string;
    bubbleType: string;
    category?: string;
    responseType: 'voice' | 'text' | 'selection' | 'contact' | 'date';
    responseLength?: number;
    responseDurationSeconds?: number;
    timeToAnswerSeconds: number;
    isPersonalized: boolean;
  };
}

interface BubbleSkipped {
  event: 'bubble_skipped';
  properties: {
    bubbleId: string;
    bubbleType: string;
    category?: string;
    wasExpanded: boolean;
    timeViewedSeconds: number;
  };
}

interface BubbleDismissed {
  event: 'bubble_dismissed';
  properties: {
    bubbleId: string;
    bubbleType: string;
    category?: string;
  };
}

interface BubblesShuffled {
  event: 'bubbles_shuffled';
  properties: {
    previousCount: number;
    newCount: number;
    answeredBeforeShuffle: number;
  };
}

// ============================================================================
// MEMORY EVENTS
// ============================================================================

interface MemoryCreated {
  event: 'memory_created';
  properties: {
    memoryId: string;
    source: 'bubble' | 'manual' | 'photo' | 'voice' | 'import';
    hasPhoto: boolean;
    hasAudio: boolean;
    hasLocation: boolean;
    tagCount: number;
    sharedWithCount: number;
    wordCount: number;
    category?: string;
  };
}

interface MemoryViewed {
  event: 'memory_viewed';
  properties: {
    memoryId: string;
    isOwner: boolean;
    source: 'feed' | 'profile' | 'search' | 'notification' | 'share';
  };
}

interface MemoryEdited {
  event: 'memory_edited';
  properties: {
    memoryId: string;
    fieldsEdited: string[];
  };
}

interface MemoryDeleted {
  event: 'memory_deleted';
  properties: {
    memoryId: string;
    ageInDays: number;
  };
}

interface MemoryShared {
  event: 'memory_shared';
  properties: {
    memoryId: string;
    shareMethod: 'contact' | 'link' | 'export';
    recipientCount: number;
  };
}

// ============================================================================
// KNOWLEDGE EVENTS
// ============================================================================

interface KnowledgeEntryCreated {
  event: 'knowledge_entry_created';
  properties: {
    entryId: string;
    category: string;
    subcategory?: string;
    responseType: 'voice' | 'text';
    wordCount: number;
    durationSeconds?: number;
    isPersonalized: boolean;
    relatedInterest?: string;
    relatedSkill?: string;
    relatedReligion?: string;
  };
}

interface KnowledgeEntryViewed {
  event: 'knowledge_entry_viewed';
  properties: {
    entryId: string;
    category: string;
    isOwner: boolean;
    viewedBy: 'owner' | 'family' | 'public';
  };
}

interface KnowledgeEntryEdited {
  event: 'knowledge_entry_edited';
  properties: {
    entryId: string;
    category: string;
  };
}

// ============================================================================
// CONTACT EVENTS
// ============================================================================

interface ContactCreated {
  event: 'contact_created';
  properties: {
    contactId: string;
    relationshipType: string;
    hasPhoto: boolean;
    hasBirthday: boolean;
    source: 'manual' | 'import' | 'tag';
  };
}

interface ContactViewed {
  event: 'contact_viewed';
  properties: {
    contactId: string;
    relationshipType: string;
  };
}

interface ContactEdited {
  event: 'contact_edited';
  properties: {
    contactId: string;
    fieldsEdited: string[];
  };
}

interface ContactDeleted {
  event: 'contact_deleted';
  properties: {
    contactId: string;
    relationshipType: string;
    memoriesCount: number;
  };
}

interface ContactTagged {
  event: 'contact_tagged';
  properties: {
    contactId: string;
    relationshipType: string;
    taggedIn: 'memory' | 'photo' | 'knowledge';
    source: 'bubble' | 'manual';
  };
}

// ============================================================================
// MEDIA EVENTS
// ============================================================================

interface PhotoUploaded {
  event: 'photo_uploaded';
  properties: {
    photoId: string;
    source: 'camera' | 'gallery' | 'import';
    hasExifData: boolean;
    facesDetected: number;
  };
}

interface PhotoBackstoryAdded {
  event: 'photo_backstory_added';
  properties: {
    photoId: string;
    responseType: 'voice' | 'text';
    wordCount: number;
    source: 'bubble' | 'manual';
  };
}

interface VoiceRecorded {
  event: 'voice_recorded';
  properties: {
    durationSeconds: number;
    purpose: 'memory' | 'knowledge' | 'backstory' | 'timedrop';
  };
}

interface VoiceTranscribed {
  event: 'voice_transcribed';
  properties: {
    durationSeconds: number;
    wordCount: number;
    confidence: number;
    language: string;
  };
}

// ============================================================================
// TIMEDROP EVENTS
// ============================================================================

interface TimeDropCreated {
  event: 'timedrop_created';
  properties: {
    timedropId: string;
    recipientRelationship: string;
    triggerType: 'date' | 'event';
    triggerEvent?: string;
    contentType: 'text' | 'voice' | 'video';
    scheduledDate?: string;
  };
}

interface TimeDropScheduled {
  event: 'timedrop_scheduled';
  properties: {
    timedropId: string;
    daysUntilDelivery: number;
  };
}

interface TimeDropDelivered {
  event: 'timedrop_delivered';
  properties: {
    timedropId: string;
    deliveryMethod: 'email' | 'sms' | 'app' | 'physical';
    recipientRelationship: string;
  };
}

interface TimeDropOpened {
  event: 'timedrop_opened';
  properties: {
    timedropId: string;
    hoursAfterDelivery: number;
    deviceType: string;
  };
}

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

interface DailyReflectionStarted {
  event: 'daily_reflection_started';
  properties: {
    triggerSource: 'notification' | 'manual' | 'widget';
    currentStreak: number;
  };
}

interface DailyReflectionCompleted {
  event: 'daily_reflection_completed';
  properties: {
    promptsAnswered: number;
    totalTimeSeconds: number;
    currentStreak: number;
  };
}

interface StreakAchieved {
  event: 'streak_achieved';
  properties: {
    streakDays: number;
    milestone: boolean; // 7, 14, 30, 60, 90, 180, 365
  };
}

interface MilestoneReached {
  event: 'milestone_reached';
  properties: {
    milestoneType: 'memories' | 'knowledge' | 'contacts' | 'photos' | 'timedrops' | 'streak';
    milestoneValue: number;
  };
}

// ============================================================================
// NOTIFICATION EVENTS
// ============================================================================

interface NotificationReceived {
  event: 'notification_received';
  properties: {
    notificationType: string;
    platform: 'ios' | 'android' | 'web';
  };
}

interface NotificationOpened {
  event: 'notification_opened';
  properties: {
    notificationType: string;
    timeToOpenSeconds: number;
    platform: 'ios' | 'android' | 'web';
  };
}

interface NotificationSettingsChanged {
  event: 'notification_settings_changed';
  properties: {
    setting: string;
    newValue: boolean | string;
    previousValue: boolean | string;
  };
}

// ============================================================================
// NAVIGATION EVENTS
// ============================================================================

interface PageViewed {
  event: 'page_viewed';
  properties: {
    pageName: string;
    pageUrl: string;
    referrer?: string;
    timeOnPreviousPageSeconds?: number;
  };
}

interface FeatureUsed {
  event: 'feature_used';
  properties: {
    featureName: string;
    context: string;
  };
}

// ============================================================================
// ERROR EVENTS
// ============================================================================

interface ErrorOccurred {
  event: 'error_occurred';
  properties: {
    errorType: string;
    errorMessage: string;
    errorCode?: string;
    context: string;
    recoverable: boolean;
  };
}

// ============================================================================
// ANALYTICS CLIENT
// ============================================================================

type EventProperties<T extends AnalyticsEvent> = T['properties'];

class Analytics {
  private userId: string | null = null;
  private sessionId: string | null = null;
  private enabled: boolean = true;

  init(userId: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;
    // Send to analytics provider
    if (this.enabled) {
      console.log('[Analytics] Identify:', userId, traits);
      // mixpanel.identify(userId);
      // mixpanel.people.set(traits);
    }
  }

  track<T extends AnalyticsEvent>(
    event: T['event'],
    properties: T['properties']
  ) {
    if (!this.enabled) return;

    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        platform: this.getPlatform(),
      },
    };

    console.log('[Analytics] Track:', payload);
    // mixpanel.track(event, payload.properties);
    // posthog.capture(event, payload.properties);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPlatform(): string {
    if (typeof window === 'undefined') return 'server';
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
    if (/Android/.test(navigator.userAgent)) return 'android';
    return 'web';
  }
}

export const analytics = new Analytics();

// ============================================================================
// HELPER HOOKS
// ============================================================================

export function usePageTracking(pageName: string) {
  if (typeof window !== 'undefined') {
    analytics.track<PageViewed>('page_viewed', {
      pageName,
      pageUrl: window.location.href,
      referrer: document.referrer,
    });
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
import { analytics } from '@/lib/analytics/events';

// Track bubble answered
analytics.track<BubbleAnswered>('bubble_answered', {
  bubbleId: prompt.id,
  bubbleType: prompt.type,
  category: prompt.category,
  responseType: 'voice',
  responseLength: transcription.length,
  responseDurationSeconds: 45,
  timeToAnswerSeconds: 30,
  isPersonalized: true,
});

// Track knowledge entry created
analytics.track<KnowledgeEntryCreated>('knowledge_entry_created', {
  entryId: entry.id,
  category: 'life_lessons',
  responseType: 'voice',
  wordCount: 150,
  durationSeconds: 60,
  isPersonalized: true,
  relatedInterest: 'cooking',
});
*/
