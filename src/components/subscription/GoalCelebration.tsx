// Goal completion celebration with upsell prompt
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
import { formatCurrency } from '../../utils/formatting';
import { successHaptic, mediumHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoalCelebrationProps {
  visible: boolean;
  goalType: 'daily' | 'weekly' | 'monthly' | 'custom';
  goalAmount: number;
  actualAmount: number;
  isPremium: boolean;
  onContinue: () => void;
  onUpgrade: () => void;
}

// Confetti particle component
function ConfettiParticle({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const colors = [Colors.gold, Colors.success, Colors.primary, '#FF6B6B', '#A855F7'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const duration = 2000 + Math.random() * 1000;
    const xDrift = (Math.random() - 0.5) * 100;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
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
        toValue: 360 * (2 + Math.random() * 2),
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
            {
              rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
    />
  );
}

export default function GoalCelebration({
  visible,
  goalType,
  goalAmount,
  actualAmount,
  isPremium,
  onContinue,
  onUpgrade,
}: GoalCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;

  const exceededBy = actualAmount - goalAmount;
  const exceededPercent = Math.round((exceededBy / goalAmount) * 100);

  useEffect(() => {
    if (visible) {
      successHaptic();

      // Trophy entrance
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
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

      // Trophy bounce loop
      const bounce = Animated.sequence([
        Animated.timing(trophyBounce, {
          toValue: -10,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(trophyBounce, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      setTimeout(() => {
        Animated.loop(bounce).start();
      }, 500);
    }
  }, [visible]);

  const goalTypeLabel = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom',
  }[goalType];

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 30 }).map((_, i) => (
    <ConfettiParticle
      key={i}
      delay={i * 50}
      startX={Math.random() * SCREEN_WIDTH}
    />
  ));

  const handleContinue = () => {
    mediumHaptic();
    onContinue();
  };

  const handleUpgrade = () => {
    successHaptic();
    onUpgrade();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleContinue}
    >
      <BlurView intensity={40} tint="dark" style={styles.backdrop}>
        {/* Confetti */}
        <View style={styles.confettiContainer}>
          {confettiParticles}
        </View>

        <View style={styles.content}>
          {/* Trophy */}
          <Animated.View
            style={[
              styles.trophyContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: trophyBounce },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.trophyGradient}
            >
              <Ionicons name="trophy" size={56} color={Colors.white} />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Goal Crushed!</Text>
          <Text style={styles.goalLabel}>{goalTypeLabel} Goal</Text>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>You earned</Text>
            <Text style={styles.amountValue}>{formatCurrency(actualAmount)}</Text>
            {exceededBy > 0 && (
              <View style={styles.exceededBadge}>
                <Ionicons name="trending-up" size={14} color={Colors.success} />
                <Text style={styles.exceededText}>
                  +{formatCurrency(exceededBy)} ({exceededPercent}% over goal!)
                </Text>
              </View>
            )}
          </View>

          {/* Premium Upsell for Free Users */}
          {!isPremium && (
            <View style={styles.upsellContainer}>
              <Text style={styles.upsellText}>
                Set unlimited goals with AI coaching to keep crushing it!
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
                  <Ionicons name="sparkles" size={18} color={Colors.white} />
                  <Text style={styles.upgradeText}>Unlock Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>
              {isPremium ? 'Set New Goal' : 'Continue'}
            </Text>
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
  trophyContainer: {
    marginBottom: 24,
  },
  trophyGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.buttonGold,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: -1,
  },
  exceededBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  exceededText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
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
    paddingVertical: 14,
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
