import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { successHaptic, mediumHaptic } from '../../utils/haptics';

interface SuccessScreenProps {
  onFinish: () => void;
  hasAddedTip: boolean;
}

export default function SuccessScreen({ onFinish, hasAddedTip }: SuccessScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Success animation
    successHaptic();

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFinish = () => {
    mediumHaptic();
    onFinish();
  };

  return (
    <LinearGradient
      colors={GradientColors.success}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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
          <Text style={styles.title}>
            {hasAddedTip ? "You're All Set!" : "Welcome Aboard!"}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {hasAddedTip
              ? "Great job! You've added your first tip entry. Now let's explore your dashboard."
              : "You can start tracking your tips anytime from the Add Tip tab."}
          </Text>

          {/* Features to explore */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                View your earnings on the Dashboard
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Check detailed stats and trends
              </Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Set goals and track your progress
              </Text>
            </View>

            {hasAddedTip && (
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>
                  Pull down to refresh your data anytime
                </Text>
              </View>
            )}
          </View>

          {/* Pro tip */}
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color={Colors.white} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                Track your tips daily for the most accurate insights and better tax planning!
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
          <Ionicons name="arrow-forward" size={20} color={Colors.success} />
        </TouchableOpacity>
      </View>
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
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.white,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  featuresList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    width: '100%',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.95,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 32,
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
    gap: 8,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
});
