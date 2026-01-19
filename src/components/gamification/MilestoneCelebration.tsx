// Milestone Celebration Modal
// Celebrates tip count milestones: 10, 25, 50, 100, 250, 500, 1000

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { successHaptic, mediumHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type MilestoneType = 10 | 25 | 50 | 100 | 250 | 500 | 1000;

interface MilestoneCelebrationProps {
  visible: boolean;
  milestone: MilestoneType;
  isPremium: boolean;
  onContinue: () => void;
  onUpgrade?: () => void;
}

const milestoneData: Record<MilestoneType, {
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  color: string;
}> = {
  10: {
    title: 'Getting Started!',
    subtitle: 'You logged your 10th tip!',
    icon: '🌱',
    badge: 'Tracking Started',
    color: Colors.success,
  },
  25: {
    title: 'Building Momentum!',
    subtitle: '25 tips and counting!',
    icon: '📈',
    badge: 'Regular Logger',
    color: Colors.primary,
  },
  50: {
    title: 'Halfway to 100!',
    subtitle: '50 tips logged - amazing!',
    icon: '🔥',
    badge: 'Dedicated Tracker',
    color: Colors.warning,
  },
  100: {
    title: 'Century Club!',
    subtitle: '100 tips! You\'re a pro!',
    icon: '💯',
    badge: 'Century Member',
    color: Colors.gold,
  },
  250: {
    title: 'Power User!',
    subtitle: '250 tips - incredible dedication!',
    icon: '⚡',
    badge: 'Power Tracker',
    color: '#A855F7',
  },
  500: {
    title: 'Elite Status!',
    subtitle: '500 tips - you\'re in the top 1%!',
    icon: '👑',
    badge: 'Elite Member',
    color: '#EC4899',
  },
  1000: {
    title: 'LEGENDARY!',
    subtitle: '1,000 tips! Absolute legend!',
    icon: '🏆',
    badge: 'TipFly Legend',
    color: Colors.gold,
  },
};

// Confetti particle
function ConfettiParticle({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const colors = [Colors.gold, Colors.success, Colors.primary, '#FF6B6B', '#A855F7', '#EC4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const duration = 2500 + Math.random() * 1000;
    const xDrift = (Math.random() - 0.5) * 120;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 500,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: xDrift,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 360 * (2 + Math.random() * 3),
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        delay: delay + duration * 0.7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
          ],
          opacity,
        },
      ]}
    />
  );
}

export default function MilestoneCelebration({
  visible,
  milestone,
  isPremium,
  onContinue,
  onUpgrade,
}: MilestoneCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  const data = milestoneData[milestone];

  useEffect(() => {
    if (visible) {
      successHaptic();

      // Icon entrance with bounce
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Badge pop-in after icon
      setTimeout(() => {
        Animated.spring(badgeScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 300);

      // Continuous icon bounce
      const bounce = Animated.sequence([
        Animated.timing(iconBounce, {
          toValue: -8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(iconBounce, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      setTimeout(() => {
        Animated.loop(bounce).start();
      }, 600);
    }
  }, [visible]);

  const handleContinue = () => {
    mediumHaptic();
    onContinue();
  };

  const handleUpgrade = () => {
    successHaptic();
    onUpgrade?.();
  };

  // Generate confetti
  const confettiParticles = Array.from({ length: 40 }).map((_, i) => (
    <ConfettiParticle
      key={i}
      delay={i * 40}
      startX={Math.random() * SCREEN_WIDTH}
    />
  ));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleContinue}
    >
      <BlurView intensity={50} tint="dark" style={styles.backdrop}>
        {/* Confetti */}
        <View style={styles.confettiContainer}>
          {confettiParticles}
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: iconBounce },
                ],
                borderColor: data.color,
              },
            ]}
          >
            <Text style={styles.icon}>{data.icon}</Text>
          </Animated.View>

          {/* Milestone number */}
          <View style={styles.milestoneNumber}>
            <Text style={[styles.number, { color: data.color }]}>{milestone}</Text>
            <Text style={styles.numberLabel}>TIPS</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>

          {/* Badge earned */}
          <Animated.View
            style={[
              styles.badgeContainer,
              { transform: [{ scale: badgeScale }] },
            ]}
          >
            <LinearGradient
              colors={[data.color, `${data.color}99`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Ionicons name="ribbon" size={16} color={Colors.white} />
              <Text style={styles.badgeText}>{data.badge}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Premium upsell for free users at major milestones */}
          {!isPremium && milestone >= 25 && (
            <View style={styles.upsellContainer}>
              <Text style={styles.upsellText}>
                {milestone >= 100
                  ? 'You\'re a power user! Unlock AI insights to earn even more.'
                  : 'Track your progress with AI predictions and goals.'}
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={GradientColors.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeGradient}
                >
                  <Ionicons name="sparkles" size={16} color={Colors.white} />
                  <Text style={styles.upgradeText}>Unlock Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Continue button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Keep Going!</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...Shadows.medium,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  milestoneNumber: {
    alignItems: 'center',
    marginBottom: 12,
  },
  number: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  numberLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: -4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    marginBottom: 20,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  upsellContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  upsellText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.buttonGold,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  upgradeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
