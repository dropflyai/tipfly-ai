// Zustand store for referral state management
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_type?: string;
  created_at: string;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  reward_type: 'free_week' | 'free_month' | 'free_6months';
  referral_count_at_reward: number;
  granted_at: string;
  expires_at: string;
  redeemed: boolean;
  redeemed_at?: string;
}

interface ReferralState {
  // User's referral info
  referralCode: string | null;
  referralCount: number;
  referredBy: string | null;

  // Referral history
  referrals: Referral[];
  rewards: ReferralReward[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Pending referral code (entered during signup)
  pendingReferralCode: string | null;

  // Actions
  setReferralCode: (code: string) => void;
  setReferralCount: (count: number) => void;
  setReferredBy: (code: string | null) => void;
  setReferrals: (referrals: Referral[]) => void;
  setRewards: (rewards: ReferralReward[]) => void;
  setPendingReferralCode: (code: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  incrementReferralCount: () => void;
  addReward: (reward: ReferralReward) => void;
  markRewardRedeemed: (rewardId: string) => void;
  reset: () => void;

  // Computed
  getUnredeemedRewards: () => ReferralReward[];
  getNextRewardTier: () => { tier: string; needed: number } | null;
}

// Reward tiers
const REWARD_TIERS = [
  { count: 1, reward: 'free_week', label: '1 Week Free' },
  { count: 3, reward: 'free_month', label: '1 Month Free' },
  { count: 10, reward: 'free_6months', label: '6 Months Free' },
];

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      // Initial state
      referralCode: null,
      referralCount: 0,
      referredBy: null,
      referrals: [],
      rewards: [],
      isLoading: false,
      error: null,
      pendingReferralCode: null,

      // Actions
      setReferralCode: (code) => set({ referralCode: code }),
      setReferralCount: (count) => set({ referralCount: count }),
      setReferredBy: (code) => set({ referredBy: code }),
      setReferrals: (referrals) => set({ referrals }),
      setRewards: (rewards) => set({ rewards }),
      setPendingReferralCode: (code) => set({ pendingReferralCode: code }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      incrementReferralCount: () =>
        set((state) => ({ referralCount: state.referralCount + 1 })),

      addReward: (reward) =>
        set((state) => ({
          rewards: [...state.rewards, reward],
        })),

      markRewardRedeemed: (rewardId) =>
        set((state) => ({
          rewards: state.rewards.map((r) =>
            r.id === rewardId
              ? { ...r, redeemed: true, redeemed_at: new Date().toISOString() }
              : r
          ),
        })),

      reset: () =>
        set({
          referralCode: null,
          referralCount: 0,
          referredBy: null,
          referrals: [],
          rewards: [],
          isLoading: false,
          error: null,
          pendingReferralCode: null,
        }),

      // Computed
      getUnredeemedRewards: () => {
        return get().rewards.filter(
          (r) => !r.redeemed && new Date(r.expires_at) > new Date()
        );
      },

      getNextRewardTier: () => {
        const count = get().referralCount;
        const rewards = get().rewards;

        // Find the next tier they haven't earned
        for (const tier of REWARD_TIERS) {
          const hasEarned = rewards.some((r) => r.reward_type === tier.reward);
          if (!hasEarned && count < tier.count) {
            return {
              tier: tier.label,
              needed: tier.count - count,
            };
          }
        }

        // All tiers earned or count exceeds all tiers
        if (count >= 10) {
          return null; // No more tiers
        }

        return null;
      },
    }),
    {
      name: 'referral-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        referralCode: state.referralCode,
        referralCount: state.referralCount,
        referredBy: state.referredBy,
        pendingReferralCode: state.pendingReferralCode,
      }),
    }
  )
);

// Export reward tiers for UI use
export { REWARD_TIERS };
