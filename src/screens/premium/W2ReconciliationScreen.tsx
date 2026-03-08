import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { getTaxSummary, TAX_FREE_TIP_THRESHOLD } from '../../services/api/tax';
import { lightHaptic } from '../../utils/haptics';

export default function W2ReconciliationScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [trackedTips, setTrackedTips] = useState(0);
  const [w2Amount, setW2Amount] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadTaxData();
  }, [selectedYear]);

  const loadTaxData = async () => {
    try {
      setLoading(true);
      const summary = await getTaxSummary(selectedYear);
      setTrackedTips(summary.yearTotal.netTipEarnings);
    } catch (error: any) {
      console.error('Error loading tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const w2Value = parseFloat(w2Amount) || 0;
  const difference = trackedTips - w2Value;
  const hasW2Input = w2Amount.length > 0 && w2Value > 0;

  const getComparisonResult = () => {
    if (!hasW2Input) return null;

    const tolerance = Math.max(trackedTips, w2Value) * 0.05; // 5% tolerance

    if (Math.abs(difference) <= tolerance) {
      return {
        icon: 'checkmark-circle' as const,
        color: Colors.success,
        title: 'Records Match',
        message: 'Your TipFly records match your W-2. You\'re in great shape to claim the deduction.',
      };
    } else if (difference > 0) {
      return {
        icon: 'information-circle' as const,
        color: Colors.primary,
        title: `${formatCurrency(difference)} More Than W-2`,
        message: 'You tracked more than your W-2 shows. These additional tips (likely cash) are still qualified for the deduction if properly reported on your return.',
      };
    } else {
      return {
        icon: 'warning' as const,
        color: Colors.warning,
        title: `${formatCurrency(Math.abs(difference))} Less Than W-2`,
        message: 'Your W-2 shows more than you tracked in TipFly. Make sure to log all tips going forward for accurate records.',
      };
    }
  };

  const comparison = getComparisonResult();

  const handleExport = () => {
    lightHaptic();
    navigation.navigate('TaxTracking' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Compare your TipFly records with your W-2 Box 7 (Social Security tips) to ensure you can claim the full "No Tax on Tips" deduction.
          </Text>
        </View>

        {/* Year Selector */}
        <View style={styles.yearSelector}>
          <TouchableOpacity
            onPress={() => setSelectedYear(selectedYear - 1)}
            style={styles.yearButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity
            onPress={() => setSelectedYear(selectedYear + 1)}
            style={styles.yearButton}
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={selectedYear >= new Date().getFullYear() ? Colors.gray600 : Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* TipFly Tracked Amount */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="phone-portrait" size={18} color={Colors.success} />
            <Text style={styles.cardLabel}>TipFly Tracked Tips</Text>
          </View>
          <Text style={styles.cardAmount}>{formatCurrency(trackedTips)}</Text>
          <Text style={styles.cardSubtext}>Net tips after tip-out for {selectedYear}</Text>
        </View>

        {/* W-2 Input */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={18} color={Colors.primary} />
            <Text style={styles.cardLabel}>W-2 Reported Tips</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.input}
              value={w2Amount}
              onChangeText={setW2Amount}
              placeholder="Enter W-2 Box 7 amount"
              placeholderTextColor={Colors.gray600}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
          <Text style={styles.cardSubtext}>Found on your W-2 in Box 7 (Social Security tips)</Text>
        </View>

        {/* Comparison Result */}
        {comparison && (
          <View style={[styles.resultCard, { borderColor: comparison.color + '40' }]}>
            <View style={[styles.resultIconContainer, { backgroundColor: comparison.color + '20' }]}>
              <Ionicons name={comparison.icon} size={32} color={comparison.color} />
            </View>
            <Text style={[styles.resultTitle, { color: comparison.color }]}>
              {comparison.title}
            </Text>
            <Text style={styles.resultMessage}>{comparison.message}</Text>

            {/* Breakdown */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>TipFly</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(trackedTips)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>W-2</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(w2Value)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Difference</Text>
                <Text style={[styles.breakdownValue, { color: comparison.color }]}>
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </Text>
              </View>
            </View>

            {/* Deduction Summary */}
            <View style={styles.deductionSummary}>
              <Text style={styles.deductionLabel}>Qualified Deduction Amount</Text>
              <Text style={styles.deductionValue}>
                {formatCurrency(Math.min(Math.max(trackedTips, w2Value), TAX_FREE_TIP_THRESHOLD))}
              </Text>
              <Text style={styles.deductionSubtext}>
                Up to {formatCurrency(TAX_FREE_TIP_THRESHOLD)} under the No Tax on Tips Act
              </Text>
            </View>
          </View>
        )}

        {/* Export CTA */}
        {hasW2Input && (
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="document-text" size={18} color={Colors.white} />
            <Text style={styles.exportButtonText}>Export Full Tip Report</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray300,
    lineHeight: 19,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearButton: {
    padding: 4,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray300,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: Colors.gray500,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dollarSign: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.gray400,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    paddingVertical: 12,
  },
  resultCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  resultIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: Colors.gray300,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.gray400,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  breakdownDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deductionSummary: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  deductionLabel: {
    fontSize: 12,
    color: Colors.gray400,
    marginBottom: 6,
  },
  deductionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 4,
  },
  deductionSubtext: {
    fontSize: 12,
    color: Colors.gray500,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    ...Shadows.medium,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
