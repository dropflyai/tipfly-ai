import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic, mediumHaptic, successHaptic } from '../../utils/haptics';
import { createTipEntry } from '../../services/api/tips';
import { getTodayISO } from '../../utils/formatting';

interface AddFirstTipScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function AddFirstTipScreen({ onNext, onSkip }: AddFirstTipScreenProps) {
  // Pre-fill with example values
  const [tips, setTips] = useState('50');
  const [hours, setHours] = useState('5');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    console.log('[AddFirstTipScreen] handleSave called');
    console.log('[AddFirstTipScreen] tips:', tips, 'hours:', hours);

    if (!tips || !hours) {
      console.log('[AddFirstTipScreen] Missing tips or hours, returning');
      return;
    }

    setLoading(true);
    try {
      console.log('[AddFirstTipScreen] Saving tip entry...');
      await createTipEntry({
        date: getTodayISO(),
        tips_earned: parseFloat(tips),
        hours_worked: parseFloat(hours),
        shift_type: 'other',
      });

      console.log('[AddFirstTipScreen] Tip saved successfully, calling onNext');
      successHaptic();
      onNext();
    } catch (error) {
      console.error('[AddFirstTipScreen] Error adding first tip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('[AddFirstTipScreen] handleSkip called');
    mediumHaptic();
    onSkip();
  };

  const hourlyRate = tips && hours && parseFloat(tips) > 0 && parseFloat(hours) > 0
    ? (parseFloat(tips) / parseFloat(hours)).toFixed(2)
    : null;

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="add-circle-outline" size={48} color="#10B981" />
            </View>
            <Text style={styles.title}>Add Your First Tip</Text>
            <Text style={styles.subtitle}>
              How much did you make today? You can adjust these numbers.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Tips Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tips Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={tips}
                  onChangeText={setTips}
                  placeholder="0.00"
                  placeholderTextColor={Colors.inputPlaceholder}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  selectionColor={Colors.primary}
                />
              </View>
            </View>

            {/* Hours Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hours Worked</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0.0"
                  placeholderTextColor={Colors.inputPlaceholder}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  selectionColor={Colors.primary}
                />
                <Text style={styles.inputSuffix}>hrs</Text>
              </View>
            </View>

            {/* Hourly Rate Preview */}
            {hourlyRate && (
              <View style={styles.previewCard}>
                <Ionicons name="trending-up" size={28} color="#10B981" />
                <View style={styles.previewContent}>
                  <Text style={styles.previewLabel}>Your hourly rate</Text>
                  <Text style={styles.previewValue}>${hourlyRate}/hr</Text>
                </View>
              </View>
            )}
          </View>

          {/* Encouragement Card */}
          <View style={styles.encouragementCard}>
            <Ionicons name="sparkles" size={24} color="#F59E0B" />
            <Text style={styles.encouragementText}>
              Great start! Once you add more tips, AI will predict your earnings.
            </Text>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>I'll do this later</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!tips || !hours) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!tips || !hours || loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save & Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 60,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputPrefix: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputSuffix: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  previewContent: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#10B981',
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipButton: {
    flex: 0.8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  saveButton: {
    flex: 1.2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
