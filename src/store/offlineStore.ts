// Zustand store for offline state management
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipEntry } from '../types';

// Pending operations that need to sync
export interface PendingTip {
  id: string; // Temporary local ID
  data: Omit<TipEntry, 'id' | 'user_id' | 'hourly_rate' | 'created_at' | 'updated_at'>;
  createdAt: string;
  retryCount: number;
}

export interface PendingEdit {
  id: string; // Real server ID
  updates: Partial<TipEntry>;
  createdAt: string;
  retryCount: number;
}

export interface PendingDelete {
  id: string; // Real server ID
  createdAt: string;
  retryCount: number;
}

interface OfflineState {
  // Network status
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // Pending operations
  pendingTips: PendingTip[];
  pendingEdits: PendingEdit[];
  pendingDeletes: PendingDelete[];

  // Sync state
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;

  // Actions
  addPendingTip: (tip: PendingTip) => void;
  removePendingTip: (id: string) => void;
  addPendingEdit: (edit: PendingEdit) => void;
  removePendingEdit: (id: string) => void;
  addPendingDelete: (del: PendingDelete) => void;
  removePendingDelete: (id: string) => void;
  incrementRetryCount: (type: 'tip' | 'edit' | 'delete', id: string) => void;

  // Sync actions
  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncAt: (date: string) => void;
  clearAllPending: () => void;

  // Computed
  getPendingCount: () => number;
  hasPendingChanges: () => boolean;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: true,
      pendingTips: [],
      pendingEdits: [],
      pendingDeletes: [],
      isSyncing: false,
      lastSyncAt: null,
      syncError: null,

      // Network status
      setOnline: (online) => set({ isOnline: online }),

      // Pending tips
      addPendingTip: (tip) =>
        set((state) => ({
          pendingTips: [...state.pendingTips, tip],
        })),

      removePendingTip: (id) =>
        set((state) => ({
          pendingTips: state.pendingTips.filter((t) => t.id !== id),
        })),

      // Pending edits
      addPendingEdit: (edit) =>
        set((state) => {
          // If there's already a pending edit for this ID, merge them
          const existingIndex = state.pendingEdits.findIndex((e) => e.id === edit.id);
          if (existingIndex >= 0) {
            const updated = [...state.pendingEdits];
            updated[existingIndex] = {
              ...updated[existingIndex],
              updates: { ...updated[existingIndex].updates, ...edit.updates },
            };
            return { pendingEdits: updated };
          }
          return { pendingEdits: [...state.pendingEdits, edit] };
        }),

      removePendingEdit: (id) =>
        set((state) => ({
          pendingEdits: state.pendingEdits.filter((e) => e.id !== id),
        })),

      // Pending deletes
      addPendingDelete: (del) =>
        set((state) => {
          // Also remove any pending edits for this ID
          return {
            pendingDeletes: [...state.pendingDeletes, del],
            pendingEdits: state.pendingEdits.filter((e) => e.id !== del.id),
          };
        }),

      removePendingDelete: (id) =>
        set((state) => ({
          pendingDeletes: state.pendingDeletes.filter((d) => d.id !== id),
        })),

      // Retry count
      incrementRetryCount: (type, id) =>
        set((state) => {
          if (type === 'tip') {
            return {
              pendingTips: state.pendingTips.map((t) =>
                t.id === id ? { ...t, retryCount: t.retryCount + 1 } : t
              ),
            };
          } else if (type === 'edit') {
            return {
              pendingEdits: state.pendingEdits.map((e) =>
                e.id === id ? { ...e, retryCount: e.retryCount + 1 } : e
              ),
            };
          } else {
            return {
              pendingDeletes: state.pendingDeletes.map((d) =>
                d.id === id ? { ...d, retryCount: d.retryCount + 1 } : d
              ),
            };
          }
        }),

      // Sync actions
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncError: (error) => set({ syncError: error }),
      setLastSyncAt: (date) => set({ lastSyncAt: date, syncError: null }),

      clearAllPending: () =>
        set({
          pendingTips: [],
          pendingEdits: [],
          pendingDeletes: [],
          syncError: null,
        }),

      // Computed
      getPendingCount: () => {
        const state = get();
        return (
          state.pendingTips.length +
          state.pendingEdits.length +
          state.pendingDeletes.length
        );
      },

      hasPendingChanges: () => {
        const state = get();
        return (
          state.pendingTips.length > 0 ||
          state.pendingEdits.length > 0 ||
          state.pendingDeletes.length > 0
        );
      },
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist pending operations, not transient state
      partialize: (state) => ({
        pendingTips: state.pendingTips,
        pendingEdits: state.pendingEdits,
        pendingDeletes: state.pendingDeletes,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
