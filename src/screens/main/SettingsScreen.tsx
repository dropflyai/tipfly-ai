import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { signOut } from '../../services/api/supabase';
import { deleteUserAccount, exportUserData } from '../../services/api/user';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, isPremium, clearUser, resetOnboarding } = useUserStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              clearUser();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate('Upgrade' as never);
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      Alert.alert(
        'Data Exported',
        'Your data has been prepared. In production, this would download a JSON file.',
        [{ text: 'OK' }]
      );
      console.log('Exported data:', data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export data');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'Last chance! This will delete:\n\n• All your tip entries\n• All your goals\n• All your data\n• Your account\n\nType DELETE to confirm',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount();
              clearUser();
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    navigation.navigate('ContactSupport' as never);
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/idXXXXXXXX', // TODO: Replace with actual App Store ID
      android: 'https://play.google.com/store/apps/details?id=com.tipgenius.app',
    });

    if (storeUrl) {
      Linking.canOpenURL(storeUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(storeUrl);
          } else {
            Alert.alert('Error', 'Could not open store');
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Could not open store');
        });
    }
  };

  const handleShareApp = async () => {
    try {
      const shareMessage = Platform.select({
        ios: 'Check out TipFly AI - the best app for tracking tips and managing your earnings! 💰\n\nhttps://apps.apple.com/app/idXXXXXXXX',
        android: 'Check out TipFly AI - the best app for tracking tips and managing your earnings! 💰\n\nhttps://play.google.com/store/apps/details?id=com.tipgenius.app',
      });

      const result = await Share.share({
        message: shareMessage || 'Check out TipFly AI!',
        title: 'Share TipFly AI',
      });

      if (result.action === Share.sharedAction) {
        // Shared successfully
        console.log('App shared successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share app');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionPlan}>
                {isPremium() ? '✨ Premium' : 'Free Plan'}
              </Text>
              <Text style={styles.subscriptionDesc}>
                {isPremium()
                  ? 'Unlimited history, receipt scanning & more'
                  : 'Upgrade to unlock all features'}
              </Text>
            </View>
            {!isPremium() && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Premium Features */}
        {isPremium() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium Features</Text>

            <View style={styles.optionsList}>
              <SettingsOption
                icon="calculator"
                title="Bill Split Calculator"
                onPress={() => navigation.navigate('BillSplit' as never)}
              />
              <SettingsOption
                icon="document-text"
                title="Tax Tracking"
                onPress={() => navigation.navigate('TaxTracking' as never)}
              />
              <SettingsOption
                icon="trophy"
                title="Goals"
                onPress={() => navigation.navigate('Goals' as never)}
              />
              <SettingsOption
                icon="download"
                title="Export Reports"
                onPress={() => navigation.navigate('ExportReports' as never)}
              />
            </View>
          </View>
        )}

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.optionsList}>
            <SettingsOption
              icon="person-outline"
              title="Edit Profile"
              onPress={() => navigation.navigate('EditProfile' as never)}
            />
            <SettingsOption
              icon="briefcase"
              title="Manage Jobs"
              subtitle="Track tips from multiple workplaces"
              onPress={() => navigation.navigate('Jobs' as never)}
            />
            <SettingsOption
              icon="briefcase-outline"
              title="Job Type"
              value={user?.job_title || 'Not set'}
              onPress={() => navigation.navigate('EditProfile' as never)}
            />
            <SettingsOption
              icon="notifications-outline"
              title="Notifications"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
            />
            <SettingsOption
              icon="lock-closed-outline"
              title="Privacy"
              onPress={() => navigation.navigate('PrivacySettings' as never)}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.optionsList}>
            <SettingsOption
              icon="mail-outline"
              title="Contact Support"
              onPress={handleContactSupport}
            />
            <SettingsOption
              icon="star-outline"
              title="Rate TipFly AI"
              onPress={handleRateApp}
            />
            <SettingsOption
              icon="share-social-outline"
              title="Share with Friends"
              onPress={handleShareApp}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.optionsList}>
            <SettingsOption
              icon="information-circle-outline"
              title="About TipFly AI"
              value="Version 1.0.0"
              onPress={() => Alert.alert('TipFly AI', 'Track Your Tips, Master Your Money\n\nVersion 1.0.0')}
            />
            <SettingsOption
              icon="document-text-outline"
              title="Privacy Policy"
              onPress={() => navigation.navigate('PrivacyPolicy' as never)}
            />
            <SettingsOption
              icon="document-outline"
              title="Terms of Service"
              onPress={() => navigation.navigate('TermsOfService' as never)}
            />
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <View style={styles.optionsList}>
            <SettingsOption
              icon="download-outline"
              title="Export My Data"
              onPress={handleExportData}
            />
            <SettingsOption
              icon="trash-outline"
              title="Delete Account"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        {/* Developer Options */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>

            <View style={styles.optionsList}>
              <SettingsOption
                icon="refresh-outline"
                title="Reset Onboarding"
                onPress={() => {
                  Alert.alert(
                    'Reset Onboarding',
                    'This will restart the tutorial flow on next app restart.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        onPress: () => {
                          resetOnboarding();
                          Alert.alert('Success', 'Onboarding has been reset. The tutorial will show on next app restart.');
                        },
                      },
                    ]
                  );
                }}
              />
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          Made with ❤️ for service workers
        </Text>
      </ScrollView>
    </View>
  );
}

function SettingsOption({
  icon,
  title,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={22} color={Colors.textSecondary} />
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      <View style={styles.optionRight}>
        {value && <Text style={styles.optionValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
    paddingBottom: 120,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  subscriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subscriptionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  optionsList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: Colors.text,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footer: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
