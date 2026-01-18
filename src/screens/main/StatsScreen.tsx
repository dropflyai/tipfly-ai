import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows, GlassStyles, GradientColors } from '../../constants/colors';
import { getWeeklyTips, getMonthlyTips, getTipEntriesByDateRange } from '../../services/api/tips';
import { TipEntry } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { calculateTotalTips, calculateAverageHourlyRate } from '../../utils/calculations';
import { startOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { useUserStore } from '../../store/userStore';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import CollapsibleSection from '../../components/common/CollapsibleSection';

const screenWidth = Dimensions.get('window').width;

interface Insight {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  type: 'positive' | 'neutral' | 'action';
}

export default function StatsScreenV2() {
  const navigation = useNavigation();
  const { isPremium } = useUserStore();
  const [weeklyData, setWeeklyData] = useState<TipEntry[]>([]);
  const [lastWeekData, setLastWeekData] = useState<TipEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    try {
      const [weekTips, prevWeekTips, last6MonthsTips] = await Promise.all([
        getWeeklyTips(),
        getLastWeekTips(),
        getLast6MonthsTips(),
      ]);

      setWeeklyData(weekTips);
      setLastWeekData(prevWeekTips);
      setMonthlyData(last6MonthsTips);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getLastWeekTips = async () => {
    const today = new Date();
    const lastWeekStart = startOfWeek(subWeeks(today, 1));
    const lastWeekEnd = endOfWeek(subWeeks(today, 1));

    return getTipEntriesByDateRange(
      lastWeekStart.toISOString().split('T')[0],
      lastWeekEnd.toISOString().split('T')[0]
    );
  };

  const getLast6MonthsTips = async () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const tips = await getTipEntriesByDateRange(
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      );

      months.push({
        label: format(monthStart, 'MMM'),
        total: calculateTotalTips(tips),
        hourlyRate: calculateAverageHourlyRate(tips),
      });
    }
    return months;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStatsData();
  };

  // Calculate stats
  const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const weeklyStats = useMemo(() => {
    return weekDays.map((day, index) => {
      const dayTips = weeklyData.filter(entry => {
        const entryDay = new Date(entry.date).getDay();
        return entryDay === index;
      });
      const total = calculateTotalTips(dayTips);
      const hours = dayTips.reduce((sum, e) => sum + (e.hours_worked || 0), 0);
      return {
        day,
        dayFull: weekDaysFull[index],
        total,
        hourlyRate: hours > 0 ? total / hours : 0,
        shiftCount: dayTips.length,
      };
    });
  }, [weeklyData]);

  const weekTotal = calculateTotalTips(weeklyData);
  const weekAvgHourly = calculateAverageHourlyRate(weeklyData);
  const lastWeekTotal = calculateTotalTips(lastWeekData);

  const weekChange = lastWeekTotal > 0
    ? ((weekTotal - lastWeekTotal) / lastWeekTotal) * 100
    : weekTotal > 0 ? 100 : 0;
  const weekChangePositive = weekChange >= 0;

  // Find best day
  const bestDayStats = [...weeklyStats].sort((a, b) => b.total - a.total)[0];
  const bestDay = bestDayStats?.total > 0 ? bestDayStats.dayFull : null;

  // Find best hourly rate day
  const bestHourlyDay = [...weeklyStats].filter(s => s.hourlyRate > 0).sort((a, b) => b.hourlyRate - a.hourlyRate)[0];

  // Day vs Night comparison
  const dayShifts = weeklyData.filter(e => e.shift_type === 'day');
  const nightShifts = weeklyData.filter(e => e.shift_type === 'night');
  const dayAvg = dayShifts.length > 0 ? calculateTotalTips(dayShifts) / dayShifts.length : 0;
  const nightAvg = nightShifts.length > 0 ? calculateTotalTips(nightShifts) / nightShifts.length : 0;
  const betterShift = dayAvg > nightAvg ? 'day' : nightAvg > dayAvg ? 'night' : null;

  // Generate key insight
  const keyInsight = useMemo((): Insight | null => {
    if (weeklyData.length === 0) {
      return {
        icon: 'add-circle',
        title: 'Start Tracking',
        message: 'Log your first tip to unlock personalized insights about your earnings.',
        type: 'action',
      };
    }

    // Best performing insight
    if (bestDay && bestDayStats.total > 0) {
      const otherDaysWithData = weeklyStats.filter(s => s.dayFull !== bestDay && s.total > 0);
      const avgOtherDays = otherDaysWithData.length > 0
        ? otherDaysWithData.reduce((sum, s) => sum + s.total, 0) / otherDaysWithData.length
        : 0;

      // Only show percentage comparison if we have other days to compare against
      if (avgOtherDays > 0 && bestDayStats.total > avgOtherDays * 1.2) {
        return {
          icon: 'trophy',
          title: `${bestDay} is your best day`,
          message: `You earn ${((bestDayStats.total / avgOtherDays - 1) * 100).toFixed(0)}% more on ${bestDay}s. Consider picking up extra shifts!`,
          type: 'positive',
        };
      } else if (otherDaysWithData.length === 0) {
        // Only have data for one day
        return {
          icon: 'trophy',
          title: `${bestDay} is your best day`,
          message: `You earned ${formatCurrency(bestDayStats.total)} on ${bestDay}. Keep logging to see patterns!`,
          type: 'positive',
        };
      }
    }

    // Week over week comparison
    if (weekChangePositive && weekChange > 10) {
      return {
        icon: 'trending-up',
        title: 'Great week!',
        message: `You're up ${weekChange.toFixed(0)}% from last week. Keep the momentum going!`,
        type: 'positive',
      };
    }

    // Shift type insight
    if (betterShift && Math.abs(dayAvg - nightAvg) > 20) {
      const better = betterShift === 'day' ? 'Day' : 'Night';
      const worse = betterShift === 'day' ? 'night' : 'day';
      return {
        icon: betterShift === 'day' ? 'sunny' : 'moon',
        title: `${better} shifts pay better`,
        message: `You average ${formatCurrency(Math.max(dayAvg, nightAvg))} on ${better.toLowerCase()} shifts vs ${formatCurrency(Math.min(dayAvg, nightAvg))} on ${worse} shifts.`,
        type: 'neutral',
      };
    }

    // Default insight
    return {
      icon: 'stats-chart',
      title: 'Earning consistently',
      message: `Averaging ${formatCurrency(weekAvgHourly)}/hour this week. Keep logging to unlock more insights!`,
      type: 'neutral',
    };
  }, [weeklyData, bestDay, bestDayStats, weekChange, betterShift, dayAvg, nightAvg, weekAvgHourly]);

  // Chart config
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(26, 35, 50, 0.7)',
    backgroundGradientTo: 'rgba(26, 35, 50, 0.7)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 168, 232, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: { borderRadius: 16 },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(0, 168, 232, 0.15)',
      strokeWidth: 1,
    },
    fillShadowGradient: Colors.primary,
    fillShadowGradientOpacity: 0.3,
  };

  const monthlyChartData = {
    labels: monthlyData.map(m => m.label),
    datasets: [{ data: monthlyData.length > 0 ? monthlyData.map(m => m.total) : [0, 0, 0, 0, 0, 0] }],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card - This Week */}
        <LinearGradient
          colors={GradientColors.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>This Week</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{formatCurrency(weekTotal)}</Text>
            {lastWeekTotal > 0 && (
              <View style={[styles.changeBadge, weekChangePositive ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
                <Ionicons
                  name={weekChangePositive ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={weekChangePositive ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.changeText, weekChangePositive ? styles.changeTextPositive : styles.changeTextNegative]}>
                  {Math.abs(weekChange).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Ionicons name="time-outline" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={styles.heroStatText}>{formatCurrency(weekAvgHourly)}/hr avg</Text>
            </View>
            {bestDay && (
              <View style={styles.heroStatItem}>
                <Ionicons name="trophy" size={16} color={Colors.gold} />
                <Text style={[styles.heroStatText, { color: Colors.gold }]}>{bestDay}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* KEY INSIGHT CARD - Insight First! */}
        {keyInsight && (
          <View style={[
            styles.insightCard,
            keyInsight.type === 'positive' && styles.insightCardPositive,
            keyInsight.type === 'action' && styles.insightCardAction,
          ]}>
            <View style={[
              styles.insightIconContainer,
              keyInsight.type === 'positive' && styles.insightIconPositive,
              keyInsight.type === 'action' && styles.insightIconAction,
            ]}>
              <Ionicons
                name={keyInsight.icon}
                size={24}
                color={keyInsight.type === 'positive' ? Colors.success : keyInsight.type === 'action' ? Colors.primary : Colors.gold}
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{keyInsight.title}</Text>
              <Text style={styles.insightMessage}>{keyInsight.message}</Text>
            </View>
          </View>
        )}

        {/* Quick Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickStatsScroll}>
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{formatCurrency(weekAvgHourly)}</Text>
              <Text style={styles.quickStatLabel}>Avg Hourly</Text>
            </View>

            {bestDay && (
              <View style={styles.quickStatCard}>
                <Ionicons name="calendar" size={20} color={Colors.gold} />
                <Text style={[styles.quickStatValue, { color: Colors.gold }]}>{bestDay.slice(0, 3)}</Text>
                <Text style={styles.quickStatLabel}>Best Day</Text>
              </View>
            )}

            {bestHourlyDay && bestHourlyDay.hourlyRate > 0 && (
              <View style={styles.quickStatCard}>
                <Ionicons name="flash" size={20} color={Colors.success} />
                <Text style={styles.quickStatValue}>${bestHourlyDay.hourlyRate.toFixed(0)}/hr</Text>
                <Text style={styles.quickStatLabel}>Best Rate</Text>
              </View>
            )}

            <View style={styles.quickStatCard}>
              <Ionicons name="layers" size={20} color={Colors.info} />
              <Text style={styles.quickStatValue}>{weeklyData.length}</Text>
              <Text style={styles.quickStatLabel}>Shifts</Text>
            </View>
          </View>
        </ScrollView>

        {/* Weekly Breakdown - Collapsible */}
        <CollapsibleSection
          title="Weekly Breakdown"
          icon="calendar"
          iconColor={Colors.primary}
          defaultExpanded={true}
        >
          {weeklyStats.some(s => s.total > 0) ? (
            <View style={styles.weeklyRows}>
              {weeklyStats.map((stat, index) => {
                const maxAmount = Math.max(...weeklyStats.map(s => s.total), 1);
                const isTop = stat.total === maxAmount && stat.total > 0;
                return (
                  <View key={stat.day} style={styles.weeklyRow}>
                    <View style={[styles.dayBadge, isTop && styles.dayBadgeTop]}>
                      <Text style={[styles.dayBadgeText, isTop && styles.dayBadgeTextTop]}>{stat.day}</Text>
                    </View>
                    <View style={styles.weeklyBarContainer}>
                      <View
                        style={[
                          styles.weeklyBarFill,
                          {
                            width: `${(stat.total / maxAmount) * 100}%`,
                            backgroundColor: isTop ? Colors.gold : Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.weeklyAmount, isTop && styles.weeklyAmountTop]}>
                      {formatCurrency(stat.total)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No tips logged this week yet</Text>
            </View>
          )}
        </CollapsibleSection>

        {/* Day vs Night - Collapsible */}
        {(dayShifts.length > 0 || nightShifts.length > 0) && (
          <CollapsibleSection
            title="Day vs Night"
            icon="sunny"
            iconColor={Colors.warning}
            defaultExpanded={false}
          >
            <View style={styles.shiftComparison}>
              <View style={[styles.shiftCard, dayAvg >= nightAvg && dayAvg > 0 && styles.shiftCardWinner]}>
                <Ionicons name="sunny" size={24} color="#FCD34D" />
                <Text style={styles.shiftCardTitle}>Day</Text>
                <Text style={styles.shiftCardAmount}>{formatCurrency(dayAvg)}</Text>
                <Text style={styles.shiftCardLabel}>avg/shift</Text>
                <Text style={styles.shiftCardCount}>{dayShifts.length} shifts</Text>
              </View>
              <View style={[styles.shiftCard, nightAvg > dayAvg && styles.shiftCardWinner]}>
                <Ionicons name="moon" size={24} color="#818CF8" />
                <Text style={styles.shiftCardTitle}>Night</Text>
                <Text style={styles.shiftCardAmount}>{formatCurrency(nightAvg)}</Text>
                <Text style={styles.shiftCardLabel}>avg/shift</Text>
                <Text style={styles.shiftCardCount}>{nightShifts.length} shifts</Text>
              </View>
            </View>
          </CollapsibleSection>
        )}

        {/* Monthly Trend - Collapsible */}
        <CollapsibleSection
          title="Monthly Trend"
          icon="trending-up"
          iconColor={Colors.primary}
          defaultExpanded={false}
        >
          {monthlyData.some(m => m.total > 0) ? (
            <>
              <LineChart
                data={monthlyChartData}
                width={screenWidth - 72}
                height={180}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chart}
                bezier={true}
                fromZero={true}
              />
              <Text style={styles.chartCaption}>Last 6 months</Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>Log tips to see monthly trends</Text>
            </View>
          )}
        </CollapsibleSection>

        {/* Premium Upsell */}
        {!isPremium() && (
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
                <Ionicons name="sparkles" size={24} color={Colors.white} />
              </View>
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Unlock AI Insights</Text>
                <Text style={styles.upgradeSubtitle}>Shift predictions, best times & more</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 24,
    ...Shadows.buttonBlue,
  },
  heroLabel: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  changeBadgePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  changeBadgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  changeTextPositive: {
    color: '#10B981',
  },
  changeTextNegative: {
    color: '#EF4444',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 24,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '600',
  },

  // Key Insight Card
  insightCard: {
    ...GlassStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  insightCardPositive: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  insightCardAction: {
    borderColor: 'rgba(0, 168, 232, 0.3)',
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightIconPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  insightIconAction: {
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Quick Stats
  quickStatsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  quickStatCard: {
    ...GlassStyles.card,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    gap: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Weekly Rows
  weeklyRows: {
    gap: 10,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeTop: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  dayBadgeTextTop: {
    color: Colors.gold,
  },
  weeklyBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  weeklyBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  weeklyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 70,
    textAlign: 'right',
  },
  weeklyAmountTop: {
    color: Colors.gold,
  },

  // Shift Comparison
  shiftComparison: {
    flexDirection: 'row',
    gap: 12,
  },
  shiftCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  shiftCardWinner: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  shiftCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shiftCardAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  shiftCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  shiftCardCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Chart
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartCaption: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Upgrade Card
  upgradeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.buttonGold,
  },
  upgradeGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  upgradeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 3,
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
});
