// Smart upgrade triggers shown at high-intent moments
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { mediumHaptic, successHaptic } from '../../utils/haptics';

type TriggerType =
  | 'export_limit'      // When trying to export without premium
  | 'history_limit'     // When scrolling past 30-day history
  | 'tip_milestone'     // After logging 10+ tips
  | 'goal_achieved'     // When a goal is completed
  | 'weekly_summary'    // End of week summary
  | 'first_month';      // After first month of tracking

interface SmartUpgradeTriggerProps {
  visible: boolean;
  triggerType: TriggerType;
  onUpgrade: () => void;
  onDismiss: () => void;
  // Context data for personalization
  context?: {
    totalTips?: number;
    weeklyEarnings?: number;
    goalAmount?: number;
    tipCount?: number;
    savingsEstimate?: number;
  };
}

const triggerContent: Record<TriggerType, {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  getMessage: (ctx?: SmartUpgradeTriggerProps['context']) => string;
  cta: string;
  benefit: string;
}> = {
  export_limit: {
    icon: 'download-outline',
    iconColor: Colors.primary,
    title: 'Export Your Tip Data',
    getMessage: (ctx) => ctx?.savingsEstimate
      ? `Your ${formatCurrency(ctx.savingsEstimate)} in potential deductions is ready to export for tax season.`
      : 'Get your complete tip history as a CSV or PDF for tax filing and record keeping.',
    cta: 'Unlock Exports',
    benefit: 'Unlimited exports + tax reports included',
  },
  history_limit: {
    icon: 'time-outline',
    iconColor: Colors.gold,
    title: "There's More History",
    getMessage: (ctx) => ctx?.totalTips
      ? `You have ${formatCurrency(ctx.totalTips)} in tips beyond this view. Unlock your full earning history.`
      : 'View your complete tip history and track patterns over time.',
    cta: 'See Full History',
    benefit: 'Unlimited history + trend analysis',
  },
  tip_milestone: {
    icon: 'trophy-outline',
    iconColor: Colors.gold,
    title: 'You\'re on a Roll!',
    getMessage: (ctx) => ctx?.tipCount
      ? `${ctx.tipCount} tips logged! You're building great tracking habits. Ready to level up?`
      : 'You\'re building great tracking habits! Ready to unlock more features?',
    cta: 'Level Up Now',
    benefit: 'AI predictions + goal tracking',
  },
  goal_achieved: {
    icon: 'checkmark-circle',
    iconColor: Colors.success,
    title: 'Goal Crushed!',
    getMessage: (ctx) => ctx?.goalAmount
      ? `You hit ${formatCurrency(ctx.goalAmount)}! Set bigger goals with unlimited tracking.`
      : 'Amazing work hitting your goal! Set unlimited goals to keep pushing.',
    cta: 'Set New Goals',
    benefit: 'Unlimited goals + AI coaching',
  },
  weekly_summary: {
    icon: 'bar-chart-outline',
    iconColor: Colors.primary,
    title: 'Great Week!',
    getMessage: (ctx) => ctx?.weeklyEarnings
      ? `You earned ${formatCurrency(ctx.weeklyEarnings)} this week. Want AI insights on how to earn even more?`
      : 'See detailed breakdowns and AI-powered suggestions to maximize your earnings.',
    cta: 'Get AI Insights',
    benefit: 'Personalized earning strategies',
  },
  first_month: {
    icon: 'calendar-outline',
    iconColor: Colors.primary,
    title: '1 Month of Tracking!',
    getMessage: (ctx) => ctx?.totalTips
      ? `You've tracked ${formatCurrency(ctx.totalTips)} in your first month! Keep the momentum with Premium.`
      : 'You\'ve been tracking for a month! Unlock advanced features to maximize your earnings.',
    cta: 'Go Premium',
    benefit: '7-day free trial included',
  },
};

export default function SmartUpgradeTrigger({
  visible,
  triggerType,
  onUpgrade,
  onDismiss,
  context,
}: SmartUpgradeTriggerProps) {
  const content = triggerContent[triggerType];

  const handleUpgrade = () => {
    successHaptic();
    onUpgrade();
  };

  const handleDismiss = () => {
    mediumHaptic();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <BlurView intensity={30} tint="dark" style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleDismiss}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <LinearGradient
              colors={['#1A2332', '#0D1520']}
              style={styles.modal}
            >
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${content.iconColor}20` }]}>
                <Ionicons name={content.icon} size={32} color={content.iconColor} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{content.title}</Text>

              {/* Message */}
              <Text style={styles.message}>{content.getMessage(context)}</Text>

              {/* Benefit highlight */}
              <View style={styles.benefitContainer}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.benefitText}>{content.benefit}</Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleUpgrade}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={GradientColors.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{content.cta}</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Maybe later */}
              <TouchableOpacity style={styles.laterButton} onPress={handleDismiss}>
                <Text style={styles.laterText}>Maybe later</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  modal: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    ...Shadows.medium,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    ...Shadows.buttonGold,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  laterButton: {
    paddingVertical: 8,
  },
  laterText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
