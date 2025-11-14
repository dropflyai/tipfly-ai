import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { TipEntry } from '../../../types';
import { formatCurrency } from '../../../utils/formatting';
import { lightHaptic } from '../../../utils/haptics';

interface CalendarViewProps {
  currentMonth: Date;
  tipEntries: TipEntry[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface DayData {
  date: Date;
  total: number;
  entries: TipEntry[];
  isCurrentMonth: boolean;
}

export default function CalendarView({
  currentMonth,
  tipEntries,
  selectedDate,
  onDateSelect,
}: CalendarViewProps) {

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;

    // Calculate total cells needed (6 weeks * 7 days = 42)
    const totalCells = 42;

    const days: DayData[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = tipEntries.filter(e => e.date === dateStr);
      const total = dayEntries.reduce((sum, e) => sum + e.tips_earned, 0);

      days.push({
        date,
        total,
        entries: dayEntries,
        isCurrentMonth: false,
      });
    }

    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = tipEntries.filter(e => e.date === dateStr);
      const total = dayEntries.reduce((sum, e) => sum + e.tips_earned, 0);

      days.push({
        date,
        total,
        entries: dayEntries,
        isCurrentMonth: true,
      });
    }

    // Add days from next month to fill grid
    const daysToAdd = totalCells - days.length;
    for (let day = 1; day <= daysToAdd; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = tipEntries.filter(e => e.date === dateStr);
      const total = dayEntries.reduce((sum, e) => sum + e.tips_earned, 0);

      days.push({
        date,
        total,
        entries: dayEntries,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, tipEntries]);

  // Calculate color intensity based on amount
  const getColorIntensity = (amount: number): string => {
    if (amount === 0) return 'transparent';

    const maxAmount = Math.max(...calendarDays.map(d => d.total));
    if (maxAmount === 0) return Colors.primary + '20';

    const intensity = amount / maxAmount;

    if (intensity >= 0.8) return Colors.primary;
    if (intensity >= 0.6) return Colors.primary + 'CC'; // 80% opacity
    if (intensity >= 0.4) return Colors.primary + '99'; // 60% opacity
    if (intensity >= 0.2) return Colors.primary + '66'; // 40% opacity
    return Colors.primary + '33'; // 20% opacity
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDayPress = (day: DayData) => {
    lightHaptic();
    onDateSelect(day.date);
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Weekday Headers */}
        <View style={styles.weekdayHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayCellInactive,
                isSelected(day.date) && styles.dayCellSelected,
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              {/* Background color for tip amount */}
              <View
                style={[
                  styles.dayBackground,
                  { backgroundColor: getColorIntensity(day.total) },
                  isToday(day.date) && styles.dayBackgroundToday,
                  isSelected(day.date) && styles.dayBackgroundSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    !day.isCurrentMonth && styles.dayNumberInactive,
                    isToday(day.date) && styles.dayNumberToday,
                    isSelected(day.date) && styles.dayNumberSelected,
                    day.total > 0 && day.isCurrentMonth && styles.dayNumberWithTips,
                  ]}
                >
                  {day.date.getDate()}
                </Text>

                {day.total > 0 && day.isCurrentMonth && (
                  <Text
                    style={[
                      styles.dayAmount,
                      isSelected(day.date) && styles.dayAmountSelected,
                    ]}
                    numberOfLines={1}
                  >
                    ${Math.round(day.total)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Date Details */}
      {(() => {
        const selectedDay = calendarDays.find(d => isSelected(d.date));
        if (!selectedDay || selectedDay.entries.length === 0) {
          return (
            <View style={styles.detailsCard}>
              <Text style={styles.noEntriesText}>
                No tips on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsDate}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={styles.detailsTotal}>{formatCurrency(selectedDay.total)}</Text>

            <View style={styles.entriesList}>
              {selectedDay.entries.map((entry, index) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <View style={[styles.shiftBadge, getShiftColor(entry.shift_type)]}>
                      <Text style={styles.shiftText}>{getShiftLabel(entry.shift_type)}</Text>
                    </View>
                    <Text style={styles.entryHours}>{entry.hours_worked}h</Text>
                  </View>
                  <Text style={styles.entryAmount}>{formatCurrency(entry.tips_earned)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Hours</Text>
                <Text style={styles.summaryValue}>
                  {selectedDay.entries.reduce((sum, e) => sum + e.hours_worked, 0).toFixed(1)}h
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Hourly Rate</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(
                    selectedDay.total / selectedDay.entries.reduce((sum, e) => sum + e.hours_worked, 0)
                  )}/hr
                </Text>
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

function getShiftLabel(shift: string): string {
  const labels: Record<string, string> = {
    day: 'DAY',
    night: 'NIGHT',
    double: 'DOUBLE',
    other: 'OTHER',
  };
  return labels[shift] || 'OTHER';
}

function getShiftColor(shift: string): object {
  const colors: Record<string, object> = {
    day: { backgroundColor: Colors.warning + '20' },
    night: { backgroundColor: Colors.info + '20' },
    double: { backgroundColor: Colors.success + '20' },
    other: { backgroundColor: Colors.gray200 },
  };
  return colors[shift] || { backgroundColor: Colors.gray200 };
}

const { width } = Dimensions.get('window');
const cellSize = (width - 48) / 7; // 24px padding on each side

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  calendar: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: cellSize,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: cellSize,
    aspectRatio: 1,
    padding: 2,
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellSelected: {
    // Selected styling handled in background
  },
  dayBackground: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayBackgroundToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayBackgroundSelected: {
    backgroundColor: Colors.primary + '!important',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  dayNumberInactive: {
    color: Colors.textSecondary,
  },
  dayNumberToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: Colors.white,
    fontWeight: '800',
  },
  dayNumberWithTips: {
    color: Colors.white,
  },
  dayAmount: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  dayAmountSelected: {
    color: Colors.white,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noEntriesText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  detailsDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  detailsTotal: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  entriesList: {
    gap: 12,
    marginBottom: 20,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shiftBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shiftText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  entryHours: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  detailsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
