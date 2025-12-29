// Analytics Service for TipFly AI
// Wrapper for analytics provider (Mixpanel/Amplitude)
// Currently uses console logging - replace with actual SDK when ready

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, EventProperties, UserProperties } from './events';

// Configuration
const ANALYTICS_ENABLED = !__DEV__; // Disable in development
const ANALYTICS_DEBUG = __DEV__; // Log to console in development
const QUEUE_KEY = 'analytics_queue';
const MAX_QUEUE_SIZE = 100;

// Event queue for offline support
interface QueuedEvent {
  event: AnalyticsEvent;
  properties: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
}

let currentSessionId: string | null = null;
let sessionStartTime: Date | null = null;
let userId: string | null = null;
let userProperties: Partial<UserProperties> = {};

// Generate a unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Initialize analytics
export const initializeAnalytics = async (): Promise<void> => {
  currentSessionId = generateSessionId();
  sessionStartTime = new Date();

  // TODO: Initialize actual analytics SDK here
  // Example for Mixpanel:
  // import { Mixpanel } from 'mixpanel-react-native';
  // const mixpanel = new Mixpanel('YOUR_PROJECT_TOKEN', true);
  // await mixpanel.init();

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Initialized with session:', currentSessionId);
  }

  // Flush any queued events from previous sessions
  await flushEventQueue();
};

// Set user identity
export const identifyUser = (id: string, properties?: Partial<UserProperties>): void => {
  userId = id;

  if (properties) {
    userProperties = { ...userProperties, ...properties };
  }

  // Add platform info
  userProperties.platform = Platform.OS as 'ios' | 'android';
  userProperties.user_id = id;

  // TODO: Call actual SDK identify
  // mixpanel.identify(id);
  // mixpanel.getPeople().set(userProperties);

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Identified user:', id, userProperties);
  }
};

// Update user properties
export const setUserProperties = (properties: Partial<UserProperties>): void => {
  userProperties = { ...userProperties, ...properties };

  // TODO: Call actual SDK
  // mixpanel.getPeople().set(properties);

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Updated user properties:', properties);
  }
};

// Track an event
export const trackEvent = async <E extends AnalyticsEvent>(
  event: E,
  properties?: E extends keyof EventProperties ? EventProperties[E] : Record<string, unknown>
): Promise<void> => {
  const eventData = {
    event,
    properties: {
      ...properties,
      session_id: currentSessionId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    },
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || 'unknown',
  };

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Track:', event, eventData.properties);
  }

  if (!ANALYTICS_ENABLED) {
    return;
  }

  // TODO: Send to actual analytics SDK
  // mixpanel.track(event, eventData.properties);

  // Queue event for offline support
  await queueEvent(eventData);
};

// Queue event for later sending
const queueEvent = async (event: QueuedEvent): Promise<void> => {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedEvent[] = queueJson ? JSON.parse(queueJson) : [];

    // Add event to queue
    queue.push(event);

    // Trim queue if too large
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Analytics] Failed to queue event:', error);
  }
};

// Flush queued events
export const flushEventQueue = async (): Promise<void> => {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueJson) return;

    const queue: QueuedEvent[] = JSON.parse(queueJson);
    if (queue.length === 0) return;

    if (ANALYTICS_DEBUG) {
      console.log('[Analytics] Flushing', queue.length, 'queued events');
    }

    // TODO: Send queued events to analytics service
    // for (const event of queue) {
    //   await mixpanel.track(event.event, event.properties);
    // }

    // Clear queue after successful send
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('[Analytics] Failed to flush queue:', error);
  }
};

// Track screen views
export const trackScreen = (screenName: string, properties?: Record<string, unknown>): void => {
  trackEvent('feature_used', {
    feature: 'screen_view',
    screen: screenName,
    ...properties,
  } as EventProperties['feature_used']);
};

// Track errors
export const trackError = (
  errorType: string,
  message: string,
  screen?: string
): void => {
  trackEvent('error_occurred', {
    error_type: errorType,
    message,
    screen,
  });
};

// Get session duration
export const getSessionDuration = (): number => {
  if (!sessionStartTime) return 0;
  return Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
};

// End session
export const endSession = (): void => {
  const duration = getSessionDuration();

  trackEvent('app_backgrounded', {
    session_duration_seconds: duration,
  });

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Session ended, duration:', duration, 'seconds');
  }
};

// Resume session
export const resumeSession = (): void => {
  // Start new session if previous was too long ago
  const newSession = generateSessionId();
  currentSessionId = newSession;
  sessionStartTime = new Date();

  trackEvent('app_foregrounded', {});

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Session resumed:', newSession);
  }
};

// Reset analytics (for logout)
export const resetAnalytics = (): void => {
  userId = null;
  userProperties = {};

  // TODO: Reset actual SDK
  // mixpanel.reset();

  if (ANALYTICS_DEBUG) {
    console.log('[Analytics] Reset');
  }
};

// Export convenience functions for common events
export const Analytics = {
  init: initializeAnalytics,
  identify: identifyUser,
  setUserProperties,
  track: trackEvent,
  trackScreen,
  trackError,
  endSession,
  resumeSession,
  reset: resetAnalytics,
  flush: flushEventQueue,

  // Convenience methods for common events
  tipAdded: (amount: number, shiftType: string, isOffline: boolean = false) => {
    trackEvent('tip_added', {
      amount,
      shift_type: shiftType,
      has_hours: true,
      has_notes: false,
      is_offline: isOffline,
    });
  },

  featureUsed: (feature: string, screen?: string) => {
    trackEvent('feature_used', { feature, screen });
  },

  premiumBlocked: (feature: string) => {
    trackEvent('premium_feature_blocked', { feature });
  },

  upgradeViewed: (source: string) => {
    trackEvent('upgrade_screen_viewed', { source });
  },

  subscriptionStarted: (plan: 'monthly' | 'annual', price: number) => {
    trackEvent('subscription_started', { plan, price });
  },

  referralShared: (method: string) => {
    trackEvent('referral_link_shared', { method });
  },

  streakAchieved: (days: number) => {
    trackEvent('streak_achieved', { days });
  },

  goalCompleted: (type: string, targetAmount: number, daysToComplete: number) => {
    trackEvent('goal_completed', {
      type: type as 'daily' | 'weekly' | 'monthly',
      target_amount: targetAmount,
      days_to_complete: daysToComplete,
    });
  },
};

export default Analytics;
