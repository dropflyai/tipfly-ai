// Weekly Percentile Card
// Shows anonymous ranking vs other users

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GlassStyles } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { getWeeklyPercentile, WeeklyPercentile, getPercentileMessage } from '../../services/api/leaderboard';

export default function WeeklyPercentileCard() {
  const [data, setData] = useState<WeeklyPercentile | null>(null);
  const [loading, setLoading] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const percentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (data) {
      // Entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Animate percentile number
      Animated.timing(percentAnim, {
        toValue: data.percentile,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [data]);

  const loadData = async () => {
    try {
      const result = await getWeeklyPercentile();
      setData(result);
    } catch (error) {
      console.error('[WeeklyPercentileCard] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data || data.totalUsers < 2) {
    return null;
  }

  const isTop10 = data.percentile >= 90;
  const isTop25 = data.percentile >= 75;
  const isAboveAverage = data.percentile >= 50;

  const getIcon = () => {
    if (isTop10) return 'flame';
    if (isTop25) return 'trending-up';
    if (isAboveAverage) return 'arrow-up';
    return 'fitness';
  };

  const getColor = () => {
    if (isTop10) return '#FF6B6B';
    if (isTop25) return Colors.gold;
    if (isAboveAverage) return Colors.success;
    return Colors.primary;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.iconSection}>
        <View style={[styles.iconCircle, { backgroundColor: `${getColor()}20` }]}>
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.percentileRow}>
          <Text style={styles.percentileLabel}>This week you're outearning</Text>
          <View style={styles.percentileValue}>
            <Animated.Text style={[styles.percentileNumber, { color: getColor() }]}>
              {Math.round(data.percentile)}
            </Animated.Text>
            <Text style={[styles.percentileSymbol, { color: getColor() }]}>%</Text>
          </View>
          <Text style={styles.percentileLabel}>of TipFly users</Text>
        </View>

        <Text style={styles.message}>{getPercentileMessage(data.percentile)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(data.userTotal)}</Text>
            <Text style={styles.statLabel}>Your week</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.totalUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Users tracked</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...GlassStyles.card,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  iconSection: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
  },
  percentileRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  percentileLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  percentileValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  percentileNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  percentileSymbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});
