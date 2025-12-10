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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows, GlassStyles } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { signOut } from '../../services/api/supabase';
import { deleteUserAccount, exportUserData } from '../../services/api/user';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, isPremium, clearUser, resetOnboarding } = useUserStore();

  const handleSignOut = () => {
    lightHaptic();
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
              mediumHaptic();
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
    mediumHaptic();
    navigation.navigate('Upgrade' as never);
  };

  const handleExportData = async () => {
    lightHaptic();
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
    lightHaptic();
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
              mediumHaptic();
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
    lightHaptic();
    navigation.navigate('ContactSupport' as never);
  };

  const handleRateApp = () => {
    lightHaptic();
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
    lightHaptic();
    try {
      const shareMessage = Platform.select({
        ios: 'Check out TipFly AI - the best app for tracking tips and managing your earnings!\n\nhttps://apps.apple.com/app/idXXXXXXXX',
        android: 'Check out TipFly AI - the best app for tracking tips and managing your earnings!\n\nhttps://play.google.com/store/apps/details?id=com.tipgenius.app',
      });

      const result = await Share.share({
        message: shareMessage || 'Check out TipFly AI!',
        title: 'Share TipFly AI',
      });

      if (result.action === Share.sharedAction) {
        console.log('App shared successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share app');
    }
  };

  const handleAbout = () => {
    lightHaptic();
    Alert.alert(
      'TipFly AI by DropFly',
      'Track Your Tips, Master Your Money\n\nVersion 1.0.0\n\nPowered by DropFly'
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
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
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              lightHaptic();
              navigation.navigate('EditProfile' as never);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Subscription Section */}
        <View style={[
          styles.subscriptionCard,
          isPremium() && styles.subscriptionCardPremium
        ]}>
          <View style={styles.subscriptionHeader}>
            <View style={[
              styles.subscriptionIconContainer,
              isPremium() && styles.subscriptionIconPremium
            ]}>
              <Ionicons
                name={isPremium() ? "star" : "star-outline"}
                size={24}
                color={isPremium() ? Colors.gold : Colors.primary}
              />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={[
                styles.subscriptionPlan,
                isPremium() && styles.subscriptionPlanPremium
              ]}>
                {isPremium() ? 'Premium' : 'Free Plan'}
              </Text>
              <Text style={styles.subscriptionDesc}>
                {isPremium()
                  ? 'Unlimited history, receipt scanning & more'
                  : 'Upgrade to unlock all features'}
              </Text>
            </View>
          </View>
          {!isPremium() && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.background} />
            </TouchableOpacity>
          )}
        </View>

        {/* Premium Features */}
        {isPremium() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium Features</Text>
            <View style={styles.optionsList}>
              <SettingsOption
                icon="calculator"
                title="Bill Split Calculator"
                iconColor={Colors.gold}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('BillSplit' as never);
                }}
              />
              <SettingsOption
                icon="document-text"
                title="Tax Tracking"
                iconColor={Colors.gold}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('TaxTracking' as never);
                }}
              />
              <SettingsOption
                icon="trophy"
                title="Goals"
                iconColor={Colors.gold}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('Goals' as never);
                }}
              />
              <SettingsOption
                icon="download"
                title="Export Reports"
                iconColor={Colors.gold}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('ExportReports' as never);
                }}
                isLast
              />
            </View>
          </View>
        )}

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.optionsList}>
            <SettingsOption
              icon="briefcase"
              title="Manage Jobs"
              subtitle="Track tips from multiple workplaces"
              onPress={() => {
                lightHaptic();
                navigation.navigate('Jobs' as never);
              }}
            />
            <SettingsOption
              icon="notifications-outline"
              title="Notifications"
              onPress={() => {
                lightHaptic();
                Alert.alert('Coming Soon', 'Notification settings will be available soon');
              }}
            />
            <SettingsOption
              icon="lock-closed-outline"
              title="Privacy"
              onPress={() => {
                lightHaptic();
                navigation.navigate('PrivacySettings' as never);
              }}
              isLast
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
              isLast
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
              value="v1.0.0"
              onPress={handleAbout}
            />
            <SettingsOption
              icon="document-text-outline"
              title="Privacy Policy"
              onPress={() => {
                lightHaptic();
                navigation.navigate('PrivacyPolicy' as never);
              }}
            />
            <SettingsOption
              icon="document-outline"
              title="Terms of Service"
              onPress={() => {
                lightHaptic();
                navigation.navigate('TermsOfService' as never);
              }}
              isLast
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
              titleColor={Colors.error}
              onPress={handleDeleteAccount}
              isLast
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
                  lightHaptic();
                  Alert.alert(
                    'Reset Onboarding',
                    'This will restart the tutorial flow on next app restart.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        onPress: () => {
                          mediumHaptic();
                          resetOnboarding();
                          Alert.alert('Success', 'Onboarding has been reset.');
                        },
                      },
                    ]
                  );
                }}
                isLast
              />
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer with DropFly Branding */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Text style={styles.footerPoweredBy}>Powered by</Text>
            <View style={styles.footerLogoContainer}>
              <Ionicons name="flash" size={16} color={Colors.primary} />
              <Text style={styles.footerBrandName}>DropFly</Text>
            </View>
          </View>
          <Text style={styles.footerTagline}>Made with care for service workers</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsOption({
  icon,
  title,
  subtitle,
  value,
  titleColor,
  iconColor,
  onPress,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  titleColor?: string;
  iconColor?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionItem, isLast && styles.optionItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View style={[
          styles.optionIconContainer,
          iconColor === Colors.gold && styles.optionIconContainerGold
        ]}>
          <Ionicons name={icon} size={20} color={iconColor || Colors.primary} />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, titleColor && { color: titleColor }]}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.optionRight}>
        {value && <Text style={styles.optionValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  // Profile Card - Glass with blue glow
  profileCard: {
    ...GlassStyles.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowBlueSubtle,
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
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Subscription Card
  subscriptionCard: {
    ...GlassStyles.card,
    padding: 20,
    gap: 16,
  },
  subscriptionCardPremium: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...Shadows.glowGoldSubtle,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionIconPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  subscriptionPlanPremium: {
    color: Colors.gold,
  },
  subscriptionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    ...Shadows.buttonGold,
  },
  upgradeButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
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
  optionsList: {
    ...GlassStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 168, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconContainerGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
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
  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    ...GlassStyles.card,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  // Footer with DropFly Branding
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerPoweredBy: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBrandName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
