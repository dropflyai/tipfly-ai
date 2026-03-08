// Zustand store for gamification (streaks & badges)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Badge definitions
export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'milestone' | 'streak' | 'earnings' | 'goals' | 'deduction';
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // Milestone badges
  first_tip: {
    id: 'first_tip',
    name: 'First Steps',
    icon: '🎯',
    description: 'Logged your first tip',
    category: 'milestone',
  },
  ten_tips: {
    id: 'ten_tips',
    name: 'Getting Started',
    icon: '📝',
    description: 'Logged 10 tips',
    category: 'milestone',
  },
  fifty_tips: {
    id: 'fifty_tips',
    name: 'Regular Logger',
    icon: '📊',
    description: 'Logged 50 tips',
    category: 'milestone',
  },
  hundred_tips: {
    id: 'hundred_tips',
    name: 'Pro Logger',
    icon: '🏅',
    description: 'Logged 100 tips',
    category: 'milestone',
  },

  // Streak badges
  streak_7: {
    id: 'streak_7',
    name: 'On Fire',
    icon: '🔥',
    description: '7-day logging streak',
    category: 'streak',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Unstoppable',
    icon: '⚡',
    description: '30-day logging streak',
    category: 'streak',
  },
  streak_100: {
    id: 'streak_100',
    name: 'Legend',
    icon: '🏆',
    description: '100-day logging streak',
    category: 'streak',
  },

  // Earnings badges
  first_500: {
    id: 'first_500',
    name: 'Money Maker',
    icon: '💰',
    description: 'Earned $500 in a week',
    category: 'earnings',
  },
  first_1000: {
    id: 'first_1000',
    name: 'Big Earner',
    icon: '💵',
    description: 'Earned $1,000 in a week',
    category: 'earnings',
  },

  // Goal badges
  goal_crusher: {
    id: 'goal_crusher',
    name: 'Goal Crusher',
    icon: '🎯',
    description: 'Completed your first goal',
    category: 'goals',
  },
  tax_ready: {
    id: 'tax_ready',
    name: 'Tax Pro',
    icon: '📋',
    description: 'Tracked all quarterly taxes',
    category: 'goals',
  },

  // Deduction badges ($25K No Tax on Tips)
  deduction_1k: {
    id: 'deduction_1k',
    name: 'Deduction Started',
    icon: '🛡️',
    description: '$1,000 toward your $25K deduction',
    category: 'deduction',
  },
  deduction_5k: {
    id: 'deduction_5k',
    name: 'Deduction Builder',
    icon: '🧱',
    description: '$5,000 toward your $25K deduction',
    category: 'deduction',
  },
  deduction_10k: {
    id: 'deduction_10k',
    name: 'Halfway There',
    icon: '⭐',
    description: '$10,000 toward your $25K deduction',
    category: 'deduction',
  },
  deduction_25k: {
    id: 'deduction_25k',
    name: 'Max Deduction',
    icon: '👑',
    description: 'Claimed the full $25,000 deduction',
    category: 'deduction',
  },
};

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
  streak_started_at: string | null;
  total_tips_logged: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

interface GamificationState {
  // Streak data
  streak: UserStreak | null;

  // Badges
  badges: UserBadge[];
  newlyEarnedBadge: BadgeDefinition | null;
  pendingBadgeCelebration: BadgeDefinition | null;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  setStreak: (streak: UserStreak | null) => void;
  setBadges: (badges: UserBadge[]) => void;
  addBadge: (badge: UserBadge) => void;
  setNewlyEarnedBadge: (badge: BadgeDefinition | null) => void;
  triggerBadgeCelebration: (badge: BadgeDefinition) => void;
  clearBadgeCelebration: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  getBadgeDefinition: (badgeId: string) => BadgeDefinition | undefined;
  getEarnedBadges: () => (UserBadge & { definition: BadgeDefinition })[];
  getUnearnedBadges: () => BadgeDefinition[];
  getBadgesByCategory: (category: BadgeDefinition['category']) => BadgeDefinition[];
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      streak: null,
      badges: [],
      newlyEarnedBadge: null,
      pendingBadgeCelebration: null,
      isLoading: false,
      error: null,

      setStreak: (streak) => set({ streak }),
      setBadges: (badges) => set({ badges }),
      addBadge: (badge) =>
        set((state) => ({
          badges: [...state.badges, badge],
        })),
      setNewlyEarnedBadge: (badge) => set({ newlyEarnedBadge: badge }),
      triggerBadgeCelebration: (badge) => set({ pendingBadgeCelebration: badge }),
      clearBadgeCelebration: () => set({ pendingBadgeCelebration: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () =>
        set({
          streak: null,
          badges: [],
          newlyEarnedBadge: null,
          pendingBadgeCelebration: null,
          isLoading: false,
          error: null,
        }),

      getBadgeDefinition: (badgeId) => BADGE_DEFINITIONS[badgeId],

      getEarnedBadges: () => {
        const { badges } = get();
        return badges
          .map((badge) => ({
            ...badge,
            definition: BADGE_DEFINITIONS[badge.badge_id],
          }))
          .filter((b) => b.definition) // Filter out any undefined definitions
          .sort(
            (a, b) =>
              new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
          );
      },

      getUnearnedBadges: () => {
        const { badges } = get();
        const earnedIds = new Set(badges.map((b) => b.badge_id));
        return Object.values(BADGE_DEFINITIONS).filter(
          (def) => !earnedIds.has(def.id)
        );
      },

      getBadgesByCategory: (category) => {
        return Object.values(BADGE_DEFINITIONS).filter(
          (def) => def.category === category
        );
      },
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        streak: state.streak,
        badges: state.badges,
      }),
    }
  )
);
