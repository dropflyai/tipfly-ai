// API functions for position management (roles within a job like Server, Bartender, Host)
import { supabase } from './supabase';
import { Position } from '../../types';

// Get all positions for a specific job
export const getPositionsByJob = async (jobId: string): Promise<Position[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  // If positions table doesn't exist, return empty array
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[positions] Positions table not found, returning empty array');
      return [];
    }
    throw error;
  }
  return data || [];
};

// Get all positions for the current user (across all jobs)
export const getAllPositions = async (): Promise<Position[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  // If positions table doesn't exist, return empty array
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[positions] Positions table not found, returning empty array');
      return [];
    }
    throw error;
  }
  return data || [];
};

// Get a specific position by ID
export const getPositionById = async (id: string): Promise<Position> => {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Get default position for a job
export const getDefaultPosition = async (jobId: string): Promise<Position | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single();

  if (error) {
    // If no default position found or table doesn't exist, return null
    if (error.code === 'PGRST116') return null;
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[positions] Positions table not found, returning null');
      return null;
    }
    throw error;
  }

  return data;
};

// Create a new position
export const createPosition = async (
  positionData: Omit<Position, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Position> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('positions')
    .insert([{
      user_id: user.id,
      ...positionData,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a position
export const updatePosition = async (id: string, updates: Partial<Position>): Promise<Position> => {
  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Set a position as default (will need to unset others manually)
export const setDefaultPosition = async (jobId: string, positionId: string): Promise<Position> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  // First, unset all other defaults for this job
  await supabase
    .from('positions')
    .update({ is_default: false })
    .eq('job_id', jobId)
    .eq('user_id', user.id);

  // Then set the new default
  return updatePosition(positionId, { is_default: true });
};

// Delete a position
export const deletePosition = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Common position presets for quick setup
export const POSITION_PRESETS = [
  { name: 'Server', color: '#3B82F6' },
  { name: 'Bartender', color: '#8B5CF6' },
  { name: 'Host', color: '#10B981' },
  { name: 'Busboy', color: '#F59E0B' },
  { name: 'Runner', color: '#EF4444' },
  { name: 'Barback', color: '#6366F1' },
] as const;
