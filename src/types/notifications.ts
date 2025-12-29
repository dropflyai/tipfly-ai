// Notification Types for TipFly AI

export type NotificationPreferences = {
  // Local Notifications
  weeklySummary: boolean;
  goalProgress: boolean;
  goalAchieved: boolean;
  streakReminder: boolean;
  taxReminders: boolean; // Premium only

  // Email Notifications
  weeklyEmailSummary: boolean; // Monday morning email recap

  // Push Notifications
  teamPoolUpdates: boolean;
  teamInvites: boolean;
  announcements: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  weeklySummary: true,
  goalProgress: true,
  goalAchieved: true,
  streakReminder: true,
  taxReminders: true,
  weeklyEmailSummary: true,
  teamPoolUpdates: true,
  teamInvites: true,
  announcements: false,
};

export type NotificationType = keyof NotificationPreferences;

export type NotificationConfig = {
  key: NotificationType;
  title: string;
  description: string;
  isPremium?: boolean;
  isTeamFeature?: boolean;
  isEmailNotification?: boolean;
};

export const NOTIFICATION_CONFIGS: NotificationConfig[] = [
  // Local Notifications - Earnings & Goals
  {
    key: 'weeklySummary',
    title: 'Weekly Summary',
    description: 'Get your earnings recap every Sunday',
  },
  {
    key: 'goalProgress',
    title: 'Goal Progress',
    description: 'Know when you\'re close to hitting your goals',
  },
  {
    key: 'goalAchieved',
    title: 'Goal Achieved',
    description: 'Celebrate when you hit your targets',
  },
  {
    key: 'streakReminder',
    title: 'Streak Reminder',
    description: 'Don\'t lose your logging streak',
  },
  {
    key: 'taxReminders',
    title: 'Tax Reminders',
    description: 'Quarterly tax deadline alerts',
    isPremium: true,
  },
  // Email Notifications
  {
    key: 'weeklyEmailSummary',
    title: 'Weekly Email Summary',
    description: 'Receive your week\'s tips recap via email every Monday',
    isEmailNotification: true,
  },
  // Push Notifications - Teams
  {
    key: 'teamPoolUpdates',
    title: 'Team Pool Updates',
    description: 'When tip pools are distributed',
    isTeamFeature: true,
  },
  {
    key: 'teamInvites',
    title: 'Team Invites',
    description: 'When someone invites you to a team',
    isTeamFeature: true,
  },
  // Push Notifications - General
  {
    key: 'announcements',
    title: 'Announcements',
    description: 'New features and updates',
  },
];
