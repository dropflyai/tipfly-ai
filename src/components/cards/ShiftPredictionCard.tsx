import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ShiftPrediction } from '../../services/ai/predictions';
import { formatCurrency } from '../../utils/formatting';
import { lightHaptic } from '../../utils/haptics';

interface ShiftPredictionCardProps {
  prediction: ShiftPrediction | null;
  loading?: boolean;
  onRefresh?: () => void;
  isPremium?: boolean;
}

export default function ShiftPredictionCard({
  prediction,
  loading,
  onRefresh,
  isPremium,
}: ShiftPredictionCardProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color={Colors.gray400} />
          <Text style={styles.emptyText}>
            Log a few more shifts to see AI predictions!
          </Text>
        </View>
      </View>
    );
  }

  const confidencePercent = Math.round(prediction.confidence * 100);
  const avgExpected = (prediction.expectedRange[0] + prediction.expectedRange[1]) / 2;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>AI Prediction</Text>
        </View>
        {onRefresh && (
          <TouchableOpacity
            onPress={() => {
              lightHaptic();
              onRefresh();
            }}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Prediction Content */}
      <View style={styles.predictionContent}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{prediction.dayOfWeek}</Text>
          <Text style={styles.shiftTypeText}>{prediction.shiftType}</Text>
        </View>

        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>Expected Earnings</Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(prediction.expectedRange[0])} - {formatCurrency(prediction.expectedRange[1])}
          </Text>
          <Text style={styles.earningsAverage}>
            ~{formatCurrency(avgExpected)} average
          </Text>
        </View>

        {/* Confidence Indicator */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${confidencePercent}%`,
                  backgroundColor: getConfidenceColor(prediction.confidence),
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>{confidencePercent}% confidence</Text>
        </View>

        {/* Reasoning */}
        <View style={styles.reasoningContainer}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.reasoningText}>{prediction.reasoning}</Text>
        </View>

        {/* Suggestion */}
        {prediction.suggestion && (
          <View style={styles.suggestionContainer}>
            <Ionicons name="bulb" size={20} color={Colors.accent} />
            <Text style={styles.suggestionText}>{prediction.suggestion}</Text>
          </View>
        )}
      </View>

      {/* Premium Upsell for Free Users */}
      {!isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>
            ✨ Premium: Unlimited predictions + advanced insights
          </Text>
        </View>
      )}
    </View>
  );
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return Colors.success;
  if (confidence >= 0.6) return Colors.primary;
  return Colors.warning;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  predictionContent: {
    gap: 16,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  dayBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  shiftTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  earningsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  earningsLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  earningsAverage: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confidenceContainer: {
    gap: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'right',
  },
  reasoningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.gray50,
    padding: 12,
    borderRadius: 8,
  },
  reasoningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.accentLight + '20',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  premiumBadge: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  premiumBadgeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
