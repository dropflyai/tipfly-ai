import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface WeeklyTrendChartProps {
  data: number[]; // 7 days of earnings
  labels?: string[]; // Optional day labels
  maxValue?: number;
}

export default function WeeklyTrendChart({ data, labels, maxValue }: WeeklyTrendChartProps) {
  const max = maxValue || Math.max(...data, 1);
  const dayLabels = labels || ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((value, index) => {
          const heightPercent = (value / max) * 100;
          const isToday = index === data.length - 1;

          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(heightPercent, 5)}%`,
                      backgroundColor: isToday ? Colors.primary : Colors.primaryLight,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, isToday && styles.labelActive]}>
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
    height: 80,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
