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
import { Colors, GradientColors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { successHaptic } from '../../utils/haptics';
import { createTipEntry } from '../../services/api/tips';
import { getTodayISO } from '../../utils/formatting';
import OnboardingProgress from '../../components/OnboardingProgress';

interface AddFirstTipScreenProps {
  onNext: () => void;
  jobType?: string;
}

// Default values based on job type
const getDefaultValues = (jobType?: string) => {
  switch (jobType) {
    case 'waiter':
    case 'bartender':
      return { tips: '75', hours: '6' };
    case 'stylist':
    case 'nail_tech':
      return { tips: '60', hours: '8' };
    case 'driver':
    case 'delivery':
      return { tips: '45', hours: '5' };
    default:
      return { tips: '50', hours: '5' };
  }
};

export default function AddFirstTipScreen({ onNext, jobType }: AddFirstTipScreenProps) {
  const defaults = getDefaultValues(jobType);
  const [tips, setTips] = useState(defaults.tips);
  const [hours, setHours] = useState(defaults.hours);
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
      // Still proceed on error so user isn't stuck
      onNext();
    } finally {
      setLoading(false);
    }
  };

  const hourlyRate = tips && hours && parseFloat(tips) > 0 && parseFloat(hours) > 0
    ? (parseFloat(tips) / parseFloat(hours)).toFixed(2)
    : null;

  const isValid = tips && hours && parseFloat(tips) > 0 && parseFloat(hours) > 0;

  return (
    <LinearGradient
      colors={GradientColors.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <OnboardingProgress currentStep={2} totalSteps={3} />
      </View>

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
              <Ionicons name="cash-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Add Your First Tip</Text>
            <Text style={styles.subtitle}>
              Enter your most recent earnings to get started
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Tips Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tips Earned</Text>
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
                <Ionicons name="trending-up" size={28} color={Colors.primary} />
                <View style={styles.previewContent}>
                  <Text style={styles.previewLabel}>Your hourly rate</Text>
                  <Text style={styles.previewValue}>${hourlyRate}/hr</Text>
                </View>
              </View>
            )}
          </View>

          {/* Encouragement Card */}
          <View style={styles.encouragementCard}>
            <Ionicons name="sparkles" size={24} color={Colors.gold} />
            <Text style={styles.encouragementText}>
              Great start! Once you add more tips, AI will predict your earnings before each shift.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isValid && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!isValid || loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isValid ? GradientColors.primary : [Colors.backgroundTertiary, Colors.backgroundTertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={[
                styles.saveButtonText,
                !isValid && styles.saveButtonTextDisabled
              ]}>
                {loading ? 'Saving...' : 'Save & Continue'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={isValid ? Colors.white : Colors.textTertiary}
              />
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
  progressContainer: {
    paddingTop: 60,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
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
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    color: Colors.text,
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
    color: Colors.white,
  },
  inputSuffix: {
    fontSize: 15,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
  },
  previewContent: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 1,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  saveButtonTextDisabled: {
    color: Colors.textTertiary,
  },
});
