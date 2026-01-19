// Offline-aware tip API functions
// Wraps the regular tips API with offline queue support

import { supabase } from './supabase';
import { TipEntry } from '../../types';
import { useOfflineStore, PendingTip, PendingEdit, PendingDelete } from '../../store/offlineStore';
import { Analytics } from '../analytics/analytics';

// Generate a temporary local ID for offline entries
const generateLocalId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Create a new tip entry (with offline support)
export const createTipEntryOffline = async (
  tipData: Omit<TipEntry, 'id' | 'user_id' | 'hourly_rate' | 'created_at' | 'updated_at'>
): Promise<TipEntry | PendingTip> => {
  const { isOnline, addPendingTip } = useOfflineStore.getState();

  // If online, try to create directly
  if (isOnline) {
    try {
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

      // Track successful online add
      Analytics.tipAdded(tipData.tips_earned, tipData.shift_type || 'day', false);

      return data;
    } catch (error) {
      console.log('[Tips] Online create failed, queuing offline:', error);
      // Fall through to offline handling
    }
  }

  // Queue for offline sync
  const pendingTip: PendingTip = {
    id: generateLocalId(),
    data: tipData,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  addPendingTip(pendingTip);

  // Track offline add
  Analytics.track('tip_added_offline', { amount: tipData.tips_earned });

  console.log('[Tips] Queued tip for offline sync:', pendingTip.id);

  return pendingTip;
};

// Update a tip entry (with offline support)
export const updateTipEntryOffline = async (
  id: string,
  updates: Partial<TipEntry>
): Promise<TipEntry | PendingTip | PendingEdit> => {
  const { isOnline, addPendingEdit, pendingTips, removePendingTip, addPendingTip } = useOfflineStore.getState();

  // Check if this is a pending (not yet synced) tip
  const pendingTip = pendingTips.find((t) => t.id === id);
  if (pendingTip) {
    // Update the pending tip directly
    removePendingTip(id);
    const updatedPending: PendingTip = {
      ...pendingTip,
      data: { ...pendingTip.data, ...updates },
    };
    addPendingTip(updatedPending);
    return updatedPending;
  }

  // If online, try to update directly
  if (isOnline) {
    try {
      const { data, error } = await supabase
        .from('tip_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      Analytics.track('tip_edited', { field_changed: Object.keys(updates).join(',') });

      return data;
    } catch (error) {
      console.log('[Tips] Online update failed, queuing offline:', error);
      // Fall through to offline handling
    }
  }

  // Queue for offline sync
  const pendingEdit: PendingEdit = {
    id,
    updates,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  addPendingEdit(pendingEdit);

  console.log('[Tips] Queued edit for offline sync:', id);

  return pendingEdit;
};

// Delete a tip entry (with offline support)
export const deleteTipEntryOffline = async (id: string): Promise<void> => {
  const { isOnline, addPendingDelete, pendingTips, removePendingTip } = useOfflineStore.getState();

  // Check if this is a pending (not yet synced) tip
  const pendingTip = pendingTips.find((t) => t.id === id);
  if (pendingTip) {
    // Just remove from pending, no need to sync a delete
    removePendingTip(id);
    console.log('[Tips] Removed pending tip (never synced):', id);
    return;
  }

  // If online, try to delete directly
  if (isOnline) {
    try {
      const { error } = await supabase
        .from('tip_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Analytics.track('tip_deleted', {});

      return;
    } catch (error) {
      console.log('[Tips] Online delete failed, queuing offline:', error);
      // Fall through to offline handling
    }
  }

  // Queue for offline sync
  const pendingDelete: PendingDelete = {
    id,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  addPendingDelete(pendingDelete);

  console.log('[Tips] Queued delete for offline sync:', id);
};

// Get all tip entries (includes pending offline entries)
export const getTipEntriesWithPending = async (limit?: number): Promise<(TipEntry | PendingTip)[]> => {
  const { isOnline, pendingTips } = useOfflineStore.getState();

  let serverTips: TipEntry[] = [];

  // Try to fetch from server if online
  if (isOnline) {
    try {
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
      serverTips = data || [];
    } catch (error) {
      console.log('[Tips] Failed to fetch from server:', error);
    }
  }

  // Merge with pending tips (pending tips appear first/at top)
  const pendingAsTips = pendingTips.map((p) => ({
    ...p,
    isPending: true,
  }));

  // Sort by date (pending entries use their data.date)
  const allEntries = [...pendingAsTips, ...serverTips].sort((a, b) => {
    const dateA = 'data' in a ? a.data.date : a.date;
    const dateB = 'data' in b ? b.data.date : b.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  if (limit) {
    return allEntries.slice(0, limit);
  }

  return allEntries;
};

// Check if an entry is pending (not synced)
export const isPendingEntry = (entry: TipEntry | PendingTip): entry is PendingTip => {
  return 'data' in entry && 'retryCount' in entry;
};

// Get pending count
export const getPendingTipCount = (): number => {
  return useOfflineStore.getState().pendingTips.length;
};
