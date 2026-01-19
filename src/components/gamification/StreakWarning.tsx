// Streak Warning Component
// Shows prominent warning when streak is at risk

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../../constants/colors';
import { useGamificationStore } from '../../store/gamificationStore';
import { hasLoggedToday } from '../../services/api/gamification';
import { mediumHaptic } from '../../utils/haptics';

interface StreakWarningProps {
  onLogTip: () => void;
}

export default function StreakWarning({ onLogTip }: StreakWarningProps) {
  const { streak } = useGamificationStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentStreak = streak?.current_streak || 0;
  const loggedToday = hasLoggedToday(streak);

  // Don't show if logged today or no streak to protect
  if (loggedToday || currentStreak === 0) {
    return null;
  }

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.02,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    Animated.loop(pulse).start();

    // Initial shake to grab attention
    const shake = Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]);
    shake.start();
  }, []);

  const handlePress = () => {
    mediumHaptic();
    onLogTip();
  };

  const getUrgencyMessage = () => {
    const now = new Date();
    const hoursUntilMidnight = 24 - now.getHours() - (now.getMinutes() / 60);

    if (hoursUntilMidnight <= 2) {
      return `Only ${Math.ceil(hoursUntilMidnight * 60)} minutes left!`;
    } else if (hoursUntilMidnight <= 6) {
      return `${Math.ceil(hoursUntilMidnight)} hours until midnight!`;
    }
    return "Don't lose your progress!";
  };

  const getStreakMessage = () => {
    if (currentStreak >= 30) {
      return `${currentStreak}-day streak at risk!`;
    } else if (currentStreak >= 7) {
      return `Your ${currentStreak}-day streak is at risk!`;
    }
    return `Protect your ${currentStreak}-day streak!`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: pulseAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={['#F59E0B', '#D97706', '#B45309']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.fireIcon}>🔥</Text>
              <View style={styles.alertBadge}>
                <Ionicons name="alert" size={12} color={Colors.white} />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{getStreakMessage()}</Text>
              <Text style={styles.subtitle}>{getUrgencyMessage()}</Text>
            </View>

            <View style={styles.actionContainer}>
              <View style={styles.actionButton}>
                <Text style={styles.actionText}>Log Tip</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.warning} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  fireIcon: {
    fontSize: 32,
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  actionContainer: {
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
  },
});
