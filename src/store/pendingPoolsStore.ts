import { create } from 'zustand';
import { getPendingPools } from '../services/api/tipPools';
import type { TipPoolWithDetails } from '../types/teams';

interface PendingPoolsState {
  pendingPools: TipPoolWithDetails[];
  pendingCount: number;
  loading: boolean;
  lastFetched: number | null;

  // Actions
  fetchPendingPools: () => Promise<void>;
  clearPendingPools: () => void;
  decrementCount: () => void;
}

export const usePendingPoolsStore = create<PendingPoolsState>((set, get) => ({
  pendingPools: [],
  pendingCount: 0,
  loading: false,
  lastFetched: null,

  fetchPendingPools: async () => {
    // Don't refetch if we fetched within the last 30 seconds
    const now = Date.now();
    const lastFetched = get().lastFetched;
    if (lastFetched && now - lastFetched < 30000) {
      return;
    }

    try {
      set({ loading: true });
      const pools = await getPendingPools();
      set({
        pendingPools: pools,
        pendingCount: pools.length,
        lastFetched: now,
      });
    } catch (error) {
      console.error('[PendingPoolsStore] Error fetching pending pools:', error);
      // Don't clear existing data on error
    } finally {
      set({ loading: false });
    }
  },

  clearPendingPools: () => {
    set({
      pendingPools: [],
      pendingCount: 0,
      lastFetched: null,
    });
  },

  decrementCount: () => {
    const current = get().pendingCount;
    if (current > 0) {
      set({ pendingCount: current - 1 });
    }
  },
}));
