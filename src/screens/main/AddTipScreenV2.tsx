import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors, GlassStyles, Shadows } from '../../constants/colors';
import { AppConfig } from '../../constants/config';
import { createTipEntry } from '../../services/api/tips';
import { formatCurrency } from '../../utils/formatting';
import { validateTipAmount, validateHours, sanitizeInput, checkAIRateLimit, detectSpamInput } from '../../utils/security';
import { successHaptic, errorHaptic, selectionHaptic, lightHaptic, mediumHaptic } from '../../utils/haptics';
import { parseConversationalEntry, ParsedTipEntry } from '../../services/ai/conversationalEntry';
import { getCurrentUser } from '../../services/api/supabase';
import { useUserStore } from '../../store/userStore';
import { useAnimationStore } from '../../store/animationStore';
import { useAlert } from '../../contexts/AlertContext';
import { Job, Position } from '../../types';
import { getPrimaryJob } from '../../services/api/jobs';
import { getPositionsByJob } from '../../services/api/positions';
import JobSelector from '../../components/common/JobSelector';
import VoiceInputButton from '../../components/common/VoiceInputButton';
import ImportEarningsScreen from '../import/ImportEarningsScreen';
import ScanReceiptScreen from '../import/ScanReceiptScreen';

interface AddTipScreenV2Props {
  onClose?: () => void;
}

type EntryMode = 'quick' | 'ai';

export default function AddTipScreenV2({ onClose }: AddTipScreenV2Props) {
  const navigation = useNavigation();
  const { success, error: showError, confirm } = useAlert();
  const isPremium = useUserStore((state) => state.isPremium());

  const [entryMode, setEntryMode] = useState<EntryMode>('quick');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [clockIn, setClockIn] = useState<Date | null>(null);
  const [clockOut, setClockOut] = useState<Date | null>(null);
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showClockOutPicker, setShowClockOutPicker] = useState(false);
  const [tipsEarned, setTipsEarned] = useState('');
  const [tipOut, setTipOut] = useState('');
  const [shiftType, setShiftType] = useState<string>('day');
  const [notes, setNotes] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);

  // AI Entry state
  const [conversationalInput, setConversationalInput] = useState('');
  const [parsedEntry, setParsedEntry] = useState<ParsedTipEntry | null>(null);
  const [parsing, setParsing] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Import modal state
  const [showImportEarnings, setShowImportEarnings] = useState(false);
  const [showScanReceipt, setShowScanReceipt] = useState(false);

  // Tip count tracking
  const incrementTipCount = useAnimationStore((state) => state.incrementTipCount);
  const loadTipCount = useAnimationStore((state) => state.loadTipCount);

  // Import scan limits
  const canUseImportScan = useUserStore((state) => state.canUseImportScan);
  const getRemainingImportScans = useUserStore((state) => state.getRemainingImportScans);

  // Calculate derived values
  const calculatedHours = useMemo(() => {
    if (clockIn && clockOut) {
      const timeDiffMs = clockOut.getTime() - clockIn.getTime();
      if (timeDiffMs > 0) {
        return timeDiffMs / (1000 * 60 * 60);
      }
    }
    return null;
  }, [clockIn, clockOut]);

  const hourlyRate = useMemo(() => {
    if (calculatedHours && tipsEarned) {
      const tips = parseFloat(tipsEarned);
      if (!isNaN(tips) && tips > 0) {
        return tips / calculatedHours;
      }
    }
    return null;
  }, [calculatedHours, tipsEarned]);

  const netTakeHome = useMemo(() => {
    if (tipsEarned && tipOut) {
      const tips = parseFloat(tipsEarned);
      const out = parseFloat(tipOut);
      if (!isNaN(tips) && !isNaN(out)) {
        return tips - out;
      }
    }
    return parseFloat(tipsEarned) || null;
  }, [tipsEarned, tipOut]);

  // Load primary job and tip count on mount
  useEffect(() => {
    loadPrimaryJob();
    loadTipCount();
  }, []);

  const loadPrimaryJob = async () => {
    try {
      const primaryJob = await getPrimaryJob();
      if (primaryJob) {
        setSelectedJob(primaryJob);
        loadPositionsForJob(primaryJob.id);
      }
    } catch (error) {
      console.error('[AddTipScreenV2] Error loading primary job:', error);
    }
  };

  const loadPositionsForJob = async (jobId: string) => {
    try {
      const jobPositions = await getPositionsByJob(jobId);
      setPositions(jobPositions);

      const defaultPos = jobPositions.find(p => p.is_default);
      if (defaultPos) {
        setSelectedPosition(defaultPos);
      } else if (jobPositions.length === 1) {
        setSelectedPosition(jobPositions[0]);
      } else {
        setSelectedPosition(null);
      }
    } catch (error) {
      console.error('[AddTipScreenV2] Error loading positions:', error);
      setPositions([]);
      setSelectedPosition(null);
    }
  };

  const handleJobSelect = (job: Job | null) => {
    setSelectedJob(job);
    if (job) {
      loadPositionsForJob(job.id);
    } else {
      setPositions([]);
      setSelectedPosition(null);
    }
  };

  const handleImportPress = (type: 'screenshot' | 'receipt') => {
    const remaining = getRemainingImportScans();

    if (!canUseImportScan()) {
      errorHaptic();
      confirm(
        'Monthly Limit Reached',
        `You've used all 3 free import scans this month. Upgrade to Premium for unlimited scans!`,
        () => navigation.navigate('Premium' as never),
        'Upgrade',
        false
      );
      return;
    }

    lightHaptic();
    if (type === 'screenshot') {
      setShowImportEarnings(true);
    } else {
      setShowScanReceipt(true);
    }
  };

  const handleAIEntryToggle = () => {
    if (!isPremium) {
      errorHaptic();
      confirm(
        'Premium Feature',
        'AI Entry is a premium feature. Upgrade to unlock conversational tip entry, smart predictions, and more!',
        () => navigation.navigate('Premium' as never),
        'Upgrade',
        false
      );
      return;
    }
    selectionHaptic();
    setEntryMode('ai');
  };

  const handleVoiceTranscript = (text: string) => {
    setConversationalInput(text);
    setTimeout(() => {
      handleAIParseWithInput(text);
    }, 300);
  };

  const handleAIParseWithInput = async (input: string) => {
    if (!input.trim()) {
      errorHaptic();
      showError('Empty Input', 'Please describe your shift');
      return;
    }

    const user = await getCurrentUser();
    const userId = user?.id || 'anonymous';

    const rateLimit = checkAIRateLimit(userId);
    if (!rateLimit.allowed) {
      errorHaptic();
      const minutesLeft = Math.ceil(rateLimit.resetIn / 60000);
      showError('Rate Limit Reached', `Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`);
      return;
    }

    if (detectSpamInput(userId, input)) {
      errorHaptic();
      showError('Suspicious Activity', 'Please avoid submitting the same input repeatedly.');
      return;
    }

    setParsing(true);
    lightHaptic();

    try {
      const result = await parseConversationalEntry(input);
      setParsedEntry(result);

      if (result.tips_earned > 0) {
        setTipsEarned(result.tips_earned.toString());
      }
      if (result.hours_worked > 0) {
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

      if (result.needs_clarification && result.clarification_question) {
        showError('Need More Info', result.clarification_question);
      } else {
        successHaptic();
        setEntryMode('quick');
      }
    } catch (err: any) {
      errorHaptic();
      showError('Parse Error', 'Failed to parse your entry. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!clockIn || !clockOut) {
      errorHaptic();
      showError('Missing Info', 'Please enter clock in and clock out times');
      return;
    }

    if (!tipsEarned) {
      errorHaptic();
      showError('Missing Info', 'Please enter tips earned');
      return;
    }

    const timeDiffMs = clockOut.getTime() - clockIn.getTime();
    if (timeDiffMs <= 0) {
      errorHaptic();
      showError('Invalid Times', 'Clock out time must be after clock in time');
      return;
    }

    const hours = timeDiffMs / (1000 * 60 * 60);
    if (!validateHours(hours)) {
      errorHaptic();
      showError('Invalid Hours', 'Shift length must be between 0 and 24 hours');
      return;
    }

    const tips = parseFloat(tipsEarned);
    if (isNaN(tips) || !validateTipAmount(tips)) {
      errorHaptic();
      showError('Invalid Tips', 'Tip amount must be between $0 and $100,000');
      return;
    }

    const cleanNotes = notes ? sanitizeInput(notes) : '';
    setLoading(true);

    const tipOutAmount = tipOut ? parseFloat(tipOut) : undefined;

    const tipEntryData = {
      date: date.toISOString().split('T')[0],
      clock_in: clockIn.toISOString(),
      clock_out: clockOut.toISOString(),
      hours_worked: hours,
      tips_earned: tips,
      tip_out: tipOutAmount && tipOutAmount > 0 ? tipOutAmount : undefined,
      shift_type: shiftType as any,
      job_id: selectedJob?.id,
      ...(selectedPosition?.id && { position_id: selectedPosition.id }),
      notes: cleanNotes || undefined,
    };

    try {
      await createTipEntry(tipEntryData);
      successHaptic();

      // Clear form
      setClockIn(null);
      setClockOut(null);
      setTipsEarned('');
      setTipOut('');
      setNotes('');
      setDate(new Date());
      if (positions.length > 0) {
        const defaultPos = positions.find(p => p.is_default);
        setSelectedPosition(defaultPos || null);
      }

      await incrementTipCount();

      success(
        'Tip Logged!',
        `${formatCurrency(tips)} logged for ${hours.toFixed(1)} hours (${formatCurrency(tips / hours)}/hr)`
      );

      // Close after showing success
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          navigation.navigate('Home' as never);
        }
      }, 1500);
    } catch (err: any) {
      errorHaptic();
      let errorTitle = 'Unable to Save';
      let errorMessage = 'We couldn\'t save your tip entry. Please try again.';

      if (err.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes('position')) {
          errorTitle = 'Position Issue';
          errorMessage = 'There was an issue with the position. Try selecting a different one.';
        } else if (msg.includes('network') || msg.includes('timeout')) {
          errorTitle = 'Connection Issue';
          errorMessage = 'Please check your internet connection.';
        }
      }

      showError(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      selectionHaptic();
      setDate(selectedDate);
    }
  };

  const handleClockInChange = (event: any, selectedTime?: Date) => {
    setShowClockInPicker(Platform.OS === 'ios');
    if (selectedTime) {
      selectionHaptic();
      setClockIn(selectedTime);
    }
  };

  const handleClockOutChange = (event: any, selectedTime?: Date) => {
    setShowClockOutPicker(Platform.OS === 'ios');
    if (selectedTime) {
      selectionHaptic();
      setClockOut(selectedTime);
    }
  };

  const setQuickShift = (hours: number) => {
    lightHaptic();
    const now = new Date();
    const clockInTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    setClockIn(clockInTime);
    setClockOut(now);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Tips</Text>
        {onClose && (
          <TouchableOpacity
            onPress={() => {
              lightHaptic();
              onClose();
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Insight Preview Card - Shows when data is entered */}
          {hourlyRate !== null && (
            <View style={styles.insightCard}>
              <LinearGradient
                colors={GradientColors.gold}
                style={styles.insightGradient}
              >
                <View style={styles.insightContent}>
                  <View style={styles.insightMain}>
                    <Text style={styles.insightLabel}>Hourly Rate</Text>
                    <Text style={styles.insightValue}>{formatCurrency(hourlyRate)}/hr</Text>
                  </View>
                  <View style={styles.insightDivider} />
                  <View style={styles.insightStats}>
                    <View style={styles.insightStat}>
                      <Text style={styles.insightStatLabel}>Hours</Text>
                      <Text style={styles.insightStatValue}>{calculatedHours?.toFixed(1)}h</Text>
                    </View>
                    {netTakeHome && tipOut && (
                      <View style={styles.insightStat}>
                        <Text style={styles.insightStatLabel}>Net</Text>
                        <Text style={styles.insightStatValue}>{formatCurrency(netTakeHome)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Entry Mode Toggle */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeToggleButton, entryMode === 'quick' && styles.modeToggleButtonActive]}
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
              <Text style={[styles.modeToggleText, entryMode === 'quick' && styles.modeToggleTextActive]}>
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
              <Text style={[styles.modeToggleText, entryMode === 'ai' && styles.modeToggleTextActive]}>
                AI Entry
              </Text>
              {!isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="lock-closed" size={12} color={Colors.gold} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Import Options */}
          <View style={styles.importSection}>
            <View style={styles.importHeader}>
              <Text style={styles.importSectionTitle}>Or import from:</Text>
              {!isPremium && (
                <View style={styles.importLimitBadge}>
                  <Text style={styles.importLimitText}>{getRemainingImportScans()}/3</Text>
                </View>
              )}
            </View>
            <View style={styles.importButtons}>
              <TouchableOpacity
                style={styles.importButton}
                onPress={() => handleImportPress('screenshot')}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />
                <Text style={styles.importButtonText}>Screenshot</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.importButton}
                onPress={() => handleImportPress('receipt')}
              >
                <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
                <Text style={styles.importButtonText}>Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>

          {entryMode === 'ai' ? (
            /* AI Entry Mode */
            <View style={styles.aiContainer}>
              <View style={styles.aiHeader}>
                <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary} />
                <Text style={styles.aiHeaderText}>Describe your shift</Text>
              </View>

              <View style={styles.voiceSection}>
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  onListeningChange={setIsVoiceListening}
                  disabled={parsing}
                  size="large"
                />
                <Text style={styles.voiceLabel}>
                  {isVoiceListening ? 'Listening...' : 'Tap to speak'}
                </Text>
              </View>

              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or type</Text>
                <View style={styles.orLine} />
              </View>

              <TextInput
                style={styles.aiInput}
                placeholder="e.g., Made $85 in 5 hours tonight..."
                placeholderTextColor={Colors.textMuted}
                value={conversationalInput}
                onChangeText={setConversationalInput}
                multiline
                numberOfLines={3}
                maxLength={300}
              />

              {parsedEntry && (
                <View style={styles.parsedResult}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.parsedResultText}>
                    {formatCurrency(parsedEntry.tips_earned)} • {parsedEntry.hours_worked}h
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.parseButton, parsing && styles.parseButtonDisabled]}
                onPress={() => handleAIParseWithInput(conversationalInput)}
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
          ) : (
            /* Quick Entry Mode */
            <>
              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    lightHaptic();
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
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
                onSelectJob={handleJobSelect}
                allowNone={true}
              />

              {/* Position Selector */}
              {selectedJob && positions.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Position</Text>
                  <View style={styles.positionContainer}>
                    {positions.map((position) => (
                      <TouchableOpacity
                        key={position.id}
                        style={[
                          styles.positionButton,
                          selectedPosition?.id === position.id && styles.positionButtonActive,
                          { borderColor: selectedPosition?.id === position.id ? position.color : Colors.border },
                        ]}
                        onPress={() => {
                          selectionHaptic();
                          setSelectedPosition(selectedPosition?.id === position.id ? null : position);
                        }}
                      >
                        <View style={[styles.positionColor, { backgroundColor: position.color }]} />
                        <Text style={[styles.positionText, selectedPosition?.id === position.id && styles.positionTextActive]}>
                          {position.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Shift Hours */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shift Hours</Text>
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
                      <Ionicons name="time-outline" size={18} color={Colors.primary} />
                      <Text style={styles.timeButtonText}>
                        {clockIn ? clockIn.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Select'}
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
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Clock Out</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        lightHaptic();
                        setShowClockOutPicker(true);
                      }}
                    >
                      <Ionicons name="time-outline" size={18} color={Colors.primary} />
                      <Text style={styles.timeButtonText}>
                        {clockOut ? clockOut.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Select'}
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

                {/* Calculated Hours Display */}
                {calculatedHours && (
                  <View style={styles.hoursDisplay}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={styles.hoursText}>{calculatedHours.toFixed(1)} hours</Text>
                  </View>
                )}

                {/* Quick shift buttons */}
                <View style={styles.quickButtons}>
                  {[4, 5, 6, 7, 8].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={styles.quickButton}
                      onPress={() => setQuickShift(hours)}
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
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    value={tipsEarned}
                    onChangeText={setTipsEarned}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Tip Out */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Tip Out</Text>
                  <Text style={styles.labelOptional}>(Optional)</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    value={tipOut}
                    onChangeText={setTipOut}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.helperText}>Busboys, bartenders, hosts, etc.</Text>
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

              {/* Notes */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.labelOptional}>(Optional)</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Busy Saturday night..."
                  placeholderTextColor={Colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  maxLength={200}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Log Tips</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Import Modals */}
      <Modal
        visible={showImportEarnings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowImportEarnings(false)}
      >
        <ImportEarningsScreen onClose={() => setShowImportEarnings(false)} />
      </Modal>

      <Modal
        visible={showScanReceipt}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScanReceipt(false)}
      >
        <ScanReceiptScreen onClose={() => setShowScanReceipt(false)} />
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  headerTitle: {
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
    paddingBottom: 100,
    gap: 20,
  },

  // Insight Card
  insightCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.glowGoldSubtle,
  },
  insightGradient: {
    padding: 20,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightMain: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '500',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.background,
  },
  insightDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginHorizontal: 16,
  },
  insightStats: {
    alignItems: 'flex-end',
  },
  insightStat: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  insightStatLabel: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  insightStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },

  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
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
    borderColor: Colors.primary + '40',
  },
  modeToggleButtonLocked: {
    opacity: 0.7,
  },
  modeToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeToggleTextActive: {
    color: Colors.primary,
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 12,
    backgroundColor: Colors.gold + '20',
    borderRadius: 8,
    padding: 3,
  },

  // Import Section
  importSection: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  importSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  importLimitBadge: {
    backgroundColor: Colors.gold + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  importLimitText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
  },
  importButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: 10,
    paddingVertical: 12,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // AI Entry
  aiContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiHeaderText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  voiceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  aiInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parsedResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '15',
    borderRadius: 10,
    padding: 12,
  },
  parsedResultText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  parseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.buttonBlue,
  },
  parseButtonDisabled: {
    opacity: 0.5,
  },
  parseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Form Inputs
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelOptional: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  dateButtonText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  positionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  positionButtonActive: {
    backgroundColor: Colors.primary + '10',
  },
  positionColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  positionTextActive: {
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  timeButtonText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  hoursDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success + '15',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 8,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shiftTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shiftTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  shiftTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  shiftTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shiftTypeTextActive: {
    color: Colors.primary,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.buttonBlue,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
