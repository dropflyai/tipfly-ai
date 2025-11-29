// Export Reports Screen - Export tip data in CSV or PDF format
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  generateExportData,
  exportToCSV,
  generatePDFHTML,
  getExportFilename,
  formatDateRange,
} from '../../services/api/export';

type ExportFormat = 'csv' | 'pdf';
type DateRangeOption = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export default function ExportReportsScreen() {
  const { isPremium } = useUserStore();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('month');
  const [includeDeductions, setIncludeDeductions] = useState(true);
  const [exporting, setExporting] = useState(false);

  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);

    switch (selectedRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Custom will use same as month for now
        startDate.setMonth(startDate.getMonth() - 1);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { startDate, endDate } = getDateRange();
      const { user } = useUserStore.getState();

      if (!user?.email_confirmed_at) {
        Alert.alert(
          'Email Verification Required',
          'Please verify your email address to export tax reports. This helps secure your financial data.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Email', onPress: () => {
              // User can check email or resend verification
              Alert.alert('Check Your Email', 'Please check your email inbox for the verification link. You can also resend it from the Dashboard.');
            }}
          ]
        );
        return;
      }

      // Generate export data
      const data = await generateExportData({
        startDate,
        endDate,
        format: selectedFormat,
        includeDeductions,
      });

      // Check if there's data to export
      if (data.entries.length === 0) {
        Alert.alert(
          'No Data',
          'No tip entries found for the selected date range.',
          [{ text: 'OK' }]
        );
        return;
      }

      const filename = getExportFilename(selectedFormat, startDate, endDate);

      if (selectedFormat === 'csv') {
        // Export as CSV
        const content = exportToCSV(data);
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export TipFly AI Report',
          });
        }

        Alert.alert(
          'Export Successful',
          'Your CSV report has been created and shared.',
          [{ text: 'OK' }]
        );
      } else {
        // Export as PDF
        const html = generatePDFHTML(data, startDate, endDate, user?.full_name || 'User');
        const { uri } = await Print.printToFileAsync({ html });

        // Share the PDF directly (no need to move in Expo SDK 54+)
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export TipFly AI Report',
            UTI: 'com.adobe.pdf',
          });
        }

        Alert.alert(
          'Export Successful',
          'Your PDF report has been created and shared.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Premium lock for free users
  if (!isPremium()) {
    return (
      <View style={styles.container}>
        <View style={styles.upgradeContainer}>
          <Ionicons name="download" size={64} color={Colors.primary} />
          <Text style={styles.upgradeTitle}>Premium Feature</Text>
          <Text style={styles.upgradeText}>
            Export your tip data for tax filing, accounting, or personal records.
          </Text>
          <Text style={styles.upgradeFeatures}>
            • Export to CSV or PDF format{'\n'}
            • Include tax deductions{'\n'}
            • Custom date ranges{'\n'}
            • Share via email or cloud storage
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { startDate, endDate } = getDateRange();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Export Reports</Text>
          <Text style={styles.headerSubtitle}>
            Generate detailed reports of your tip earnings
          </Text>
        </View>

        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRangeButtons}>
            <DateRangeButton
              label="Last Week"
              icon="calendar-outline"
              selected={selectedRange === 'week'}
              onPress={() => setSelectedRange('week')}
            />
            <DateRangeButton
              label="Last Month"
              icon="calendar"
              selected={selectedRange === 'month'}
              onPress={() => setSelectedRange('month')}
            />
            <DateRangeButton
              label="Last Quarter"
              icon="calendar-sharp"
              selected={selectedRange === 'quarter'}
              onPress={() => setSelectedRange('quarter')}
            />
            <DateRangeButton
              label="Last Year"
              icon="calendar-clear"
              selected={selectedRange === 'year'}
              onPress={() => setSelectedRange('year')}
            />
          </View>

          <View style={styles.dateRangeDisplay}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateRangeText}>{formatDateRange(startDate, endDate)}</Text>
          </View>
        </View>

        {/* Format Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatButtons}>
            <TouchableOpacity
              style={[
                styles.formatButton,
                selectedFormat === 'csv' && styles.formatButtonActive,
              ]}
              onPress={() => setSelectedFormat('csv')}
            >
              <Ionicons
                name="document-text"
                size={28}
                color={selectedFormat === 'csv' ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.formatLabel,
                  selectedFormat === 'csv' && styles.formatLabelActive,
                ]}
              >
                CSV
              </Text>
              <Text
                style={[
                  styles.formatDesc,
                  selectedFormat === 'csv' && styles.formatDescActive,
                ]}
              >
                For Excel & Sheets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatButton,
                selectedFormat === 'pdf' && styles.formatButtonActive,
              ]}
              onPress={() => setSelectedFormat('pdf')}
            >
              <Ionicons
                name="document"
                size={28}
                color={selectedFormat === 'pdf' ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.formatLabel,
                  selectedFormat === 'pdf' && styles.formatLabelActive,
                ]}
              >
                PDF
              </Text>
              <Text
                style={[
                  styles.formatDesc,
                  selectedFormat === 'pdf' && styles.formatDescActive,
                ]}
              >
                Professional Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeDeductions(!includeDeductions)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="receipt-outline" size={22} color={Colors.text} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>Include Tax Deductions</Text>
                <Text style={styles.optionDesc}>Add deductions to the report</Text>
              </View>
            </View>
            <View
              style={[
                styles.checkbox,
                includeDeductions && styles.checkboxActive,
              ]}
            >
              {includeDeductions && (
                <Ionicons name="checkmark" size={18} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Export Preview */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="eye-outline" size={24} color={Colors.primary} />
            <Text style={styles.previewTitle}>Report Preview</Text>
          </View>
          <View style={styles.previewContent}>
            <PreviewRow label="Format" value={selectedFormat.toUpperCase()} />
            <PreviewRow label="Date Range" value={formatDateRange(startDate, endDate)} />
            <PreviewRow
              label="Include Deductions"
              value={includeDeductions ? 'Yes' : 'No'}
            />
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="download" size={22} color={Colors.white} />
              <Text style={styles.exportButtonText}>Export Report</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Your report will include all tip entries and a summary of your earnings. You can
            share it via email or save it to cloud storage for safekeeping.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Date Range Button Component
function DateRangeButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.dateRangeButton, selected && styles.dateRangeButtonActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? Colors.white : Colors.primary}
      />
      <Text
        style={[
          styles.dateRangeButtonText,
          selected && styles.dateRangeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Preview Row Component
function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
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
    gap: 24,
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
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundTertiary,
  },
  dateRangeButtonActive: {
    backgroundColor: Colors.primary,
  },
  dateRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  dateRangeButtonTextActive: {
    color: Colors.white,
  },
  dateRangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '15',
    padding: 12,
    borderRadius: 8,
  },
  dateRangeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  formatButtonActive: {
    backgroundColor: Colors.primary,
  },
  formatLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  formatLabelActive: {
    color: Colors.white,
  },
  formatDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  formatDescActive: {
    color: Colors.white + 'CC',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionTextContainer: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  optionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  previewContent: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  previewLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  exportButton: {
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
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  infoSection: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  upgradeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeFeatures: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 24,
    marginTop: 8,
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
