import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GradientColors, Shadows, GlassStyles } from '../../constants/colors';
import { DashboardStats, TipEntry } from '../../types';
import { getTodaysTips, getWeeklyTips, getMonthlyTips, getTipEntriesByDateRange, getTipEntries } from '../../services/api/tips';
import { calculateDashboardStats } from '../../utils/calculations';
import { formatCurrency, formatHourlyRate, formatHours, formatChange, getYesterdayISO, getTodayISO } from '../../utils/formatting';
import { useUserStore } from '../../store/userStore';
import { getActiveGoals, Goal } from '../../services/api/goals';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { springAnimation } from '../../utils/animations';
import EmailVerificationBanner from '../../components/EmailVerificationBanner';
import WeekSparkline from '../../components/charts/WeekSparkline';
import CollapsibleSection from '../../components/common/CollapsibleSection';
import PendingPoolsAlert from '../../components/cards/PendingPoolsAlert';
import { StreakDisplay } from '../../components/StreakDisplay';
import { SyncStatusBadge } from '../../components/SyncStatusBadge';
import { generateShiftPrediction, ShiftPrediction } from '../../services/ai/predictions';
import { generateDailyInsight, DailyInsight } from '../../services/ai/insights';
import { useGamificationStore } from '../../store/gamificationStore';
import { initializeGamification } from '../../services/api/gamification';
import { openAddTipModal } from '../../navigation/MainTabNavigator';

export default function DashboardScreenV2() {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [recentEntries, setRecentEntries] = useState<TipEntry[]>([]);
  const [weeklyChartData, setWeeklyChartData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [prediction, setPrediction] = useState<ShiftPrediction | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [lastWeekTotal, setLastWeekTotal] = useState<number>(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [isPremium])
  );

  useEffect(() => {
    initializeGamification();
  }, []);

  useEffect(() => {
    if (!loading && stats) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for Add Tips button if no tips today
      if (stats.today.tips === 0) {
        const pulse = Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]);
        Animated.loop(pulse).start();
      }
    }
  }, [loading, stats]);

  const loadDashboardData = async () => {
    try {
      // Get last week's data for comparison
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 13);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      const [todayEntries, yesterdayEntries, weekEntries, monthEntries, lastWeekEntries, goals, entries] = await Promise.all([
        getTodaysTips(),
        getTipEntriesByDateRange(getYesterdayISO(), getYesterdayISO()),
        getWeeklyTips(),
        getMonthlyTips(),
        getTipEntriesByDateRange(
          lastWeekStart.toISOString().split('T')[0],
          lastWeekEnd.toISOString().split('T')[0]
        ),
        isPremium ? getActiveGoals() : Promise.resolve([]),
        getTipEntries(3), // Only 3 for compact view
      ]);

      const calculatedStats = calculateDashboardStats(
        todayEntries,
        yesterdayEntries,
        weekEntries,
        monthEntries
      );

      const chartData = prepareWeeklyChartData(weekEntries);
      const lastWeekSum = lastWeekEntries.reduce((sum, e) => sum + e.tips_earned, 0);
      setLastWeekTotal(lastWeekSum);

      // Generate AI insights for premium users
      if (isPremium) {
        try {
          const [predictionResult, insightResult] = await Promise.all([
            generateShiftPrediction(weekEntries),
            generateDailyInsight(monthEntries),
          ]);
          setPrediction(predictionResult);
          setDailyInsight(insightResult);
        } catch (error) {
          console.error('Dashboard: Failed to generate AI insights:', error);
        }
      }

      springAnimation();
      setStats(calculatedStats);
      setActiveGoals(goals);
      setRecentEntries(entries);
      setWeeklyChartData(chartData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const prepareWeeklyChartData = (entries: TipEntry[]): number[] => {
    const today = new Date();
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEntries = entries.filter(e => e.date === dateStr);
      const dayTotal = dayEntries.reduce((sum, e) => sum + e.tips_earned, 0);
      data.push(dayTotal);
    }

    return data;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleAddTips = () => {
    openAddTipModal();
  };

  const weekChangePercent = lastWeekTotal > 0
    ? ((stats?.week.tips || 0) - lastWeekTotal) / lastWeekTotal * 100
    : 0;

  // Find best day of the week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxTipsIndex = weeklyChartData.indexOf(Math.max(...weeklyChartData));
  const today = new Date();
  const bestDayOffset = 6 - maxTipsIndex;
  const bestDayDate = new Date(today);
  bestDayDate.setDate(bestDayDate.getDate() - bestDayOffset);
  const bestDay = dayNames[bestDayDate.getDay()];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasTipsToday = (stats?.today.tips || 0) > 0;
  const hasAnyTips = (stats?.week.tips || 0) > 0 || recentEntries.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.headerRight}>
            <SyncStatusBadge />
            <StreakDisplay compact onPress={() => navigation.navigate('Achievements' as never)} />
          </View>
        </View>
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <EmailVerificationBanner />
          <PendingPoolsAlert />

          {/* HERO CARD - Today's Earnings + Add Tips CTA */}
          <LinearGradient
            colors={GradientColors.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>Today's Tips</Text>
                <Text style={styles.heroAmount}>{formatCurrency(stats?.today.tips || 0)}</Text>
                {hasTipsToday ? (
                  <View style={styles.heroStats}>
                    <Text style={styles.heroStat}>
                      {formatHours(stats?.today.hours || 0)} worked
                    </Text>
                    <Text style={styles.heroDot}>•</Text>
                    <Text style={styles.heroStat}>
                      {formatHourlyRate(stats?.today.hourly_rate || 0)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.heroEmptyText}>
                    {hasAnyTips ? 'No tips logged yet today' : 'Start tracking your tips!'}
                  </Text>
                )}
                {hasTipsToday && stats && stats.today.vs_yesterday !== 0 && (
                  <View style={[
                    styles.changeIndicator,
                    stats.today.vs_yesterday > 0 ? styles.changePositive : styles.changeNegative
                  ]}>
                    <Ionicons
                      name={stats.today.vs_yesterday > 0 ? "trending-up" : "trending-down"}
                      size={14}
                      color={Colors.white}
                    />
                    <Text style={styles.changeText}>
                      {formatChange(stats.today.vs_yesterday)} vs yesterday
                    </Text>
                  </View>
                )}
              </View>

              {/* Add Tips Button - PRIMARY CTA */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.addTipsButton}
                  onPress={handleAddTips}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={GradientColors.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addTipsGradient}
                  >
                    <Ionicons name="add" size={24} color={Colors.white} />
                    <Text style={styles.addTipsText}>Add Tips</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>

          {/* WEEK SUMMARY - Secondary */}
          <View style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <View>
                <Text style={styles.weekLabel}>This Week</Text>
                <Text style={styles.weekAmount}>{formatCurrency(stats?.week.tips || 0)}</Text>
              </View>
              <WeekSparkline data={weeklyChartData} height={36} barWidth={10} />
            </View>
            {weekChangePercent !== 0 && (
              <View style={styles.weekChange}>
                <Ionicons
                  name={weekChangePercent > 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color={weekChangePercent > 0 ? Colors.success : Colors.error}
                />
                <Text style={[
                  styles.weekChangeText,
                  { color: weekChangePercent > 0 ? Colors.success : Colors.error }
                ]}>
                  {Math.abs(weekChangePercent).toFixed(0)}% vs last week
                </Text>
              </View>
            )}
          </View>

          {/* QUICK STATS ROW - Tertiary */}
          <View style={styles.quickStatsRow}>
            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => navigation.navigate('Analytics' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickStatValue}>
                {formatHourlyRate(stats?.week.hourly_rate || 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Avg Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => navigation.navigate('Analytics' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickStatValue}>{bestDay}</Text>
              <Text style={styles.quickStatLabel}>Best Day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => navigation.navigate('Achievements' as never)}
              activeOpacity={0.7}
            >
              <StreakDisplay inline />
            </TouchableOpacity>
          </View>

          {/* AI INSIGHTS - Collapsible (Premium) */}
          <CollapsibleSection
            title="AI Insights"
            icon="sparkles"
            iconColor={Colors.gold}
            locked={!isPremium}
            lockedMessage="Unlock AI predictions with Premium"
            onLockedPress={() => navigation.navigate('Upgrade' as never)}
            defaultExpanded={isPremium}
          >
            {prediction && (
              <View style={styles.insightItem}>
                <Ionicons name="flash" size={18} color={Colors.primary} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Next Shift Prediction</Text>
                  <Text style={styles.insightValue}>
                    {formatCurrency(prediction.expectedRange[0])} - {formatCurrency(prediction.expectedRange[1])}
                  </Text>
                  <Text style={styles.insightSubtext}>{prediction.reasoning}</Text>
                </View>
              </View>
            )}
            {dailyInsight && (
              <View style={styles.insightItem}>
                <Ionicons name="bulb" size={18} color={Colors.gold} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Today's Insight</Text>
                  <Text style={styles.insightSubtext}>{dailyInsight.insight}</Text>
                </View>
              </View>
            )}
            {!prediction && !dailyInsight && isPremium && (
              <Text style={styles.emptyInsight}>
                Log more tips to get personalized AI insights!
              </Text>
            )}
          </CollapsibleSection>

          {/* RECENT TIPS - Collapsible */}
          <CollapsibleSection
            title="Recent Tips"
            icon="time"
            iconColor={Colors.primary}
            badge={recentEntries.length > 0 ? `${recentEntries.length}` : undefined}
            defaultExpanded={true}
          >
            {recentEntries.length > 0 ? (
              <>
                {recentEntries.map((entry, index) => (
                  <View key={entry.id} style={styles.recentEntry}>
                    <View style={styles.recentEntryLeft}>
                      <Text style={styles.recentEntryDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.recentEntryHours}>
                        {formatHours(entry.hours_worked)}
                      </Text>
                    </View>
                    <Text style={styles.recentEntryAmount}>
                      {formatCurrency(entry.tips_earned)}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => navigation.navigate('TipHistory' as never)}
                >
                  <Text style={styles.seeAllText}>See all tips</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyRecentText}>
                  No tips logged yet. Add your first tip to get started!
                </Text>
              </View>
            )}
          </CollapsibleSection>

          {/* GOALS - Collapsible (Premium) */}
          <CollapsibleSection
            title="Goals"
            icon="flag"
            iconColor={Colors.success}
            locked={!isPremium}
            lockedMessage="Set earning goals with Premium"
            onLockedPress={() => navigation.navigate('Upgrade' as never)}
            defaultExpanded={isPremium && activeGoals.length > 0}
          >
            {activeGoals.length > 0 ? (
              <>
                {activeGoals.slice(0, 2).map((goal) => (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName}>{goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal</Text>
                      <Text style={styles.goalProgress}>
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </Text>
                    </View>
                    <View style={styles.goalProgressBar}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          { width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }
                        ]}
                      />
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => navigation.navigate('Goals' as never)}
                >
                  <Text style={styles.seeAllText}>Manage goals</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.createGoalButton}
                onPress={() => navigation.navigate('Goals' as never)}
              >
                <Ionicons name="add-circle" size={20} color={Colors.success} />
                <Text style={styles.createGoalText}>Create your first goal</Text>
              </TouchableOpacity>
            )}
          </CollapsibleSection>

          {/* UPGRADE CARD - For Free Users */}
          {!isPremium && (
            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={() => {
                mediumHaptic();
                navigation.navigate('Upgrade' as never);
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0077B6', '#005F8A', '#004466']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeIconContainer}>
                  <Ionicons name="sparkles" size={24} color={Colors.gold} />
                </View>
                <View style={styles.upgradeContent}>
                  <Text style={styles.upgradeTitle}>Know what you'll earn</Text>
                  <Text style={styles.upgradeSubtitle}>
                    Unlock AI predictions, goals & tax reports
                  </Text>
                </View>
                <View style={styles.upgradeArrow}>
                  <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 24,
    ...Shadows.buttonBlue,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 4,
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStat: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
  },
  heroDot: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.5,
  },
  heroEmptyText: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.8,
  },
  changeIndicator: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  changePositive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  changeNegative: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  changeText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  addTipsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.buttonGold,
  },
  addTipsGradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  addTipsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Week Card
  weekCard: {
    ...GlassStyles.card,
    padding: 18,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  weekAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  weekChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  weekChangeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    ...GlassStyles.card,
    padding: 14,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Insights
  insightItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emptyInsight: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Recent Entries
  recentEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentEntryLeft: {
    flex: 1,
  },
  recentEntryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  recentEntryHours: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recentEntryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyRecent: {
    paddingVertical: 16,
  },
  emptyRecentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Goals
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  goalProgress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  createGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  createGoalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },

  // Upgrade Card
  upgradeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.3)',
    ...Shadows.buttonBlue,
  },
  upgradeGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  upgradeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  upgradeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
