// Analytics Event Definitions for TipFly AI
// These events help track user behavior and app performance

export type AnalyticsEvent =
  // App Lifecycle
  | 'app_opened'
  | 'app_backgrounded'
  | 'app_foregrounded'

  // Authentication
  | 'user_signed_up'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'password_reset_requested'

  // Onboarding
  | 'onboarding_started'
  | 'onboarding_job_selected'
  | 'onboarding_completed'
  | 'onboarding_skipped'

  // Tip Tracking
  | 'tip_added'
  | 'tip_edited'
  | 'tip_deleted'
  | 'tip_added_offline'
  | 'tips_synced'

  // Features
  | 'feature_used'
  | 'premium_feature_blocked'
  | 'voice_input_used'
  | 'receipt_captured'

  // Goals
  | 'goal_created'
  | 'goal_completed'
  | 'goal_deleted'

  // Teams
  | 'team_created'
  | 'team_joined'
  | 'team_left'
  | 'pool_created'
  | 'pool_distributed'

  // Subscription
  | 'upgrade_screen_viewed'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'subscription_restored'
  | 'trial_started'

  // Referrals
  | 'referral_link_shared'
  | 'referral_code_entered'
  | 'referral_completed'
  | 'referral_reward_claimed'

  // Engagement
  | 'streak_achieved'
  | 'badge_earned'
  | 'notification_opened'
  | 'weekly_summary_viewed'

  // Errors
  | 'error_occurred'
  | 'sync_failed'
  | 'api_error';

// Event property types
export interface EventProperties {
  // App events
  app_opened: { source?: 'notification' | 'deep_link' | 'normal' };
  app_backgrounded: { session_duration_seconds: number };
  app_foregrounded: Record<string, never>;

  // Auth events
  user_signed_up: { method: 'email' | 'google' | 'apple' };
  user_logged_in: { method: 'email' | 'google' | 'apple' | 'biometric' };
  user_logged_out: Record<string, never>;
  password_reset_requested: Record<string, never>;

  // Onboarding events
  onboarding_started: Record<string, never>;
  onboarding_job_selected: { job_type: string };
  onboarding_completed: { duration_seconds: number };
  onboarding_skipped: { step: string };

  // Tip events
  tip_added: {
    amount: number;
    shift_type: string;
    has_hours: boolean;
    has_notes: boolean;
    is_offline: boolean;
    job_id?: string;
  };
  tip_edited: { field_changed: string };
  tip_deleted: Record<string, never>;
  tip_added_offline: { amount: number };
  tips_synced: { count: number; success: boolean };

  // Feature events
  feature_used: { feature: string; screen?: string };
  premium_feature_blocked: { feature: string };
  voice_input_used: { success: boolean; duration_ms?: number };
  receipt_captured: { success: boolean };

  // Goal events
  goal_created: { type: 'daily' | 'weekly' | 'monthly'; target_amount: number };
  goal_completed: { type: string; target_amount: number; days_to_complete: number };
  goal_deleted: { type: string; progress_percent: number };

  // Team events
  team_created: { member_count: number };
  team_joined: { via: 'code' | 'invite' };
  team_left: { was_owner: boolean };
  pool_created: { total_amount: number; member_count: number };
  pool_distributed: { total_amount: number; member_count: number };

  // Subscription events
  upgrade_screen_viewed: { source: string };
  subscription_started: { plan: 'monthly' | 'annual'; price: number };
  subscription_cancelled: { reason?: string };
  subscription_restored: Record<string, never>;
  trial_started: { duration_days: number };

  // Referral events
  referral_link_shared: { method: string };
  referral_code_entered: { valid: boolean };
  referral_completed: { referrer_total: number };
  referral_reward_claimed: { reward_type: string };

  // Engagement events
  streak_achieved: { days: number };
  badge_earned: { badge_id: string; badge_name: string };
  notification_opened: { type: string };
  weekly_summary_viewed: { week_total: number };

  // Error events
  error_occurred: { error_type: string; message: string; screen?: string };
  sync_failed: { error: string; pending_count: number };
  api_error: { endpoint: string; status_code: number; message: string };
}

// User properties that persist across sessions
export interface UserProperties {
  user_id: string;
  email?: string;
  job_type?: string;
  subscription_tier: 'free' | 'premium';
  account_created_at: string;
  total_tips_logged: number;
  current_streak: number;
  referral_count: number;
  platform: 'ios' | 'android';
  app_version: string;
}
