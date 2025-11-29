import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors } from '../../constants/colors';
import { Goal, calculateProgress, getGoalPeriodLabel } from '../../services/api/goals';
import { formatCurrency } from '../../utils/formatting';
import { lightHaptic } from '../../utils/haptics';

interface GoalsSectionProps {
  goals: Goal[];
  onViewAll?: () => void;
  onCreateGoal?: () => void;
  onGoalPress?: (goal: Goal) => void;
  isPremium?: boolean;
}

export default function GoalsSection({
  goals,
  onViewAll,
  onCreateGoal,
  onGoalPress,
  isPremium = false,
}: GoalsSectionProps) {
  if (goals.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Goals</Text>
        </View>
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={() => {
            lightHaptic();
            onCreateGoal?.();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="flag" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Set Your First Goal</Text>
          <Text style={styles.emptyText}>
            Track your progress and stay motivated
          </Text>
          <View style={styles.setGoalButton}>
            <Text style={styles.setGoalButtonText}>Set Goal</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Goals</Text>
        {onViewAll && goals.length > 2 && (
          <TouchableOpacity
            onPress={() => {
              lightHaptic();
              onViewAll();
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.goalsList}>
        {goals.slice(0, 2).map((goal) => {
          const progressPercent = calculateProgress(goal);
          const isComplete = goal.status === 'completed';

          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onPress={() => {
                lightHaptic();
                onGoalPress?.(goal);
              }}
              activeOpacity={0.7}
            >
              {isComplete && (
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.completeText}>Complete!</Text>
                </View>
              )}

              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Ionicons
                    name="flag"
                    size={20}
                    color={isComplete ? Colors.success : Colors.primary}
                  />
                  <Text style={styles.goalTitle}>
                    {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal
                  </Text>
                </View>
                <Text style={styles.goalPeriod}>{getGoalPeriodLabel(goal)}</Text>
              </View>

              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                </Text>
                <Text style={[styles.progressPercent, isComplete && styles.progressPercentComplete]}>
                  {progressPercent.toFixed(0)}%
                </Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <LinearGradient
                    colors={isComplete ? GradientColors.success : GradientColors.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isPremium && onCreateGoal && (
        <TouchableOpacity
          style={styles.addGoalButton}
          onPress={() => {
            lightHaptic();
            onCreateGoal();
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addGoalText}>Add Another Goal</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  goalPeriod: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressPercentComplete: {
    color: Colors.success,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  setGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  setGoalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
  },
  addGoalText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
