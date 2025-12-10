// Tip Pool Management API
import { supabase } from './supabase';
import { createTipEntry } from './tips';
import type {
  TipPool,
  PoolParticipant,
  TipPoolWithDetails,
  CreateTipPoolRequest,
  ConfirmPoolShareRequest,
} from '../../types/teams';

/**
 * Get all tip pools for a workplace
 */
export async function getWorkplacePools(workplaceId: string): Promise<TipPool[]> {
  const { data, error } = await supabase
    .from('tip_pools')
    .select('*')
    .eq('workplace_id', workplaceId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get pools where the current user is a participant (with unconfirmed shares)
 */
export async function getPendingPools(): Promise<TipPoolWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all pools where user is a participant and hasn't confirmed
  const { data: participants, error: participantsError } = await supabase
    .from('pool_participants')
    .select(`
      *,
      tip_pools!inner(*)
    `)
    .eq('user_id', user.id)
    .eq('confirmed', false);

  if (participantsError) throw participantsError;

  // Get full pool details for each
  const pools = await Promise.all(
    (participants || []).map(async (p: any) => {
      return await getPoolDetails(p.tip_pools.id);
    })
  );

  return pools;
}

/**
 * Get detailed information about a specific pool
 */
export async function getPoolDetails(poolId: string): Promise<TipPoolWithDetails> {
  const { data: pool, error: poolError } = await supabase
    .from('tip_pools')
    .select(`
      *,
      workplaces(*)
    `)
    .eq('id', poolId)
    .single();

  if (poolError) throw poolError;

  // Get participants
  const { data: participants, error: participantsError } = await supabase
    .from('pool_participants')
    .select('*')
    .eq('pool_id', poolId);

  if (participantsError) throw participantsError;

  // Calculate totals
  const confirmedParticipants = (participants || []).filter((p: any) => p.confirmed);
  const pendingParticipants = (participants || []).filter((p: any) => !p.confirmed);

  return {
    ...pool,
    workplace: pool.workplaces,
    participants: participants || [],
    creator_name: 'Pool Creator', // TODO: Fetch actual creator name
    total_confirmed: confirmedParticipants.length,
    total_pending: pendingParticipants.length,
  };
}

/**
 * Create a new tip pool
 */
export async function createTipPool(request: CreateTipPoolRequest): Promise<TipPool> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is a member of the workplace
  const { data: membership } = await supabase
    .from('workplace_memberships')
    .select('id')
    .eq('workplace_id', request.workplace_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    throw new Error('You must be a team member to create a pool');
  }

  // Validate split type logic
  if (request.split_type === 'equal_hours') {
    // All participants must have hours_worked
    const missingHours = request.participants.some((p) => !p.hours_worked || p.hours_worked <= 0);
    if (missingHours) {
      throw new Error('All participants must have hours worked for equal split');
    }
  } else if (request.split_type === 'custom_percentage') {
    // All participants must have percentage
    const missingPercentage = request.participants.some((p) => !p.percentage || p.percentage <= 0);
    if (missingPercentage) {
      throw new Error('All participants must have a percentage for custom split');
    }

    // Percentages must add up to 100
    const totalPercentage = request.participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Percentages must add up to 100% (currently ${totalPercentage.toFixed(1)}%)`);
    }
  }

  // Create the pool
  const { data: pool, error: poolError } = await supabase
    .from('tip_pools')
    .insert({
      workplace_id: request.workplace_id,
      date: request.date,
      shift_type: request.shift_type,
      total_amount: request.total_amount,
      split_type: request.split_type,
      created_by: user.id,
      status: 'draft',
    })
    .select()
    .single();

  if (poolError) throw poolError;

  // Calculate shares based on split type
  const participantsWithShares = calculateShares(
    request.participants,
    request.split_type,
    request.total_amount
  );

  // Add participants
  const { error: participantsError } = await supabase
    .from('pool_participants')
    .insert(
      participantsWithShares.map((p) => ({
        pool_id: pool.id,
        user_id: p.user_id,
        hours_worked: p.hours_worked,
        percentage: p.percentage,
        share_amount: p.share_amount,
        confirmed: false,
      }))
    );

  if (participantsError) {
    // Rollback pool creation
    await supabase.from('tip_pools').delete().eq('id', pool.id);
    throw participantsError;
  }

  return pool;
}

/**
 * Calculate share amounts for participants
 */
function calculateShares(
  participants: Array<{
    user_id: string;
    hours_worked?: number;
    percentage?: number;
  }>,
  splitType: 'equal_hours' | 'custom_percentage',
  totalAmount: number
): Array<{
  user_id: string;
  hours_worked?: number;
  percentage?: number;
  share_amount: number;
}> {
  if (splitType === 'equal_hours') {
    // Calculate total hours
    const totalHours = participants.reduce((sum, p) => sum + (p.hours_worked || 0), 0);

    if (totalHours === 0) {
      throw new Error('Total hours cannot be zero');
    }

    // Calculate hourly rate
    const hourlyRate = totalAmount / totalHours;

    // Calculate each person's share
    return participants.map((p) => ({
      ...p,
      share_amount: Math.round((p.hours_worked || 0) * hourlyRate * 100) / 100,
    }));
  } else {
    // custom_percentage
    return participants.map((p) => ({
      ...p,
      share_amount: Math.round(totalAmount * ((p.percentage || 0) / 100) * 100) / 100,
    }));
  }
}

/**
 * Confirm a participant's share in a pool
 */
export async function confirmPoolShare(request: ConfirmPoolShareRequest): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify the participant belongs to the current user
  const { data: participant, error: fetchError } = await supabase
    .from('pool_participants')
    .select('*')
    .eq('id', request.participant_id)
    .eq('pool_id', request.pool_id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !participant) {
    throw new Error('Participant not found or unauthorized');
  }

  if (participant.confirmed) {
    throw new Error('Share already confirmed');
  }

  // Update confirmation status
  const { error: updateError } = await supabase
    .from('pool_participants')
    .update({
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', request.participant_id);

  if (updateError) throw updateError;

  // Create a tip entry for this confirmed share
  const { data: poolData } = await supabase
    .from('tip_pools')
    .select('date')
    .eq('id', request.pool_id)
    .single();

  if (poolData) {
    // Note: Pool shift_type values (breakfast/lunch/dinner/late_night) don't match
    // tip_entries shift_type constraint (day/night/double/other), so we use 'other'
    await createTipEntry({
      date: poolData.date,
      hours_worked: participant.hours_worked || 0,
      tips_earned: parseFloat(participant.share_amount),
      shift_type: 'other',
      notes: `Pool share from team`,
    });
  }

  // Check if all participants have confirmed - auto-finalize if yes
  const { data: allParticipants } = await supabase
    .from('pool_participants')
    .select('confirmed')
    .eq('pool_id', request.pool_id);

  const allConfirmed = allParticipants?.every(p => p.confirmed);

  if (allConfirmed) {
    // Auto-finalize the pool
    await supabase
      .from('tip_pools')
      .update({ status: 'finalized' })
      .eq('id', request.pool_id);
  }
}

/**
 * Finalize a pool (lock it from further edits)
 */
export async function finalizePool(poolId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is the pool creator
  const { data: pool, error: poolError } = await supabase
    .from('tip_pools')
    .select('created_by, status')
    .eq('id', poolId)
    .single();

  if (poolError || !pool) {
    throw new Error('Pool not found');
  }

  if (pool.created_by !== user.id) {
    throw new Error('Only the pool creator can finalize it');
  }

  if (pool.status !== 'draft') {
    throw new Error('Pool is already finalized or cancelled');
  }

  // Update status to finalized
  const { error: updateError } = await supabase
    .from('tip_pools')
    .update({ status: 'finalized' })
    .eq('id', poolId);

  if (updateError) throw updateError;

  // TODO: Send notifications to all unconfirmed participants
}

/**
 * Cancel a pool (only creator, only if draft)
 */
export async function cancelPool(poolId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is the pool creator
  const { data: pool, error: poolError } = await supabase
    .from('tip_pools')
    .select('created_by, status')
    .eq('id', poolId)
    .single();

  if (poolError || !pool) {
    throw new Error('Pool not found');
  }

  if (pool.created_by !== user.id) {
    throw new Error('Only the pool creator can cancel it');
  }

  if (pool.status !== 'draft') {
    throw new Error('Can only cancel draft pools');
  }

  // Update status to cancelled
  const { error: updateError } = await supabase
    .from('tip_pools')
    .update({ status: 'cancelled' })
    .eq('id', poolId);

  if (updateError) throw updateError;
}

/**
 * Delete a pool (only creator, only if draft and no confirmations)
 */
export async function deletePool(poolId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is the pool creator
  const { data: pool, error: poolError } = await supabase
    .from('tip_pools')
    .select('created_by, status')
    .eq('id', poolId)
    .single();

  if (poolError || !pool) {
    throw new Error('Pool not found');
  }

  if (pool.created_by !== user.id) {
    throw new Error('Only the pool creator can delete it');
  }

  if (pool.status !== 'draft') {
    throw new Error('Can only delete draft pools');
  }

  // Check for confirmations
  const { data: participants } = await supabase
    .from('pool_participants')
    .select('confirmed')
    .eq('pool_id', poolId);

  const hasConfirmations = (participants || []).some((p: any) => p.confirmed);
  if (hasConfirmations) {
    throw new Error('Cannot delete pool with confirmed participants');
  }

  // Delete pool (participants will cascade delete)
  const { error: deleteError } = await supabase
    .from('tip_pools')
    .delete()
    .eq('id', poolId);

  if (deleteError) throw deleteError;
}

/**
 * Get pool statistics for a workplace
 */
export async function getWorkplacePoolStats(workplaceId: string) {
  const { data: pools, error } = await supabase
    .from('tip_pools')
    .select('*')
    .eq('workplace_id', workplaceId)
    .eq('status', 'finalized');

  if (error) throw error;

  const totalPools = pools?.length || 0;
  const totalAmount = pools?.reduce((sum, pool) => sum + Number(pool.total_amount), 0) || 0;

  return {
    total_pools: totalPools,
    total_amount: totalAmount,
    average_pool: totalPools > 0 ? totalAmount / totalPools : 0,
  };
}
