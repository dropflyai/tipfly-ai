import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { DailyInsight } from '../../services/ai/insights';
import { lightHaptic } from '../../utils/haptics';

interface DailyInsightCardProps {
  insight: DailyInsight | null;
  loading?: boolean;
  onRefresh?: () => void;
  isPremium?: boolean;
}

export default function DailyInsightCard({
  insight,
  loading,
  onRefresh,
  isPremium,
}: DailyInsightCardProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating insight...</Text>
        </View>
      </View>
    );
  }

  if (!insight) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bulb-outline" size={32} color={Colors.gray400} />
          <Text style={styles.emptyText}>Log more shifts to unlock insights!</Text>
        </View>
      </View>
    );
  }

  // Category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'earnings':
        return Colors.success;
      case 'schedule':
        return Colors.primary;
      case 'efficiency':
        return Colors.accent;
      case 'trends':
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };

  const categoryColor = getCategoryColor(insight.category);

  return (
    <View style={[styles.container, { borderLeftColor: categoryColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{insight.emoji}</Text>
          <View>
            <Text style={styles.headerTitle}>Daily Insight</Text>
            <Text style={[styles.category, { color: categoryColor }]}>
              {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
            </Text>
          </View>
        </View>
        {onRefresh && (
          <TouchableOpacity
            onPress={() => {
              lightHaptic();
              onRefresh();
            }}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Insight Content */}
      <View style={styles.content}>
        <Text style={styles.insightText}>{insight.insight}</Text>

        <View style={styles.actionContainer}>
          <Ionicons name="arrow-forward-circle" size={20} color={categoryColor} />
          <Text style={styles.actionText}>{insight.action}</Text>
        </View>

        <View style={styles.impactContainer}>
          <Ionicons name="trending-up" size={16} color={Colors.textSecondary} />
          <Text style={styles.impactText}>{insight.impact}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    gap: 12,
  },
  insightText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.gray50,
    padding: 12,
    borderRadius: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
