// Personal Best Progress Card
// Shows progress toward beating personal records

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { getPersonalBests, PersonalBests, getPersonalBestMessage } from '../../services/api/leaderboard';
import { mediumHaptic, successHaptic } from '../../utils/haptics';

interface PersonalBestCardProps {
  onPress?: () => void;
}

export default function PersonalBestCard({ onPress }: PersonalBestCardProps) {
  const [personalBests, setPersonalBests] = useState<PersonalBests | null>(null);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPersonalBests();
  }, []);

  useEffect(() => {
    if (personalBests?.bestWeek) {
      // Animate progress bar
      Animated.spring(progressAnim, {
        toValue: Math.min(personalBests.bestWeek.progressPercent / 100, 1),
        tension: 40,
        friction: 8,
        useNativeDriver: false,
      }).start();

      // Pulse if close to beating record
      if (personalBests.bestWeek.progressPercent >= 75 && personalBests.bestWeek.progressPercent < 100) {
        const pulse = Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]);
        Animated.loop(pulse).start();
      }

      // Celebration if new record
      if (personalBests.bestWeek.progressPercent >= 100) {
        successHaptic();
      }
    }
  }, [personalBests]);

  const loadPersonalBests = async () => {
    try {
      const data = await getPersonalBests();
      setPersonalBests(data);
    } catch (error) {
      console.error('[PersonalBestCard] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !personalBests?.hasData || !personalBests.bestWeek) {
    return null;
  }

  const { bestWeek, bestDay, lifetimeTotal } = personalBests;
  const isNewRecord = bestWeek.progressPercent >= 100;
  const isClose = bestWeek.progressPercent >= 75 && !isNewRecord;

  const handlePress = () => {
    mediumHaptic();
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isNewRecord
            ? ['#FFD700', '#FFA500', '#FF8C00']
            : isClose
              ? ['#1A2332', '#0D1520']
              : ['#1A2332', '#0D1520']
          }
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, isNewRecord && styles.iconContainerGold]}>
                <Ionicons
                  name={isNewRecord ? "trophy" : "trending-up"}
                  size={20}
                  color={isNewRecord ? Colors.white : Colors.gold}
                />
              </View>
              <View>
                <Text style={[styles.title, isNewRecord && styles.titleGold]}>
                  {isNewRecord ? 'New Record!' : 'Personal Best'}
                </Text>
                <Text style={[styles.subtitle, isNewRecord && styles.subtitleGold]}>
                  {getPersonalBestMessage(bestWeek.progressPercent, bestWeek.amountToBeat)}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.currentLabel, isNewRecord && styles.labelGold]}>This Week</Text>
              <Text style={[styles.bestLabel, isNewRecord && styles.labelGold]}>Your Best</Text>
            </View>

            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  isNewRecord && styles.progressFillGold,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              {/* Best marker */}
              <View style={styles.bestMarker}>
                <View style={[styles.bestMarkerLine, isNewRecord && styles.bestMarkerLineGold]} />
              </View>
            </View>

            <View style={styles.amountRow}>
              <Text style={[styles.currentAmount, isNewRecord && styles.amountGold]}>
                {formatCurrency(bestWeek.current)}
              </Text>
              <Text style={[styles.bestAmount, isNewRecord && styles.amountGold]}>
                {formatCurrency(bestWeek.amount)}
              </Text>
            </View>

            {/* Beat Record CTA - Show when close but not yet beaten */}
            {!isNewRecord && bestWeek.amountToBeat > 0 && (
              <View style={[styles.beatRecordCta, isClose && styles.beatRecordCtaUrgent]}>
                <Text style={styles.beatRecordText}>
                  {isClose ? '🔥 ' : ''}
                  <Text style={styles.beatRecordAmount}>
                    {formatCurrency(bestWeek.amountToBeat)}
                  </Text>
                  {' '}more to beat your record!
                </Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {bestDay && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isNewRecord && styles.labelGold]}>Best Day</Text>
                <Text style={[styles.statValue, isNewRecord && styles.valueGold]}>
                  {formatCurrency(bestDay.amount)}
                </Text>
              </View>
            )}
            {lifetimeTotal && lifetimeTotal > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isNewRecord && styles.labelGold]}>Lifetime</Text>
                <Text style={[styles.statValue, isNewRecord && styles.valueGold]}>
                  {formatCurrency(lifetimeTotal)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    ...Shadows.medium,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerGold: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  titleGold: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subtitleGold: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bestLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  labelGold: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 6,
  },
  progressFillGold: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  bestMarker: {
    position: 'absolute',
    right: 0,
    top: -4,
    bottom: -4,
    width: 3,
    alignItems: 'center',
  },
  bestMarkerLine: {
    width: 3,
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 1.5,
  },
  bestMarkerLineGold: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  bestAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  amountGold: {
    color: Colors.white,
  },
  beatRecordCta: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  beatRecordCtaUrgent: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  beatRecordText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  beatRecordAmount: {
    fontWeight: '700',
    color: Colors.gold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  valueGold: {
    color: Colors.white,
  },
});
