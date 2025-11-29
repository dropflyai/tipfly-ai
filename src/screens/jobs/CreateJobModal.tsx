import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Job } from '../../types';
import { createJob } from '../../services/api/jobs';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
}

const JOB_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { value: 'bar', label: 'Bar', icon: 'beer' },
  { value: 'delivery', label: 'Delivery', icon: 'bicycle' },
  { value: 'rideshare', label: 'Rideshare', icon: 'car' },
  { value: 'other', label: 'Other', icon: 'briefcase' },
];

const JOB_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function CreateJobModal({
  visible,
  onClose,
  onJobCreated,
}: CreateJobModalProps) {
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState<string>('restaurant');
  const [selectedColor, setSelectedColor] = useState(JOB_COLORS[0]);
  const [hourlyWage, setHourlyWage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    lightHaptic();
    // Reset form
    setJobName('');
    setJobType('restaurant');
    setSelectedColor(JOB_COLORS[0]);
    setHourlyWage('');
    setNotes('');
    onClose();
  };

  const handleCreate = async () => {
    if (!jobName.trim()) {
      Alert.alert('Required', 'Please enter a job name');
      return;
    }

    if (jobName.trim().length < 2) {
      Alert.alert('Too Short', 'Job name must be at least 2 characters');
      return;
    }

    try {
      mediumHaptic();
      setLoading(true);

      const jobData = {
        name: jobName.trim(),
        job_type: jobType as any,
        color: selectedColor,
        is_primary: false, // User can set it primary later
        is_active: true,
        hourly_wage: hourlyWage ? parseFloat(hourlyWage) : undefined,
        notes: notes.trim() || undefined,
      };

      const newJob = await createJob(jobData);
      handleClose();
      onJobCreated(newJob);
    } catch (error: any) {
      console.error('[CreateJobModal] Error creating job:', error);
      Alert.alert('Error', error.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Job</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Job Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Joe's Diner"
                placeholderTextColor={Colors.gray400}
                value={jobName}
                onChangeText={setJobName}
                autoFocus
                maxLength={100}
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            {/* Job Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Type</Text>
              <View style={styles.jobTypesContainer}>
                {JOB_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.jobTypeButton,
                      jobType === type.value && styles.jobTypeButtonActive,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setJobType(type.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={jobType === type.value ? Colors.white : Colors.text}
                    />
                    <Text
                      style={[
                        styles.jobTypeText,
                        jobType === type.value && styles.jobTypeTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorsContainer}>
                {JOB_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setSelectedColor(color);
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hourly Wage (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Base Hourly Wage (Optional)</Text>
              <View style={styles.moneyInputContainer}>
                <Text style={styles.moneySymbol}>$</Text>
                <TextInput
                  style={styles.moneyInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.gray400}
                  value={hourlyWage}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal
                    const formatted = text.replace(/[^0-9.]/g, '');
                    setHourlyWage(formatted);
                  }}
                  keyboardType="decimal-pad"
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Notes (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about this job..."
                placeholderTextColor={Colors.gray400}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!loading}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.createButtonText}>Create Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  jobTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jobTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.backgroundTertiary,
    gap: 6,
  },
  jobTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  jobTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  jobTypeTextActive: {
    color: Colors.white,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  moneyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  moneySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 4,
  },
  moneyInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
