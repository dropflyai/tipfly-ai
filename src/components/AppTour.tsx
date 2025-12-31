import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Shadows } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { mediumHaptic, lightHaptic } from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Step types for different interactions
export type TourStepType =
  | 'info' // Just show info, tap Next to continue
  | 'tap_element' // User must tap the highlighted element
  | 'tap_anywhere'; // Tap anywhere to continue

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: TourStepType;
  // Position of spotlight (relative to screen)
  spotlightPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Where to show the tooltip relative to spotlight
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  // Optional: tab to navigate to when showing this step
  navigateToTab?: string;
  // For tap_element: action to trigger when element is tapped
  action?: string;
  // Custom button text
  buttonText?: string;
}

interface AppTourProps {
  visible: boolean;
  onComplete: () => void;
  steps: TourStep[];
  onNavigateToTab?: (tabName: string) => void;
  onAction?: (action: string) => void;
}

export default function AppTour({
  visible,
  onComplete,
  steps,
  onNavigateToTab,
  onAction
}: AppTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const pointerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start subtle pulse animation for spotlight border
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pointer bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pointerAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pointerAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate tooltip in
      Animated.spring(tooltipAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Navigate to first step's tab if specified
      if (steps[0]?.navigateToTab && onNavigateToTab) {
        onNavigateToTab(steps[0].navigateToTab);
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Reset and animate tooltip when step changes
      tooltipAnim.setValue(0);
      Animated.spring(tooltipAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Navigate to this step's tab if specified
      const step = steps[currentStep];
      if (step?.navigateToTab && onNavigateToTab) {
        onNavigateToTab(step.navigateToTab);
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    mediumHaptic();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    mediumHaptic();
    handleComplete();
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(0);
      onComplete();
    });
  };

  const handleSpotlightTap = () => {
    const step = steps[currentStep];

    if (step.type === 'tap_element') {
      lightHaptic();
      // Trigger the action if specified
      if (step.action && onAction) {
        onAction(step.action);
      }
      // Auto-advance to next step
      setTimeout(() => {
        handleNext();
      }, 300);
    }
  };

  const handleBackdropTap = () => {
    const step = steps[currentStep];
    if (step.type === 'tap_anywhere') {
      handleNext();
    }
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isInteractive = step.type === 'tap_element';

  // Spotlight dimensions with padding
  const spotlightPadding = 8;
  const spotlightBorderRadius = 16;
  const spotlightX = step.spotlightPosition.x - spotlightPadding;
  const spotlightY = step.spotlightPosition.y - spotlightPadding;
  const spotlightWidth = step.spotlightPosition.width + spotlightPadding * 2;
  const spotlightHeight = step.spotlightPosition.height + spotlightPadding * 2;

  // Calculate tooltip position and pointer direction
  const getTooltipStyle = () => {
    const { spotlightPosition, tooltipPosition } = step;

    switch (tooltipPosition) {
      case 'top':
        return {
          bottom: SCREEN_HEIGHT - spotlightPosition.y + 24,
          left: 20,
          right: 20,
        };
      case 'bottom':
        return {
          top: spotlightPosition.y + spotlightPosition.height + 24,
          left: 20,
          right: 20,
        };
      case 'left':
        return {
          top: spotlightPosition.y,
          right: SCREEN_WIDTH - spotlightPosition.x + 24,
          maxWidth: spotlightPosition.x - 48,
        };
      case 'right':
        return {
          top: spotlightPosition.y,
          left: spotlightPosition.x + spotlightPosition.width + 24,
          maxWidth: SCREEN_WIDTH - spotlightPosition.x - spotlightPosition.width - 48,
        };
      default:
        return {
          top: SCREEN_HEIGHT / 2 - 100,
          left: 20,
          right: 20,
        };
    }
  };

  // Get pointer position based on tooltip position
  const getPointerStyle = () => {
    const { spotlightPosition, tooltipPosition } = step;
    const centerX = spotlightPosition.x + spotlightPosition.width / 2;
    const centerY = spotlightPosition.y + spotlightPosition.height / 2;

    const bounceOffset = pointerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    });

    switch (tooltipPosition) {
      case 'top':
        // Pointer at bottom of tooltip, pointing down
        return {
          left: centerX - 12,
          bottom: SCREEN_HEIGHT - spotlightPosition.y + 8,
          transform: [{ translateY: bounceOffset as any }, { rotate: '180deg' }],
        };
      case 'bottom':
        // Pointer at top of tooltip, pointing up
        return {
          left: centerX - 12,
          top: spotlightPosition.y + spotlightPosition.height + 8,
          transform: [{ translateY: Animated.multiply(bounceOffset, -1) as any }],
        };
      case 'left':
        // Pointer on right side, pointing right
        return {
          right: SCREEN_WIDTH - spotlightPosition.x + 8,
          top: centerY - 12,
          transform: [{ translateX: bounceOffset as any }, { rotate: '90deg' }],
        };
      case 'right':
        // Pointer on left side, pointing left
        return {
          left: spotlightPosition.x + spotlightPosition.width + 8,
          top: centerY - 12,
          transform: [{ translateX: Animated.multiply(bounceOffset, -1) as any }, { rotate: '-90deg' }],
        };
      default:
        return { display: 'none' as const };
    }
  };

  // Get button text based on step type
  const getButtonText = () => {
    if (step.buttonText) return step.buttonText;
    if (isLastStep) return "Let's Go!";
    if (step.type === 'tap_element') return 'or tap Next';
    return 'Next';
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Dark overlay pieces around the spotlight (creates cutout effect) */}
        {/* Top section */}
        <TouchableWithoutFeedback onPress={handleBackdropTap}>
          <View style={[styles.overlaySection, {
            top: 0,
            left: 0,
            right: 0,
            height: spotlightY
          }]} />
        </TouchableWithoutFeedback>

        {/* Bottom section */}
        <TouchableWithoutFeedback onPress={handleBackdropTap}>
          <View style={[styles.overlaySection, {
            top: spotlightY + spotlightHeight,
            left: 0,
            right: 0,
            bottom: 0
          }]} />
        </TouchableWithoutFeedback>

        {/* Left section */}
        <TouchableWithoutFeedback onPress={handleBackdropTap}>
          <View style={[styles.overlaySection, {
            top: spotlightY,
            left: 0,
            width: spotlightX,
            height: spotlightHeight
          }]} />
        </TouchableWithoutFeedback>

        {/* Right section */}
        <TouchableWithoutFeedback onPress={handleBackdropTap}>
          <View style={[styles.overlaySection, {
            top: spotlightY,
            left: spotlightX + spotlightWidth,
            right: 0,
            height: spotlightHeight
          }]} />
        </TouchableWithoutFeedback>

        {/* Spotlight border/highlight */}
        <Animated.View
          style={[
            styles.spotlightBorder,
            {
              left: spotlightX,
              top: spotlightY,
              width: spotlightWidth,
              height: spotlightHeight,
              borderRadius: spotlightBorderRadius,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Inner glow effect */}
        <View
          style={[
            styles.spotlightInnerGlow,
            {
              left: spotlightX + 2,
              top: spotlightY + 2,
              width: spotlightWidth - 4,
              height: spotlightHeight - 4,
              borderRadius: spotlightBorderRadius - 2,
            },
          ]}
        />

        {/* Touchable spotlight area for interactive steps */}
        {isInteractive && (
          <TouchableOpacity
            style={[
              styles.spotlightTouchable,
              {
                left: spotlightX,
                top: spotlightY,
                width: spotlightWidth,
                height: spotlightHeight,
                borderRadius: spotlightBorderRadius,
              },
            ]}
            onPress={handleSpotlightTap}
            activeOpacity={0.9}
          />
        )}

        {/* Animated pointer arrow */}
        <Animated.View style={[styles.pointer, getPointerStyle()]}>
          <View style={styles.pointerArrow}>
            <Ionicons name="caret-up" size={24} color={Colors.primary} />
          </View>
        </Animated.View>

        {/* Tooltip */}
        <Animated.View
          style={[
            styles.tooltip,
            getTooltipStyle(),
            {
              opacity: tooltipAnim,
              transform: [
                {
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.tooltipIcon}>
            <Ionicons name={step.icon as any} size={28} color={Colors.primary} />
          </View>

          {/* Content */}
          <Text style={styles.tooltipTitle}>{step.title}</Text>
          <Text style={styles.tooltipDescription}>{step.description}</Text>

          {/* Interactive hint */}
          {isInteractive && (
            <View style={styles.interactiveHint}>
              <Ionicons name="finger-print" size={16} color={Colors.primary} />
              <Text style={styles.interactiveHintText}>
                Tap the highlighted area
              </Text>
            </View>
          )}

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                  index < currentStep && styles.dotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.tooltipActions}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>{getButtonText()}</Text>
              {!isLastStep && (
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    // Add shadow glow effect
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  spotlightInnerGlow: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.3)',
    backgroundColor: 'transparent',
  },
  spotlightTouchable: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pointer: {
    position: 'absolute',
    zIndex: 1001,
  },
  pointerArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Add glow to pointer
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.large,
  },
  tooltipIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  interactiveHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  interactiveHintText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  progressDots: {
    flexDirection: 'row',
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
    backgroundColor: Colors.primary,
    width: 20,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
  },
  tooltipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
