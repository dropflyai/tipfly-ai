import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { usePendingPoolsStore } from '../../store/pendingPoolsStore';
import { getUserWorkplaces } from '../../services/api/teams';
import { lightHaptic } from '../../utils/haptics';

export default function TipPoolCard() {
  const navigation = useNavigation();
  const pendingCount = usePendingPoolsStore((state) => state.pendingCount);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    loadTeamCount();
  }, []);

  const loadTeamCount = async () => {
    try {
      const workplaces = await getUserWorkplaces();
      setTeamCount(workplaces.length);
    } catch {
      // Non-critical
    }
  };

  const handlePress = () => {
    lightHaptic();
    navigation.navigate('Teams' as never);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="people" size={22} color={Colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Tip Pooling</Text>
        <Text style={styles.subtitle}>
          {teamCount > 0
            ? `${teamCount} team${teamCount > 1 ? 's' : ''}`
            : 'Split tips with your team'}
        </Text>
      </View>

      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderBlue,
    ...Shadows.medium,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.backgroundDark,
  },
});
