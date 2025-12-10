import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { usePendingPoolsStore } from '../../store/pendingPoolsStore';
import { formatCurrency } from '../../utils/formatting';
import { lightHaptic } from '../../utils/haptics';

export default function PendingPoolsAlert() {
  const navigation = useNavigation();
  const pendingPools = usePendingPoolsStore((state) => state.pendingPools);
  const pendingCount = usePendingPoolsStore((state) => state.pendingCount);
  const fetchPendingPools = usePendingPoolsStore((state) => state.fetchPendingPools);

  useEffect(() => {
    fetchPendingPools();
  }, []);

  // Don't render if no pending pools
  if (pendingCount === 0) {
    return null;
  }

  // Calculate total pending amount
  const totalPendingAmount = pendingPools.reduce((sum, pool) => {
    // Find the current user's share in this pool
    const userShare = pool.participants?.find(p => !p.confirmed);
    return sum + (userShare?.share_amount || 0);
  }, 0);

  const handlePress = () => {
    lightHaptic();
    // Navigate to Teams screen
    navigation.navigate('Teams' as never);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="wallet-outline" size={24} color={Colors.gold} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {pendingCount === 1
            ? 'You have a pending pool share'
            : `You have ${pendingCount} pending pool shares`}
        </Text>
        <Text style={styles.subtitle}>
          {totalPendingAmount > 0
            ? `${formatCurrency(totalPendingAmount)} awaiting confirmation`
            : 'Tap to review and confirm'}
        </Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{pendingCount}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    ...Shadows.glowGoldSubtle,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.backgroundDark,
  },
});
