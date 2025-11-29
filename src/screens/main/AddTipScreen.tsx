import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors } from '../../constants/colors';
import { AppConfig } from '../../constants/config';
import { createTipEntry } from '../../services/api/tips';
import { formatCurrency, getTodayISO } from '../../utils/formatting';
import { validateTipAmount, validateHours, sanitizeInput, checkAIRateLimit, detectSpamInput } from '../../utils/security';
import { successHaptic, errorHaptic, selectionHaptic, lightHaptic } from '../../utils/haptics';
import { parseConversationalEntry, ParsedTipEntry } from '../../services/ai/conversationalEntry';
import { getCurrentUser } from '../../services/api/supabase';
import { useUserStore } from '../../store/userStore';
import { Job } from '../../types';
import { getPrimaryJob } from '../../services/api/jobs';
import JobSelector from '../../components/common/JobSelector';

interface AddTipScreenProps {
  onClose?: () => void;
}

type EntryMode = 'quick' | 'ai';

export default function AddTipScreen({ onClose }: AddTipScreenProps) {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());
  const [entryMode, setEntryMode] = useState<EntryMode>('quick');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [clockIn, setClockIn] = useState<Date | null>(null);
  const [clockOut, setClockOut] = useState<Date | null>(null);
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showClockOutPicker, setShowClockOutPicker] = useState(false);
  const [tipsEarned, setTipsEarned] = useState('');
  const [shiftType, setShiftType] = useState<string>('day');
  const [notes, setNotes] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  // AI Entry state
  const [conversationalInput, setConversationalInput] = useState('');
  const [parsedEntry, setParsedEntry] = useState<ParsedTipEntry | null>(null);
  const [parsing, setParsing] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedTipData, setSavedTipData] = useState<{ tips: number; hours: number } | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load primary job on mount
  React.useEffect(() => {
    loadPrimaryJob();
  }, []);

  const loadPrimaryJob = async () => {
    try {
      const primaryJob = await getPrimaryJob();
      if (primaryJob) {
        setSelectedJob(primaryJob);
      }
    } catch (error) {
      console.error('[AddTipScreen] Error loading primary job:', error);
    }
  };

  // Handle AI Entry mode toggle (premium check)
  const handleAIEntryToggle = () => {
    if (!isPremium) {
      errorHaptic();
      Alert.alert(
        'Premium Feature',
        'AI Entry is a premium feature. Upgrade to TipFly AI Premium for $2.99/month to unlock:\n\n• AI-powered conversational entry\n• Smart shift predictions\n• Daily earnings insights\n• PDF export\n\nUpgrade now?',
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => {
              // @ts-ignore - navigation typing
              navigation.navigate('Premium');
            },
          },
        ]
      );
      return;
    }
    selectionHaptic();
    setEntryMode('ai');
  };

  // Handle AI parsing with security guardrails
  const handleAIParse = async () => {
    if (!conversationalInput.trim()) {
      errorHaptic();
      Alert.alert('Empty Input', 'Please describe your shift');
      return;
    }

    // SECURITY: Get user ID for rate limiting
    const user = await getCurrentUser();
    const userId = user?.id || 'anonymous';

    // SECURITY: Check rate limit (20 requests per hour)
    const rateLimit = checkAIRateLimit(userId);
    if (!rateLimit.allowed) {
      errorHaptic();
      const minutesLeft = Math.ceil(rateLimit.resetIn / 60000);
      Alert.alert(
        'Rate Limit Reached',
        `You've reached the AI parsing limit. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // SECURITY: Detect spam/repeated inputs
    if (detectSpamInput(userId, conversationalInput)) {
      errorHaptic();
      Alert.alert(
        'Suspicious Activity',
        'Please avoid submitting the same input repeatedly.',
        [{ text: 'OK' }]
      );
      return;
    }

    setParsing(true);
    lightHaptic();

    try {
      const result = await parseConversationalEntry(conversationalInput);
      setParsedEntry(result);

      // Auto-fill the form fields
      if (result.tips_earned > 0) {
        setTipsEarned(result.tips_earned.toString());
      }
      if (result.hours_worked > 0) {
        // Convert hours to clock in/out times
        // Assume clock out is now, clock in is hours ago
        const now = new Date();
        const clockInTime = new Date(now.getTime() - (result.hours_worked * 60 * 60 * 1000));
        setClockOut(now);
        setClockIn(clockInTime);
      }
      if (result.shift_type) {
        setShiftType(result.shift_type);
      }
      if (result.notes) {
        setNotes(result.notes);
      }

      // If it needs clarification, show the question
      if (result.needs_clarification && result.clarification_question) {
        Alert.alert(
          'Need More Info',
          result.clarification_question,
          [{ text: 'OK', onPress: () => {} }]
        );
      } else {
        // Success - switch to quick mode to review/edit
        successHaptic();
        setEntryMode('quick');
      }
    } catch (error: any) {
      errorHaptic();
      Alert.alert('Parse Error', 'Failed to parse your entry. Please try again.');
      console.error('AI Parse Error:', error);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!clockIn || !clockOut) {
      errorHaptic();
      Alert.alert('Missing Info', 'Please enter clock in and clock out times');
      return;
    }

    if (!tipsEarned) {
      errorHaptic();
      Alert.alert('Missing Info', 'Please enter tips earned');
      return;
    }

    // Calculate hours from clock in/out
    const timeDiffMs = clockOut.getTime() - clockIn.getTime();
    if (timeDiffMs <= 0) {
      errorHaptic();
      Alert.alert('Invalid Times', 'Clock out time must be after clock in time');
      return;
    }

    const hours = timeDiffMs / (1000 * 60 * 60); // Convert ms to hours

    if (!validateHours(hours)) {
      errorHaptic();
      Alert.alert('Invalid Hours', 'Shift length must be between 0 and 24 hours');
      return;
    }

    const tips = parseFloat(tipsEarned);

    if (isNaN(tips) || !validateTipAmount(tips)) {
      errorHaptic();
      Alert.alert('Invalid Tips', 'Tip amount must be between $0 and $10,000');
      return;
    }

    // Sanitize notes
    const cleanNotes = notes ? sanitizeInput(notes) : '';

    setLoading(true);

    try {
      await createTipEntry({
        date: date.toISOString().split('T')[0],
        hours_worked: hours,
        tips_earned: tips,
        shift_type: shiftType as any,
        job_id: selectedJob?.id,
        notes: cleanNotes || undefined,
      });

      // Success!
      successHaptic();

      // Save tip data for modal
      setSavedTipData({ tips, hours });

      // Clear form
      setClockIn(null);
      setClockOut(null);
      setTipsEarned('');
      setNotes('');
      setDate(new Date());

      // Show success modal with animation
      setShowSuccessModal(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error: any) {
      errorHaptic();
      Alert.alert('Error', error.message || 'Failed to save tip entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      selectionHaptic();
      setDate(selectedDate);
    }
  };

  const handleClockInChange = (event: any, selectedTime?: Date) => {
    setShowClockInPicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedTime) {
      selectionHaptic();
      setClockIn(selectedTime);
    }
  };

  const handleClockOutChange = (event: any, selectedTime?: Date) => {
    setShowClockOutPicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedTime) {
      selectionHaptic();
      setClockOut(selectedTime);
    }
  };

  const handleCloseSuccessModal = () => {
    mediumHaptic();

    // Reset animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      setSavedTipData(null);

      // Navigate or close
      if (onClose) {
        onClose();
      } else {
        navigation.navigate('Home' as never);
      }
    });
  };

  const calculateHours = () => {
    if (clockIn && clockOut) {
      const timeDiffMs = clockOut.getTime() - clockIn.getTime();
      if (timeDiffMs > 0) {
        return (timeDiffMs / (1000 * 60 * 60)).toFixed(1);
      }
    }
    return null;
  };

  const hourlyRate =
    clockIn && clockOut && tipsEarned
      ? (parseFloat(tipsEarned) / parseFloat(calculateHours() || '1')).toFixed(2)
      : '0.00';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modal Header (only shown when onClose exists) */}
      {onClose && (
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Tip Entry</Text>
          <TouchableOpacity
            onPress={() => {
              lightHaptic();
              onClose();
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Entry Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              entryMode === 'quick' && styles.modeToggleButtonActive,
            ]}
            onPress={() => {
              selectionHaptic();
              setEntryMode('quick');
            }}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={entryMode === 'quick' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.modeToggleText,
                entryMode === 'quick' && styles.modeToggleTextActive,
              ]}
            >
              Quick Entry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              entryMode === 'ai' && styles.modeToggleButtonActive,
              !isPremium && styles.modeToggleButtonLocked,
            ]}
            onPress={handleAIEntryToggle}
          >
            <Ionicons
              name="sparkles"
              size={20}
              color={entryMode === 'ai' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.modeToggleText,
                entryMode === 'ai' && styles.modeToggleTextActive,
              ]}
            >
              AI Entry
            </Text>
            {!isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="lock-closed" size={12} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Entry Mode */}
        {entryMode === 'ai' ? (
          <>
            <View style={styles.aiInputContainer}>
              <View style={styles.aiHeader}>
                <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary} />
                <Text style={styles.aiHeaderText}>Describe your shift</Text>
              </View>
              <TextInput
                style={styles.aiInput}
                placeholder="e.g., Made $85 in 5 hours tonight, busy dinner shift..."
                placeholderTextColor={Colors.gray400}
                value={conversationalInput}
                onChangeText={setConversationalInput}
                multiline={true}
                numberOfLines={4}
                maxLength={300}
              />
              <Text style={styles.aiHelperText}>
                💬 Just type naturally - AI will extract the details!
              </Text>
              {parsedEntry && (
                <View style={styles.parsedResultContainer}>
                  <View style={styles.parsedResultHeader}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.parsedResultTitle}>
                      Parsed (Confidence: {Math.round(parsedEntry.confidence * 100)}%)
                    </Text>
                  </View>
                  <Text style={styles.parsedResultText}>
                    Tips: {formatCurrency(parsedEntry.tips_earned)} • Hours: {parsedEntry.hours_worked}h
                    {parsedEntry.shift_type && ` • ${parsedEntry.shift_type}`}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.parseButton, parsing && styles.parseButtonDisabled]}
                onPress={handleAIParse}
                disabled={parsing}
              >
                {parsing ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={Colors.white} />
                    <Text style={styles.parseButtonText}>Parse with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Quick Stats Preview */}
            {clockIn && clockOut && tipsEarned && (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Hourly Rate</Text>
                <Text style={styles.previewValue}>${hourlyRate}/hr</Text>
              </View>
            )}

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              lightHaptic();
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.dateButtonText}>
              {date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Job Selector */}
        <JobSelector
          selectedJobId={selectedJob?.id}
          onSelectJob={setSelectedJob}
          allowNone={true}
        />

        {/* Clock In/Out Times */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shift Hours</Text>

          {/* Clock In */}
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Clock In</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  lightHaptic();
                  setShowClockInPicker(true);
                }}
              >
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.timeButtonText}>
                  {clockIn ? clockIn.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : 'Select time'}
                </Text>
              </TouchableOpacity>
              {showClockInPicker && (
                <DateTimePicker
                  value={clockIn || new Date()}
                  mode="time"
                  display="default"
                  onChange={handleClockInChange}
                />
              )}
            </View>

            {/* Clock Out */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Clock Out</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  lightHaptic();
                  setShowClockOutPicker(true);
                }}
              >
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.timeButtonText}>
                  {clockOut ? clockOut.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : 'Select time'}
                </Text>
              </TouchableOpacity>
              {showClockOutPicker && (
                <DateTimePicker
                  value={clockOut || new Date()}
                  mode="time"
                  display="default"
                  onChange={handleClockOutChange}
                />
              )}
            </View>
          </View>

          {/* Calculated Total Hours */}
          {clockIn && clockOut && calculateHours() && (
            <View style={styles.hoursDisplay}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.hoursText}>
                Total Hours: {calculateHours()}h
              </Text>
            </View>
          )}

          {/* Quick shift buttons */}
          <View style={styles.quickButtons}>
            {[4, 5, 6, 7, 8].map((hours) => (
              <TouchableOpacity
                key={hours}
                style={styles.quickButton}
                onPress={() => {
                  lightHaptic();
                  const now = new Date();
                  const clockInTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
                  setClockIn(clockInTime);
                  setClockOut(now);
                }}
              >
                <Text style={styles.quickButtonText}>{hours}h</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Earned */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tips Earned</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix]}
              placeholder="87.50"
              placeholderTextColor={Colors.gray400}
              value={tipsEarned}
              onChangeText={setTipsEarned}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Shift Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shift Type</Text>
          <View style={styles.shiftTypeContainer}>
            {AppConfig.SHIFT_TYPES.map((shift) => (
              <TouchableOpacity
                key={shift.id}
                style={[
                  styles.shiftTypeButton,
                  shiftType === shift.id && styles.shiftTypeButtonActive,
                ]}
                onPress={() => {
                  selectionHaptic();
                  setShiftType(shift.id);
                }}
              >
                <Text
                  style={[
                    styles.shiftTypeText,
                    shiftType === shift.id && styles.shiftTypeTextActive,
                  ]}
                >
                  {shift.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Busy Saturday night, great section..."
            placeholderTextColor={Colors.gray400}
            value={notes}
            onChangeText={setNotes}
            multiline={true}
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Log Tips</Text>
          )}
        </TouchableOpacity>

        {/* Helper Text */}
        <Text style={styles.helperText}>
          💡 Tip: Log your tips right after each shift for best accuracy
        </Text>
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseSuccessModal}
      >
        <Animated.View
          style={[
            styles.successModalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseSuccessModal}
          />
          <Animated.View
            style={[
              styles.successModalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={GradientColors.success}
              style={styles.successGradient}
            >
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.white} />
              </View>

              {/* Success Title */}
              <Text style={styles.successTitle}>Tips Logged!</Text>

              {/* Tip Amount */}
              {savedTipData && (
                <>
                  <View style={styles.successAmountContainer}>
                    <Text style={styles.successAmount}>
                      {formatCurrency(savedTipData.tips)}
                    </Text>
                    <Text style={styles.successHours}>
                      in {savedTipData.hours.toFixed(1)} hours
                    </Text>
                  </View>

                  {/* Hourly Rate */}
                  <View style={styles.successRateContainer}>
                    <Ionicons name="trending-up" size={20} color={Colors.white} />
                    <Text style={styles.successRate}>
                      {formatCurrency(savedTipData.tips / savedTipData.hours)}/hr
                    </Text>
                  </View>
                </>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.successButton}
                onPress={handleCloseSuccessModal}
                activeOpacity={0.8}
              >
                <Text style={styles.successButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.success} />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  previewCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dateButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  inputSuffix: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
  },
  inputWithPrefix: {
    paddingLeft: 0,
  },
  notesInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 8,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shiftTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shiftTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  shiftTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  shiftTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  shiftTypeTextActive: {
    color: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeToggleButtonActive: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modeToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeToggleTextActive: {
    color: Colors.primary,
  },
  modeToggleButtonLocked: {
    opacity: 0.7,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiInputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  aiInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  aiHelperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  parsedResultContainer: {
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  parsedResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parsedResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  parsedResultText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  parseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  parseButtonDisabled: {
    opacity: 0.5,
  },
  parseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  hoursDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    borderWidth: 1,
    borderColor: Colors.success + '30',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  hoursText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successGradient: {
    padding: 32,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  successAmountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 4,
  },
  successHours: {
    fontSize: 18,
    color: Colors.white,
    opacity: 0.9,
  },
  successRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white + '20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  successRate: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
});
