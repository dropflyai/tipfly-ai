import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlassStyles } from '../../constants/colors';
import { useNotificationStore } from '../../store/notificationStore';
import { useUserStore } from '../../store/userStore';
import {
  NOTIFICATION_CONFIGS,
  NotificationType,
} from '../../types/notifications';
import {
  initializeNotifications,
  updateScheduledNotifications,
} from '../../services/notifications/notificationService';
import { lightHaptic } from '../../utils/haptics';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { preferences, setPreference, hasPermission, setHasPermission } =
    useNotificationStore();
  const { isPremium } = useUserStore();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Check permission status on mount
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setIsInitializing(true);
    await initializeNotifications();
    setIsInitializing(false);
  };

  const handleToggle = async (key: NotificationType, value: boolean) => {
    lightHaptic();

    // Check if this is a premium feature
    const config = NOTIFICATION_CONFIGS.find((c) => c.key === key);
    if (config?.isPremium && !isPremium()) {
      Alert.alert(
        'Premium Feature',
        'Tax reminders are available for Premium subscribers.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => navigation.navigate('Upgrade' as never),
          },
        ]
      );
      return;
    }

    // Update preference
    setPreference(key, value);

    // Update scheduled notifications
    await updateScheduledNotifications();
  };

  const handleEnableNotifications = async () => {
    lightHaptic();
    if (Platform.OS === 'ios') {
      // On iOS, we need to open settings if permission was denied
      Alert.alert(
        'Enable Notifications',
        'To receive notifications, please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    } else {
      // On Android, we can request again
      await checkPermissions();
    }
  };

  const renderToggleItem = (
    key: NotificationType,
    title: string,
    description: string,
    isPremiumFeature?: boolean,
    isTeamFeature?: boolean
  ) => {
    const isEnabled = preferences[key];
    const isLocked = isPremiumFeature && !isPremium();

    return (
      <View key={key} style={styles.toggleItem}>
        <View style={styles.toggleInfo}>
          <View style={styles.toggleTitleRow}>
            <Text style={styles.toggleTitle}>{title}</Text>
            {isPremiumFeature && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color={Colors.gold} />
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}
            {isTeamFeature && (
              <View style={styles.teamBadge}>
                <Ionicons name="people" size={10} color={Colors.primary} />
              </View>
            )}
          </View>
          <Text style={styles.toggleDescription}>{description}</Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(value) => handleToggle(key, value)}
          trackColor={{
            false: 'rgba(255, 255, 255, 0.1)',
            true: isLocked ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 168, 232, 0.5)',
          }}
          thumbColor={isEnabled ? (isLocked ? Colors.gold : Colors.primary) : Colors.gray500}
          ios_backgroundColor="rgba(255, 255, 255, 0.1)"
          disabled={!hasPermission}
        />
      </View>
    );
  };

  // Group notifications by category
  const localNotifications = NOTIFICATION_CONFIGS.filter(
    (c) => !c.isTeamFeature && c.key !== 'announcements'
  );
  const teamNotifications = NOTIFICATION_CONFIGS.filter((c) => c.isTeamFeature);
  const generalNotifications = NOTIFICATION_CONFIGS.filter(
    (c) => c.key === 'announcements'
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Permission Banner */}
        {!hasPermission && (
          <TouchableOpacity
            style={styles.permissionBanner}
            onPress={handleEnableNotifications}
            activeOpacity={0.8}
          >
            <View style={styles.permissionIcon}>
              <Ionicons name="notifications-off" size={24} color={Colors.warning} />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionDescription}>
                Tap to enable notifications in settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Earnings & Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings & Goals</Text>
          <View style={styles.toggleList}>
            {localNotifications.map((config) =>
              renderToggleItem(
                config.key,
                config.title,
                config.description,
                config.isPremium
              )
            )}
          </View>
        </View>

        {/* Teams Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teams</Text>
          <View style={styles.toggleList}>
            {teamNotifications.map((config) =>
              renderToggleItem(
                config.key,
                config.title,
                config.description,
                config.isPremium,
                config.isTeamFeature
              )
            )}
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.toggleList}>
            {generalNotifications.map((config) =>
              renderToggleItem(config.key, config.title, config.description)
            )}
          </View>
        </View>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.footerText}>
            You can change these settings at any time. Some notifications require
            an active internet connection.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  // Permission Banner
  permissionBanner: {
    ...GlassStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Sections
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  toggleList: {
    ...GlassStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  toggleDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
  },
  teamBadge: {
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    padding: 4,
    borderRadius: 4,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
