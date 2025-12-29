// Referral Screen - Share and track referrals
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Colors, GlassStyles } from '../../constants/colors';
import { useReferralStore, REWARD_TIERS } from '../../store/referralStore';
import {
  fetchReferralData,
  fetchReferrals,
  fetchReferralRewards,
  getReferralShareMessage,
} from '../../services/api/referrals';
import { Analytics } from '../../services/analytics/analytics';
import { lightHaptic, successHaptic } from '../../utils/haptics';

export default function ReferralScreen() {
  const navigation = useNavigation();
  const {
    referralCode,
    referralCount,
    referrals,
    rewards,
    isLoading,
    getNextRewardTier,
    getUnredeemedRewards,
  } = useReferralStore();

  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchReferralData(),
        fetchReferrals(),
        fetchReferralRewards(),
      ]);
    } catch (error) {
      console.error('[Referral] Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;

    lightHaptic();
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode) return;

    lightHaptic();

    try {
      const message = getReferralShareMessage(referralCode);
      const result = await Share.share({
        message,
        title: 'Join TipFly AI',
      });

      if (result.action === Share.sharedAction) {
        Analytics.referralShared(result.activityType || 'unknown');
        successHaptic();
      }
    } catch (error) {
      console.error('[Referral] Share error:', error);
    }
  };

  const nextTier = getNextRewardTier();
  const unredeemedRewards = getUnredeemedRewards();

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    if (!nextTier) return 100;
    const currentTierIndex = REWARD_TIERS.findIndex(
      (t) => referralCount < t.count
    );
    if (currentTierIndex === 0) {
      return (referralCount / REWARD_TIERS[0].count) * 100;
    }
    const prevCount = REWARD_TIERS[currentTierIndex - 1]?.count || 0;
    const nextCount = REWARD_TIERS[currentTierIndex].count;
    return ((referralCount - prevCount) / (nextCount - prevCount)) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Share & Earn Free Premium</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to TipFly AI and earn free premium time for every
            friend who joins!
          </Text>
        </View>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode || '...'}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={20}
                color={copied ? Colors.success : Colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color={Colors.white} />
            <Text style={styles.shareButtonText}>Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Referrals</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralCount}</Text>
              <Text style={styles.statLabel}>Friends Joined</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rewards.length}</Text>
              <Text style={styles.statLabel}>Rewards Earned</Text>
            </View>
          </View>

          {/* Progress to next tier */}
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Next Reward: {nextTier.tier}</Text>
                <Text style={styles.progressCount}>
                  {nextTier.needed} more {nextTier.needed === 1 ? 'referral' : 'referrals'}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(getProgressToNextTier(), 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Unredeemed Rewards */}
        {unredeemedRewards.length > 0 && (
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsHeader}>
              <Ionicons name="star" size={20} color={Colors.gold} />
              <Text style={styles.rewardsTitle}>Pending Rewards</Text>
            </View>
            {unredeemedRewards.map((reward) => (
              <View key={reward.id} style={styles.rewardItem}>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardType}>
                    {reward.reward_type === 'free_week'
                      ? '1 Week Free'
                      : reward.reward_type === 'free_month'
                      ? '1 Month Free'
                      : '6 Months Free'}
                  </Text>
                  <Text style={styles.rewardExpiry}>
                    Expires{' '}
                    {new Date(reward.expires_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => {
                    // TODO: Integrate with RevenueCat to apply promo
                    Alert.alert(
                      'Claim Reward',
                      'This reward will be applied to your subscription.'
                    );
                  }}
                >
                  <Text style={styles.claimButtonText}>Claim</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reward Tiers */}
        <View style={styles.tiersCard}>
          <Text style={styles.tiersTitle}>Reward Tiers</Text>
          {REWARD_TIERS.map((tier, index) => {
            const earned = referralCount >= tier.count;
            const hasReward = rewards.some((r) => r.reward_type === tier.reward);

            return (
              <View
                key={tier.reward}
                style={[styles.tierItem, earned && styles.tierItemEarned]}
              >
                <View
                  style={[
                    styles.tierIcon,
                    earned && styles.tierIconEarned,
                  ]}
                >
                  {earned ? (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  ) : (
                    <Text style={styles.tierCount}>{tier.count}</Text>
                  )}
                </View>
                <View style={styles.tierInfo}>
                  <Text
                    style={[styles.tierLabel, earned && styles.tierLabelEarned]}
                  >
                    {tier.count} {tier.count === 1 ? 'Referral' : 'Referrals'}
                  </Text>
                  <Text style={styles.tierReward}>{tier.label}</Text>
                </View>
                {hasReward && (
                  <View style={styles.earnedBadge}>
                    <Text style={styles.earnedBadgeText}>Earned</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Share your unique referral code</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Friend signs up with your code</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Both of you get rewards! They get 20% off, you earn free premium
            </Text>
          </View>
        </View>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.recentTitle}>Recent Referrals</Text>
            {referrals.slice(0, 5).map((referral) => (
              <View key={referral.id} style={styles.referralItem}>
                <View style={styles.referralIcon}>
                  <Ionicons name="person" size={16} color={Colors.primary} />
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralDate}>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.referralStatus}>
                    {referral.status === 'rewarded'
                      ? `Earned: ${referral.reward_type?.replace('_', ' ')}`
                      : 'Completed'}
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.success}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // Hero
  heroCard: {
    ...GlassStyles.card,
    alignItems: 'center',
    padding: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Code card
  codeCard: {
    ...GlassStyles.card,
    padding: 20,
  },
  codeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Stats
  statsCard: {
    ...GlassStyles.card,
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  progressCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },

  // Rewards
  rewardsCard: {
    ...GlassStyles.card,
    padding: 20,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gold,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardType: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  rewardExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
  },

  // Tiers
  tiersCard: {
    ...GlassStyles.card,
    padding: 20,
  },
  tiersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tierItemEarned: {
    opacity: 0.8,
  },
  tierIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierIconEarned: {
    backgroundColor: Colors.success,
  },
  tierCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tierInfo: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tierLabelEarned: {
    color: Colors.text,
  },
  tierReward: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  earnedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  earnedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },

  // How it works
  howItWorks: {
    ...GlassStyles.card,
    padding: 20,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Recent referrals
  recentCard: {
    ...GlassStyles.card,
    padding: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  referralIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referralDate: {
    fontSize: 14,
    color: Colors.text,
  },
  referralStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 40,
  },
});
