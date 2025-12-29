// Weekly Summary Service
// Handles user preferences for weekly email summaries
import { supabase } from '../api/supabase';

export interface NotificationPreferences {
  weekly_summary: boolean;
  streak_reminders: boolean;
  goal_alerts: boolean;
  team_updates: boolean;
  tax_reminders: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  weekly_summary: true,
  streak_reminders: true,
  goal_alerts: true,
  team_updates: true,
  tax_reminders: true,
};

// Get user's notification preferences
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_PREFERENCES;

    const { data, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    if (error || !data?.notification_preferences) {
      return DEFAULT_PREFERENCES;
    }

    return {
      ...DEFAULT_PREFERENCES,
      ...data.notification_preferences,
    };
  } catch (error) {
    console.error('[WeeklySummary] Error getting preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get current preferences
    const current = await getNotificationPreferences();
    const updated = { ...current, ...preferences };

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: updated })
      .eq('id', user.id);

    if (error) {
      console.error('[WeeklySummary] Error updating preferences:', error);
      return false;
    }

    console.log('[WeeklySummary] Preferences updated:', updated);
    return true;
  } catch (error) {
    console.error('[WeeklySummary] Error updating preferences:', error);
    return false;
  }
};

// Toggle weekly summary emails
export const toggleWeeklySummary = async (enabled: boolean): Promise<boolean> => {
  return updateNotificationPreferences({ weekly_summary: enabled });
};

// Request a manual weekly summary (for testing or on-demand)
export const requestWeeklySummary = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.functions.invoke('send-weekly-summary', {
      body: { userId: user.id },
    });

    if (error) {
      console.error('[WeeklySummary] Error requesting summary:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[WeeklySummary] Error requesting summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request summary',
    };
  }
};

// Get summary history
export interface SummaryLogEntry {
  id: string;
  week_start: string;
  sent_at: string;
  stats: {
    totalTips: number;
    tipCount: number;
    totalHours: number;
    avgPerHour: number;
  } | null;
}

export const getSummaryHistory = async (limit = 10): Promise<SummaryLogEntry[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('weekly_summary_log')
      .select('id, week_start, sent_at, stats')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[WeeklySummary] Error getting history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[WeeklySummary] Error getting history:', error);
    return [];
  }
};

// Check if email is verified (required for email summaries)
export const isEmailVerified = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', user.id)
      .single();

    if (error || !data) return false;

    return data.email_verified === true;
  } catch (error) {
    console.error('[WeeklySummary] Error checking email verification:', error);
    return false;
  }
};
