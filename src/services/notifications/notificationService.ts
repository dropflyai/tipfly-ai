// Notification Service for TipFly AI
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useNotificationStore } from '../../store/notificationStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00A8E8',
    });
  }

  return true;
}

// Get push token for remote notifications
export async function getPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '678843bb-99fd-4806-b1a7-79e07f4346af', // From app.json
    });
    console.log('[Notifications] Push token:', token.data);
    return token.data;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

// Initialize notifications
export async function initializeNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  useNotificationStore.getState().setHasPermission(hasPermission);

  if (hasPermission) {
    const token = await getPushToken();
    useNotificationStore.getState().setPushToken(token);
  }
}

// Schedule weekly summary notification (Sunday at 7 PM)
export async function scheduleWeeklySummary(): Promise<string | null> {
  try {
    // Cancel existing weekly summary notifications
    await cancelNotificationsByTag('weekly-summary');

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Earnings Summary',
        body: 'Tap to see how much you earned this week!',
        data: { type: 'weekly-summary' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 19,
        minute: 0,
      },
    });

    console.log('[Notifications] Scheduled weekly summary:', id);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling weekly summary:', error);
    return null;
  }
}

// Schedule streak reminder (daily at 9 PM if no entry logged)
export async function scheduleStreakReminder(): Promise<string | null> {
  try {
    // Cancel existing streak reminders
    await cancelNotificationsByTag('streak-reminder');

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep Your Streak Going!',
        body: "Don't forget to log today's tips",
        data: { type: 'streak-reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });

    console.log('[Notifications] Scheduled streak reminder:', id);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling streak reminder:', error);
    return null;
  }
}

// Cancel streak reminder for today (call when user logs a tip)
export async function cancelTodayStreakReminder(): Promise<void> {
  await cancelNotificationsByTag('streak-reminder');
  // Reschedule for tomorrow
  await scheduleStreakReminder();
}

// Schedule quarterly tax reminder
export async function scheduleTaxReminders(): Promise<void> {
  try {
    // Cancel existing tax reminders
    await cancelNotificationsByTag('tax-reminder');

    // Q1: April 15, Q2: June 15, Q3: September 15, Q4: January 15
    const taxDates = [
      { month: 4, day: 10, quarter: 'Q1' }, // Reminder 5 days before
      { month: 6, day: 10, quarter: 'Q2' },
      { month: 9, day: 10, quarter: 'Q3' },
      { month: 1, day: 10, quarter: 'Q4' },
    ];

    for (const date of taxDates) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${date.quarter} Tax Deadline Approaching`,
          body: 'Quarterly taxes are due in 5 days. Check your estimated amount.',
          data: { type: 'tax-reminder', quarter: date.quarter },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          month: date.month,
          day: date.day,
          hour: 10,
          minute: 0,
        },
      });
    }

    console.log('[Notifications] Scheduled tax reminders');
  } catch (error) {
    console.error('[Notifications] Error scheduling tax reminders:', error);
  }
}

// Send immediate goal progress notification
export async function sendGoalProgressNotification(
  percentage: number,
  goalType: string,
  targetAmount: number
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You're Almost There!",
        body: `${percentage}% to your ${goalType} goal of $${targetAmount}`,
        data: { type: 'goal-progress', percentage, goalType },
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('[Notifications] Error sending goal progress:', error);
  }
}

// Send immediate goal achieved notification
export async function sendGoalAchievedNotification(
  goalType: string,
  targetAmount: number
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Goal Achieved!',
        body: `You hit your ${goalType} goal of $${targetAmount}!`,
        data: { type: 'goal-achieved', goalType, targetAmount },
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.error('[Notifications] Error sending goal achieved:', error);
  }
}

// Send team pool update notification
export async function sendPoolUpdateNotification(
  teamName: string,
  amount: number
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tip Pool Distributed',
        body: `Your share from ${teamName}: $${amount.toFixed(2)}`,
        data: { type: 'pool-update', teamName, amount },
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('[Notifications] Error sending pool update:', error);
  }
}

// Send team invite notification
export async function sendTeamInviteNotification(
  teamName: string,
  inviterName: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Team Invitation',
        body: `${inviterName} invited you to join "${teamName}"`,
        data: { type: 'team-invite', teamName, inviterName },
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('[Notifications] Error sending team invite:', error);
  }
}

// Cancel notifications by type/tag
async function cancelNotificationsByTag(tag: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === tag) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Update scheduled notifications based on preferences
export async function updateScheduledNotifications(): Promise<void> {
  const { preferences } = useNotificationStore.getState();

  // Weekly Summary
  if (preferences.weeklySummary) {
    await scheduleWeeklySummary();
  } else {
    await cancelNotificationsByTag('weekly-summary');
  }

  // Streak Reminder
  if (preferences.streakReminder) {
    await scheduleStreakReminder();
  } else {
    await cancelNotificationsByTag('streak-reminder');
  }

  // Tax Reminders (Premium)
  if (preferences.taxReminders) {
    await scheduleTaxReminders();
  } else {
    await cancelNotificationsByTag('tax-reminder');
  }
}

// Listen for notification interactions
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Listen for received notifications (foreground)
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}
