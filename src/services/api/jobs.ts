// API functions for job management
import { supabase } from './supabase';
import { Job, JobStatistics } from '../../types';

// Get all jobs for the current user
export const getJobs = async (activeOnly: boolean = true): Promise<Job[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Get a specific job by ID
export const getJobById = async (id: string): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Get the primary job for the current user
export const getPrimaryJob = async (): Promise<Job | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .eq('is_active', true)
    .single();

  if (error) {
    // If no primary job found, return null instead of throwing
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

// Create a new job
export const createJob = async (
  jobData: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Job> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('jobs')
    .insert([{
      user_id: user.id,
      ...jobData,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a job
export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Set a job as primary (will unset other jobs automatically via trigger)
export const setPrimaryJob = async (id: string): Promise<Job> => {
  return updateJob(id, { is_primary: true });
};

// Deactivate a job (soft delete)
export const deactivateJob = async (id: string): Promise<Job> => {
  return updateJob(id, { is_active: false });
};

// Reactivate a job
export const reactivateJob = async (id: string): Promise<Job> => {
  return updateJob(id, { is_active: true });
};

// Delete a job permanently
export const deleteJob = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get job statistics (uses the job_statistics view)
export const getJobStatistics = async (activeOnly: boolean = true): Promise<JobStatistics[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('job_statistics')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('total_tips', { ascending: false });

  // Note: The view doesn't have is_active column directly,
  // so we need to join with jobs table if we want to filter by active status
  if (activeOnly) {
    // Get active job IDs first
    const { data: activeJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeJobs) {
      const activeJobIds = activeJobs.map(j => j.id);
      query = query.in('id', activeJobIds);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Get statistics for a specific job
export const getJobStatisticsById = async (jobId: string): Promise<JobStatistics> => {
  const { data, error } = await supabase
    .from('job_statistics')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
};

// Migrate existing tips to a job
export const assignTipsToJob = async (tipIds: string[], jobId: string): Promise<void> => {
  const { error } = await supabase
    .from('tip_entries')
    .update({ job_id: jobId })
    .in('id', tipIds);

  if (error) throw error;
};

// Get all tips for a specific job
export const getTipsByJob = async (jobId: string, limit?: number) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('tip_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};
