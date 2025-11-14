// API functions for tip entries
import { supabase } from './supabase';
import { TipEntry } from '../../types';

// Create a new tip entry
export const createTipEntry = async (tipData: Omit<TipEntry, 'id' | 'user_id' | 'hourly_rate' | 'created_at' | 'updated_at'>): Promise<TipEntry> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tip_entries')
    .insert([{
      user_id: user.id,
      ...tipData,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all tip entries for the current user
export const getTipEntries = async (limit?: number): Promise<TipEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('tip_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Get tip entries for a specific date range
export const getTipEntriesByDateRange = async (startDate: string, endDate: string): Promise<TipEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tip_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update a tip entry
export const updateTipEntry = async (id: string, updates: Partial<TipEntry>): Promise<TipEntry> => {
  const { data, error } = await supabase
    .from('tip_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a tip entry
export const deleteTipEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tip_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get today's tips
export const getTodaysTips = async (): Promise<TipEntry[]> => {
  const today = new Date().toISOString().split('T')[0];
  return getTipEntriesByDateRange(today, today);
};

// Get this week's tips
export const getWeeklyTips = async (): Promise<TipEntry[]> => {
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

  const startDate = firstDayOfWeek.toISOString().split('T')[0];
  const endDate = lastDayOfWeek.toISOString().split('T')[0];

  return getTipEntriesByDateRange(startDate, endDate);
};

// Get this month's tips
export const getMonthlyTips = async (): Promise<TipEntry[]> => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const startDate = firstDayOfMonth.toISOString().split('T')[0];
  const endDate = lastDayOfMonth.toISOString().split('T')[0];

  return getTipEntriesByDateRange(startDate, endDate);
};
