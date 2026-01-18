// Leaderboard and Personal Bests Service
// Anonymous percentile rankings + personal records

import { supabase } from './supabase';

export interface WeeklyPercentile {
  percentile: number; // 0-100, percentage of users you outperformed
  totalUsers: number;
  userTotal: number;
  weekStart: string;
}

export interface StreakPercentile {
  percentile: number;
  currentStreak: number;
  totalUsers: number;
}

export interface PersonalBest {
  amount: number;
  date: string;
}

export interface PersonalBestWithProgress {
  amount: number;
  date: string;
  current: number;
  progressPercent: number;
  amountToBeat: number;
}

export interface PersonalBests {
  hasData: boolean;
  bestDay?: PersonalBest;
  bestWeek?: PersonalBestWithProgress;
  bestMonth?: PersonalBestWithProgress;
  bestHourly?: { rate: number; date: string };
  lifetimeTotal?: number;
}

/**
 * Get user's percentile ranking for a given week
 * Returns what percentage of users they outperformed
 */
export async function getWeeklyPercentile(weekStart?: string): Promise<WeeklyPercentile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_weekly_percentile', {
      p_user_id: user.id,
      p_week_start: weekStart || null,
    });

    if (error) {
      console.error('[Leaderboard] Error getting weekly percentile:', error);
      return null;
    }

    return {
      percentile: data.percentile,
      totalUsers: data.total_users,
      userTotal: parseFloat(data.user_total) || 0,
      weekStart: data.week_start,
    };
  } catch (error) {
    console.error('[Leaderboard] Exception:', error);
    return null;
  }
}

/**
 * Get user's streak percentile
 * Returns what percentage of users have a shorter streak
 */
export async function getStreakPercentile(): Promise<StreakPercentile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_streak_percentile', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('[Leaderboard] Error getting streak percentile:', error);
      return null;
    }

    return {
      percentile: data.percentile,
      currentStreak: data.current_streak,
      totalUsers: data.total_users,
    };
  } catch (error) {
    console.error('[Leaderboard] Exception:', error);
    return null;
  }
}

/**
 * Get user's personal bests with progress toward beating them
 */
export async function getPersonalBests(): Promise<PersonalBests | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_personal_bests_with_progress', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('[Leaderboard] Error getting personal bests:', error);
      return null;
    }

    if (!data.has_data) {
      return { hasData: false };
    }

    return {
      hasData: true,
      bestDay: data.best_day ? {
        amount: parseFloat(data.best_day.amount) || 0,
        date: data.best_day.date,
      } : undefined,
      bestWeek: data.best_week ? {
        amount: parseFloat(data.best_week.amount) || 0,
        date: data.best_week.date,
        current: parseFloat(data.best_week.current) || 0,
        progressPercent: data.best_week.progress_percent || 0,
        amountToBeat: parseFloat(data.best_week.amount_to_beat) || 0,
      } : undefined,
      bestMonth: data.best_month ? {
        amount: parseFloat(data.best_month.amount) || 0,
        date: data.best_month.date,
        current: parseFloat(data.best_month.current) || 0,
        progressPercent: data.best_month.progress_percent || 0,
        amountToBeat: parseFloat(data.best_month.amount_to_beat) || 0,
      } : undefined,
      bestHourly: data.best_hourly ? {
        rate: parseFloat(data.best_hourly.rate) || 0,
        date: data.best_hourly.date,
      } : undefined,
      lifetimeTotal: parseFloat(data.lifetime_total) || 0,
    };
  } catch (error) {
    console.error('[Leaderboard] Exception:', error);
    return null;
  }
}

/**
 * Get motivational message based on percentile
 */
export function getPercentileMessage(percentile: number): string {
  if (percentile >= 90) return "You're in the top 10%! 🔥";
  if (percentile >= 75) return "You're outearning 75% of users!";
  if (percentile >= 50) return "You're above average!";
  if (percentile >= 25) return "Keep pushing, you're building momentum!";
  return "Every shift counts. You've got this!";
}

/**
 * Get message for personal best progress
 */
export function getPersonalBestMessage(progressPercent: number, amountToBeat: number): string {
  if (progressPercent >= 100) return "🎉 NEW PERSONAL BEST!";
  if (progressPercent >= 90) return `Almost there! Just $${amountToBeat.toFixed(0)} to beat your record!`;
  if (progressPercent >= 75) return `75% of the way to your best week!`;
  if (progressPercent >= 50) return `Halfway to your personal best!`;
  return `${progressPercent}% toward your record`;
}
