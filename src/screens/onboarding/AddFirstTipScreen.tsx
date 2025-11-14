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
} from 'react-native';
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
  const [tips, setTips] = useState('');
  const [hours, setHours] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Your First Tip</Text>
          <Text style={styles.subtitle}>
            Let's start tracking your earnings! Enter today's tips and hours worked.
          </Text>
        </View>

        {/* Tooltip */}
        {showTooltip && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Ionicons name="bulb" size={24} color={Colors.primary} />
              <Text style={styles.tooltipText}>
                Don't worry, you can always edit or delete this entry later!
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                lightHaptic();
                setShowTooltip(false);
              }}
              style={styles.tooltipClose}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

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
                placeholderTextColor={Colors.gray400}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
            <Text style={styles.hint}>Total tips you earned today</Text>
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
                placeholderTextColor={Colors.gray400}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              <Text style={styles.inputSuffix}>hrs</Text>
            </View>
            <Text style={styles.hint}>How long did you work today?</Text>
          </View>

          {/* Hourly Rate Preview */}
          {tips && hours && parseFloat(tips) > 0 && parseFloat(hours) > 0 && (
            <View style={styles.previewCard}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <View style={styles.previewContent}>
                <Text style={styles.previewLabel}>Your hourly rate</Text>
                <Text style={styles.previewValue}>
                  ${(parseFloat(tips) / parseFloat(hours)).toFixed(2)}/hr
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Why track tips?</Text>
            <Text style={styles.infoText}>
              TipFly AI helps you understand your earnings patterns, track tax deductions, and set realistic income goals.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!tips || !hours) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!tips || !hours || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 24,
    gap: 20,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  tooltip: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tooltipContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tooltipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  tooltipClose: {
    padding: 4,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    gap: 24,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  inputSuffix: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
