// Locked insight teaser that shows blurred real data to entice upgrades
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { mediumHaptic } from '../../utils/haptics';

interface LockedInsightTeaserProps {
  // Calculated from actual user data
  predictedEarnings?: [number, number]; // [min, max]
  potentialSavings?: number; // Tax savings estimate
  missedTips?: number; // Tips missed by not tracking
  bestDayPotential?: number; // Potential earnings on best day
  onUnlock: () => void;
}

export default function LockedInsightTeaser({
  predictedEarnings = [85, 142],
  potentialSavings = 847,
  bestDayPotential = 215,
  onUnlock,
}: LockedInsightTeaserProps) {
  const [currentInsight, setCurrentInsight] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Rotate through insights
  const insights = [
    {
      icon: 'flash' as const,
      label: 'Next Shift Prediction',
      value: `${formatCurrency(predictedEarnings[0])} - ${formatCurrency(predictedEarnings[1])}`,
      subtext: 'Based on your patterns',
      color: Colors.primary,
    },
    {
      icon: 'receipt' as const,
      label: 'Estimated Tax Savings',
      value: formatCurrency(potentialSavings),
      subtext: 'This year with deductions',
      color: Colors.success,
    },
    {
      icon: 'trending-up' as const,
      label: 'Best Day Potential',
      value: formatCurrency(bestDayPotential),
      subtext: 'Your top-earning day',
      color: Colors.gold,
    },
  ];

  useEffect(() => {
    // Pulse animation to draw attention
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.02,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);
    Animated.loop(pulse).start();

    // Rotate insights every 4 seconds
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCurrentInsight((prev) => (prev + 1) % insights.length);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const insight = insights[currentInsight];

  const handlePress = () => {
    mediumHaptic();
    onUnlock();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#1A2332', '#0D1520']}
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.gold}20` }]}>
                <Ionicons name="sparkles" size={18} color={Colors.gold} />
              </View>
              <Text style={styles.headerTitle}>AI Insights</Text>
            </View>
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.gold} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          </View>

          {/* Blurred Insight Preview */}
          <View style={styles.previewContainer}>
            {/* Actual content (blurred) */}
            <Animated.View style={[styles.insightContent, { opacity: fadeAnim }]}>
              <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                <Ionicons name={insight.icon} size={24} color={insight.color} />
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightLabel}>{insight.label}</Text>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <Text style={styles.insightSubtext}>{insight.subtext}</Text>
              </View>
            </Animated.View>

            {/* Blur overlay */}
            <BlurView intensity={20} tint="dark" style={styles.blurOverlay} />

            {/* Lock overlay */}
            <View style={styles.lockOverlay}>
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={20} color={Colors.white} />
              </View>
            </View>
          </View>

          {/* Dots indicator */}
          <View style={styles.dotsContainer}>
            {insights.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentInsight && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handlePress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={GradientColors.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Unlock AI Insights</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Social proof */}
          <Text style={styles.socialProof}>
            Join 2,400+ workers earning more with AI
          </Text>
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
    ...Shadows.buttonGold,
  },
  card: {
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
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
  },
  previewContainer: {
    position: 'relative',
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 12,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  insightIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  insightSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 20,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  socialProof: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
