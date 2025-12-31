import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { successHaptic, mediumHaptic } from '../../utils/haptics';
import OnboardingProgress from '../../components/OnboardingProgress';

interface SuccessScreenProps {
  onFinish: () => void;
}

export default function SuccessScreen({ onFinish }: SuccessScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef([...Array(6)].map(() => ({
    y: new Animated.Value(-50),
    x: new Animated.Value(0),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    successHaptic();

    // Main success animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    confettiAnims.forEach((anim, index) => {
      const delay = index * 100;
      const xOffset = (Math.random() - 0.5) * 200;

      Animated.parallel([
        Animated.timing(anim.y, {
          toValue: 400,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.x, {
          toValue: xOffset,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 2000,
          delay: delay + 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handleFinish = () => {
    mediumHaptic();
    onFinish();
  };

  const confettiEmojis = ['🎉', '✨', '🌟', '💰', '🎊', '⭐'];
  const confettiPositions = [20, 60, 100, 200, 260, 320];

  return (
    <LinearGradient
      colors={GradientColors.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <OnboardingProgress currentStep={3} totalSteps={3} />
      </View>

      {/* Confetti */}
      {confettiAnims.map((anim, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.confetti,
            {
              left: confettiPositions[index],
              transform: [
                { translateY: anim.y },
                { translateX: anim.x },
                {
                  rotate: anim.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: anim.opacity,
            },
          ]}
        >
          {confettiEmojis[index]}
        </Animated.Text>
      ))}

      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={80} color={Colors.white} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContent,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Title */}
          <Text style={styles.title}>You're All Set!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Your first tip is logged. You're on your way to mastering your money!
          </Text>

          {/* Features to explore */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="analytics-outline" size={20} color={Colors.white} />
              <Text style={styles.featureText}>
                Track your daily earnings
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="sparkles-outline" size={20} color={Colors.white} />
              <Text style={styles.featureText}>
                Get AI-powered predictions
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="trophy-outline" size={20} color={Colors.white} />
              <Text style={styles.featureText}>
                Set and crush your goals
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="calculator-outline" size={20} color={Colors.white} />
              <Text style={styles.featureText}>
                Stay tax-ready year round
              </Text>
            </View>
          </View>

          {/* Pro tip */}
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color={Colors.white} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                Log your tips right after each shift for the most accurate tracking!
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Finish Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
          activeOpacity={0.9}
        >
          <Text style={styles.finishButtonText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: 60,
  },
  confetti: {
    position: 'absolute',
    top: 100,
    fontSize: 32,
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.white,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  featuresList: {
    width: '100%',
    gap: 14,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
    flex: 1,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  finishButton: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    ...Shadows.large,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
});
