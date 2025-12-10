import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows, GlassStyles, GradientColors } from '../../constants/colors';
import { getWeeklyTips, getMonthlyTips, getTipEntriesByDateRange } from '../../services/api/tips';
import { TipEntry, Job } from '../../types';
import { formatCurrency, formatDayOfWeek } from '../../utils/formatting';
import { calculateTotalTips, calculateAverageHourlyRate } from '../../utils/calculations';
import { startOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { useUserStore } from '../../store/userStore';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { getActiveGoals, Goal, calculateProgress } from '../../services/api/goals';
import { getJobs } from '../../services/api/jobs';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const navigation = useNavigation();
  const { isPremium } = useUserStore();
  const [weeklyData, setWeeklyData] = useState<TipEntry[]>([]);
  const [lastWeekData, setLastWeekData] = useState<TipEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    try {
      const [weekTips, prevWeekTips, last6MonthsTips, userJobs, goals] = await Promise.all([
        getWeeklyTips(),
        getLastWeekTips(),
        getLast6MonthsTips(),
        getJobs(),
        getActiveGoals(),
      ]);

      setWeeklyData(weekTips);
      setLastWeekData(prevWeekTips);
      setMonthlyData(last6MonthsTips);
      setJobs(userJobs);
      setActiveGoals(goals);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // Prepare weekly bar chart data
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyTotals = weekDays.map((day, index) => {
    const dayTips = weeklyData.filter(entry => {
      const entryDay = new Date(entry.date).getDay();
      return entryDay === index;
    });
    return calculateTotalTips(dayTips);
  });

  const weeklyChartData = {
    labels: weekDays,
    datasets: [
      {
        data: weeklyTotals.length > 0 ? weeklyTotals : [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  // Prepare monthly line chart data
  const monthlyChartData = {
    labels: monthlyData.map(m => m.label),
    datasets: [
      {
        data: monthlyData.length > 0 ? monthlyData.map(m => m.total) : [0, 0, 0, 0, 0, 0],
      },
    ],
  };

  // Blue-themed chart config
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(26, 35, 50, 0.7)',
    backgroundGradientTo: 'rgba(26, 35, 50, 0.7)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 168, 232, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(0, 168, 232, 0.15)',
      strokeWidth: 1,
    },
    fillShadowGradient: Colors.primary,
    fillShadowGradientOpacity: 0.3,
  };

  const weekTotal = calculateTotalTips(weeklyData);
  const weekAvgHourly = calculateAverageHourlyRate(weeklyData);
  const bestDayIndex = weeklyTotals.indexOf(Math.max(...weeklyTotals));
  const bestDay = weekDays[bestDayIndex];
  const bestDayAmount = weeklyTotals[bestDayIndex];

  // Week-over-week comparison
  const lastWeekTotal = calculateTotalTips(lastWeekData);
  const weekChange = lastWeekTotal > 0
    ? ((weekTotal - lastWeekTotal) / lastWeekTotal) * 100
    : weekTotal > 0 ? 100 : 0;
  const weekChangePositive = weekChange >= 0;

  // Month-over-month comparison (from monthly data)
  const thisMonthTotal = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.total || 0 : 0;
  const lastMonthTotal = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2]?.total || 0 : 0;
  const monthChange = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : thisMonthTotal > 0 ? 100 : 0;
  const monthChangePositive = monthChange >= 0;

  // Job-based analytics (for users with multiple jobs)
  const jobAnalytics = jobs.map(job => {
    const jobTips = weeklyData.filter(entry => entry.job_id === job.id);
    return {
      id: job.id,
      name: job.name,
      color: job.color,
      total: calculateTotalTips(jobTips),
      hours: jobTips.reduce((sum, e) => sum + (e.hours_worked || 0), 0),
      avgHourly: calculateAverageHourlyRate(jobTips),
      shifts: jobTips.length,
    };
  }).filter(j => j.total > 0).sort((a, b) => b.total - a.total);

  const hasMultipleJobs = jobs.length > 1;

  // Premium: Shift type analysis
  const shiftTypes = ['day', 'night', 'double', 'other'];
  const shiftPerformance = shiftTypes.map(type => {
    const shiftTips = weeklyData.filter(entry => entry.shift_type === type);
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      amount: calculateTotalTips(shiftTips),
      count: shiftTips.length,
      population: shiftTips.length,
      color: type === 'day' ? Colors.primary : type === 'night' ? '#3B82F6' : type === 'double' ? Colors.gold : '#6B7280',
      legendFontColor: Colors.text,
      legendFontSize: 13,
    };
  }).filter(s => s.amount > 0);

  // Premium: Hour distribution analysis - uses clock_in time for accurate shift timing
  // Filter entries that have clock_in data (new entries will have this)
  const entriesWithClockData = weeklyData.filter(e => e.clock_in);

  const morningTips = entriesWithClockData.filter(e => {
    const hour = new Date(e.clock_in!).getHours();
    return hour >= 6 && hour < 12;
  });
  const afternoonTips = entriesWithClockData.filter(e => {
    const hour = new Date(e.clock_in!).getHours();
    return hour >= 12 && hour < 17;
  });
  const eveningTips = entriesWithClockData.filter(e => {
    const hour = new Date(e.clock_in!).getHours();
    return hour >= 17 && hour < 21;
  });
  const nightTips = entriesWithClockData.filter(e => {
    const hour = new Date(e.clock_in!).getHours();
    return hour >= 21 || hour < 6;
  });

  const bestTimeData = [
    { time: 'Morning (6am-12pm)', amount: calculateTotalTips(morningTips), count: morningTips.length },
    { time: 'Afternoon (12pm-5pm)', amount: calculateTotalTips(afternoonTips), count: afternoonTips.length },
    { time: 'Evening (5pm-9pm)', amount: calculateTotalTips(eveningTips), count: eveningTips.length },
    { time: 'Night (9pm-6am)', amount: calculateTotalTips(nightTips), count: nightTips.length },
  ].sort((a, b) => b.amount - a.amount);

  const bestTime = bestTimeData[0];
  const hasClockData = entriesWithClockData.length > 0;

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Weekly Summary Card - Gradient Hero */}
        <LinearGradient
          colors={GradientColors.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>This Week</Text>
          <View style={styles.summaryAmountRow}>
            <Text style={styles.summaryAmount}>{formatCurrency(weekTotal)}</Text>
            {lastWeekTotal > 0 && (
              <View style={[
                styles.changeIndicator,
                weekChangePositive ? styles.changePositive : styles.changeNegative
              ]}>
                <Ionicons
                  name={weekChangePositive ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={weekChangePositive ? '#10B981' : '#EF4444'}
                />
                <Text style={[
                  styles.changeText,
                  weekChangePositive ? styles.changeTextPositive : styles.changeTextNegative
                ]}>
                  {Math.abs(weekChange).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <View style={styles.summaryStatIconContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.summaryStatLabel}>Avg Hourly</Text>
                <Text style={styles.summaryStatValue}>
                  ${weekAvgHourly.toFixed(2)}/hr
                </Text>
              </View>
            </View>
            {bestDayAmount > 0 && (
              <View style={styles.summaryStatItem}>
                <View style={[styles.summaryStatIconContainer, styles.summaryStatIconGold]}>
                  <Ionicons name="trophy" size={16} color={Colors.gold} />
                </View>
                <View>
                  <Text style={styles.summaryStatLabel}>Best Day</Text>
                  <Text style={[styles.summaryStatValue, styles.summaryStatValueGold]}>
                    {bestDay}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {lastWeekTotal > 0 && (
            <Text style={styles.comparisonText}>
              vs {formatCurrency(lastWeekTotal)} last week
            </Text>
          )}
        </LinearGradient>

        {/* Goal Progress Cards */}
        {activeGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.chartIconContainer}>
                <Ionicons name="flag" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Goal Progress</Text>
            </View>
            {activeGoals.map(goal => {
              const progress = calculateProgress(goal);
              const remaining = goal.target_amount - goal.current_amount;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalType}>
                      {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal
                    </Text>
                    <Text style={styles.goalProgress}>
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </Text>
                  </View>
                  <View style={styles.goalProgressBar}>
                    <View
                      style={[
                        styles.goalProgressFill,
                        {
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: progress >= 100 ? Colors.success : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.goalRemaining}>
                    {progress >= 100
                      ? 'Goal achieved!'
                      : `${formatCurrency(remaining)} to go`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Job Performance (for multi-job users) */}
        {hasMultipleJobs && jobAnalytics.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartIconContainer}>
                <Ionicons name="briefcase" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.chartTitle}>Earnings by Job</Text>
            </View>
            <View style={styles.jobsList}>
              {jobAnalytics.map((job, index) => (
                <View key={job.id} style={styles.jobRow}>
                  <View style={styles.jobInfo}>
                    <View style={[styles.jobColorDot, { backgroundColor: job.color }]} />
                    <View style={styles.jobDetails}>
                      <Text style={styles.jobName}>{job.name}</Text>
                      <Text style={styles.jobMeta}>
                        {job.shifts} shift{job.shifts !== 1 ? 's' : ''} • {job.hours.toFixed(1)} hrs
                      </Text>
                    </View>
                  </View>
                  <View style={styles.jobAmountContainer}>
                    <Text style={[styles.jobAmount, index === 0 && styles.jobAmountTop]}>
                      {formatCurrency(job.total)}
                    </Text>
                    <Text style={styles.jobHourlyRate}>
                      ${job.avgHourly.toFixed(2)}/hr
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.chartCaption}>
              This week's earnings by job
            </Text>
          </View>
        )}

        {/* Weekly Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartIconContainer}>
              <Ionicons name="bar-chart" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.chartTitle}>Weekly Earnings</Text>
          </View>
          <BarChart
            data={weeklyChartData}
            width={screenWidth - 56}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
          />
          <Text style={styles.chartCaption}>
            Tips by day of the week
          </Text>
        </View>

        {/* Monthly Line Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartIconContainer}>
              <Ionicons name="trending-up" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.chartTitle}>Monthly Trend</Text>
          </View>
          <LineChart
            data={monthlyChartData}
            width={screenWidth - 56}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            bezier={true}
            fromZero={true}
          />
          <Text style={styles.chartCaption}>
            Last 6 months tip earnings
          </Text>
        </View>

        {/* Premium Charts */}
        {isPremium() && shiftPerformance.length > 0 && (
          <>
            {/* Shift Performance Pie Chart */}
            <View style={styles.chartCard}>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color={Colors.gold} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <View style={styles.chartHeader}>
                <View style={[styles.chartIconContainer, styles.chartIconContainerGold]}>
                  <Ionicons name="pie-chart" size={20} color={Colors.gold} />
                </View>
                <Text style={styles.chartTitle}>Shift Performance</Text>
              </View>
              <PieChart
                data={shiftPerformance}
                width={screenWidth - 56}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
              <Text style={styles.chartCaption}>
                Earnings breakdown by shift type
              </Text>
            </View>

            {/* Time Analysis */}
            <View style={styles.chartCard}>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color={Colors.gold} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <View style={styles.chartHeader}>
                <View style={[styles.chartIconContainer, styles.chartIconContainerGold]}>
                  <Ionicons name="sunny" size={20} color={Colors.gold} />
                </View>
                <Text style={styles.chartTitle}>Best Earning Times</Text>
              </View>
              {hasClockData ? (
                <>
                  <View style={styles.timeAnalysis}>
                    {bestTimeData.map((item, index) => (
                      <View key={item.time} style={styles.timeRow}>
                        <View style={[
                          styles.timeRank,
                          index === 0 && styles.timeRankFirst
                        ]}>
                          <Text style={[
                            styles.timeRankText,
                            index === 0 && styles.timeRankTextFirst
                          ]}>#{index + 1}</Text>
                        </View>
                        <View style={styles.timeInfo}>
                          <Text style={styles.timeLabel}>{item.time}</Text>
                          <View style={styles.timeBar}>
                            <View
                              style={[
                                styles.timeBarFill,
                                {
                                  width: `${(item.amount / (bestTime.amount || 1)) * 100}%`,
                                  backgroundColor:
                                    index === 0 ? Colors.gold :
                                    index === 1 ? Colors.primary :
                                    index === 2 ? Colors.primaryLight : Colors.textSecondary,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <View style={styles.timeAmountContainer}>
                          <Text style={[
                            styles.timeAmount,
                            index === 0 && styles.timeAmountFirst
                          ]}>{formatCurrency(item.amount)}</Text>
                          <Text style={styles.timeShiftCount}>{item.count} shift{item.count !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.chartCaption}>
                    {bestTime.time.split(' ')[0]} is your best earning time
                  </Text>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.noDataTitle}>No Time Data Yet</Text>
                  <Text style={styles.noDataText}>
                    Log a few more shifts to see which times of day earn you the most tips.
                  </Text>
                </View>
              )}
            </View>

            {/* Personalized Insights */}
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightsCard}
            >
              <View style={styles.insightsHeader}>
                <View style={styles.insightsIconContainer}>
                  <Ionicons name="bulb" size={24} color={Colors.gold} />
                </View>
                <Text style={styles.insightsTitle}>AI Insights</Text>
              </View>
              <View style={styles.insightsList}>
                <View style={styles.insightItem}>
                  <Ionicons name="flash" size={16} color={Colors.gold} />
                  <Text style={styles.insightText}>
                    Your {bestTime.time.toLowerCase()} shifts earn {((bestTime.amount / (weekTotal || 1)) * 100).toFixed(0)}% of weekly tips
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <Ionicons name="trending-up" size={16} color={Colors.gold} />
                  <Text style={styles.insightText}>
                    Averaging {formatCurrency(weekAvgHourly)}/hour this week
                  </Text>
                </View>
                {bestDayAmount > 0 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="trophy" size={16} color={Colors.gold} />
                    <Text style={styles.insightText}>
                      {bestDay} is your best earning day
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </>
        )}

        {/* Premium Teaser for Free Users */}
        {!isPremium() && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => {
              mediumHaptic();
              navigation.navigate('Upgrade' as never);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.upgradeContent}>
              <View style={styles.upgradeIconContainer}>
                <Ionicons name="analytics" size={32} color={Colors.gold} />
              </View>
              <Text style={styles.upgradeTitle}>Unlock Premium Analytics</Text>
              <View style={styles.upgradeFeatures}>
                <View style={styles.upgradeFeature}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />
                  <Text style={styles.upgradeFeatureText}>Shift performance breakdown</Text>
                </View>
                <View style={styles.upgradeFeature}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />
                  <Text style={styles.upgradeFeatureText}>Best earning time analysis</Text>
                </View>
                <View style={styles.upgradeFeature}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />
                  <Text style={styles.upgradeFeatureText}>AI-powered insights</Text>
                </View>
                <View style={styles.upgradeFeature}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />
                  <Text style={styles.upgradeFeatureText}>Advanced trend predictions</Text>
                </View>
              </View>
            </View>
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.background} />
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
    paddingBottom: 20,
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
    padding: 20,
    gap: 20,
  },
  // Summary Card - Gradient Hero
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Shadows.glowBlue,
  },
  summaryTitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  summaryAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  changeNegative: {
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
  comparisonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 32,
  },
  summaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryStatIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatIconGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  summaryStatValueGold: {
    color: Colors.gold,
  },
  // Chart Cards - Glass Style
  chartCard: {
    ...GlassStyles.card,
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chartIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartIconContainerGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartCaption: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  // Premium Badge
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  // Time Analysis
  timeAnalysis: {
    gap: 14,
    marginVertical: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeRank: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRankFirst: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  timeRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timeRankTextFirst: {
    color: Colors.gold,
  },
  timeInfo: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  timeBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeAmountContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  timeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
  },
  timeAmountFirst: {
    color: Colors.gold,
  },
  timeShiftCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Goals Section
  goalsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  goalCard: {
    ...GlassStyles.card,
    padding: 16,
    gap: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalType: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  goalProgress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  goalProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalRemaining: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  // Job Analytics
  jobsList: {
    gap: 12,
    marginVertical: 8,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  jobColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  jobDetails: {
    flex: 1,
  },
  jobName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  jobMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  jobAmountContainer: {
    alignItems: 'flex-end',
  },
  jobAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  jobAmountTop: {
    color: Colors.primary,
  },
  jobHourlyRate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // No Data State
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Insights Card
  insightsCard: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    ...Shadows.glowBlue,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    borderRadius: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    lineHeight: 21,
  },
  // Upgrade Card
  upgradeCard: {
    ...GlassStyles.card,
    padding: 24,
    gap: 20,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  upgradeContent: {
    alignItems: 'center',
    gap: 16,
  },
  upgradeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowGoldSubtle,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  upgradeFeatures: {
    gap: 10,
    width: '100%',
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeFeatureText: {
    fontSize: 15,
    color: Colors.text,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    ...Shadows.buttonGold,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.background,
  },
  bottomSpacing: {
    height: 80,
  },
});
