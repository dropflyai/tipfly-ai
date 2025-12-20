import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { lightHaptic, errorHaptic } from '../../utils/haptics';
import { useNavigation } from '@react-navigation/native';

export interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  premiumFeature?: boolean; // If true, shows premium upsell when disabled
}

interface QuickActionsRowProps {
  actions: QuickAction[];
}

export default function QuickActionsRow({ actions }: QuickActionsRowProps) {
  const navigation = useNavigation();

  const handlePress = (action: QuickAction) => {
    if (action.disabled && action.premiumFeature) {
      // Show premium upsell for disabled premium features
      errorHaptic();
      Alert.alert(
        '✨ Premium Feature',
        `${action.label} is a premium feature. Upgrade to TipFly Pro to unlock all features and maximize your earnings insights!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Upgrade Now',
            onPress: () => navigation.navigate('Upgrade' as never),
          },
        ]
      );
      return;
    }

    lightHaptic();
    action.onPress();
  };

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
          onPress={() => handlePress(action)}
          disabled={action.disabled && !action.premiumFeature}
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
