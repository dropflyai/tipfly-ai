import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { lightHaptic } from '../../utils/haptics';

export interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

interface QuickActionsRowProps {
  actions: QuickAction[];
}

export default function QuickActionsRow({ actions }: QuickActionsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.actionButton, action.disabled && styles.actionButtonDisabled]}
          onPress={() => {
            lightHaptic();
            action.onPress();
          }}
          disabled={action.disabled}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: action.color || Colors.primary + '15' },
            ]}
          >
            <Ionicons
              name={action.icon}
              size={24}
              color={action.color || Colors.primary}
            />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    width: 80,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});
