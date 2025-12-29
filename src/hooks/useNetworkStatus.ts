// Hook to monitor network connectivity
import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useOfflineStore } from '../store/offlineStore';
import { syncPendingChanges } from '../services/offline/syncService';

export const useNetworkStatus = () => {
  const { isOnline, setOnline, hasPendingChanges, isSyncing } = useOfflineStore();
  const appState = useRef(AppState.currentState);
  const syncInProgress = useRef(false);

  // Handle network state changes
  const handleNetworkChange = useCallback(
    async (state: NetInfoState) => {
      const wasOffline = !isOnline;
      const nowOnline = state.isConnected === true && state.isInternetReachable !== false;

      setOnline(nowOnline);

      // If we just came online and have pending changes, sync them
      if (wasOffline && nowOnline && hasPendingChanges() && !syncInProgress.current) {
        syncInProgress.current = true;
        try {
          await syncPendingChanges();
        } finally {
          syncInProgress.current = false;
        }
      }
    },
    [isOnline, setOnline, hasPendingChanges]
  );

  // Handle app state changes (foreground/background)
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Check network and sync if needed
        const state = await NetInfo.fetch();
        handleNetworkChange(state);
      }

      appState.current = nextAppState;
    },
    [handleNetworkChange]
  );

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribeNetInfo = NetInfo.addEventListener(handleNetworkChange);

    // Subscribe to app state changes
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Initial network check
    NetInfo.fetch().then(handleNetworkChange);

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [handleNetworkChange, handleAppStateChange]);

  // Manual sync function
  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing || syncInProgress.current) {
      return false;
    }

    syncInProgress.current = true;
    try {
      await syncPendingChanges();
      return true;
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline, isSyncing]);

  return {
    isOnline,
    triggerSync,
    hasPendingChanges: hasPendingChanges(),
    isSyncing,
  };
};

export default useNetworkStatus;
