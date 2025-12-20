import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { getTaxSummary, getDeductions, addDeduction, deleteDeduction, TAX_FREE_TIP_THRESHOLD } from '../../services/api/tax';
import { Deduction } from '../../types';
import { AppConfig } from '../../constants/config';
import { formatCurrency } from '../../utils/formatting';
import { generateTaxSummaryPDFHTML, getTaxSummaryFilename, TaxSummaryPDFData } from '../../services/api/export';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../services/api/supabase';

export default function TaxTrackingScreen() {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());

  const [loading, setLoading] = useState(true);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [showDeductionGuide, setShowDeductionGuide] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add Deduction Form
  const [deductionDate, setDeductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [deductionCategory, setDeductionCategory] = useState('mileage');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionDescription, setDeductionDescription] = useState('');

  useEffect(() => {
    if (isPremium) {
      loadData();
    }
  }, [selectedYear, isPremium]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summary, deductionsList] = await Promise.all([
        getTaxSummary(selectedYear),
        getDeductions(selectedYear),
      ]);
      setTaxSummary(summary);
      setDeductions(deductionsList);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load tax data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeduction = async () => {
    if (!deductionAmount || parseFloat(deductionAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addDeduction({
        user_id: '', // Will be set by API
        date: deductionDate,
        category: deductionCategory as any,
        amount: parseFloat(deductionAmount),
        description: deductionDescription,
      });

      setShowAddDeduction(false);
      setDeductionAmount('');
      setDeductionDescription('');
      loadData();
      Alert.alert('Success', 'Deduction added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add deduction');
    }
  };

  const handleDeleteDeduction = (id: string) => {
    Alert.alert(
      'Delete Deduction',
      'Are you sure you want to delete this deduction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeduction(id);
              loadData();
              Alert.alert('Success', 'Deduction deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleExportTaxSummary = async () => {
    if (!taxSummary) {
      Alert.alert('No Data', 'Please wait for tax data to load.');
      return;
    }

    try {
      setExporting(true);

      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

      // Get tip entries for stats
      const { data: tipEntries } = await supabase
        .from('tip_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      const totalShifts = tipEntries?.length || 0;
      const totalHours = tipEntries?.reduce((sum, e) => sum + (e.hours_worked || 0), 0) || 0;
      const avgHourlyRate = totalHours > 0 ? taxSummary.yearTotal.netTipEarnings / totalHours : 0;

      // Group deductions by category
      const deductionsByCategory: { category: string; amount: number }[] = [];
      const categoryMap = new Map<string, number>();
      deductions.forEach(d => {
        const cat = AppConfig.DEDUCTION_CATEGORIES.find(c => c.id === d.category)?.label || d.category;
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + d.amount);
      });
      categoryMap.forEach((amount, category) => {
        deductionsByCategory.push({ category, amount });
      });

      // Build PDF data
      const pdfData: TaxSummaryPDFData = {
        year: selectedYear,
        userName,
        grossTips: taxSummary.yearTotal.totalEarnings,
        tipOut: taxSummary.yearTotal.totalTipOut,
        netTipEarnings: taxSummary.yearTotal.netTipEarnings,
        taxFreeTips: taxSummary.yearTotal.taxFreeTips,
        taxableTips: taxSummary.yearTotal.taxableTips,
        thresholdUsed: taxSummary.yearTotal.thresholdProgress,
        deductionsByCategory,
        totalDeductions: taxSummary.yearTotal.totalDeductions,
        taxableIncome: taxSummary.yearTotal.netIncome,
        estimatedTax: taxSummary.yearTotal.estimatedTax,
        taxRate: taxSummary.yearTotal.taxRate,
        quarters: [
          {
            quarter: 1,
            grossTips: taxSummary.q1.totalEarnings,
            tipOut: taxSummary.q1.totalTipOut,
            netTips: taxSummary.q1.netTipEarnings,
            taxFreeTips: taxSummary.q1.taxFreeTips,
            taxableTips: taxSummary.q1.taxableTips,
            deductions: taxSummary.q1.totalDeductions,
            estimatedTax: taxSummary.q1.estimatedTax,
          },
          {
            quarter: 2,
            grossTips: taxSummary.q2.totalEarnings,
            tipOut: taxSummary.q2.totalTipOut,
            netTips: taxSummary.q2.netTipEarnings,
            taxFreeTips: taxSummary.q2.taxFreeTips,
            taxableTips: taxSummary.q2.taxableTips,
            deductions: taxSummary.q2.totalDeductions,
            estimatedTax: taxSummary.q2.estimatedTax,
          },
          {
            quarter: 3,
            grossTips: taxSummary.q3.totalEarnings,
            tipOut: taxSummary.q3.totalTipOut,
            netTips: taxSummary.q3.netTipEarnings,
            taxFreeTips: taxSummary.q3.taxFreeTips,
            taxableTips: taxSummary.q3.taxableTips,
            deductions: taxSummary.q3.totalDeductions,
            estimatedTax: taxSummary.q3.estimatedTax,
          },
          {
            quarter: 4,
            grossTips: taxSummary.q4.totalEarnings,
            tipOut: taxSummary.q4.totalTipOut,
            netTips: taxSummary.q4.netTipEarnings,
            taxFreeTips: taxSummary.q4.taxFreeTips,
            taxableTips: taxSummary.q4.taxableTips,
            deductions: taxSummary.q4.totalDeductions,
            estimatedTax: taxSummary.q4.estimatedTax,
          },
        ],
        totalShifts,
        totalHours,
        avgHourlyRate,
      };

      // Generate PDF
      const html = generateTaxSummaryPDFHTML(pdfData);
      const { uri } = await Print.printToFileAsync({ html });

      // Share the PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${selectedYear} Tax Summary`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error.message || 'Failed to generate tax summary PDF');
    } finally {
      setExporting(false);
    }
  };

  if (!isPremium) {
    return (
      <View style={styles.upgradeContainer}>
        <Ionicons name="lock-closed" size={64} color={Colors.primary} />
        <Text style={styles.upgradeTitle}>Premium Feature</Text>
        <Text style={styles.upgradeText}>
          Tax Tracking is a premium feature. Track deductions, calculate quarterly estimates, and stay tax-ready year-round.
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Upgrade' as never)}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Year Selector */}
        <View style={styles.yearSelectorRow}>
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
                color={selectedYear >= new Date().getFullYear() ? Colors.gray400 : Colors.primary}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportTaxSummary}
            disabled={exporting || loading || !taxSummary}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={Colors.white} />
                <Text style={styles.exportButtonText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* $25K Tax-Free Threshold Progress */}
        {taxSummary && (
          <View style={[
            styles.thresholdCard,
            taxSummary.yearTotal.isOverThreshold && styles.thresholdCardOver
          ]}>
            <View style={styles.thresholdHeader}>
              <View style={styles.thresholdTitleRow}>
                <Ionicons
                  name={taxSummary.yearTotal.isOverThreshold ? "alert-circle" : "shield-checkmark"}
                  size={24}
                  color={taxSummary.yearTotal.isOverThreshold ? Colors.warning : Colors.success}
                />
                <Text style={styles.thresholdTitle}>
                  {taxSummary.yearTotal.isOverThreshold ? "Tax-Free Threshold Exceeded" : "Tax-Free Tips Progress"}
                </Text>
              </View>
              <Text style={styles.thresholdSubtitle}>
                No Tax on Tips Act - First ${formatCurrency(TAX_FREE_TIP_THRESHOLD)} tax-free
              </Text>
            </View>

            <View style={styles.thresholdProgressContainer}>
              <View style={styles.thresholdProgressBar}>
                <View
                  style={[
                    styles.thresholdProgressFill,
                    { width: `${Math.min(100, taxSummary.yearTotal.thresholdProgress)}%` },
                    taxSummary.yearTotal.isOverThreshold && styles.thresholdProgressFillOver
                  ]}
                />
              </View>
              <Text style={styles.thresholdProgressText}>
                {taxSummary.yearTotal.thresholdProgress.toFixed(0)}%
              </Text>
            </View>

            <View style={styles.thresholdStats}>
              <View style={styles.thresholdStat}>
                <Text style={styles.thresholdStatLabel}>Tax-Free Tips</Text>
                <Text style={[styles.thresholdStatValue, styles.thresholdStatGreen]}>
                  ${formatCurrency(taxSummary.yearTotal.taxFreeTips)}
                </Text>
              </View>
              <View style={styles.thresholdStatDivider} />
              <View style={styles.thresholdStat}>
                <Text style={styles.thresholdStatLabel}>Taxable Tips</Text>
                <Text style={[
                  styles.thresholdStatValue,
                  taxSummary.yearTotal.taxableTips > 0 && styles.thresholdStatRed
                ]}>
                  ${formatCurrency(taxSummary.yearTotal.taxableTips)}
                </Text>
              </View>
              <View style={styles.thresholdStatDivider} />
              <View style={styles.thresholdStat}>
                <Text style={styles.thresholdStatLabel}>Remaining</Text>
                <Text style={styles.thresholdStatValue}>
                  ${formatCurrency(Math.max(0, TAX_FREE_TIP_THRESHOLD - taxSummary.yearTotal.netTipEarnings))}
                </Text>
              </View>
            </View>

            {taxSummary.yearTotal.isOverThreshold && (
              <View style={styles.thresholdWarning}>
                <Ionicons name="information-circle" size={16} color={Colors.warning} />
                <Text style={styles.thresholdWarningText}>
                  You've exceeded the $25K threshold. Tips above this amount ({formatCurrency(taxSummary.yearTotal.taxableTips)}) are subject to self-employment tax.
                </Text>
              </View>
            )}

            {!taxSummary.yearTotal.isOverThreshold && taxSummary.yearTotal.thresholdProgress >= 80 && (
              <View style={styles.thresholdApproaching}>
                <Ionicons name="trending-up" size={16} color={Colors.accent} />
                <Text style={styles.thresholdApproachingText}>
                  Approaching threshold! You have ${formatCurrency(TAX_FREE_TIP_THRESHOLD - taxSummary.yearTotal.netTipEarnings)} in tax-free tips remaining.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Year Summary Card */}
        {taxSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>💰 {selectedYear} Tax Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Tips Earned</Text>
              <Text style={styles.summaryValue}>${formatCurrency(taxSummary.yearTotal.totalEarnings)}</Text>
            </View>

            {taxSummary.yearTotal.totalTipOut > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip Out (Support Staff)</Text>
                <Text style={[styles.summaryValue, styles.tipOutValue]}>
                  -${formatCurrency(taxSummary.yearTotal.totalTipOut)}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net Tip Earnings</Text>
              <Text style={styles.summaryValue}>${formatCurrency(taxSummary.yearTotal.netTipEarnings)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Business Deductions</Text>
              <Text style={[styles.summaryValue, styles.deductionValue]}>
                -${formatCurrency(taxSummary.yearTotal.totalDeductions)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.summaryDivider]}>
              <Text style={styles.summaryLabel}>Taxable Income</Text>
              <Text style={styles.summaryValue}>${formatCurrency(taxSummary.yearTotal.netIncome)}</Text>
            </View>

            <View style={[styles.summaryRow, styles.taxRow]}>
              <Text style={styles.taxLabel}>Estimated Tax (15.3%)</Text>
              <Text style={styles.taxValue}>${formatCurrency(taxSummary.yearTotal.estimatedTax)}</Text>
            </View>
          </View>
        )}

        {/* Quarterly Breakdown */}
        {taxSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quarterly Breakdown</Text>

            {['q1', 'q2', 'q3', 'q4'].map((quarter, index) => {
              const q = taxSummary[quarter];
              return (
                <View key={quarter} style={styles.quarterCard}>
                  <View style={styles.quarterHeader}>
                    <Text style={styles.quarterTitle}>Q{index + 1} {selectedYear}</Text>
                    <View style={styles.quarterBadges}>
                      {q.isOverThreshold && (
                        <View style={styles.quarterOverBadge}>
                          <Text style={styles.quarterOverBadgeText}>Over $25K</Text>
                        </View>
                      )}
                      <Text style={styles.quarterTax}>${formatCurrency(q.estimatedTax)} tax</Text>
                    </View>
                  </View>
                  <View style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>Gross Tips:</Text>
                    <Text style={styles.quarterValue}>${formatCurrency(q.totalEarnings)}</Text>
                  </View>
                  {q.totalTipOut > 0 && (
                    <View style={styles.quarterRow}>
                      <Text style={styles.quarterLabel}>Tip Out:</Text>
                      <Text style={[styles.quarterValue, styles.quarterTipOut]}>-${formatCurrency(q.totalTipOut)}</Text>
                    </View>
                  )}
                  <View style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>Net Tips:</Text>
                    <Text style={styles.quarterValue}>${formatCurrency(q.netTipEarnings)}</Text>
                  </View>
                  <View style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>Tax-Free:</Text>
                    <Text style={[styles.quarterValue, styles.quarterTaxFree]}>${formatCurrency(q.taxFreeTips)}</Text>
                  </View>
                  <View style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>Taxable:</Text>
                    <Text style={[styles.quarterValue, q.taxableTips > 0 && styles.quarterTaxable]}>
                      ${formatCurrency(q.taxableTips)}
                    </Text>
                  </View>
                  <View style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>Deductions:</Text>
                    <Text style={[styles.quarterValue, styles.quarterDeductions]}>-${formatCurrency(q.totalDeductions)}</Text>
                  </View>
                  <View style={[styles.quarterRow, styles.quarterNetRow]}>
                    <Text style={styles.quarterLabel}>Taxable Income:</Text>
                    <Text style={[styles.quarterValue, styles.quarterNetValue]}>
                      ${formatCurrency(q.netIncome)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Deductions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => setShowDeductionGuide(true)}
              >
                <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddDeduction(true)}
              >
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {deductions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={Colors.gray400} />
              <Text style={styles.emptyText}>No deductions yet</Text>
              <Text style={styles.emptySubtext}>Add deductions to reduce your tax liability</Text>
            </View>
          ) : (
            <View style={styles.deductionsList}>
              {deductions.map((deduction) => (
                <View key={deduction.id} style={styles.deductionItem}>
                  <View style={styles.deductionInfo}>
                    <Text style={styles.deductionCategory}>
                      {AppConfig.DEDUCTION_CATEGORIES.find(c => c.id === deduction.category)?.label}
                    </Text>
                    <Text style={styles.deductionDate}>
                      {new Date(deduction.date).toLocaleDateString()}
                    </Text>
                    {deduction.description && (
                      <Text style={styles.deductionDescription}>{deduction.description}</Text>
                    )}
                  </View>
                  <View style={styles.deductionRight}>
                    <Text style={styles.deductionAmount}>${deduction.amount.toFixed(2)}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteDeduction(deduction.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* No Tax on Tips Act Info */}
        <View style={styles.noTaxActCard}>
          <View style={styles.noTaxActHeader}>
            <Ionicons name="newspaper-outline" size={24} color={Colors.primary} />
            <Text style={styles.noTaxActTitle}>No Tax on Tips Act</Text>
          </View>
          <Text style={styles.noTaxActText}>
            Under the proposed 2025 "No Tax on Tips Act", the first $25,000 in tips you earn each year would be exempt from federal income tax.
          </Text>
          <View style={styles.noTaxActBullets}>
            <View style={styles.noTaxActBullet}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.noTaxActBulletText}>First $25K in tips = tax-free</Text>
            </View>
            <View style={styles.noTaxActBullet}>
              <Ionicons name="alert-circle" size={16} color={Colors.warning} />
              <Text style={styles.noTaxActBulletText}>Tips over $25K = subject to self-employment tax (15.3%)</Text>
            </View>
            <View style={styles.noTaxActBullet}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
              <Text style={styles.noTaxActBulletText}>Threshold resets each calendar year</Text>
            </View>
          </View>
          <Text style={styles.noTaxActDisclaimer}>
            Note: This legislation is proposed for 2025. Consult a tax professional for the latest updates on tax law changes.
          </Text>
        </View>

        {/* Tax Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tax Tips</Text>
          <Text style={styles.tipText}>
            • Track tip earnings to know when you approach $25K{'\n'}
            • Keep receipts for all business expenses{'\n'}
            • Self-employment tax rate is 15.3%{'\n'}
            • Pay quarterly estimated taxes to avoid penalties{'\n'}
            • Consult a tax professional for personalized advice
          </Text>
        </View>
      </ScrollView>

      {/* Add Deduction Modal */}
      <Modal
        visible={showAddDeduction}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddDeduction(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Deduction</Text>
              <TouchableOpacity onPress={() => setShowAddDeduction(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {AppConfig.DEDUCTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      deductionCategory === cat.id && styles.categoryButtonActive,
                    ]}
                    onPress={() => setDeductionCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        deductionCategory === cat.id && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={deductionAmount}
                  onChangeText={setDeductionAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Description */}
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Gas for deliveries"
                placeholderTextColor={Colors.inputPlaceholder}
                value={deductionDescription}
                onChangeText={setDeductionDescription}
                multiline
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddDeduction}
              >
                <Text style={styles.saveButtonText}>Add Deduction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deduction Guide Modal */}
      <Modal
        visible={showDeductionGuide}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeductionGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.guideModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tax Deduction Guide</Text>
              <TouchableOpacity onPress={() => setShowDeductionGuide(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.guideScroll} contentContainerStyle={styles.guideContent}>
              <Text style={styles.guideIntro}>
                As a tip-earning worker, you can deduct work-related expenses to reduce your taxable income and save money on taxes.
              </Text>

              <View style={styles.guideSection}>
                <Text style={styles.guideSectionTitle}>✅ What You CAN Deduct:</Text>

                <View style={styles.guideItem}>
                  <Text style={styles.guideItemTitle}>🚗 Mileage & Transportation</Text>
                  <Text style={styles.guideItemText}>
                    • Gas, oil changes, car maintenance{'\n'}
                    • Mileage for delivery drivers (DoorDash, Uber Eats){'\n'}
                    • Parking fees and tolls for work{'\n'}
                    • Vehicle lease or loan payments (portion used for work)
                  </Text>
                </View>

                <View style={styles.guideItem}>
                  <Text style={styles.guideItemTitle}>👔 Work Attire & Supplies</Text>
                  <Text style={styles.guideItemText}>
                    • Required uniforms (not provided by employer){'\n'}
                    • Non-slip work shoes{'\n'}
                    • Aprons, name tags, specific clothing{'\n'}
                    • Hair styling tools (stylists){'\n'}
                    • Professional scissors, combs
                  </Text>
                </View>

                <View style={styles.guideItem}>
                  <Text style={styles.guideItemTitle}>📚 Education & Training</Text>
                  <Text style={styles.guideItemText}>
                    • Bartending certifications{'\n'}
                    • Food safety courses{'\n'}
                    • ServSafe certification{'\n'}
                    • Industry conferences and workshops{'\n'}
                    • Professional development books
                  </Text>
                </View>

                <View style={styles.guideItem}>
                  <Text style={styles.guideItemTitle}>📱 Technology & Equipment</Text>
                  <Text style={styles.guideItemText}>
                    • Work phone and data plan{'\n'}
                    • Credit card processing fees{'\n'}
                    • Point-of-sale systems{'\n'}
                    • Tablet or laptop for work
                  </Text>
                </View>

                <View style={styles.guideItem}>
                  <Text style={styles.guideItemTitle}>💼 Professional Fees</Text>
                  <Text style={styles.guideItemText}>
                    • Union dues{'\n'}
                    • Professional licensing fees{'\n'}
                    • Accountant or tax prep fees{'\n'}
                    • Professional association memberships
                  </Text>
                </View>
              </View>

              <View style={styles.guideSection}>
                <Text style={styles.guideSectionTitle}>❌ What You CANNOT Deduct:</Text>
                <Text style={styles.guideItemText}>
                  • Regular commuting to/from work{'\n'}
                  • Personal clothing (even if worn to work){'\n'}
                  • Meals during regular work hours{'\n'}
                  • Parking tickets or speeding fines{'\n'}
                  • Personal phone usage (only business portion){'\n'}
                  • Home internet (unless home office)
                </Text>
              </View>

              <View style={styles.guideTip}>
                <View style={styles.guideTipIcon}>
                  <Ionicons name="bulb" size={24} color={Colors.accent} />
                </View>
                <View style={styles.guideTipContent}>
                  <Text style={styles.guideTipTitle}>Pro Tips:</Text>
                  <Text style={styles.guideTipText}>
                    • Always keep receipts and documentation{'\n'}
                    • Take photos of receipts immediately{'\n'}
                    • Track expenses throughout the year{'\n'}
                    • When in doubt, ask a tax professional{'\n'}
                    • Separate personal and business expenses
                  </Text>
                </View>
              </View>

              <View style={styles.guideExample}>
                <Text style={styles.guideExampleTitle}>💡 Real Example:</Text>
                <Text style={styles.guideExampleText}>
                  Sarah is a server who earns $35,000/year in tips. She tracks:{'\n'}
                  • $800 for required uniforms{'\n'}
                  • $300 for non-slip shoes{'\n'}
                  • $200 for ServSafe certification{'\n'}
                  {'\n'}
                  Total deductions: $1,300{'\n'}
                  Tax savings (22% bracket): $286{'\n'}
                  {'\n'}
                  By tracking deductions, Sarah saves enough to pay for Premium and has extra money!
                </Text>
              </View>

              <View style={styles.guideFooter}>
                <View style={styles.guideFooterIcon}>
                  <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.guideFooterText}>
                  This guide is for educational purposes. Always consult with a qualified tax professional for advice specific to your situation.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.guideCloseButton}
              onPress={() => setShowDeductionGuide(false)}
            >
              <Text style={styles.guideCloseButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    padding: 20,
    gap: 20,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.backgroundDark,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  upgradeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    backgroundColor: Colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 80,
  },
  exportButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  yearButton: {
    padding: 8,
  },
  yearText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  deductionValue: {
    color: Colors.success,
  },
  taxRow: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  taxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  taxValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    padding: 4,
  },
  quarterCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quarterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quarterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  quarterTax: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  quarterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quarterLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quarterValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  quarterNetValue: {
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  deductionsList: {
    gap: 8,
  },
  deductionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deductionInfo: {
    flex: 1,
  },
  deductionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  deductionDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  deductionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  deductionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deductionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  deleteButton: {
    padding: 8,
  },
  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundTertiary,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpButton: {
    padding: 4,
  },
  guideModal: {
    height: '90%',
    display: 'flex',
  },
  guideScroll: {
    flex: 1,
    maxHeight: '100%',
  },
  guideContent: {
    padding: 20,
    paddingBottom: 40,
  },
  guideIntro: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    marginBottom: 24,
  },
  guideSection: {
    marginBottom: 24,
  },
  guideSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  guideItem: {
    marginBottom: 16,
  },
  guideItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  guideItemText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  guideTip: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  guideTipIcon: {
    marginRight: 12,
  },
  guideTipContent: {
    flex: 1,
  },
  guideTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  guideTipText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  guideExample: {
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 20,
  },
  guideExampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  guideExampleText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  guideFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
  },
  guideFooterIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  guideFooterText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  guideCloseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  guideCloseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Threshold card styles
  thresholdCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.success + '40',
    gap: 16,
  },
  thresholdCardOver: {
    borderColor: Colors.warning + '60',
    backgroundColor: Colors.warning + '08',
  },
  thresholdHeader: {
    gap: 4,
  },
  thresholdTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thresholdTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  thresholdSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 32,
  },
  thresholdProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thresholdProgressBar: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  thresholdProgressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 6,
  },
  thresholdProgressFillOver: {
    backgroundColor: Colors.warning,
  },
  thresholdProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    width: 45,
    textAlign: 'right',
  },
  thresholdStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdStat: {
    flex: 1,
    alignItems: 'center',
  },
  thresholdStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  thresholdStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  thresholdStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  thresholdStatGreen: {
    color: Colors.success,
  },
  thresholdStatRed: {
    color: Colors.error,
  },
  thresholdWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 8,
  },
  thresholdWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 18,
  },
  thresholdApproaching: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accent + '15',
    padding: 12,
    borderRadius: 8,
  },
  thresholdApproachingText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 18,
  },
  // Tip out value style
  tipOutValue: {
    color: Colors.warning,
  },
  // Quarter card new styles
  quarterBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quarterOverBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quarterOverBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  quarterTipOut: {
    color: Colors.warning,
  },
  quarterTaxFree: {
    color: Colors.success,
  },
  quarterTaxable: {
    color: Colors.error,
  },
  quarterDeductions: {
    color: Colors.success,
  },
  quarterNetRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  // No Tax on Tips Act card styles
  noTaxActCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: 12,
  },
  noTaxActHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noTaxActTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  noTaxActText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  noTaxActBullets: {
    gap: 8,
  },
  noTaxActBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noTaxActBulletText: {
    fontSize: 14,
    color: Colors.text,
  },
  noTaxActDisclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
