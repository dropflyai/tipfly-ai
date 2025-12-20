import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';

interface WeeklyTrendChartProps {
  data: number[]; // 7 days of earnings
  labels?: string[]; // Optional day labels
  maxValue?: number;
}

export default function WeeklyTrendChart({ data, labels, maxValue }: WeeklyTrendChartProps) {
  const max = maxValue || Math.max(...data, 1);
  const dayLabels = labels || ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Check if there's any data
  const hasData = data.some(value => value > 0);

  // Find the best day (highest value)
  const maxIndex = data.indexOf(Math.max(...data));

  // Show empty state if no data
  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={32} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No tips logged yet</Text>
        <Text style={styles.emptySubtitle}>Start tracking to see your weekly trends</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((value, index) => {
          const heightPercent = (value / max) * 100;
          const isToday = index === data.length - 1;
          const isBestDay = index === maxIndex && value > 0;

          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(heightPercent, 5)}%`,
                    },
                    isBestDay && styles.barBest,
                    isToday && !isBestDay && styles.barToday,
                    !isToday && !isBestDay && styles.barDefault,
                  ]}
                />
              </View>
              <Text style={[
                styles.label,
                isToday && styles.labelActive,
                isBestDay && styles.labelBest,
              ]}>
                {dayLabels[index]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '65%',
    borderRadius: 6,
    minHeight: 4,
  },
  barDefault: {
    backgroundColor: Colors.primaryLight,
  },
  barToday: {
    backgroundColor: Colors.primary,
    ...Shadows.glowBlueSubtle,
  },
  barBest: {
    backgroundColor: Colors.gold,
    ...Shadows.glowGoldSubtle,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  labelBest: {
    color: Colors.gold,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
