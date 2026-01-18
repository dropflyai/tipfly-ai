import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { TipEntry } from '../../../types';
import { formatCurrency, formatHours } from '../../../utils/formatting';
import { lightHaptic } from '../../../utils/haptics';

interface ListViewProps {
  tipEntries: TipEntry[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface GroupedEntry {
  date: string;
  displayDate: string;
  total: number;
  entries: TipEntry[];
}

type FilterType = 'all' | 'day' | 'night' | 'double';

export default function ListView({ tipEntries, selectedDate, onDateSelect }: ListViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Group entries by date
  const groupedEntries = useMemo(() => {
    // Filter entries based on shift type
    let filteredEntries = tipEntries;
    if (filter !== 'all') {
      filteredEntries = tipEntries.filter(e => e.shift_type === filter);
    }

    // Group by date
    const grouped = new Map<string, TipEntry[]>();
    filteredEntries.forEach(entry => {
      const existing = grouped.get(entry.date) || [];
      grouped.set(entry.date, [...existing, entry]);
    });

    // Convert to section list format
    const sections: GroupedEntry[] = [];
    grouped.forEach((entries, date) => {
      const total = entries.reduce((sum, e) => sum + e.tips_earned, 0);
      sections.push({
        date,
        displayDate: formatDateHeader(date),
        total,
        entries,
      });
    });

    // Sort by date descending (most recent first)
    sections.sort((a, b) => b.date.localeCompare(a.date));

    return sections;
  }, [tipEntries, filter]);

  const handleFilterChange = (newFilter: FilterType) => {
    lightHaptic();
    setFilter(newFilter);
  };

  const handleEntryPress = (entry: TipEntry) => {
    lightHaptic();
    onDateSelect(new Date(entry.date));
  };

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'day' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('day')}
        >
          <Text style={[styles.filterText, filter === 'day' && styles.filterTextActive]}>
            Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'night' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('night')}
        >
          <Text style={[styles.filterText, filter === 'night' && styles.filterTextActive]}>
            Night
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'double' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('double')}
        >
          <Text style={[styles.filterText, filter === 'double' && styles.filterTextActive]}>
            Double
          </Text>
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      {groupedEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>No Tips Found</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all'
              ? 'No tip entries for this month'
              : `No ${filter} shift entries for this month`}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {groupedEntries.map((group, index) => (
            <View key={group.date} style={styles.dateSection}>
              {/* Date Header */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>{group.displayDate}</Text>
                <Text style={styles.dateHeaderTotal}>{formatCurrency(group.total)}</Text>
              </View>

              {/* Entries for this date */}
              <View style={styles.entriesContainer}>
                {group.entries.map((entry, entryIndex) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    onPress={() => handleEntryPress(entry)}
                    activeOpacity={0.7}
                  >
                    {/* Left: Shift Info */}
                    <View style={styles.entryLeft}>
                      <View style={[styles.shiftIndicator, getShiftColor(entry.shift_type)]} />
                      <View style={styles.entryInfo}>
                        <Text style={styles.shiftLabel}>{getShiftLabel(entry.shift_type)}</Text>
                        <View style={styles.entryMeta}>
                          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.hoursText}>{formatHours(entry.hours_worked)}</Text>
                          {entry.notes && (
                            <>
                              <Text style={styles.metaDot}>•</Text>
                              <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
                            </>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Right: Amount & Rate */}
                    <View style={styles.entryRight}>
                      <Text style={styles.entryAmount}>{formatCurrency(entry.tips_earned)}</Text>
                      <Text style={styles.hourlyRate}>
                        {formatCurrency(entry.tips_earned / entry.hours_worked)}/hr
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day Summary */}
              <View style={styles.daySummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Hours</Text>
                  <Text style={styles.summaryValue}>
                    {group.entries.reduce((sum, e) => sum + e.hours_worked, 0).toFixed(1)}h
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Rate</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(
                      group.total / group.entries.reduce((sum, e) => sum + e.hours_worked, 0)
                    )}/hr
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Entries</Text>
                  <Text style={styles.summaryValue}>{group.entries.length}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}

function getShiftLabel(shift: string): string {
  const labels: Record<string, string> = {
    day: 'Day Shift',
    night: 'Night Shift',
    double: 'Double Shift',
    other: 'Other',
  };
  return labels[shift] || 'Other';
}

function getShiftColor(shift: string): object {
  const colors: Record<string, object> = {
    day: { backgroundColor: Colors.warning },
    night: { backgroundColor: Colors.info },
    double: { backgroundColor: Colors.success },
    other: { backgroundColor: Colors.gray400 },
  };
  return colors[shift] || { backgroundColor: Colors.gray400 };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  dateHeaderTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  entriesContainer: {
    gap: 8,
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  shiftIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  entryInfo: {
    flex: 1,
  },
  shiftLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: 4,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  hourlyRate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  daySummary: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
