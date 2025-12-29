// Referral Card Component for Dashboard
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlassStyles } from '../../constants/colors';
import { useReferralStore, REWARD_TIERS } from '../../store/referralStore';
import { lightHaptic } from '../../utils/haptics';

interface ReferralCardProps {
  compact?: boolean;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ compact = false }) => {
  const navigation = useNavigation();
  const { referralCount, getNextRewardTier, getUnredeemedRewards } = useReferralStore();

  const nextTier = getNextRewardTier();
  const unredeemedRewards = getUnredeemedRewards();
  const hasUnclaimedReward = unredeemedRewards.length > 0;

  const handlePress = () => {
    lightHaptic();
    navigation.navigate('Referral' as never);
  };

  // Calculate progress
  const getProgress = () => {
    if (!nextTier) return 100;
    const tierIndex = REWARD_TIERS.findIndex((t) => referralCount < t.count);
    if (tierIndex === 0) {
      return (referralCount / REWARD_TIERS[0].count) * 100;
    }
    const prevCount = REWARD_TIERS[tierIndex - 1]?.count || 0;
    const nextCount = REWARD_TIERS[tierIndex].count;
    return ((referralCount - prevCount) / (nextCount - prevCount)) * 100;
  };

  // Compact version for settings or smaller areas
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.compactIcon}>
          <Ionicons name="gift" size={20} color={Colors.primary} />
          {hasUnclaimedReward && <View style={styles.notificationDot} />}
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle}>Invite Friends</Text>
          <Text style={styles.compactSubtitle}>
            {hasUnclaimedReward
              ? 'You have a reward to claim!'
              : nextTier
              ? `${nextTier.needed} more for ${nextTier.tier}`
              : 'Share your code'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  // Full card for dashboard
  return (
    <TouchableOpacity
      style={[styles.card, hasUnclaimedReward && styles.cardHighlight]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={24} color={Colors.primary} />
          {hasUnclaimedReward && <View style={styles.notificationDot} />}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Invite Friends, Earn Free Premium</Text>
          <Text style={styles.subtitle}>
            {hasUnclaimedReward
              ? 'You have a reward waiting!'
              : `You've referred ${referralCount} ${referralCount === 1 ? 'friend' : 'friends'}`}
          </Text>
        </View>
      </View>

      {/* Progress Section */}
      {nextTier && !hasUnclaimedReward && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Next: {nextTier.tier}</Text>
            <Text style={styles.progressCount}>
              {nextTier.needed} {nextTier.needed === 1 ? 'referral' : 'referrals'} away
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${Math.min(getProgress(), 100)}%` }]}
            />
          </View>
        </View>
      )}

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaText}>
          {hasUnclaimedReward ? 'Claim Reward' : 'Share Your Code'}
        </Text>
        <Ionicons
          name={hasUnclaimedReward ? 'star' : 'arrow-forward'}
          size={16}
          color={Colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Full card styles
  card: {
    ...GlassStyles.card,
    padding: 16,
  },
  cardHighlight: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  headerText: {
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
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.text,
  },
  progressCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  compactSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default ReferralCard;
