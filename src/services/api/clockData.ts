// Clock In/Out Data Helper for Tip Pools
import { supabase } from './supabase';

export interface UserClockData {
  user_id: string;
  hours_worked: number;
  shift_start?: Date;
  shift_end?: Date;
  has_clock_data: boolean;
}

/**
 * Get clock in/out hours for team members on a specific date
 * Used to auto-fill hours when creating a tip pool
 */
export async function getTeamMemberHoursForDate(
  workplaceId: string,
  date: string // ISO format: YYYY-MM-DD
): Promise<Map<string, UserClockData>> {
  try {
    // Get all members of the workplace
    const { data: members, error: membersError } = await supabase
      .from('workplace_memberships')
      .select('user_id')
      .eq('workplace_id', workplaceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return new Map();

    const userIds = members.map(m => m.user_id);

    // Get tip entries for these users on the specified date
    // tip_entries contains hours_worked which could be from clock in/out
    const { data: entries, error: entriesError } = await supabase
      .from('tip_entries')
      .select('user_id, hours_worked, created_at')
      .in('user_id', userIds)
      .eq('date', date);

    if (entriesError) throw entriesError;

    // Build map of user_id -> clock data
    const clockDataMap = new Map<string, UserClockData>();

    for (const member of members) {
      const entry = (entries || []).find(e => e.user_id === member.user_id);

      if (entry && entry.hours_worked > 0) {
        clockDataMap.set(member.user_id, {
          user_id: member.user_id,
          hours_worked: parseFloat(entry.hours_worked),
          has_clock_data: true,
        });
      } else {
        clockDataMap.set(member.user_id, {
          user_id: member.user_id,
          hours_worked: 0,
          has_clock_data: false,
        });
      }
    }

    return clockDataMap;
  } catch (error) {
    console.error('[getTeamMemberHoursForDate] Error:', error);
    return new Map();
  }
}

/**
 * Get current user's hours for a specific date
 */
export async function getMyHoursForDate(date: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('tip_entries')
      .select('hours_worked')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (error || !data) return 0;
    return parseFloat(data.hours_worked) || 0;
  } catch (error) {
    console.error('[getMyHoursForDate] Error:', error);
    return 0;
  }
}
