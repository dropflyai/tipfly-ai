import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { TipEntry } from '../../types';
import { getTipEntriesByDateRange } from '../../services/api/tips';
import { formatCurrency } from '../../utils/formatting';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';

type ViewMode = 'calendar' | 'list';

export default function TipHistoryScreen() {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [tipEntries, setTipEntries] = useState<TipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthTotal, setMonthTotal] = useState(0);
  const [bestDay, setBestDay] = useState<{ date: string; amount: number } | null>(null);
  const toggleAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    // Animate toggle switch
    Animated.spring(toggleAnim, {
      toValue: viewMode === 'list' ? 1 : 0,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [viewMode]);

  const loadMonthData = async (month: Date) => {
    try {
      setLoading(true);

      // Get first and last day of month
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const entries = await getTipEntriesByDateRange(startDate, endDate);
      setTipEntries(entries);

      // Calculate month total
      const total = entries.reduce((sum, entry) => sum + entry.tips_earned, 0);
      setMonthTotal(total);

      // Find best day
      const dailyTotals = new Map<string, number>();
      entries.forEach(entry => {
        const current = dailyTotals.get(entry.date) || 0;
        dailyTotals.set(entry.date, current + entry.tips_earned);
      });

      let maxAmount = 0;
      let maxDate = '';
      dailyTotals.forEach((amount, date) => {
        if (amount > maxAmount) {
          maxAmount = amount;
          maxDate = date;
        }
      });

      setBestDay(maxAmount > 0 ? { date: maxDate, amount: maxAmount } : null);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleView = () => {
    lightHaptic();
    setViewMode(prev => prev === 'calendar' ? 'list' : 'calendar');
  };

  const handlePreviousMonth = () => {
    lightHaptic();
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    lightHaptic();
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleTodayPress = () => {
    mediumHaptic();
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (date: Date) => {
    lightHaptic();
    setSelectedDate(date);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMonthData(currentMonth);
  };

  const getMonthYearLabel = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return currentMonth.getMonth() === today.getMonth() &&
           currentMonth.getFullYear() === today.getFullYear();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tip History</Text>

          {/* View Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
              onPress={handleToggleView}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar"
                size={18}
                color={viewMode === 'calendar' ? Colors.white : Colors.gray600}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={handleToggleView}
              activeOpacity={0.7}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === 'list' ? Colors.white : Colors.gray600}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleTodayPress} style={styles.monthLabelContainer}>
            <Text style={styles.monthLabel}>{getMonthYearLabel()}</Text>
            {!isCurrentMonth() && (
              <Text style={styles.todayHint}>Tap for today</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Month Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{formatCurrency(monthTotal)}</Text>
          </View>
          {bestDay && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Best Day</Text>
              <Text style={styles.statValue}>
                {formatCurrency(bestDay.amount)}
              </Text>
              <Text style={styles.statSubtext}>
                {new Date(bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Entries</Text>
            <Text style={styles.statValue}>{tipEntries.length}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'calendar' ? (
          <CalendarView
            currentMonth={currentMonth}
            tipEntries={tipEntries}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        ) : (
          <ListView
            tipEntries={tipEntries}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        )}
      </ScrollView>
    </SafeAreaView>
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
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabelContainer: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  todayHint: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
});
