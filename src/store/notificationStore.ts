// Zustand store for notification preferences
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationType,
} from '../types/notifications';
import { supabase } from '../services/api/supabase';

interface NotificationState {
  preferences: NotificationPreferences;
  pushToken: string | null;
  hasPermission: boolean;
  isSyncing: boolean;

  // Actions
  setPreference: (key: NotificationType, value: boolean) => void;
  setAllPreferences: (preferences: Partial<NotificationPreferences>) => void;
  setPushToken: (token: string | null) => void;
  setHasPermission: (hasPermission: boolean) => void;
  resetPreferences: () => void;
  syncEmailPreferences: () => Promise<void>;
}

// Email notification keys that need backend sync
const EMAIL_NOTIFICATION_KEYS: NotificationType[] = ['weeklyEmailSummary'];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      pushToken: null,
      hasPermission: false,
      isSyncing: false,

      setPreference: async (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }));

        // Sync email preferences to backend
        if (EMAIL_NOTIFICATION_KEYS.includes(key)) {
          get().syncEmailPreferences();
        }
      },

      setAllPreferences: (newPreferences) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        })),

      setPushToken: (token) => set({ pushToken: token }),

      setHasPermission: (hasPermission) => set({ hasPermission }),

      resetPreferences: () =>
        set({ preferences: DEFAULT_NOTIFICATION_PREFERENCES }),

      syncEmailPreferences: async () => {
        const { preferences, isSyncing } = get();
        if (isSyncing) return;

        set({ isSyncing: true });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Map local preferences to backend format
          const backendPrefs = {
            weekly_summary: preferences.weeklyEmailSummary,
            streak_reminders: preferences.streakReminder,
            goal_alerts: preferences.goalProgress || preferences.goalAchieved,
          };

          await supabase
            .from('profiles')
            .update({ notification_preferences: backendPrefs })
            .eq('id', user.id);

          console.log('[NotificationStore] Email preferences synced');
        } catch (error) {
          console.error('[NotificationStore] Sync error:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
