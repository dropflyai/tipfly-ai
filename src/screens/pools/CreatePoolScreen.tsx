import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../../constants/colors';
import { WorkplaceWithMembers } from '../../types/teams';
import { getWorkplaceMembers } from '../../services/api/teams';
import { createTipPool } from '../../services/api/tipPools';
import { getTeamMemberHoursForDate, UserClockData } from '../../services/api/clockData';
import { getCurrentUser } from '../../services/api/supabase';
import { formatCurrency, getTodayISO } from '../../utils/formatting';
import { successHaptic, errorHaptic, lightHaptic } from '../../utils/haptics';

type RouteParams = {
  CreatePool: {
    team: WorkplaceWithMembers;
  };
};

type CreatePoolRouteProp = RouteProp<RouteParams, 'CreatePool'>;
type CreatePoolNavProp = StackNavigationProp<any>;

type SplitType = 'equal_hours' | 'custom_percentage';

interface ParticipantData {
  user_id: string;
  name?: string;
  selected: boolean;
  hours_worked: number;
  percentage: number;
  has_clock_data: boolean;
  calculated_share: number;
}

export default function CreatePoolScreen() {
  const route = useRoute<CreatePoolRouteProp>();
  const navigation = useNavigation<CreatePoolNavProp>();
  const { team } = route.params;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shiftType, setShiftType] = useState<string>('dinner');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal_hours');
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, [date]);

  const loadParticipants = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get team members
      const members = await getWorkplaceMembers(team.id);

      // Get clock data for selected date
      const dateStr = date.toISOString().split('T')[0];
      const clockDataMap = await getTeamMemberHoursForDate(team.id, dateStr);

      // Build participant list
      const participantsList: ParticipantData[] = members.map((member) => {
        const clockData = clockDataMap.get(member.user_id);
        const isCurrentUser = member.user_id === user.id;

        return {
          user_id: member.user_id,
          name: isCurrentUser ? 'You' : 'Team Member',
          selected: isCurrentUser, // Auto-select current user
          hours_worked: clockData?.hours_worked || 0,
          percentage: 0,
          has_clock_data: clockData?.has_clock_data || false,
          calculated_share: 0,
        };
      });

      setParticipants(participantsList);
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    const user = getCurrentUser();
    // Don't allow unchecking current user
    if (userId === user?.id) return;

    lightHaptic();
    setParticipants(prev =>
      prev.map(p =>
        p.user_id === userId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const updateHours = (userId: string, hours: string) => {
    const hoursNum = parseFloat(hours) || 0;
    setParticipants(prev =>
      prev.map(p =>
        p.user_id === userId ? { ...p, hours_worked: hoursNum } : p
      )
    );
  };

  const updatePercentage = (userId: string, percentage: string) => {
    const percentNum = parseFloat(percentage) || 0;
    setParticipants(prev =>
      prev.map(p =>
        p.user_id === userId ? { ...p, percentage: percentNum } : p
      )
    );
  };

  const calculateShares = (): ParticipantData[] => {
    const amount = parseFloat(totalAmount) || 0;
    const selected = participants.filter(p => p.selected);

    if (amount === 0 || selected.length === 0) {
      return participants.map(p => ({ ...p, calculated_share: 0 }));
    }

    if (splitType === 'equal_hours') {
      const totalHours = selected.reduce((sum, p) => sum + p.hours_worked, 0);
      if (totalHours === 0) {
        return participants.map(p => ({ ...p, calculated_share: 0 }));
      }

      const hourlyRate = amount / totalHours;
      return participants.map(p => ({
        ...p,
        calculated_share: p.selected ? p.hours_worked * hourlyRate : 0,
      }));
    } else {
      // custom_percentage
      return participants.map(p => ({
        ...p,
        calculated_share: p.selected ? (amount * p.percentage) / 100 : 0,
      }));
    }
  };

  const getCalculatedParticipants = () => {
    return calculateShares();
  };

  const getTotalPercentage = () => {
    return participants
      .filter(p => p.selected)
      .reduce((sum, p) => sum + p.percentage, 0);
  };

  const getTotalHours = () => {
    return participants
      .filter(p => p.selected)
      .reduce((sum, p) => sum + p.hours_worked, 0);
  };

  const validateAndCreate = async () => {
    const amount = parseFloat(totalAmount);
    if (!amount || amount <= 0) {
      errorHaptic();
      Alert.alert('Invalid Amount', 'Please enter a valid pool amount');
      return;
    }

    const selected = participants.filter(p => p.selected);
    if (selected.length === 0) {
      errorHaptic();
      Alert.alert('No Participants', 'Please select at least one participant');
      return;
    }

    if (splitType === 'equal_hours') {
      const totalHours = getTotalHours();
      if (totalHours === 0) {
        errorHaptic();
        Alert.alert('Invalid Hours', 'Total hours must be greater than 0');
        return;
      }

      if (selected.some(p => p.hours_worked <= 0)) {
        errorHaptic();
        Alert.alert('Invalid Hours', 'All participants must have hours > 0');
        return;
      }
    } else {
      const totalPct = getTotalPercentage();
      if (Math.abs(totalPct - 100) > 0.01) {
        errorHaptic();
        Alert.alert(
          'Invalid Percentages',
          `Percentages must total 100% (currently ${totalPct.toFixed(1)}%)`
        );
        return;
      }
    }

    await createPool();
  };

  const createPool = async () => {
    try {
      setCreating(true);
      const calculated = calculateShares();
      const selected = calculated.filter(p => p.selected);

      const participantsData = selected.map(p => ({
        user_id: p.user_id,
        hours_worked: splitType === 'equal_hours' ? p.hours_worked : undefined,
        percentage: splitType === 'custom_percentage' ? p.percentage : undefined,
      }));

      await createTipPool({
        workplace_id: team.id,
        date: date.toISOString().split('T')[0],
        shift_type: shiftType as any,
        total_amount: parseFloat(totalAmount),
        split_type: splitType,
        participants: participantsData,
      });

      successHaptic();
      Alert.alert('Success!', 'Tip pool created', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      errorHaptic();
      console.error('Error creating pool:', error);
      Alert.alert('Error', error.message || 'Failed to create tip pool');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const calculatedParticipants = getCalculatedParticipants();
  const totalHours = getTotalHours();
  const totalPercentage = getTotalPercentage();
  const hourlyRate = totalHours > 0 ? parseFloat(totalAmount || '0') / totalHours : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tip Pool</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Pool Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pool Details</Text>

          {/* Date */}
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputValue}>
              <Text style={styles.inputValueText}>
                {date.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.gray400} />
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Shift Type */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>Shift</Text>
            <View style={styles.shiftButtons}>
              {['breakfast', 'lunch', 'dinner', 'late_night'].map((shift) => (
                <TouchableOpacity
                  key={shift}
                  style={[
                    styles.shiftButton,
                    shiftType === shift && styles.shiftButtonActive,
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setShiftType(shift);
                  }}
                >
                  <Text
                    style={[
                      styles.shiftButtonText,
                      shiftType === shift && styles.shiftButtonTextActive,
                    ]}
                  >
                    {shift.replace('_', ' ').charAt(0).toUpperCase() + shift.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Total Amount */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>Total Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="$0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </View>

        {/* Split Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Method</Text>
          <View style={styles.splitTypeButtons}>
            <TouchableOpacity
              style={[
                styles.splitTypeButton,
                splitType === 'equal_hours' && styles.splitTypeButtonActive,
              ]}
              onPress={() => {
                lightHaptic();
                setSplitType('equal_hours');
              }}
            >
              <Ionicons
                name="time-outline"
                size={24}
                color={splitType === 'equal_hours' ? Colors.white : Colors.gray500}
              />
              <Text
                style={[
                  styles.splitTypeButtonText,
                  splitType === 'equal_hours' && styles.splitTypeButtonTextActive,
                ]}
              >
                Equal Hours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.splitTypeButton,
                splitType === 'custom_percentage' && styles.splitTypeButtonActive,
              ]}
              onPress={() => {
                lightHaptic();
                setSplitType('custom_percentage');
              }}
            >
              <Ionicons
                name="pie-chart-outline"
                size={24}
                color={splitType === 'custom_percentage' ? Colors.white : Colors.gray500}
              />
              <Text
                style={[
                  styles.splitTypeButtonText,
                  splitType === 'custom_percentage' && styles.splitTypeButtonTextActive,
                ]}
              >
                Custom %
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {calculatedParticipants.map((participant) => (
            <TouchableOpacity
              key={participant.user_id}
              style={[
                styles.participantCard,
                participant.selected && styles.participantCardSelected,
              ]}
              onPress={() => toggleParticipant(participant.user_id)}
              disabled={participant.name === 'You'}
            >
              <View style={styles.participantHeader}>
                <View style={styles.participantLeft}>
                  <Ionicons
                    name={participant.selected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={participant.selected ? Colors.primary : Colors.gray400}
                  />
                  <Text style={styles.participantName}>
                    {participant.name}
                    {participant.name === 'You' && ' (Creator)'}
                  </Text>
                </View>
                {participant.has_clock_data && participant.selected && (
                  <View style={styles.clockBadge}>
                    <Ionicons name="time" size={12} color={Colors.success} />
                    <Text style={styles.clockBadgeText}>Clock</Text>
                  </View>
                )}
              </View>

              {participant.selected && (
                <View style={styles.participantInput}>
                  {splitType === 'equal_hours' ? (
                    <>
                      <TextInput
                        style={styles.hoursInput}
                        value={participant.hours_worked.toString()}
                        onChangeText={(val) => updateHours(participant.user_id, val)}
                        placeholder="0.0"
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.gray400}
                      />
                      <Text style={styles.inputUnit}>hours</Text>
                      <Text style={styles.calculatedShare}>
                        {formatCurrency(participant.calculated_share)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <TextInput
                        style={styles.hoursInput}
                        value={participant.percentage.toString()}
                        onChangeText={(val) => updatePercentage(participant.user_id, val)}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.gray400}
                      />
                      <Text style={styles.inputUnit}>%</Text>
                      <Text style={styles.calculatedShare}>
                        {formatCurrency(participant.calculated_share)}
                      </Text>
                    </>
                  )}
                </View>
              )}

              {!participant.has_clock_data && participant.selected && (
                <Text style={styles.noClockWarning}>
                  ⚠️ No clock data - enter hours manually
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            {splitType === 'equal_hours' ? (
              <>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total Hours:</Text>
                  <Text style={styles.previewValue}>{totalHours.toFixed(1)}h</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Hourly Rate:</Text>
                  <Text style={styles.previewValue}>{formatCurrency(hourlyRate)}/hr</Text>
                </View>
              </>
            ) : (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Percentage:</Text>
                <Text
                  style={[
                    styles.previewValue,
                    Math.abs(totalPercentage - 100) > 0.01 && styles.previewValueError,
                  ]}
                >
                  {totalPercentage.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            creating && styles.createButtonDisabled,
          ]}
          onPress={validateAndCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Pool</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  inputRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  inputValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputValueText: {
    fontSize: 16,
    color: Colors.text,
  },
  shiftButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shiftButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shiftButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  shiftButtonText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  shiftButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  amountInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  splitTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  splitTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  splitTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  splitTypeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray600,
  },
  splitTypeButtonTextActive: {
    color: Colors.white,
  },
  participantCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  participantCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  clockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.successLight,
  },
  clockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  participantInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  hoursInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  inputUnit: {
    fontSize: 14,
    color: Colors.gray500,
    marginRight: 8,
  },
  calculatedShare: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  noClockWarning: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 8,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 15,
    color: Colors.gray700,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  previewValueError: {
    color: Colors.error,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
});
