import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { mediumHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface WelcomeStepProps {
  onNext: () => void;
}

const VALUE_PROPS = [
  {
    icon: 'analytics-outline',
    title: 'Track Every Tip',
    description: 'Log tips in seconds with smart input',
    color: Colors.primary,
  },
  {
    icon: 'sparkles-outline',
    title: 'AI Predictions',
    description: 'Know what you\'ll earn before your shift',
    color: Colors.gold,
  },
  {
    icon: 'calculator-outline',
    title: 'Tax Ready',
    description: 'Automatic tracking for tax season',
    color: Colors.success,
  },
];

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardAnims = useRef(VALUE_PROPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Logo animation
    Animated.spring(logoScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Fade in main content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Slide up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Stagger card animations
    const cardAnimations = cardAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 150,
        useNativeDriver: true,
      })
    );
    Animated.stagger(150, cardAnimations).start();
  }, []);

  const handleGetStarted = () => {
    mediumHaptic();
    onNext();
  };

  return (
    <LinearGradient
      colors={GradientColors.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientColors.primary}
            style={styles.logoGradient}
          >
            <Ionicons name="cash-outline" size={48} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>TipFly AI</Text>
          <Text style={styles.tagline}>
            Track Your Tips, Master Your Money
          </Text>
        </Animated.View>

        {/* Value Props */}
        <View style={styles.valuePropContainer}>
          {VALUE_PROPS.map((prop, index) => (
            <Animated.View
              key={index}
              style={[
                styles.valueCard,
                {
                  opacity: cardAnims[index],
                  transform: [
                    {
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${prop.color}20` }]}>
                <Ionicons name={prop.icon as any} size={28} color={prop.color} />
              </View>
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>{prop.title}</Text>
                <Text style={styles.valueDescription}>{prop.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* CTA Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={GradientColors.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Let's Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowBlue,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  valuePropContainer: {
    width: '100%',
    gap: 16,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.buttonBlue,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});
