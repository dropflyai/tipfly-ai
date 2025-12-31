// Zustand store for user state management
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, JobType } from '../types';
import { supabase } from '../services/api/supabase';

// Free tier limits
const FREE_IMPORT_SCANS_PER_MONTH = 3;

interface UserState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedTour: boolean;
  selectedJobType: JobType | null;
  // Import scan tracking for free tier limits
  importScansThisMonth: number;
  importScansResetDate: string | null; // ISO date string
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  isPremium: () => boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setJobType: (jobType: JobType) => void;
  completeTour: () => void;
  resetTour: () => void;
  // Import scan limit functions
  canUseImportScan: () => boolean;
  getRemainingImportScans: () => number;
  useImportScan: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      hasCompletedTour: false,
      selectedJobType: null,
      importScansThisMonth: 0,
      importScansResetDate: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setLoading: (isLoading) => set({ isLoading }),

      clearUser: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      }),

      isPremium: () => {
        const { user } = get();
        if (!user) return false;
        return user.subscription_tier === 'premium';
      },

      completeOnboarding: async () => {
        set({ hasCompletedOnboarding: true });

        // Also update in database
        const { user } = get();
        if (user?.id) {
          try {
            await supabase
              .from('users')
              .update({ onboarding_completed: true })
              .eq('id', user.id);
            console.log('[UserStore] Onboarding completed - synced to DB');
          } catch (error) {
            console.error('[UserStore] Failed to sync onboarding to DB:', error);
          }
        }
      },

      resetOnboarding: () => set({ hasCompletedOnboarding: false, hasCompletedTour: false, selectedJobType: null }),

      setJobType: (jobType) => set({ selectedJobType: jobType }),

      completeTour: () => {
        set({ hasCompletedTour: true });
        console.log('[UserStore] App tour completed');
      },

      resetTour: () => set({ hasCompletedTour: false }),

      // Check if we need to reset the monthly counter
      canUseImportScan: () => {
        const { importScansThisMonth, importScansResetDate } = get();
        const isPremium = get().isPremium();

        // Premium users have unlimited scans
        if (isPremium) return true;

        // Check if we need to reset the counter (new month)
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

        if (importScansResetDate !== currentMonth) {
          // New month, reset counter
          set({ importScansThisMonth: 0, importScansResetDate: currentMonth });
          return true;
        }

        return importScansThisMonth < FREE_IMPORT_SCANS_PER_MONTH;
      },

      getRemainingImportScans: () => {
        const { importScansThisMonth, importScansResetDate } = get();
        const isPremium = get().isPremium();

        // Premium users have unlimited
        if (isPremium) return 999;

        // Check if we need to reset the counter (new month)
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

        if (importScansResetDate !== currentMonth) {
          return FREE_IMPORT_SCANS_PER_MONTH;
        }

        return Math.max(0, FREE_IMPORT_SCANS_PER_MONTH - importScansThisMonth);
      },

      useImportScan: () => {
        const { importScansThisMonth, importScansResetDate } = get();
        const isPremium = get().isPremium();

        // Premium users don't need to track
        if (isPremium) return;

        // Check if we need to reset the counter (new month)
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

        if (importScansResetDate !== currentMonth) {
          // New month, reset and use one
          set({ importScansThisMonth: 1, importScansResetDate: currentMonth });
        } else {
          // Same month, increment
          set({ importScansThisMonth: importScansThisMonth + 1 });
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasCompletedTour: state.hasCompletedTour,
        selectedJobType: state.selectedJobType,
        importScansThisMonth: state.importScansThisMonth,
        importScansResetDate: state.importScansResetDate,
      }),
    }
  )
);
