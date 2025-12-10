import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppLockState {
  isAppLockEnabled: boolean;
  isLocked: boolean;
  lastBackgroundTime: number | null;
  lockTimeout: number; // Time in ms before requiring re-authentication

  // Actions
  setAppLockEnabled: (enabled: boolean) => void;
  lock: () => void;
  unlock: () => void;
  setLastBackgroundTime: (time: number | null) => void;
  shouldLock: () => boolean;
}

const LOCK_TIMEOUT_MS = 30000; // 30 seconds - require re-auth after 30s in background

export const useAppLockStore = create<AppLockState>()(
  persist(
    (set, get) => ({
      isAppLockEnabled: false,
      isLocked: false,
      lastBackgroundTime: null,
      lockTimeout: LOCK_TIMEOUT_MS,

      setAppLockEnabled: (enabled: boolean) => {
        set({ isAppLockEnabled: enabled });
        if (!enabled) {
          // If disabling, also unlock
          set({ isLocked: false });
        }
      },

      lock: () => {
        const { isAppLockEnabled } = get();
        if (isAppLockEnabled) {
          set({ isLocked: true });
        }
      },

      unlock: () => {
        set({ isLocked: false, lastBackgroundTime: null });
      },

      setLastBackgroundTime: (time: number | null) => {
        set({ lastBackgroundTime: time });
      },

      shouldLock: () => {
        const { isAppLockEnabled, lastBackgroundTime, lockTimeout } = get();

        if (!isAppLockEnabled) return false;
        if (!lastBackgroundTime) return false;

        const now = Date.now();
        const timeSinceBackground = now - lastBackgroundTime;

        return timeSinceBackground >= lockTimeout;
      },
    }),
    {
      name: 'tipfly-app-lock',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAppLockEnabled: state.isAppLockEnabled,
        lockTimeout: state.lockTimeout,
      }),
    }
  )
);
