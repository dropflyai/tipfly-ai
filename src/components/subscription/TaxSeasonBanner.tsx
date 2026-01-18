// Tax season promotional banner (shows Jan-Apr)
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { mediumHaptic } from '../../utils/haptics';

interface TaxSeasonBannerProps {
  estimatedSavings?: number; // Calculated from user's tips
  totalTips?: number; // Total tips for the year
  onPress: () => void;
  onDismiss?: () => void;
}

export default function TaxSeasonBanner({
  estimatedSavings = 0,
  totalTips = 0,
  onPress,
  onDismiss,
}: TaxSeasonBannerProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Check if it's tax season (January - April)
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isTaxSeason = month >= 0 && month <= 3;

  // Calculate estimated savings (roughly 15-25% of tips can be deductions)
  const calculatedSavings = estimatedSavings || Math.round(totalTips * 0.18);

  useEffect(() => {
    if (!isTaxSeason) return;

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Attention bounce
    const bounce = Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    // Bounce every 5 seconds
    const interval = setInterval(() => {
      bounce.start();
    }, 5000);

    return () => clearInterval(interval);
  }, [isTaxSeason]);

  if (!isTaxSeason) return null;

  const daysUntilDeadline = Math.ceil(
    (new Date(now.getFullYear(), 3, 15).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const handlePress = () => {
    mediumHaptic();
    onPress();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: bounceAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <LinearGradient
          colors={['#1A5F2E', '#0D4420', '#082E14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Dismiss button */}
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="receipt" size={24} color={Colors.success} />
            </View>

            <View style={styles.textContent}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Tax Season is Here</Text>
                <View style={styles.urgencyBadge}>
                  <Ionicons name="time" size={12} color={Colors.white} />
                  <Text style={styles.urgencyText}>{daysUntilDeadline} days left</Text>
                </View>
              </View>

              {calculatedSavings > 0 ? (
                <Text style={styles.subtitle}>
                  Get your {formatCurrency(calculatedSavings)} in potential deductions
                </Text>
              ) : (
                <Text style={styles.subtitle}>
                  Track deductions & export reports for easy filing
                </Text>
              )}
            </View>

            <Ionicons name="chevron-forward" size={20} color={Colors.success} />
          </View>

          {/* Bottom highlight */}
          <View style={styles.highlight}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.highlightText}>Free for Premium members</Text>
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
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    ...Shadows.medium,
  },
  gradient: {
    padding: 16,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  highlightText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
});
