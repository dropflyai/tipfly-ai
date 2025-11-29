import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { TipEntry } from '../../types';
import { formatCurrency, formatHours } from '../../utils/formatting';
import { lightHaptic } from '../../utils/haptics';

interface RecentEntriesSectionProps {
  entries: TipEntry[];
  onSeeAll?: () => void;
  onEntryPress?: (entry: TipEntry) => void;
}

export default function RecentEntriesSection({
  entries,
  onSeeAll,
  onEntryPress,
}: RecentEntriesSectionProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Entries</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={Colors.gray300} />
          <Text style={styles.emptyText}>No tip entries yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to add your first entry
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Entries</Text>
        {onSeeAll && entries.length > 3 && (
          <TouchableOpacity
            onPress={() => {
              lightHaptic();
              onSeeAll();
            }}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.entriesList}>
        {entries.slice(0, 5).map((entry) => {
          const hourlyRate = entry.tips_earned / entry.hours_worked;
          const entryDate = new Date(entry.date);
          const isToday = entryDate.toDateString() === new Date().toDateString();

          return (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => {
                lightHaptic();
                onEntryPress?.(entry);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.entryLeft}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dayText}>
                    {entryDate.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.dateText}>
                    {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.entryDetails}>
                  <Text style={styles.amountText}>{formatCurrency(entry.tips_earned)}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {formatHours(entry.hours_worked)} • ${hourlyRate.toFixed(2)}/hr
                    </Text>
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>Today</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          );
        })}
      </View>
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
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  dateContainer: {
    alignItems: 'center',
    minWidth: 48,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  entryDetails: {
    flex: 1,
    gap: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  todayBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray400,
    textAlign: 'center',
  },
});
