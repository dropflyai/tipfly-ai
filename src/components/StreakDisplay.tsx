// Streak Display Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useGamificationStore } from '../store/gamificationStore';
import { hasLoggedToday, getStreakStatusMessage } from '../services/api/gamification';
import { lightHaptic } from '../utils/haptics';

interface StreakDisplayProps {
  compact?: boolean;
  inline?: boolean; // For quick stats row - just value and label
  onPress?: () => void;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  compact = false,
  inline = false,
  onPress,
}) => {
  const navigation = useNavigation();
  const { streak } = useGamificationStore();

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const loggedToday = hasLoggedToday(streak);

  const handlePress = () => {
    lightHaptic();
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Achievements' as never);
    }
  };

  // Inline display for quick stats (just value + label)
  if (inline) {
    return (
      <>
        <Text style={styles.inlineValue}>
          {currentStreak} 🔥
        </Text>
        <Text style={styles.inlineLabel}>Streak</Text>
      </>
    );
  }

  // Compact inline display (for headers)
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.fireIcon}>🔥</Text>
        <Text style={styles.compactCount}>{currentStreak}</Text>
        {loggedToday && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color={Colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Full card display
  return (
    <TouchableOpacity
      style={[styles.card, !loggedToday && styles.cardWarning]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Streak Counter */}
      <View style={styles.streakSection}>
        <View style={styles.streakCircle}>
          <Text style={styles.fireIconLarge}>🔥</Text>
          <Text style={styles.streakCount}>{currentStreak}</Text>
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.streakStatus}>
            {getStreakStatusMessage(streak)}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streak?.total_tips_logged || 0}</Text>
          <Text style={styles.statLabel}>Total Tips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          {loggedToday ? (
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          ) : (
            <Ionicons name="alert-circle" size={24} color={Colors.warning} />
          )}
          <Text style={styles.statLabel}>
            {loggedToday ? 'Logged Today' : 'Log Today!'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Small streak badge for nav bar
export const StreakBadge: React.FC = () => {
  const { streak } = useGamificationStore();
  const currentStreak = streak?.current_streak || 0;

  if (currentStreak === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeIcon}>🔥</Text>
      <Text style={styles.badgeCount}>{currentStreak}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Inline styles (for quick stats)
  inlineValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  inlineLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  fireIcon: {
    fontSize: 14,
  },
  compactCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
  },
  checkBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  // Full card styles
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
    padding: 16,
  },
  cardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fireIconLarge: {
    fontSize: 20,
    position: 'absolute',
    top: 8,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.warning,
    marginTop: 8,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  streakStatus: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
  },
});

export default StreakDisplay;
