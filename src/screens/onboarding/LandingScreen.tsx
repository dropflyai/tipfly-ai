import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { mediumHaptic } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onSignUp, onLogin }: LandingScreenProps) {
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const predictionSlideAnim = useRef(new Animated.Value(20)).current;
  const predictionFadeAnim = useRef(new Animated.Value(0)).current;
  const amountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate prediction card after initial fade
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(predictionSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(predictionFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate the amount counting up
      Animated.timing(amountAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }, 400);

    // Continuous pulse for AI brain icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleSignUp = () => {
    mediumHaptic();
    onSignUp();
  };

  const handleLogin = () => {
    mediumHaptic();
    onLogin();
  };

  // Interpolate amount for counting animation
  const displayAmount = amountAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 142],
  });

  return (
    <LinearGradient
      colors={['#0A0F1A', '#1A2332', '#0A0F1A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingTop: insets.top + 24,
            paddingBottom: Math.max(insets.bottom, 20) + 12,
          },
        ]}
      >
        {/* Top spacer - pushes content down slightly */}
        <View style={{ flex: 1 }} />

        {/* AI Prediction Card Visual */}
        <Animated.View
          style={[
            styles.predictionCard,
            {
              opacity: predictionFadeAnim,
              transform: [{ translateY: predictionSlideAnim }],
            },
          ]}
        >
          <View style={styles.predictionHeader}>
            <Animated.View
              style={[
                styles.aiIconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name="sparkles" size={24} color={Colors.gold} />
            </Animated.View>
            <View>
              <Text style={styles.predictionLabel}>AI Prediction</Text>
              <Text style={styles.predictionDay}>Friday Dinner</Text>
            </View>
          </View>
          <View style={styles.predictionAmount}>
            <Text style={styles.predictionDollar}>$</Text>
            <Animated.Text style={styles.predictionValue}>
              {displayAmount.interpolate({
                inputRange: [0, 142],
                outputRange: ['0', '142'],
              })}
            </Animated.Text>
          </View>
          <View style={styles.predictionMeta}>
            <View style={styles.confidenceBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.confidenceText}>87% confidence</Text>
            </View>
            <Text style={styles.predictionRange}>$120 - $165 range</Text>
          </View>
        </Animated.View>

        {/* Main Headline */}
        <Text style={styles.headline}>Know Your Best Shifts</Text>
        <Text style={styles.headlineAccent}>Before You Work Them</Text>

        {/* Subheadline */}
        <Text style={styles.subheadline}>
          AI predicts your earnings so you can plan your schedule and budget with confidence.
        </Text>

        {/* Quick Value Props */}
        <View style={styles.valueProps}>
          <View style={styles.valueProp}>
            <View style={[styles.checkCircle, styles.checkCircleGold]}>
              <Ionicons name="sparkles" size={12} color={Colors.background} />
            </View>
            <Text style={styles.valuePropText}>AI predicts your best days</Text>
          </View>
          <View style={styles.valueProp}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color={Colors.background} />
            </View>
            <Text style={styles.valuePropText}>See your real hourly rate</Text>
          </View>
          <View style={styles.valueProp}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color={Colors.background} />
            </View>
            <Text style={styles.valuePropText}>Tax-ready yearly records</Text>
          </View>
        </View>

        {/* Bottom spacer - larger to give more space before buttons */}
        <View style={{ flex: 1.5 }} />

        {/* CTA Buttons - now inside content */}
        <View style={styles.buttonContainer}>
          {/* Primary CTA - Sign Up */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignUp}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary CTA - Login */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Free to use. No credit card required.
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // AI Prediction Card
  predictionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...Shadows.glowGoldSubtle,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  predictionDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  predictionAmount: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 16,
  },
  predictionDollar: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  predictionValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  predictionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  predictionRange: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  headlineAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  valueProps: {
    gap: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleGold: {
    backgroundColor: Colors.gold,
  },
  valuePropText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    ...Shadows.buttonBlue,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 16,
  },
});
