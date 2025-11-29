// Goals Management Screen - Create, view, and manage savings goals
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import {
  Goal,
  getGoals,
  createGoal,
  deleteGoal,
  calculateProgress,
  getGoalPeriodLabel,
  updateGoalProgress,
} from '../../services/api/goals';
import { useFocusEffect } from '@react-navigation/native';

export default function GoalsScreen() {
  const { isPremium } = useUserStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [targetAmount, setTargetAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Fetch goals when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isPremium()) {
        loadGoals();
      }
    }, [isPremium])
  );

  const loadGoals = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      // Update progress first
      await updateGoalProgress();
      // Then fetch goals
      const data = await getGoals();
      setGoals(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load goals');
    } finally {
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals(true);
    setRefreshing(false);
  };

  const handleCreateGoal = async () => {
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid target amount');
      return;
    }

    try {
      setCreating(true);
      await createGoal({
        goal_type: selectedGoalType,
        target_amount: parseFloat(targetAmount),
      });

      Alert.alert('Success', 'Goal created successfully!');
      setShowCreateModal(false);
      setTargetAmount('');
      loadGoals();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGoal = (goalId: string, goalType: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete this ${goalType} goal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalId);
              Alert.alert('Deleted', 'Goal deleted successfully');
              loadGoals();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  // Premium lock for free users
  if (!isPremium()) {
    return (
      <View style={styles.container}>
        <View style={styles.upgradeContainer}>
          <Ionicons name="trophy" size={64} color={Colors.primary} />
          <Text style={styles.upgradeTitle}>Premium Feature</Text>
          <Text style={styles.upgradeText}>
            Set daily, weekly, and monthly goals to stay motivated and track your progress.
          </Text>
          <Text style={styles.upgradeFeatures}>
            • Track multiple goals at once{'\n'}
            • Automatic progress updates{'\n'}
            • Goal completion celebrations{'\n'}
            • Historical goal tracking
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </View>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const failedGoals = goals.filter(g => g.status === 'failed');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Goals</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color={Colors.white} />
            <Text style={styles.createButtonText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={() => handleDeleteGoal(goal.id, goal.goal_type)}
              />
            ))}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Goals 🎉</Text>
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={() => handleDeleteGoal(goal.id, goal.goal_type)}
              />
            ))}
          </View>
        )}

        {/* Failed Goals */}
        {failedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Goals</Text>
            {failedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={() => handleDeleteGoal(goal.id, goal.goal_type)}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No Goals Yet</Text>
            <Text style={styles.emptyText}>
              Set your first goal to start tracking your progress!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Goal Setting Tips</Text>
          <Text style={styles.tipsText}>
            • Start with small, achievable goals{'\n'}
            • Track multiple goals to stay motivated{'\n'}
            • Review your progress regularly{'\n'}
            • Celebrate when you reach your targets!
          </Text>
        </View>
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Goal</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Goal Type Selection */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Goal Period</Text>
              <View style={styles.goalTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    selectedGoalType === 'daily' && styles.goalTypeButtonActive,
                  ]}
                  onPress={() => setSelectedGoalType('daily')}
                >
                  <Ionicons
                    name="today"
                    size={24}
                    color={selectedGoalType === 'daily' ? Colors.white : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.goalTypeLabel,
                      selectedGoalType === 'daily' && styles.goalTypeLabelActive,
                    ]}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    selectedGoalType === 'weekly' && styles.goalTypeButtonActive,
                  ]}
                  onPress={() => setSelectedGoalType('weekly')}
                >
                  <Ionicons
                    name="calendar"
                    size={24}
                    color={selectedGoalType === 'weekly' ? Colors.white : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.goalTypeLabel,
                      selectedGoalType === 'weekly' && styles.goalTypeLabelActive,
                    ]}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    selectedGoalType === 'monthly' && styles.goalTypeButtonActive,
                  ]}
                  onPress={() => setSelectedGoalType('monthly')}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={selectedGoalType === 'monthly' ? Colors.white : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.goalTypeLabel,
                      selectedGoalType === 'monthly' && styles.goalTypeLabelActive,
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Target Amount */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Target Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0.00"
                  placeholderTextColor={Colors.inputPlaceholder}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {targetAmount && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => Keyboard.dismiss()}
                  >
                    <Ionicons name="checkmark-circle" size={28} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.modalButton, creating && styles.modalButtonDisabled]}
              onPress={handleCreateGoal}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.modalButtonText}>Create Goal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Goal Card Component
function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: () => void }) {
  const progress = calculateProgress(goal);
  const periodLabel = getGoalPeriodLabel(goal);

  const getStatusColor = () => {
    switch (goal.status) {
      case 'completed':
        return Colors.success;
      case 'failed':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const getStatusIcon = () => {
    switch (goal.status) {
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTypeContainer}>
          <Ionicons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text style={[styles.goalType, { color: getStatusColor() }]}>
            {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <Text style={styles.goalPeriod}>{periodLabel}</Text>

      <View style={styles.goalAmounts}>
        <Text style={styles.goalCurrent}>${goal.current_amount.toFixed(2)}</Text>
        <Text style={styles.goalTarget}>of ${goal.target_amount.toFixed(2)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress}%`,
              backgroundColor: getStatusColor(),
            },
          ]}
        />
      </View>

      <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>

      {goal.status === 'completed' && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>🎉 Goal Reached!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalPeriod: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  goalCurrent: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  goalTarget: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  completedBadge: {
    backgroundColor: Colors.success + '20',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: Colors.accent + '20',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  upgradeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeFeatures: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 24,
    marginTop: 8,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  formSection: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  goalTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  goalTypeButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundTertiary,
  },
  goalTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  goalTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  goalTypeLabelActive: {
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.text,
    paddingVertical: 16,
  },
  doneButton: {
    padding: 4,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
