// Achievements Screen - View badges and streaks
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlassStyles } from '../../constants/colors';
import {
  useGamificationStore,
  BADGE_DEFINITIONS,
  BadgeDefinition,
} from '../../store/gamificationStore';
import {
  initializeGamification,
  getStreakStatusMessage,
  hasLoggedToday,
} from '../../services/api/gamification';
import { lightHaptic } from '../../utils/haptics';

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const {
    streak,
    badges,
    isLoading,
    getEarnedBadges,
    getUnearnedBadges,
    getBadgesByCategory,
  } = useGamificationStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeGamification();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeGamification();
    setRefreshing(false);
  };

  const earnedBadges = getEarnedBadges();
  const unearnedBadges = getUnearnedBadges();
  const loggedToday = hasLoggedToday(streak);

  const renderBadge = (
    badge: BadgeDefinition,
    earned: boolean,
    earnedAt?: string
  ) => (
    <View
      key={badge.id}
      style={[styles.badgeItem, !earned && styles.badgeItemLocked]}
    >
      <View style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
        <Text style={styles.badgeEmoji}>{earned ? badge.icon : '🔒'}</Text>
      </View>
      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
          {badge.name}
        </Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>
        {earned && earnedAt && (
          <Text style={styles.badgeDate}>
            Earned {new Date(earnedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      {earned && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
      )}
    </View>
  );

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
        <Text style={styles.headerTitle}>Achievements</Text>
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
        {/* Streak Card */}
        <View style={[styles.streakCard, !loggedToday && styles.streakCardWarning]}>
          <View style={styles.streakHeader}>
            <View style={styles.streakCircle}>
              <Text style={styles.fireIcon}>🔥</Text>
              <Text style={styles.streakCount}>{streak?.current_streak || 0}</Text>
            </View>
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakTitle}>Day Streak</Text>
              <Text style={styles.streakMessage}>
                {getStreakStatusMessage(streak)}
              </Text>
            </View>
          </View>

          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatValue}>
                {streak?.longest_streak || 0}
              </Text>
              <Text style={styles.streakStatLabel}>Best Streak</Text>
            </View>
            <View style={styles.streakStatDivider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatValue}>
                {streak?.total_tips_logged || 0}
              </Text>
              <Text style={styles.streakStatLabel}>Total Tips</Text>
            </View>
            <View style={styles.streakStatDivider} />
            <View style={styles.streakStat}>
              {loggedToday ? (
                <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              ) : (
                <Ionicons name="time-outline" size={28} color={Colors.warning} />
              )}
              <Text style={styles.streakStatLabel}>
                {loggedToday ? 'Done!' : 'Log Today'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{earnedBadges.length}</Text>
              <Text style={styles.progressLabel}>Badges Earned</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>
                {Object.keys(BADGE_DEFINITIONS).length}
              </Text>
              <Text style={styles.progressLabel}>Total Badges</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>
                {Math.round(
                  (earnedBadges.length / Object.keys(BADGE_DEFINITIONS).length) * 100
                )}%
              </Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color={Colors.gold} />
              <Text style={styles.sectionTitle}>Earned Badges</Text>
              <Text style={styles.sectionCount}>{earnedBadges.length}</Text>
            </View>
            <View style={styles.badgeList}>
              {earnedBadges.map((badge) =>
                renderBadge(badge.definition, true, badge.earned_at)
              )}
            </View>
          </View>
        )}

        {/* Milestone Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Milestones</Text>
          </View>
          <View style={styles.badgeList}>
            {getBadgesByCategory('milestone').map((badge) => {
              const earned = badges.find((b) => b.badge_id === badge.id);
              return renderBadge(badge, !!earned, earned?.earned_at);
            })}
          </View>
        </View>

        {/* Streak Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔥</Text>
            <Text style={styles.sectionTitle}>Streak Badges</Text>
          </View>
          <View style={styles.badgeList}>
            {getBadgesByCategory('streak').map((badge) => {
              const earned = badges.find((b) => b.badge_id === badge.id);
              return renderBadge(badge, !!earned, earned?.earned_at);
            })}
          </View>
        </View>

        {/* Earnings Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💰</Text>
            <Text style={styles.sectionTitle}>Earnings Badges</Text>
          </View>
          <View style={styles.badgeList}>
            {getBadgesByCategory('earnings').map((badge) => {
              const earned = badges.find((b) => b.badge_id === badge.id);
              return renderBadge(badge, !!earned, earned?.earned_at);
            })}
          </View>
        </View>

        {/* Goals Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon" size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}>Goal Badges</Text>
          </View>
          <View style={styles.badgeList}>
            {getBadgesByCategory('goals').map((badge) => {
              const earned = badges.find((b) => b.badge_id === badge.id);
              return renderBadge(badge, !!earned, earned?.earned_at);
            })}
          </View>
        </View>

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

  // Streak Card
  streakCard: {
    ...GlassStyles.card,
    padding: 20,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  streakCardWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fireIcon: {
    fontSize: 24,
    position: 'absolute',
    top: 8,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.warning,
    marginTop: 12,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  streakMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  streakStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  streakStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Progress Card
  progressCard: {
    ...GlassStyles.card,
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Sections
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeList: {
    ...GlassStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeIconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: Colors.textSecondary,
  },
  badgeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badgeDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});
