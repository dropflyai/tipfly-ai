// Gamification API Service
import { supabase } from './supabase';
import {
  useGamificationStore,
  UserStreak,
  UserBadge,
  BADGE_DEFINITIONS,
} from '../../store/gamificationStore';
import { Analytics } from '../analytics/analytics';

// Fetch user's streak data
export const fetchUserStreak = async (): Promise<UserStreak | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('[Gamification] Error fetching streak:', error);
    throw error;
  }

  const streak = data || {
    user_id: user.id,
    current_streak: 0,
    longest_streak: 0,
    last_logged_date: null,
    streak_started_at: null,
    total_tips_logged: 0,
  };

  useGamificationStore.getState().setStreak(streak);
  return streak;
};

// Fetch user's badges
export const fetchUserBadges = async (): Promise<UserBadge[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('[Gamification] Error fetching badges:', error);
    throw error;
  }

  const badges = data || [];
  useGamificationStore.getState().setBadges(badges);
  return badges;
};

// Check for new badges (call after tip is logged)
export const checkForNewBadges = async (): Promise<UserBadge[]> => {
  const store = useGamificationStore.getState();
  const previousBadgeIds = new Set(store.badges.map((b) => b.badge_id));

  // Fetch current badges
  const currentBadges = await fetchUserBadges();

  // Find newly earned badges
  const newBadges = currentBadges.filter(
    (badge) => !previousBadgeIds.has(badge.badge_id)
  );

  // If there's a new badge, show celebration
  if (newBadges.length > 0) {
    const newestBadge = newBadges[0];
    const definition = BADGE_DEFINITIONS[newestBadge.badge_id];

    if (definition) {
      store.setNewlyEarnedBadge(definition);

      // Track analytics
      Analytics.track('badge_earned', {
        badge_id: definition.id,
        badge_name: definition.name,
      });
    }
  }

  return newBadges;
};

// Initialize gamification data
export const initializeGamification = async (): Promise<void> => {
  const store = useGamificationStore.getState();
  store.setLoading(true);

  try {
    await Promise.all([fetchUserStreak(), fetchUserBadges()]);
    console.log('[Gamification] Data initialized');
  } catch (error) {
    console.error('[Gamification] Failed to initialize:', error);
    store.setError(error instanceof Error ? error.message : 'Failed to load');
  } finally {
    store.setLoading(false);
  }
};

// Update streak after logging tip (called locally, server handles actual update)
export const refreshStreakAfterTip = async (): Promise<void> => {
  // Wait a moment for the database trigger to complete
  await new Promise((resolve) => setTimeout(resolve, 500));

  const previousStreak = useGamificationStore.getState().streak?.current_streak || 0;

  // Fetch updated streak
  const newStreak = await fetchUserStreak();

  // Check if streak milestone reached
  if (newStreak && newStreak.current_streak > previousStreak) {
    const milestones = [7, 30, 100];
    const reachedMilestone = milestones.find(
      (m) => newStreak.current_streak >= m && previousStreak < m
    );

    if (reachedMilestone) {
      Analytics.streakAchieved(reachedMilestone);
    }
  }

  // Check for new badges
  await checkForNewBadges();
};

// Get streak status message
export const getStreakStatusMessage = (streak: UserStreak | null): string => {
  if (!streak || streak.current_streak === 0) {
    return 'Start your streak by logging a tip today!';
  }

  if (streak.current_streak === 1) {
    return "Great start! Keep logging tomorrow to build your streak.";
  }

  if (streak.current_streak < 7) {
    return `${7 - streak.current_streak} more days to reach your first milestone!`;
  }

  if (streak.current_streak < 30) {
    return `On fire! ${30 - streak.current_streak} days to Unstoppable badge.`;
  }

  if (streak.current_streak < 100) {
    return `Incredible! ${100 - streak.current_streak} days to Legend status.`;
  }

  return `You're a Legend! ${streak.current_streak} days and counting!`;
};

// Check if user has logged today
export const hasLoggedToday = (streak: UserStreak | null): boolean => {
  if (!streak || !streak.last_logged_date) return false;

  const today = new Date().toISOString().split('T')[0];
  const lastLogged = streak.last_logged_date.split('T')[0];

  return today === lastLogged;
};

// Get days until streak breaks
export const getDaysUntilStreakBreaks = (streak: UserStreak | null): number => {
  if (!streak || !streak.last_logged_date) return 0;

  const lastLogged = new Date(streak.last_logged_date);
  const tomorrow = new Date(lastLogged);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const now = new Date();
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  if (now > endOfTomorrow) {
    return 0; // Streak already broken
  }

  return 1; // They have until end of tomorrow
};
