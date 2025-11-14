// Goals API - CRUD operations for user goals
import { supabase } from './supabase';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'daily' | 'weekly' | 'monthly';
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * Get all goals for the current user
 */
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    throw new Error(error.message || 'Failed to fetch goals');
  }
};

/**
 * Get active goals only
 */
export const getActiveGoals = async (): Promise<Goal[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, let's see ALL goals for this user
    const { data: allGoals, error: allError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id);

    console.log('All goals for user:', allGoals);

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    console.log('Active goals only:', data);
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching active goals:', error);
    throw new Error(error.message || 'Failed to fetch active goals');
  }
};

/**
 * Create a new goal
 */
export const createGoal = async (goal: {
  goal_type: 'daily' | 'weekly' | 'monthly';
  target_amount: number;
}): Promise<Goal> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Calculate start and end dates based on goal type
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date(startDate);

    switch (goal.goal_type) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        goal_type: goal.goal_type,
        target_amount: goal.target_amount,
        current_amount: 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error creating goal:', error);
    throw new Error(error.message || 'Failed to create goal');
  }
};

/**
 * Update a goal
 */
export const updateGoal = async (
  goalId: string,
  updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>
): Promise<Goal> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating goal:', error);
    throw new Error(error.message || 'Failed to update goal');
  }
};

/**
 * Delete a goal
 */
export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    throw new Error(error.message || 'Failed to delete goal');
  }
};

/**
 * Update goal progress based on tips
 * Call this whenever a new tip is added
 */
export const updateGoalProgress = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all active goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (goalsError) throw goalsError;
    if (!goals || goals.length === 0) return;

    // Update each goal's progress
    for (const goal of goals) {
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);

      // Get tips in this goal's date range
      const { data: tips, error: tipsError } = await supabase
        .from('tip_entries')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lt('date', endDate.toISOString());

      if (tipsError) throw tipsError;

      // Calculate total
      const total = tips?.reduce((sum, tip) => sum + (tip.amount || 0), 0) || 0;

      // Determine status
      const now = new Date();
      let newStatus = goal.status;

      if (total >= goal.target_amount) {
        newStatus = 'completed';
      } else if (now >= endDate) {
        newStatus = 'failed';
      }

      // Update goal
      await supabase
        .from('goals')
        .update({
          current_amount: total,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id);
    }
  } catch (error: any) {
    console.error('Error updating goal progress:', error);
    // Don't throw - this is a background update
  }
};

/**
 * Check if a goal is expired
 */
export const checkGoalExpiration = (goal: Goal): boolean => {
  const now = new Date();
  const endDate = new Date(goal.end_date);
  return now >= endDate;
};

/**
 * Calculate goal progress percentage
 */
export const calculateProgress = (goal: Goal): number => {
  if (goal.target_amount === 0) return 0;
  const progress = (goal.current_amount / goal.target_amount) * 100;
  return Math.min(progress, 100);
};

/**
 * Get goal period label
 */
export const getGoalPeriodLabel = (goal: Goal): string => {
  const startDate = new Date(goal.start_date);
  const endDate = new Date(goal.end_date);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  switch (goal.goal_type) {
    case 'daily':
      return formatDate(startDate);
    case 'weekly':
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    case 'monthly':
      return startDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    default:
      return '';
  }
};
