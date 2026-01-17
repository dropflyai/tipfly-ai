import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface WeekSparklineProps {
  data: number[];
  height?: number;
  barWidth?: number;
  color?: string;
}

export default function WeekSparkline({
  data,
  height = 40,
  barWidth = 8,
  color = Colors.primary,
}: WeekSparklineProps) {
  const maxValue = Math.max(...data, 1); // Prevent division by zero
  const gap = 4;

  return (
    <View style={[styles.container, { height }]}>
      {data.map((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * height : 0;
        const isToday = index === data.length - 1;

        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: Math.max(barHeight, 2), // Minimum 2px height
                backgroundColor: isToday ? color : `${color}60`,
                marginLeft: index > 0 ? gap : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    borderRadius: 4,
  },
});
