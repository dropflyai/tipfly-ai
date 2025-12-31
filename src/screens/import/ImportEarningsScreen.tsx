// Import Earnings Screen - Screenshot analysis for delivery/rideshare apps
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../../constants/colors';
import { analyzeEarningsScreenshot, ExtractedEarnings, DeliveryApp } from '../../services/ai/visionService';
import { createTipEntry } from '../../services/api/tips';
import { formatCurrency } from '../../utils/formatting';
import { successHaptic, errorHaptic, lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useUserStore } from '../../store/userStore';

interface ImportEarningsScreenProps {
  onClose?: () => void;
}

// App display info
const APP_INFO: Record<DeliveryApp, { name: string; color: string; icon: string }> = {
  doordash: { name: 'DoorDash', color: '#FF3008', icon: 'car' },
  uber_eats: { name: 'Uber Eats', color: '#06C167', icon: 'fast-food' },
  grubhub: { name: 'Grubhub', color: '#F63440', icon: 'restaurant' },
  instacart: { name: 'Instacart', color: '#43B02A', icon: 'cart' },
  shipt: { name: 'Shipt', color: '#00A859', icon: 'bag-handle' },
  uber: { name: 'Uber', color: '#000000', icon: 'car-sport' },
  lyft: { name: 'Lyft', color: '#FF00BF', icon: 'car' },
  spark: { name: 'Spark', color: '#0071CE', icon: 'flash' },
  amazon_flex: { name: 'Amazon Flex', color: '#FF9900', icon: 'cube' },
  unknown: { name: 'Unknown App', color: Colors.textSecondary, icon: 'help-circle' },
};

export default function ImportEarningsScreen({ onClose }: ImportEarningsScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractedEarnings | null>(null);
  const [saving, setSaving] = useState(false);

  // Track import scan usage
  const useImportScan = useUserStore((state) => state.useImportScan);

  const handlePickImage = async () => {
    lightHaptic();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to import screenshots.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const handleTakePhoto = async () => {
    lightHaptic();

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take screenshots.');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
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
      const extracted = await analyzeEarningsScreenshot(imageUri);
      setResult(extracted);

      // Count this scan against the monthly limit
      useImportScan();

      if (extracted.needsReview) {
        Alert.alert(
          'Review Required',
          extracted.reviewReason || 'Some values may need verification.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ImportEarnings] Analysis failed:', error);
      errorHaptic();
      Alert.alert('Analysis Failed', 'Could not analyze the screenshot. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    mediumHaptic();
    setSaving(true);

    try {
      // Determine date to use
      const entryDate = result.singleDate || result.dateRange?.end || new Date().toISOString().split('T')[0];

      // Calculate hours if not provided (estimate based on deliveries)
      const hours = result.hoursWorked || (result.deliveryCount ? result.deliveryCount * 0.5 : 4);

      await createTipEntry({
        date: entryDate,
        tips_earned: result.tipAmount || result.totalEarnings,
        hours_worked: hours,
        shift_type: 'other',
        notes: `Imported from ${APP_INFO[result.app].name}${result.deliveryCount ? ` - ${result.deliveryCount} deliveries` : ''}${result.basePay ? ` | Base: ${formatCurrency(result.basePay)}` : ''}${result.bonuses ? ` | Bonus: ${formatCurrency(result.bonuses)}` : ''}`,
      });

      successHaptic();
      Alert.alert(
        'Earnings Imported!',
        `Successfully imported ${formatCurrency(result.tipAmount || result.totalEarnings)} from ${APP_INFO[result.app].name}.`,
        [{ text: 'Done', onPress: onClose }]
      );
    } catch (error) {
      console.error('[ImportEarnings] Save failed:', error);
      errorHaptic();
      Alert.alert('Save Failed', 'Could not save the earnings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    lightHaptic();
    setImageUri(null);
    setResult(null);
  };

  const appInfo = result ? APP_INFO[result.app] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="phone-portrait-outline" size={32} color={Colors.primary} />
          <Text style={styles.instructionTitle}>Screenshot Your Earnings</Text>
          <Text style={styles.instructionText}>
            Take a screenshot of your weekly summary from DoorDash, Uber Eats, Instacart, or any delivery app.
          </Text>
        </View>

        {/* Image Selection */}
        {!imageUri ? (
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={32} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={32} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageSection}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.changeButton} onPress={handleClear}>
                <Ionicons name="refresh" size={20} color={Colors.primary} />
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>

              {!result && (
                <TouchableOpacity
                  style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
                  onPress={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="scan" size={20} color={Colors.white} />
                      <Text style={styles.analyzeButtonText}>Analyze Screenshot</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Results */}
        {result && (
          <View style={styles.resultsSection}>
            {/* App Detection */}
            <View style={[styles.appBadge, { backgroundColor: appInfo?.color }]}>
              <Ionicons name={appInfo?.icon as any} size={20} color={Colors.white} />
              <Text style={styles.appBadgeText}>{appInfo?.name}</Text>
              {result.appConfidence < 0.8 && (
                <Ionicons name="help-circle" size={16} color="rgba(255,255,255,0.7)" />
              )}
            </View>

            {/* Extracted Data */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Extracted Earnings</Text>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Total Earnings</Text>
                <Text style={styles.dataValueLarge}>{formatCurrency(result.totalEarnings)}</Text>
              </View>

              {result.tipAmount !== null && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Tips</Text>
                  <Text style={styles.dataValue}>{formatCurrency(result.tipAmount)}</Text>
                </View>
              )}

              {result.basePay !== null && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Base Pay</Text>
                  <Text style={styles.dataValue}>{formatCurrency(result.basePay)}</Text>
                </View>
              )}

              {result.bonuses !== null && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Bonuses</Text>
                  <Text style={styles.dataValue}>{formatCurrency(result.bonuses)}</Text>
                </View>
              )}

              {result.deliveryCount !== null && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Deliveries</Text>
                  <Text style={styles.dataValue}>{result.deliveryCount}</Text>
                </View>
              )}

              {result.hoursWorked !== null && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Hours</Text>
                  <Text style={styles.dataValue}>{result.hoursWorked.toFixed(1)}h</Text>
                </View>
              )}

              {(result.dateRange || result.singleDate) && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Date</Text>
                  <Text style={styles.dataValue}>
                    {result.singleDate || `${result.dateRange?.start} to ${result.dateRange?.end}`}
                  </Text>
                </View>
              )}

              {/* Confidence Indicator */}
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${result.confidence * 100}%`,
                        backgroundColor: result.confidence > 0.8 ? Colors.success : result.confidence > 0.5 ? Colors.warning : Colors.error,
                      }
                    ]}
                  />
                </View>
                <Text style={styles.confidenceValue}>{Math.round(result.confidence * 100)}%</Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
                  <Text style={styles.saveButtonText}>Save to Tips</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Supported Apps */}
        <View style={styles.supportedApps}>
          <Text style={styles.supportedTitle}>Supported Apps</Text>
          <View style={styles.appGrid}>
            {Object.entries(APP_INFO)
              .filter(([key]) => key !== 'unknown')
              .map(([key, info]) => (
                <View key={key} style={styles.appItem}>
                  <View style={[styles.appIcon, { backgroundColor: info.color }]}>
                    <Ionicons name={info.icon as any} size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.appName}>{info.name}</Text>
                </View>
              ))}
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
  uploadSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginTop: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  analyzeButton: {
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
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultsSection: {
    marginBottom: 20,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  appBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  dataCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dataLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  dataValueLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confidenceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    width: 35,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    ...Shadows.medium,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  supportedApps: {
    marginTop: 20,
    marginBottom: 40,
  },
  supportedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
