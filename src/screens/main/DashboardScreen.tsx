import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, GradientColors, Shadows, GlassStyles } from '../../constants/colors';
import { DashboardStats, TipEntry } from '../../types';
import { getTodaysTips, getWeeklyTips, getMonthlyTips, getTipEntriesByDateRange, getTipEntries } from '../../services/api/tips';
import { calculateDashboardStats } from '../../utils/calculations';
import { formatCurrency, formatHourlyRate, formatHours, formatChange, getYesterdayISO, getTodayISO } from '../../utils/formatting';
import { useUserStore } from '../../store/userStore';
import { getActiveGoals, Goal, calculateProgress, getGoalPeriodLabel } from '../../services/api/goals';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { Animated } from 'react-native';
import { springAnimation } from '../../utils/animations';
import EmailVerificationBanner from '../../components/EmailVerificationBanner';
import WeeklyTrendChart from '../../components/charts/WeeklyTrendChart';
import QuickActionsRow, { QuickAction } from '../../components/common/QuickActionsRow';
import RecentEntriesSection from '../../components/cards/RecentEntriesSection';
import GoalsSection from '../../components/cards/GoalsSection';
import ShiftPredictionCard from '../../components/cards/ShiftPredictionCard';
import DailyInsightCard from '../../components/cards/DailyInsightCard';
import PendingPoolsAlert from '../../components/cards/PendingPoolsAlert';
import { generateShiftPrediction, ShiftPrediction } from '../../services/ai/predictions';
import { generateDailyInsight, DailyInsight } from '../../services/ai/insights';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [recentEntries, setRecentEntries] = useState<TipEntry[]>([]);
  const [weeklyChartData, setWeeklyChartData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [prediction, setPrediction] = useState<ShiftPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Fade-in animation when data loads
    if (!loading && stats) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, stats]);

  const loadDashboardData = async () => {
    try {
      console.log('Dashboard: isPremium =', isPremium);
      const [todayEntries, yesterdayEntries, weekEntries, monthEntries, goals, entries] = await Promise.all([
        getTodaysTips(),
        getTipEntriesByDateRange(getYesterdayISO(), getYesterdayISO()),
        getWeeklyTips(),
        getMonthlyTips(),
        isPremium ? getActiveGoals() : Promise.resolve([]),
        getTipEntries(5), // Get recent 5 entries
      ]);

      console.log('Dashboard: Fetched goals =', goals);
      console.log('Dashboard: Goals count =', goals.length);

      const calculatedStats = calculateDashboardStats(
        todayEntries,
        yesterdayEntries,
        weekEntries,
        monthEntries
      );

      // Prepare weekly chart data (last 7 days)
      const chartData = prepareWeeklyChartData(weekEntries);

      // Generate AI shift prediction (PREMIUM ONLY)
      if (isPremium) {
        setPredictionLoading(true);
        try {
          const predictionResult = await generateShiftPrediction(weekEntries);
          setPrediction(predictionResult);
          console.log('Dashboard: AI prediction generated');
        } catch (error) {
          console.error('Dashboard: Failed to generate prediction:', error);
          setPrediction(null);
        } finally {
          setPredictionLoading(false);
        }
      } else {
        setPrediction(null);
        setPredictionLoading(false);
      }

      // Generate daily insight (PREMIUM ONLY)
      if (isPremium) {
        setInsightLoading(true);
        try {
          const insightResult = await generateDailyInsight(monthEntries);
          setDailyInsight(insightResult);
          console.log('Dashboard: Daily insight generated');
        } catch (error) {
          console.error('Dashboard: Failed to generate insight:', error);
          setDailyInsight(null);
        } finally {
          setInsightLoading(false);
        }
      } else {
        setDailyInsight(null);
        setInsightLoading(false);
      }

      // Animate layout changes
      springAnimation();
      setStats(calculatedStats);
      setActiveGoals(goals);
      setRecentEntries(entries);
      setWeeklyChartData(chartData);
      console.log('Dashboard: Active goals set to state');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const prepareWeeklyChartData = (entries: TipEntry[]): number[] => {
    // Get last 7 days
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

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'history',
      icon: 'calendar',
      label: 'Tip History',
      onPress: () => navigation.navigate('TipHistory' as never),
    },
    {
      id: 'analytics',
      icon: 'analytics',
      label: 'Analytics',
      onPress: () => navigation.navigate('Analytics' as never),
    },
    {
      id: 'goals',
      icon: 'flag',
      label: 'Goals',
      onPress: () => navigation.navigate('Goals' as never),
      disabled: !isPremium,
    },
    {
      id: 'export',
      icon: 'document-text',
      label: 'Export',
      onPress: () => navigation.navigate('ExportReports' as never),
      disabled: !isPremium,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        >
          {/* Email Verification Banner */}
          <EmailVerificationBanner />

          {/* Pending Pools Alert */}
          <PendingPoolsAlert />

          {/* Today's Earnings Card - Hero with Blue Gradient */}
          <LinearGradient
            colors={GradientColors.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>Today's Tips</Text>
            <Text style={styles.heroAmount}>{formatCurrency(stats?.today.tips || 0)}</Text>
            <View style={styles.heroStats}>
              <Text style={styles.heroStat}>
                {formatHours(stats?.today.hours || 0)} worked
              </Text>
              <Text style={styles.heroDot}>•</Text>
              <Text style={styles.heroStat}>
                {formatHourlyRate(stats?.today.hourly_rate || 0)}
              </Text>
            </View>
            {stats && stats.today.vs_yesterday !== 0 && (
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
          </LinearGradient>

          {/* AI Shift Prediction */}
          <View style={styles.section}>
            <ShiftPredictionCard
              prediction={prediction}
              loading={predictionLoading}
              onRefresh={onRefresh}
              isPremium={isPremium}
            />
          </View>

          {/* Daily Insight */}
          <View style={styles.section}>
            <DailyInsightCard
              insight={dailyInsight}
              loading={insightLoading}
              onRefresh={onRefresh}
              isPremium={isPremium}
            />
          </View>

          {/* Weekly Trend Chart - Glass Card */}
          <View style={styles.glassCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <Ionicons name="bar-chart" size={20} color={Colors.primary} />
                <Text style={styles.chartTitle}>This Week</Text>
              </View>
              <Text style={styles.chartSubtitle}>{formatCurrency(stats?.week.tips || 0)}</Text>
            </View>
            <WeeklyTrendChart data={weeklyChartData} />
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <QuickActionsRow actions={quickActions} />
          </View>

          {/* Goals Section */}
          {isPremium && (
            <View style={styles.section}>
              <GoalsSection
                goals={activeGoals}
                onViewAll={() => navigation.navigate('Goals' as never)}
                onCreateGoal={() => navigation.navigate('Goals' as never)}
                onGoalPress={(goal) => navigation.navigate('Goals' as never)}
                isPremium={isPremium}
              />
            </View>
          )}

          {/* Recent Entries */}
          <View style={styles.section}>
            <RecentEntriesSection
              entries={recentEntries}
              onSeeAll={() => navigation.navigate('Analytics' as never)}
              onEntryPress={(entry) => {
                // Could navigate to edit screen in the future
                console.log('Entry pressed:', entry.id);
              }}
            />
          </View>

          {/* This Month Summary Card - Glass Style */}
          <View style={styles.section}>
            <View style={styles.glassCard}>
              <View style={styles.monthHeader}>
                <Ionicons name="calendar" size={24} color={Colors.primary} />
                <Text style={styles.monthTitle}>This Month</Text>
              </View>
              <Text style={styles.monthAmount}>{formatCurrency(stats?.month.tips || 0)}</Text>
              <View style={styles.monthStats}>
                <View style={styles.monthStat}>
                  <Text style={styles.monthStatLabel}>Hours</Text>
                  <Text style={styles.monthStatValue}>{formatHours(stats?.month.hours || 0)}</Text>
                </View>
                <View style={styles.monthStatDivider} />
                <View style={styles.monthStat}>
                  <Text style={styles.monthStatLabel}>Avg Rate</Text>
                  <Text style={styles.monthStatValue}>{formatHourlyRate(stats?.month.hourly_rate || 0)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Upgrade Prompt for Free Users - Gold Accent */}
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
                colors={GradientColors.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeIconContainer}>
                  <Ionicons name="star" size={28} color={Colors.white} />
                </View>
                <View style={styles.upgradeContent}>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeSubtitle}>
                    Unlimited history, AI insights, goals & more
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingBottom: 120,
  },
  // Hero Card - Main earnings display with blue gradient
  heroCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...Shadows.buttonBlue,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 12,
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStat: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  heroDot: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.5,
  },
  changeIndicator: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePositive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  changeNegative: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  changeText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  // Glass Card Style
  glassCard: {
    ...GlassStyles.card,
    padding: 20,
  },
  // Chart styles
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chartSubtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  // Month card styles
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  monthAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthStat: {
    flex: 1,
  },
  monthStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  monthStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  // Upgrade card - Gold gradient
  upgradeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.buttonGold,
  },
  upgradeGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upgradeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  section: {
    gap: 8,
  },
});
