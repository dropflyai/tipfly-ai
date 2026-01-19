// Milestone tracking service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MilestoneType } from '../../components/gamification';

const MILESTONES: MilestoneType[] = [10, 25, 50, 100, 250, 500, 1000];
const CELEBRATED_KEY = 'celebrated_milestones';

/**
 * Check if a tip count has hit a new milestone
 */
export function checkMilestone(tipCount: number): MilestoneType | null {
  // Check if tip count exactly matches a milestone
  for (const milestone of MILESTONES) {
    if (tipCount === milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get the next milestone the user is working toward
 */
export function getNextMilestone(tipCount: number): MilestoneType | null {
  for (const milestone of MILESTONES) {
    if (tipCount < milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get progress toward next milestone
 */
export function getMilestoneProgress(tipCount: number): {
  next: MilestoneType | null;
  progress: number; // 0-100
  remaining: number;
} {
  const next = getNextMilestone(tipCount);
  if (!next) {
    return { next: null, progress: 100, remaining: 0 };
  }

  // Find previous milestone
  const prevIndex = MILESTONES.indexOf(next) - 1;
  const prev = prevIndex >= 0 ? MILESTONES[prevIndex] : 0;

  const range = next - prev;
  const achieved = tipCount - prev;
  const progress = Math.round((achieved / range) * 100);
  const remaining = next - tipCount;

  return { next, progress, remaining };
}

/**
 * Check if a milestone has already been celebrated
 */
export async function hasBeenCelebrated(milestone: MilestoneType): Promise<boolean> {
  try {
    const celebrated = await AsyncStorage.getItem(CELEBRATED_KEY);
    if (!celebrated) return false;
    const list: number[] = JSON.parse(celebrated);
    return list.includes(milestone);
  } catch {
    return false;
  }
}

/**
 * Mark a milestone as celebrated
 */
export async function markCelebrated(milestone: MilestoneType): Promise<void> {
  try {
    const celebrated = await AsyncStorage.getItem(CELEBRATED_KEY);
    const list: number[] = celebrated ? JSON.parse(celebrated) : [];
    if (!list.includes(milestone)) {
      list.push(milestone);
      await AsyncStorage.setItem(CELEBRATED_KEY, JSON.stringify(list));
    }
  } catch (error) {
    console.error('[Milestones] Error marking celebrated:', error);
  }
}

/**
 * Check if user should see a milestone celebration
 * Returns the milestone to celebrate, or null if none
 */
export async function checkAndGetMilestone(tipCount: number): Promise<MilestoneType | null> {
  const milestone = checkMilestone(tipCount);
  if (!milestone) return null;

  const alreadyCelebrated = await hasBeenCelebrated(milestone);
  if (alreadyCelebrated) return null;

  return milestone;
}
