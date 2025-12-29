// Referral API Service
import { supabase } from './supabase';
import { useReferralStore, Referral, ReferralReward } from '../../store/referralStore';
import { Analytics } from '../analytics/analytics';

// Fetch user's referral data
export const fetchReferralData = async (): Promise<{
  referralCode: string;
  referralCount: number;
  referredBy: string | null;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('referral_code, referral_count, referred_by')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  // Update store
  const store = useReferralStore.getState();
  store.setReferralCode(data.referral_code);
  store.setReferralCount(data.referral_count || 0);
  store.setReferredBy(data.referred_by);

  return {
    referralCode: data.referral_code,
    referralCount: data.referral_count || 0,
    referredBy: data.referred_by,
  };
};

// Fetch user's referral history
export const fetchReferrals = async (): Promise<Referral[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const referrals = data || [];
  useReferralStore.getState().setReferrals(referrals);

  return referrals;
};

// Fetch user's rewards
export const fetchReferralRewards = async (): Promise<ReferralReward[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false });

  if (error) throw error;

  const rewards = data || [];
  useReferralStore.getState().setRewards(rewards);

  return rewards;
};

// Validate a referral code
export const validateReferralCode = async (code: string): Promise<{
  valid: boolean;
  error?: string;
}> => {
  const normalizedCode = code.toUpperCase().trim();

  if (normalizedCode.length !== 8) {
    return { valid: false, error: 'Invalid code format' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Check if code exists
  const { data, error } = await supabase
    .from('users')
    .select('id, referral_code')
    .eq('referral_code', normalizedCode)
    .single();

  if (error || !data) {
    Analytics.track('referral_code_entered', { valid: false });
    return { valid: false, error: 'Referral code not found' };
  }

  // Don't allow self-referral
  if (user && data.id === user.id) {
    return { valid: false, error: 'Cannot use your own referral code' };
  }

  Analytics.track('referral_code_entered', { valid: true });
  return { valid: true };
};

// Apply a referral code to current user
export const applyReferralCode = async (code: string): Promise<{
  success: boolean;
  rewardEarned?: string;
  error?: string;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const normalizedCode = code.toUpperCase().trim();

  // Call the database function
  const { data, error } = await supabase.rpc('process_referral', {
    p_referred_user_id: user.id,
    p_referral_code: normalizedCode,
  });

  if (error) {
    console.error('[Referrals] Error applying code:', error);
    return { success: false, error: error.message };
  }

  if (!data.success) {
    return { success: false, error: data.error };
  }

  // Update local store
  useReferralStore.getState().setReferredBy(normalizedCode);

  // Track referral completion
  Analytics.track('referral_completed', {
    referrer_total: data.referral_count,
  });

  return {
    success: true,
    rewardEarned: data.reward_earned,
  };
};

// Mark a reward as redeemed
export const redeemReward = async (rewardId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('referral_rewards')
    .update({
      redeemed: true,
      redeemed_at: new Date().toISOString(),
    })
    .eq('id', rewardId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Referrals] Error redeeming reward:', error);
    return false;
  }

  // Update local store
  useReferralStore.getState().markRewardRedeemed(rewardId);

  Analytics.track('referral_reward_claimed', { reward_type: rewardId });

  return true;
};

// Get referral link
export const getReferralLink = (code: string): string => {
  return `tipflyai://referral/${code}`;
};

// Get share message
export const getReferralShareMessage = (code: string): string => {
  return `Track your tips like a pro with TipFly AI! Use my referral code ${code} to get a free 7-day trial + 20% off your first month. Download: https://apps.apple.com/app/tipflyai`;
};

// Initialize referral data on app load
export const initializeReferralData = async (): Promise<void> => {
  try {
    await Promise.all([
      fetchReferralData(),
      fetchReferrals(),
      fetchReferralRewards(),
    ]);
    console.log('[Referrals] Data initialized');
  } catch (error) {
    console.error('[Referrals] Failed to initialize:', error);
  }
};
