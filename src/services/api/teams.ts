// Team/Workplace Management API
import { supabase } from './supabase';
import type {
  Workplace,
  WorkplaceMembership,
  WorkplaceWithMembers,
  CreateWorkplaceRequest,
  JoinWorkplaceRequest,
} from '../../types/teams';

/**
 * Get all workplaces the current user is a member of
 */
export async function getUserWorkplaces(): Promise<WorkplaceWithMembers[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, get user's memberships to find their workplaces (avoids RLS recursion)
  const { data: memberships, error: membershipError } = await supabase
    .from('workplace_memberships')
    .select('workplace_id, role')
    .eq('user_id', user.id);

  if (membershipError) throw membershipError;
  if (!memberships || memberships.length === 0) return [];

  // Get the workplace IDs
  const workplaceIds = memberships.map(m => m.workplace_id);

  // Fetch workplace details
  const { data, error } = await supabase
    .from('workplaces')
    .select('*')
    .in('id', workplaceIds)
    .order('created_at', { ascending: false});

  if (error) throw error;

  // Get member counts for each workplace
  const workplacesWithCounts = await Promise.all(
    (data || []).map(async (workplace: any) => {
      const { count } = await supabase
        .from('workplace_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('workplace_id', workplace.id);

      // Find user's role for this workplace
      const userMembership = memberships.find(m => m.workplace_id === workplace.id);

      return {
        ...workplace,
        member_count: count || 0,
        user_role: userMembership?.role || 'member',
      };
    })
  );

  return workplacesWithCounts;
}
/**
 * Create a new workplace/team
 */
export async function createWorkplace(request: CreateWorkplaceRequest): Promise<Workplace> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate unique invite code
  let inviteCode = '';
  let codeExists = true;
  let attempts = 0;

  while (codeExists && attempts < 10) {
    inviteCode = generateInviteCode();
    const { data } = await supabase
      .from('workplaces')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    codeExists = !!data;
    attempts++;
  }

  if (codeExists) {
    throw new Error('Failed to generate unique invite code');
  }

  // Create workplace
  const { data: workplace, error: workplaceError } = await supabase
    .from('workplaces')
    .insert({
      name: request.name.trim(),
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select()
    .single();

  if (workplaceError) throw workplaceError;

  // Auto-join creator as owner
  const { error: membershipError } = await supabase
    .from('workplace_memberships')
    .insert({
      workplace_id: workplace.id,
      user_id: user.id,
      role: 'owner',
    });

  if (membershipError) {
    // Rollback workplace creation
    await supabase.from('workplaces').delete().eq('id', workplace.id);
    throw membershipError;
  }

  return workplace;
}

/**
 * Join a workplace using invite code
 */
export async function joinWorkplace(request: JoinWorkplaceRequest): Promise<Workplace> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const inviteCode = request.invite_code.trim();

  // Find workplace by invite code using RPC function (bypasses RLS)
  const { data: lookupResult, error: lookupError } = await supabase
    .rpc('lookup_workplace_by_invite_code', { code: inviteCode });

  if (lookupError || !lookupResult || lookupResult.length === 0) {
    throw new Error('Invalid invite code');
  }

  const workplaceId = lookupResult[0].id;
  const workplaceName = lookupResult[0].name;

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from('workplace_memberships')
    .select('id')
    .eq('workplace_id', workplaceId)
    .eq('user_id', user.id)
    .single();

  if (existingMembership) {
    throw new Error('You are already a member of this team');
  }

  // Join as member
  const { error: membershipError } = await supabase
    .from('workplace_memberships')
    .insert({
      workplace_id: workplaceId,
      user_id: user.id,
      role: 'member',
    });

  if (membershipError) throw membershipError;

  // Fetch the full workplace data now that we're a member
  const { data: workplace, error: workplaceError } = await supabase
    .from('workplaces')
    .select('*')
    .eq('id', workplaceId)
    .single();

  if (workplaceError || !workplace) {
    // Return minimal data if we can't fetch full details
    return {
      id: workplaceId,
      name: workplaceName,
      invite_code: inviteCode.toUpperCase(),
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return workplace;
}

/**
 * Leave a workplace
 */
export async function leaveWorkplace(workplaceId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user is the owner
  const { data: membership } = await supabase
    .from('workplace_memberships')
    .select('role')
    .eq('workplace_id', workplaceId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role === 'owner') {
    // Check if there are other members
    const { count } = await supabase
      .from('workplace_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('workplace_id', workplaceId);

    if (count && count > 1) {
      throw new Error('Transfer ownership before leaving. You are the only owner.');
    }

    // Delete workplace if owner and no other members
    const { error: deleteError } = await supabase
      .from('workplaces')
      .delete()
      .eq('id', workplaceId);

    if (deleteError) throw deleteError;
  } else {
    // Regular member leaving
    const { error } = await supabase
      .from('workplace_memberships')
      .delete()
      .eq('workplace_id', workplaceId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

/**
 * Get members of a workplace
 */
export async function getWorkplaceMembers(workplaceId: string): Promise<any[]> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('workplace_memberships')
    .select(`
      id,
      role,
      joined_at,
      user_id
    `)
    .eq('workplace_id', workplaceId)
    .order('joined_at', { ascending: true });

  if (error) throw error;

  // Get user details for each member
  const membersWithDetails = (data || []).map((membership: any) => {
    // Check if this is the current user
    const isCurrentUser = currentUser && membership.user_id === currentUser.id;

    return {
      ...membership,
      name: isCurrentUser ? 'You' : 'Team Member',
      email: isCurrentUser ? currentUser.email : '',
      isCurrentUser,
    };
  });

  // Sort to put current user first, then by role (owner first)
  membersWithDetails.sort((a, b) => {
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (b.role === 'owner' && a.role !== 'owner') return 1;
    return 0;
  });

  return membersWithDetails;
}

/**
 * Update workplace name
 */
export async function updateWorkplaceName(workplaceId: string, name: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is owner
  const { data: membership } = await supabase
    .from('workplace_memberships')
    .select('role')
    .eq('workplace_id', workplaceId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'owner') {
    throw new Error('Only the owner can update workplace details');
  }

  const { error } = await supabase
    .from('workplaces')
    .update({ name: name.trim() })
    .eq('id', workplaceId);

  if (error) throw error;
}

/**
 * Generate a random 6-character invite code
 * Format: ABCDEF (uppercase letters and numbers, excluding confusing chars)
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude 0,O,1,I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
