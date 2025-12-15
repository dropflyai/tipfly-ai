// Zustand store for notification preferences
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationType,
} from '../types/notifications';

interface NotificationState {
  preferences: NotificationPreferences;
  pushToken: string | null;
  hasPermission: boolean;

  // Actions
  setPreference: (key: NotificationType, value: boolean) => void;
  setAllPreferences: (preferences: Partial<NotificationPreferences>) => void;
  setPushToken: (token: string | null) => void;
  setHasPermission: (hasPermission: boolean) => void;
  resetPreferences: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      pushToken: null,
      hasPermission: false,

      setPreference: (key, value) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        })),

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
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
