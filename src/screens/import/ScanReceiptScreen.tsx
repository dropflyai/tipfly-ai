// Scan Receipt Screen - OCR analysis for paper receipts
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../../constants/colors';
import { analyzeReceipt, ExtractedReceipt } from '../../services/ai/visionService';
import { createTipEntry } from '../../services/api/tips';
import { formatCurrency } from '../../utils/formatting';
import { successHaptic, errorHaptic, lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useUserStore } from '../../store/userStore';

interface ScanReceiptScreenProps {
  onClose?: () => void;
}

export default function ScanReceiptScreen({ onClose }: ScanReceiptScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedReceipt | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields (user can correct AI extraction)
  const [editedTip, setEditedTip] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedMerchant, setEditedMerchant] = useState('');

  // Track import scan usage
  const useImportScan = useUserStore((state) => state.useImportScan);

  const handleTakePhoto = async () => {
    lightHaptic();

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to scan receipts.');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const handlePickImage = async () => {
    lightHaptic();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;

    mediumHaptic();
    setAnalyzing(true);

    try {
      const extracted = await analyzeReceipt(imageUri);
      setResult(extracted);

      // Count this scan against the monthly limit
      useImportScan();

      // Pre-fill editable fields
      setEditedTip(extracted.tipAmount?.toString() || '');
      setEditedDate(extracted.date || '');
      setEditedMerchant(extracted.merchantName || '');

      if (extracted.needsReview) {
        Alert.alert(
          'Review Required',
          extracted.reviewReason || 'Some values may need verification. Please check and correct if needed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ScanReceipt] Analysis failed:', error);
      errorHaptic();
      Alert.alert('Scan Failed', 'Could not read the receipt. Please try again with better lighting.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const tipAmount = parseFloat(editedTip);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      Alert.alert('Invalid Tip', 'Please enter a valid tip amount.');
      return;
    }

    mediumHaptic();
    setSaving(true);

    try {
      const entryDate = editedDate || new Date().toISOString().split('T')[0];

      await createTipEntry({
        date: entryDate,
        tips_earned: tipAmount,
        hours_worked: 1, // Default for receipt-based entries
        shift_type: 'other',
        notes: editedMerchant ? `Receipt from ${editedMerchant}${result?.totalAmount ? ` | Total: ${formatCurrency(result.totalAmount)}` : ''}` : 'Scanned receipt',
      });

      successHaptic();
      Alert.alert(
        'Tip Saved!',
        `Successfully saved ${formatCurrency(tipAmount)} tip${editedMerchant ? ` from ${editedMerchant}` : ''}.`,
        [{ text: 'Done', onPress: onClose }]
      );
    } catch (error) {
      console.error('[ScanReceipt] Save failed:', error);
      errorHaptic();
      Alert.alert('Save Failed', 'Could not save the tip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    lightHaptic();
    setImageUri(null);
    setResult(null);
    setEditedTip('');
    setEditedDate('');
    setEditedMerchant('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="receipt-outline" size={32} color={Colors.primary} />
          <Text style={styles.instructionTitle}>Scan Your Receipt</Text>
          <Text style={styles.instructionText}>
            Take a photo of your signed receipt to automatically extract the tip amount.
          </Text>
        </View>

        {/* Image Capture */}
        {!imageUri ? (
          <View style={styles.captureSection}>
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
              <View style={styles.captureIconContainer}>
                <Ionicons name="camera" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.captureButtonTitle}>Take Photo</Text>
              <Text style={styles.captureButtonSubtitle}>Best results with good lighting</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.libraryButton} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={20} color={Colors.primary} />
              <Text style={styles.libraryButtonText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageSection}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.retakeButton} onPress={handleClear}>
                <Ionicons name="camera-reverse" size={20} color={Colors.primary} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              {!result && (
                <TouchableOpacity
                  style={[styles.scanButton, analyzing && styles.buttonDisabled]}
                  onPress={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <ActivityIndicator color={Colors.white} size="small" />
                      <Text style={styles.scanButtonText}>Reading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="scan" size={20} color={Colors.white} />
                      <Text style={styles.scanButtonText}>Scan Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Results / Edit Form */}
        {result && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Extracted Information</Text>
            <Text style={styles.resultsSubtitle}>Review and edit if needed</Text>

            {/* Tip Amount (Primary) */}
            <View style={styles.primaryField}>
              <Text style={styles.fieldLabel}>Tip Amount</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.tipInput}
                  value={editedTip}
                  onChangeText={setEditedTip}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            {/* Secondary Fields */}
            <View style={styles.secondaryFields}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Merchant</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedMerchant}
                  onChangeText={setEditedMerchant}
                  placeholder="Restaurant name"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedDate}
                  onChangeText={setEditedDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {result.totalAmount && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Bill</Text>
                  <Text style={styles.infoValue}>{formatCurrency(result.totalAmount)}</Text>
                </View>
              )}

              {result.subtotal && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Subtotal</Text>
                  <Text style={styles.infoValue}>{formatCurrency(result.subtotal)}</Text>
                </View>
              )}

              {result.paymentMethod && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment</Text>
                  <Text style={styles.infoValue}>{result.paymentMethod}</Text>
                </View>
              )}
            </View>

            {/* Confidence */}
            <View style={styles.confidenceSection}>
              <Text style={styles.confidenceLabel}>
                Scan Confidence: {Math.round(result.confidence * 100)}%
              </Text>
              {result.confidence < 0.7 && (
                <Text style={styles.confidenceWarning}>
                  Low confidence - please verify the values
                </Text>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving || !editedTip}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
                  <Text style={styles.saveButtonText}>Save Tip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for Best Results</Text>
          <View style={styles.tipItem}>
            <Ionicons name="sunny-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.tipText}>Use good lighting - avoid shadows</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="resize-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.tipText}>Keep the receipt flat and fill the frame</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="eye-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.tipText}>Make sure the tip line is clearly visible</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  captureSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButton: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  captureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  captureButtonSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  libraryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  imageSection: {
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultsSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  primaryField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },
  tipInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    paddingVertical: 12,
  },
  secondaryFields: {
    gap: 12,
    marginBottom: 16,
  },
  fieldRow: {
    gap: 6,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confidenceWarning: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.medium,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  tipsSection: {
    marginTop: 10,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
