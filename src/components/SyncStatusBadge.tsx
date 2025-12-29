// Sync Status Badge Component
// Shows offline/syncing status in the UI

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useOfflineStore } from '../store/offlineStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { lightHaptic } from '../utils/haptics';

interface SyncStatusBadgeProps {
  compact?: boolean;
  onPress?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  compact = false,
  onPress,
}) => {
  const { isOnline, isSyncing, hasPendingChanges, triggerSync } = useNetworkStatus();
  const { getPendingCount, lastSyncAt, syncError } = useOfflineStore();
  const pendingCount = getPendingCount();

  // Don't show anything if online with no pending changes
  if (isOnline && !hasPendingChanges && !isSyncing) {
    return null;
  }

  const handlePress = async () => {
    lightHaptic();
    if (onPress) {
      onPress();
    } else if (isOnline && hasPendingChanges) {
      await triggerSync();
    }
  };

  // Compact version (just icon + count)
  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          !isOnline && styles.offlineBackground,
          isSyncing && styles.syncingBackground,
          syncError && styles.errorBackground,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : !isOnline ? (
          <Ionicons name="cloud-offline" size={16} color={Colors.warning} />
        ) : syncError ? (
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
        ) : (
          <Ionicons name="cloud-upload" size={16} color={Colors.primary} />
        )}
        {pendingCount > 0 && !isSyncing && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Full version (icon + text + count)
  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isOnline && styles.offlineContainer,
        isSyncing && styles.syncingContainer,
        syncError && styles.errorContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : !isOnline ? (
          <Ionicons name="cloud-offline" size={20} color={Colors.warning} />
        ) : syncError ? (
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
        ) : (
          <Ionicons name="cloud-upload" size={20} color={Colors.primary} />
        )}
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>
          {isSyncing
            ? 'Syncing...'
            : !isOnline
            ? 'Offline Mode'
            : syncError
            ? 'Sync Failed'
            : `${pendingCount} pending`}
        </Text>
        {!isSyncing && (
          <Text style={styles.subtitleText}>
            {!isOnline
              ? 'Changes will sync when online'
              : syncError
              ? 'Tap to retry'
              : 'Tap to sync now'}
          </Text>
        )}
      </View>

      {/* Count badge */}
      {pendingCount > 0 && !isSyncing && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Inline status indicator (for headers)
export const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, hasPendingChanges } = useNetworkStatus();

  if (isOnline && !hasPendingChanges && !isSyncing) {
    return null;
  }

  return (
    <View style={styles.indicator}>
      {isSyncing ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : !isOnline ? (
        <Ionicons name="cloud-offline" size={16} color={Colors.warning} />
      ) : (
        <View style={styles.pendingDot} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
  },
  offlineBackground: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  syncingBackground: {
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
  },
  errorBackground: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },

  // Full styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
  },
  offlineContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  syncingContainer: {
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderColor: 'rgba(0, 168, 232, 0.3)',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },

  // Indicator styles
  indicator: {
    marginLeft: 8,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});

export default SyncStatusBadge;
