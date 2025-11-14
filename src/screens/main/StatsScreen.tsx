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
import { } from 'react-native-safe-area-context';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { getWeeklyTips, getMonthlyTips, getTipEntriesByDateRange } from '../../services/api/tips';
import { TipEntry } from '../../types';
import { formatCurrency, formatDayOfWeek } from '../../utils/formatting';
import { calculateTotalTips, calculateAverageHourlyRate } from '../../utils/calculations';
import { startOfMonth, subMonths, format } from 'date-fns';
import { useUserStore } from '../../store/userStore';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const navigation = useNavigation();
  const { isPremium } = useUserStore();
  const [weeklyData, setWeeklyData] = useState<TipEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    try {
      const [weekTips, last6MonthsTips] = await Promise.all([
        getWeeklyTips(),
        getLast6MonthsTips(),
      ]);

      setWeeklyData(weekTips);
      setMonthlyData(last6MonthsTips);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const chartConfig = {
    backgroundColor: Colors.white,
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: Colors.gray200,
      strokeWidth: 1,
    },
  };

  const weekTotal = calculateTotalTips(weeklyData);
  const weekAvgHourly = calculateAverageHourlyRate(weeklyData);
  const bestDayIndex = weeklyTotals.indexOf(Math.max(...weeklyTotals));
  const bestDay = weekDays[bestDayIndex];
  const bestDayAmount = weeklyTotals[bestDayIndex];

  // Premium: Shift type analysis
  const shiftTypes = ['day', 'night', 'double', 'other'];
  const shiftPerformance = shiftTypes.map(type => {
    const shiftTips = weeklyData.filter(entry => entry.shift_type === type);
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      amount: calculateTotalTips(shiftTips),
      count: shiftTips.length,
      population: shiftTips.length,
      color: type === 'day' ? '#10B981' : type === 'night' ? '#3B82F6' : type === 'double' ? '#F59E0B' : '#6B7280',
      legendFontColor: Colors.text,
      legendFontSize: 13,
    };
  }).filter(s => s.amount > 0);

  // Premium: Hour distribution analysis
  const morningTips = weeklyData.filter(e => {
    const hour = new Date(e.date).getHours();
    return hour >= 6 && hour < 12;
  });
  const afternoonTips = weeklyData.filter(e => {
    const hour = new Date(e.date).getHours();
    return hour >= 12 && hour < 17;
  });
  const eveningTips = weeklyData.filter(e => {
    const hour = new Date(e.date).getHours();
    return hour >= 17 && hour < 23;
  });
  const nightTips = weeklyData.filter(e => {
    const hour = new Date(e.date).getHours();
    return hour >= 23 || hour < 6;
  });

  const bestTimeData = [
    { time: 'Morning', amount: calculateTotalTips(morningTips) },
    { time: 'Afternoon', amount: calculateTotalTips(afternoonTips) },
    { time: 'Evening', amount: calculateTotalTips(eveningTips) },
    { time: 'Night', amount: calculateTotalTips(nightTips) },
  ].sort((a, b) => b.amount - a.amount);

  const bestTime = bestTimeData[0];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Weekly Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(weekTotal)}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Avg Hourly</Text>
              <Text style={styles.summaryStatValue}>
                ${weekAvgHourly.toFixed(2)}/hr
              </Text>
            </View>
            {bestDayAmount > 0 && (
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>Best Day</Text>
                <Text style={styles.summaryStatValue}>
                  {bestDay} ({formatCurrency(bestDayAmount)})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Earnings</Text>
          <BarChart
            data={weeklyChartData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel="$"
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
          <Text style={styles.chartTitle}>Monthly Trend</Text>
          <LineChart
            data={monthlyChartData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel="$"
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
                <Ionicons name="star" size={14} color={Colors.accent} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.chartTitle}>Shift Performance</Text>
              <PieChart
                data={shiftPerformance}
                width={screenWidth - 48}
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
                <Ionicons name="star" size={14} color={Colors.accent} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.chartTitle}>Best Earning Times</Text>
              <View style={styles.timeAnalysis}>
                {bestTimeData.map((item, index) => (
                  <View key={item.time} style={styles.timeRow}>
                    <View style={styles.timeRank}>
                      <Text style={styles.timeRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeLabel}>{item.time}</Text>
                      <View style={styles.timeBar}>
                        <View
                          style={[
                            styles.timeBarFill,
                            {
                              width: `${(item.amount / bestTime.amount) * 100}%`,
                              backgroundColor:
                                index === 0 ? Colors.success :
                                index === 1 ? Colors.primary :
                                index === 2 ? Colors.accent : Colors.gray400,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.timeAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.chartCaption}>
                {bestTime.time} is your best earning time
              </Text>
            </View>

            {/* Personalized Insights */}
            <View style={styles.insightsCard}>
              <Ionicons name="bulb" size={32} color={Colors.white} />
              <Text style={styles.insightsTitle}>Personalized Insights</Text>
              <View style={styles.insightsList}>
                <Text style={styles.insightItem}>
                  💡 Your {bestTime.time.toLowerCase()} shifts earn {((bestTime.amount / weekTotal) * 100).toFixed(0)}% of your weekly tips
                </Text>
                <Text style={styles.insightItem}>
                  📈 You're averaging {formatCurrency(weekAvgHourly)}/hour this week
                </Text>
                {bestDayAmount > 0 && (
                  <Text style={styles.insightItem}>
                    🎯 {bestDay} is consistently your best earning day
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* Premium Teaser for Free Users */}
        {!isPremium() && (
          <TouchableOpacity
            style={styles.upgradCard}
            onPress={() => navigation.navigate('Upgrade' as never)}
          >
            <View style={styles.upgradeContent}>
              <Ionicons name="bar-chart" size={48} color={Colors.accent} />
              <Text style={styles.upgradeTitle}>Unlock Premium Analytics</Text>
              <Text style={styles.upgradeText}>
                • Shift performance breakdown{'\n'}
                • Best earning time analysis{'\n'}
                • Personalized insights{'\n'}
                • Advanced trend predictions
              </Text>
            </View>
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 32,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  timeAnalysis: {
    gap: 12,
    marginVertical: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
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
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 60,
    textAlign: 'right',
  },
  insightsCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  insightsList: {
    gap: 12,
    marginTop: 8,
  },
  insightItem: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
  upgradCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    gap: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeContent: {
    alignItems: 'center',
    gap: 12,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 24,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
});
