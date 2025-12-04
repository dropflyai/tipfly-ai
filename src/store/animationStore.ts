import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnimationState {
  // Splash animation
  hasShownSplashThisSession: boolean;
  setHasShownSplashThisSession: (shown: boolean) => void;

  // Tip milestones
  tipCount: number;
  hasShownFirstTipCelebration: boolean;
  lastMilestoneCelebrated: number;

  // Actions
  loadTipCount: () => Promise<void>;
  incrementTipCount: () => Promise<{ shouldCelebrate: boolean; milestone: number | null }>;

  // Goal celebration
  shouldShowGoalCelebration: boolean;
  goalCelebrationData: { title?: string; subtitle?: string } | null;
  triggerGoalCelebration: (data?: { title?: string; subtitle?: string }) => void;
  clearGoalCelebration: () => void;
}

const MILESTONES = [1, 10, 25, 50, 100, 250, 500, 1000];

export const useAnimationStore = create<AnimationState>((set, get) => ({
  // Splash
  hasShownSplashThisSession: false,
  setHasShownSplashThisSession: (shown) => set({ hasShownSplashThisSession: shown }),

  // Tips
  tipCount: 0,
  hasShownFirstTipCelebration: false,
  lastMilestoneCelebrated: 0,

  loadTipCount: async () => {
    try {
      const stored = await AsyncStorage.getItem('tipCount');
      const lastMilestone = await AsyncStorage.getItem('lastMilestoneCelebrated');
      const firstTipShown = await AsyncStorage.getItem('hasShownFirstTipCelebration');

      set({
        tipCount: stored ? parseInt(stored, 10) : 0,
        lastMilestoneCelebrated: lastMilestone ? parseInt(lastMilestone, 10) : 0,
        hasShownFirstTipCelebration: firstTipShown === 'true',
      });
    } catch (error) {
      console.error('Error loading tip count:', error);
    }
  },

  incrementTipCount: async () => {
    const { tipCount, lastMilestoneCelebrated, hasShownFirstTipCelebration } = get();
    const newCount = tipCount + 1;

    // Save new count
    await AsyncStorage.setItem('tipCount', newCount.toString());

    let shouldCelebrate = false;
    let milestone: number | null = null;

    // Check for first tip
    if (newCount === 1 && !hasShownFirstTipCelebration) {
      shouldCelebrate = true;
      milestone = 1;
      await AsyncStorage.setItem('hasShownFirstTipCelebration', 'true');
      set({ hasShownFirstTipCelebration: true });
    } else {
      // Check for other milestones
      for (const m of MILESTONES) {
        if (newCount === m && m > lastMilestoneCelebrated && m > 1) {
          shouldCelebrate = true;
          milestone = m;
          await AsyncStorage.setItem('lastMilestoneCelebrated', m.toString());
          set({ lastMilestoneCelebrated: m });
          break;
        }
      }
    }

    set({ tipCount: newCount });

    return { shouldCelebrate, milestone };
  },

  // Goals
  shouldShowGoalCelebration: false,
  goalCelebrationData: null,

  triggerGoalCelebration: (data) => set({
    shouldShowGoalCelebration: true,
    goalCelebrationData: data || null,
  }),

  clearGoalCelebration: () => set({
    shouldShowGoalCelebration: false,
    goalCelebrationData: null,
  }),
}));
