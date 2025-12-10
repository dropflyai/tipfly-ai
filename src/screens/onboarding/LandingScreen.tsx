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
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { mediumHaptic } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onSignUp, onLogin }: LandingScreenProps) {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const graphAnim = useRef(new Animated.Value(0)).current;
  const bar1Anim = useRef(new Animated.Value(0)).current;
  const bar2Anim = useRef(new Animated.Value(0)).current;
  const bar3Anim = useRef(new Animated.Value(0)).current;
  const bar4Anim = useRef(new Animated.Value(0)).current;

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

    // Animate graph bars sequentially
    Animated.stagger(150, [
      Animated.spring(bar1Anim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(bar2Anim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(bar3Anim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(bar4Anim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignUp = () => {
    mediumHaptic();
    onSignUp();
  };

  const handleLogin = () => {
    mediumHaptic();
    onLogin();
  };

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
          },
        ]}
      >
        {/* Animated Graph Visual */}
        <View style={styles.graphContainer}>
          <View style={styles.graphBars}>
            <Animated.View
              style={[
                styles.graphBar,
                styles.bar1,
                { transform: [{ scaleY: bar1Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.graphBar,
                styles.bar2,
                { transform: [{ scaleY: bar2Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.graphBar,
                styles.bar3,
                { transform: [{ scaleY: bar3Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.graphBar,
                styles.bar4,
                { transform: [{ scaleY: bar4Anim }] }
              ]}
            />
          </View>
          <View style={styles.trendLine}>
            <Ionicons name="trending-up" size={32} color={Colors.primary} />
          </View>
        </View>

        {/* Main Headline */}
        <Text style={styles.headline}>Stop guessing.</Text>
        <Text style={styles.headlineAccent}>Start tracking.</Text>

        {/* Subheadline */}
        <Text style={styles.subheadline}>
          Know exactly what you earn. Predict your income. Earn more.
        </Text>

        {/* Quick Value Props */}
        <View style={styles.valueProps}>
          <View style={styles.valueProp}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color={Colors.background} />
            </View>
            <Text style={styles.valuePropText}>AI-powered predictions</Text>
          </View>
          <View style={styles.valueProp}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color={Colors.background} />
            </View>
            <Text style={styles.valuePropText}>Track tips in seconds</Text>
          </View>
          <View style={styles.valueProp}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={14} color={Colors.background} />
            </View>
            <Text style={styles.valuePropText}>Team tip pooling</Text>
          </View>
        </View>
      </Animated.View>

      {/* CTA Buttons */}
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
      <Text style={styles.footer}>Free to use. No credit card required.</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  graphContainer: {
    width: 200,
    height: 120,
    marginBottom: 40,
    position: 'relative',
  },
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 100,
    gap: 12,
  },
  graphBar: {
    width: 36,
    borderRadius: 8,
    transformOrigin: 'bottom',
  },
  bar1: {
    height: 40,
    backgroundColor: 'rgba(0, 168, 232, 0.3)',
  },
  bar2: {
    height: 55,
    backgroundColor: 'rgba(0, 168, 232, 0.5)',
  },
  bar3: {
    height: 70,
    backgroundColor: 'rgba(0, 168, 232, 0.7)',
  },
  bar4: {
    height: 95,
    backgroundColor: Colors.primary,
    ...Shadows.glowBlueSubtle,
  },
  trendLine: {
    position: 'absolute',
    top: 0,
    right: 20,
  },
  headline: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  headlineAccent: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 20,
  },
  subheadline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  valueProps: {
    gap: 12,
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
  valuePropText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
    paddingBottom: 40,
  },
});
