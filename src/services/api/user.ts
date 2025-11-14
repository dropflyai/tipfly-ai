// User account management API
import { supabase } from './supabase';

/**
 * Delete user account and all associated data
 * Required by Apple App Store and GDPR/CCPA
 */
export const deleteUserAccount = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    // Delete all user data
    // RLS policies ensure only user's own data is deleted
    // Database foreign keys with CASCADE will handle related records

    // Delete user profile (this will cascade delete all related data)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteError) throw deleteError;

    // Sign out the user
    await supabase.auth.signOut();

  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

/**
 * Export user data (GDPR requirement)
 * Returns all user data in JSON format
 */
export const exportUserData = async (): Promise<any> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get all tip entries
    const { data: tips } = await supabase
      .from('tip_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Get all goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id);

    // Get all deductions
    const { data: deductions } = await supabase
      .from('deductions')
      .select('*')
      .eq('user_id', user.id);

    return {
      profile,
      tip_entries: tips || [],
      goals: goals || [],
      deductions: deductions || [],
      exported_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};
