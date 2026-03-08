import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { TAX_FREE_TIP_THRESHOLD } from '../../services/api/tax';
import { lightHaptic } from '../../utils/haptics';

interface DeductionTrackerCardProps {
  netTipEarnings: number;
  taxFreeTips: number;
  thresholdProgress: number;
  isOverThreshold: boolean;
  isPremium: boolean;
}

export default function DeductionTrackerCard({
  netTipEarnings,
  taxFreeTips,
  thresholdProgress,
  isOverThreshold,
  isPremium,
}: DeductionTrackerCardProps) {
  const navigation = useNavigation();

  // Estimated federal tax savings (~22% marginal rate on deducted tips)
  const estimatedSavings = Math.round(taxFreeTips * 0.22);
  const remaining = Math.max(0, TAX_FREE_TIP_THRESHOLD - netTipEarnings);
  const progressPercent = Math.min(100, thresholdProgress);

  const handlePress = () => {
    lightHaptic();
    if (isPremium) {
      navigation.navigate('TaxTracking' as never);
    } else {
      navigation.navigate('Upgrade' as never);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          </View>
          <View>
            <Text style={styles.title}>No Tax on Tips Deduction</Text>
            <Text style={styles.subtitle}>2025-2028 Federal Tax Benefit</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressAmount}>
            {formatCurrency(taxFreeTips)}
          </Text>
          <Text style={styles.progressTotal}>
            / {formatCurrency(TAX_FREE_TIP_THRESHOLD)}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                isOverThreshold && styles.progressBarFillOver,
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>{progressPercent.toFixed(0)}%</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Tax Savings</Text>
          <Text style={[styles.statValue, styles.statValueGreen]}>
            ~{formatCurrency(estimatedSavings)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.statValue}>
            {formatCurrency(remaining)}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaRow}>
        <Ionicons
          name={isPremium ? 'document-text' : 'lock-closed'}
          size={14}
          color={isPremium ? Colors.success : Colors.primary}
        />
        <Text style={[styles.ctaText, { color: isPremium ? Colors.success : Colors.primary }]}>
          {isPremium ? 'View full tax report' : 'Export proof for tax filing'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
    ...Shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.gray400,
    marginTop: 1,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.success,
  },
  progressTotal: {
    fontSize: 14,
    color: Colors.gray400,
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressBarFillOver: {
    backgroundColor: Colors.warning,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray400,
    minWidth: 36,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray400,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  statValueGreen: {
    color: Colors.success,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
