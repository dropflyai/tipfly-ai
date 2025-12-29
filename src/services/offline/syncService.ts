// Sync Service for TipFly AI
// Handles syncing offline changes when connection is restored

import { useOfflineStore } from '../../store/offlineStore';
import { supabase } from '../api/supabase';
import { Analytics } from '../analytics/analytics';

const MAX_RETRIES = 3;

// Sync all pending changes
export const syncPendingChanges = async (): Promise<{
  success: boolean;
  synced: number;
  failed: number;
}> => {
  const store = useOfflineStore.getState();

  if (store.isSyncing) {
    console.log('[Sync] Already syncing, skipping...');
    return { success: false, synced: 0, failed: 0 };
  }

  if (!store.hasPendingChanges()) {
    console.log('[Sync] No pending changes to sync');
    return { success: true, synced: 0, failed: 0 };
  }

  store.setSyncing(true);
  store.setSyncError(null);

  let synced = 0;
  let failed = 0;

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Sync pending tips first (creates)
    for (const pendingTip of store.pendingTips) {
      if (pendingTip.retryCount >= MAX_RETRIES) {
        console.log('[Sync] Skipping tip after max retries:', pendingTip.id);
        failed++;
        continue;
      }

      try {
        const { error } = await supabase
          .from('tip_entries')
          .insert([{
            user_id: user.id,
            ...pendingTip.data,
          }]);

        if (error) throw error;

        store.removePendingTip(pendingTip.id);
        synced++;
        console.log('[Sync] Synced tip:', pendingTip.id);
      } catch (error) {
        console.error('[Sync] Failed to sync tip:', pendingTip.id, error);
        store.incrementRetryCount('tip', pendingTip.id);
        failed++;
      }
    }

    // Sync pending edits (updates)
    for (const pendingEdit of store.pendingEdits) {
      if (pendingEdit.retryCount >= MAX_RETRIES) {
        console.log('[Sync] Skipping edit after max retries:', pendingEdit.id);
        failed++;
        continue;
      }

      try {
        const { error } = await supabase
          .from('tip_entries')
          .update(pendingEdit.updates)
          .eq('id', pendingEdit.id);

        if (error) throw error;

        store.removePendingEdit(pendingEdit.id);
        synced++;
        console.log('[Sync] Synced edit:', pendingEdit.id);
      } catch (error) {
        console.error('[Sync] Failed to sync edit:', pendingEdit.id, error);
        store.incrementRetryCount('edit', pendingEdit.id);
        failed++;
      }
    }

    // Sync pending deletes
    for (const pendingDelete of store.pendingDeletes) {
      if (pendingDelete.retryCount >= MAX_RETRIES) {
        console.log('[Sync] Skipping delete after max retries:', pendingDelete.id);
        failed++;
        continue;
      }

      try {
        const { error } = await supabase
          .from('tip_entries')
          .delete()
          .eq('id', pendingDelete.id);

        if (error) throw error;

        store.removePendingDelete(pendingDelete.id);
        synced++;
        console.log('[Sync] Synced delete:', pendingDelete.id);
      } catch (error) {
        console.error('[Sync] Failed to sync delete:', pendingDelete.id, error);
        store.incrementRetryCount('delete', pendingDelete.id);
        failed++;
      }
    }

    // Update last sync time
    store.setLastSyncAt(new Date().toISOString());

    // Track sync event
    Analytics.track('tips_synced', {
      count: synced,
      success: failed === 0,
    });

    console.log(`[Sync] Complete: ${synced} synced, ${failed} failed`);
    return { success: failed === 0, synced, failed };
  } catch (error) {
    console.error('[Sync] Error:', error);
    store.setSyncError(error instanceof Error ? error.message : 'Sync failed');

    Analytics.track('sync_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pending_count: store.getPendingCount(),
    });

    return { success: false, synced, failed };
  } finally {
    store.setSyncing(false);
  }
};

// Clear failed items that exceeded max retries
export const clearFailedItems = (): void => {
  const store = useOfflineStore.getState();

  // Remove tips that exceeded retries
  store.pendingTips
    .filter((t) => t.retryCount >= MAX_RETRIES)
    .forEach((t) => store.removePendingTip(t.id));

  // Remove edits that exceeded retries
  store.pendingEdits
    .filter((e) => e.retryCount >= MAX_RETRIES)
    .forEach((e) => store.removePendingEdit(e.id));

  // Remove deletes that exceeded retries
  store.pendingDeletes
    .filter((d) => d.retryCount >= MAX_RETRIES)
    .forEach((d) => store.removePendingDelete(d.id));
};

// Force sync with reset (use with caution)
export const forceSyncAndReset = async (): Promise<void> => {
  const store = useOfflineStore.getState();
  store.clearAllPending();
  store.setLastSyncAt(new Date().toISOString());
  console.log('[Sync] Force reset complete');
};
