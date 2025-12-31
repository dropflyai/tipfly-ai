// Income Summary Report Screen - Generate professional income summary PDFs
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  getIncomeVerificationData,
  generateIncomeVerificationPDFHTML,
  getIncomeVerificationFilename,
} from '../../services/api/export';

type PeriodType = 'monthly' | 'quarterly' | 'annual';

interface PeriodOption {
  type: PeriodType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  {
    type: 'monthly',
    label: 'Monthly',
    icon: 'calendar-outline',
    description: 'Last 30 days',
  },
  {
    type: 'quarterly',
    label: 'Quarterly',
    icon: 'calendar',
    description: 'Last 3 months',
  },
  {
    type: 'annual',
    label: 'Annual',
    icon: 'calendar-clear',
    description: 'Last 12 months',
  },
];

export default function IncomeVerificationScreen() {
  const { isPremium } = useUserStore();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<{
    netIncome: number;
    totalShifts: number;
    totalHours: number;
    averagePerHour: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const getDateRange = (period: PeriodType): { startDate: Date; endDate: Date; label: string } => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    let label = '';

    switch (period) {
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        label = `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        const quarterEnd = Math.ceil((endDate.getMonth() + 1) / 3);
        label = `Q${quarterEnd} ${endDate.getFullYear()}`;
        break;
      case 'annual':
        startDate.setFullYear(startDate.getFullYear() - 1);
        label = `${startDate.getFullYear()} - ${endDate.getFullYear()}`;
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate, label };
  };

  const loadPreview = async (period: PeriodType) => {
    setLoadingPreview(true);
    try {
      const { startDate, endDate, label } = getDateRange(period);
      const data = await getIncomeVerificationData(startDate, endDate, period, label);
      setPreviewData({
        netIncome: data.netIncome,
        totalShifts: data.totalShifts,
        totalHours: data.totalHours,
        averagePerHour: data.averagePerHour,
      });
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    loadPreview(period);
  };

  // Load initial preview
  React.useEffect(() => {
    loadPreview(selectedPeriod);
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { startDate, endDate, label } = getDateRange(selectedPeriod);

      // Get the data
      const data = await getIncomeVerificationData(startDate, endDate, selectedPeriod, label);

      // Check if there's data
      if (data.totalShifts === 0) {
        Alert.alert(
          'No Data',
          'No tip entries found for the selected period. Please select a different time range.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Generate PDF HTML
      const html = generateIncomeVerificationPDFHTML(data);

      // Create PDF
      const { uri } = await Print.printToFileAsync({ html });

      // Share the PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Income Summary Report',
          UTI: 'com.adobe.pdf',
        });
      }

      Alert.alert(
        'Document Created',
        'Your Income Summary Report has been generated and is ready to share.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error generating income verification:', error);
      Alert.alert('Error', error.message || 'Failed to generate income summary report');
    } finally {
      setGenerating(false);
    }
  };

  const formatMoney = (amount: number) =>
    '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Premium lock for free users
  if (!isPremium()) {
    return (
      <View style={styles.container}>
        <View style={styles.upgradeContainer}>
          <View style={styles.upgradeIconContainer}>
            <Ionicons name="document-text" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.upgradeTitle}>Income Summary Report</Text>
          <Text style={styles.upgradeText}>
            Generate professional income summary reports for apartment applications, loans, and more.
          </Text>
          <View style={styles.upgradeFeaturesList}>
            <View style={styles.upgradeFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.upgradeFeatureText}>Professional PDF document</Text>
            </View>
            <View style={styles.upgradeFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.upgradeFeatureText}>Unique report ID for reference</Text>
            </View>
            <View style={styles.upgradeFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.upgradeFeatureText}>Monthly, quarterly, or annual reports</Text>
            </View>
            <View style={styles.upgradeFeatureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.upgradeFeatureText}>Easy to share via email or print</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Income Summary Report</Text>
          <Text style={styles.headerSubtitle}>
            Generate professional income summary documents for apartments, loans, and other applications
          </Text>
        </View>

        {/* Use Cases */}
        <View style={styles.useCasesCard}>
          <Text style={styles.useCasesTitle}>Perfect for:</Text>
          <View style={styles.useCasesRow}>
            <View style={styles.useCaseItem}>
              <Ionicons name="home-outline" size={24} color={Colors.primary} />
              <Text style={styles.useCaseText}>Apartments</Text>
            </View>
            <View style={styles.useCaseItem}>
              <Ionicons name="car-outline" size={24} color={Colors.primary} />
              <Text style={styles.useCaseText}>Auto Loans</Text>
            </View>
            <View style={styles.useCaseItem}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
              <Text style={styles.useCaseText}>Credit Apps</Text>
            </View>
            <View style={styles.useCaseItem}>
              <Ionicons name="business-outline" size={24} color={Colors.primary} />
              <Text style={styles.useCaseText}>Banks</Text>
            </View>
          </View>
        </View>

        {/* Period Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Period</Text>
          <View style={styles.periodButtons}>
            {PERIOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.periodButton,
                  selectedPeriod === option.type && styles.periodButtonActive,
                ]}
                onPress={() => handlePeriodChange(option.type)}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={selectedPeriod === option.type ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.periodLabel,
                    selectedPeriod === option.type && styles.periodLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.periodDesc,
                    selectedPeriod === option.type && styles.periodDescActive,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="eye-outline" size={24} color={Colors.primary} />
            <Text style={styles.previewTitle}>Report Preview</Text>
          </View>

          {loadingPreview ? (
            <View style={styles.previewLoading}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.previewLoadingText}>Loading data...</Text>
            </View>
          ) : previewData ? (
            <View style={styles.previewContent}>
              <View style={styles.previewMainStat}>
                <Text style={styles.previewMainLabel}>Net Income</Text>
                <Text style={styles.previewMainValue}>{formatMoney(previewData.netIncome)}</Text>
              </View>
              <View style={styles.previewStats}>
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>{previewData.totalShifts}</Text>
                  <Text style={styles.previewStatLabel}>Shifts</Text>
                </View>
                <View style={styles.previewStatDivider} />
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>{previewData.totalHours.toFixed(1)}</Text>
                  <Text style={styles.previewStatLabel}>Hours</Text>
                </View>
                <View style={styles.previewStatDivider} />
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>{formatMoney(previewData.averagePerHour)}</Text>
                  <Text style={styles.previewStatLabel}>Per Hour</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.previewEmpty}>
              <Ionicons name="alert-circle-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.previewEmptyText}>No data available for this period</Text>
            </View>
          )}
        </View>

        {/* What's Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.includedList}>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Your name and contact information</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Total income for the selected period</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Detailed breakdown (shifts, hours, averages)</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Monthly breakdown (for quarterly/annual)</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Unique report ID for reference</Text>
            </View>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generating || !previewData || previewData.totalShifts === 0}
        >
          {generating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="document-text" size={22} color={Colors.white} />
              <Text style={styles.generateButtonText}>Generate PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.warning} />
          <Text style={styles.disclaimerText}>
            This document is based on self-reported data. TipFly AI does not independently verify this information. Recipients may request additional documentation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  useCasesCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  useCasesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  useCasesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  useCaseItem: {
    alignItems: 'center',
    gap: 6,
  },
  useCaseText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  periodLabelActive: {
    color: Colors.white,
  },
  periodDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  periodDescActive: {
    color: Colors.white + 'CC',
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  previewLoading: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  previewLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  previewContent: {
    gap: 16,
  },
  previewMainStat: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
  },
  previewMainLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  previewMainValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewStatItem: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  previewStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  previewStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  previewEmpty: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  previewEmptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  includedList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  includedText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.warning + '15',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  // Upgrade styles
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  upgradeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  upgradeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeFeaturesList: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  upgradeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeFeatureText: {
    fontSize: 15,
    color: Colors.text,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
