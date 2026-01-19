import React, { useMemo } from 'react';
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
import { Colors, Shadows } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { signOut } from '../../services/api/supabase';
import { deleteUserAccount, exportUserData } from '../../services/api/user';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/formatting';

export default function SettingsScreenV2() {
  const navigation = useNavigation();
  const { user, isPremium, clearUser } = useUserStore();

  // Calculate user stats for the profile hero
  const memberSince = useMemo(() => {
    if (!user?.created_at) return 'New Member';
    const date = new Date(user.created_at);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Member since ${months[date.getMonth()]} ${date.getFullYear()}`;
  }, [user?.created_at]);

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
        'Your data has been prepared for download.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export data');
    }
  };

  const handleDeleteAccount = () => {
    lightHaptic();
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All your tip history, goals, and account data will be permanently deleted.',
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
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    lightHaptic();
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/idXXXXXXXX',
      android: 'https://play.google.com/store/apps/details?id=com.tipgenius.app',
    });

    if (storeUrl) {
      Linking.canOpenURL(storeUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(storeUrl);
          }
        })
        .catch(() => {});
    }
  };

  const handleShareApp = async () => {
    lightHaptic();
    try {
      const shareMessage = 'Check out TipFly AI - the best app for tracking tips! https://tipflyai.app';
      await Share.share({ message: shareMessage, title: 'Share TipFly AI' });
    } catch (error) {}
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Hero Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.memberSince}>{memberSince}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                lightHaptic();
                navigation.navigate('EditProfile' as never);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Subscription Status */}
          <TouchableOpacity
            style={[styles.subscriptionBanner, isPremium() && styles.subscriptionBannerPremium]}
            onPress={!isPremium() ? handleUpgrade : undefined}
            activeOpacity={isPremium() ? 1 : 0.8}
          >
            <View style={styles.subscriptionLeft}>
              <Ionicons
                name={isPremium() ? 'star' : 'star-outline'}
                size={20}
                color={isPremium() ? Colors.gold : Colors.primary}
              />
              <View>
                <Text style={[styles.subscriptionTitle, isPremium() && styles.subscriptionTitlePremium]}>
                  {isPremium() ? 'Premium Member' : 'Free Plan'}
                </Text>
                <Text style={styles.subscriptionSubtitle}>
                  {isPremium() ? 'All features unlocked' : 'Upgrade for more features'}
                </Text>
              </View>
            </View>
            {!isPremium() && (
              <View style={styles.upgradeChip}>
                <Text style={styles.upgradeChipText}>Upgrade</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Premium Features - Only for Premium Users */}
        {isPremium() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={16} color={Colors.gold} />
              <Text style={styles.sectionTitle}>Premium Features</Text>
            </View>
            <View style={styles.menuCard}>
              <MenuItem
                icon="calculator"
                iconColor={Colors.gold}
                title="Bill Split Calculator"
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('BillSplit' as never);
                }}
              />
              <MenuItem
                icon="document-text"
                iconColor={Colors.gold}
                title="Tax Tracking"
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('TaxTracking' as never);
                }}
              />
              <MenuItem
                icon="trophy"
                iconColor={Colors.gold}
                title="Goals"
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('Goals' as never);
                }}
              />
              <MenuItem
                icon="download"
                iconColor={Colors.gold}
                title="Export Reports"
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('ExportReports' as never);
                }}
              />
              <MenuItem
                icon="document-text"
                iconColor={Colors.gold}
                title="Income Summary"
                subtitle="For apartments, loans & more"
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('IncomeVerification' as never);
                }}
                isLast
              />
            </View>
          </View>
        )}

        {/* App Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuItem
              icon="briefcase-outline"
              title="Manage Jobs"
              subtitle="Track tips from multiple workplaces"
              onPress={() => {
                lightHaptic();
                navigation.navigate('Jobs' as never);
              }}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => {
                lightHaptic();
                navigation.navigate('NotificationSettings' as never);
              }}
            />
            <MenuItem
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

        {/* Support & Feedback */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Support</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuItem
              icon="play-circle-outline"
              title="Replay App Tour"
              onPress={() => {
                lightHaptic();
                resetTour();
                Alert.alert('Tour Reset', 'The app tour will play next time you open the Home screen.');
              }}
            />
            <MenuItem
              icon="mail-outline"
              title="Contact Support"
              onPress={() => {
                lightHaptic();
                navigation.navigate('ContactSupport' as never);
              }}
            />
            <MenuItem
              icon="star-outline"
              title="Rate TipFly AI"
              onPress={handleRateApp}
            />
            <MenuItem
              icon="share-social-outline"
              title="Share with Friends"
              onPress={handleShareApp}
              isLast
            />
          </View>
        </View>

        {/* About & Legal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuItem
              icon="information-circle-outline"
              title="About TipFly AI"
              value="v1.0.0"
              onPress={() => {
                lightHaptic();
                Alert.alert('TipFly AI', 'Track Your Tips, Master Your Money\n\nVersion 1.0.0\nPowered by DropFly');
              }}
            />
            <MenuItem
              icon="document-text-outline"
              title="Privacy Policy"
              onPress={() => {
                lightHaptic();
                navigation.navigate('PrivacyPolicy' as never);
              }}
            />
            <MenuItem
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

        {/* Data & Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
          </View>
          <View style={styles.menuCard}>
            <MenuItem
              icon="download-outline"
              title="Export My Data"
              onPress={handleExportData}
            />
            <MenuItem
              icon="trash-outline"
              title="Delete Account"
              titleColor={Colors.error}
              onPress={handleDeleteAccount}
              isLast
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by</Text>
          <View style={styles.footerBrand}>
            <Ionicons name="flash" size={14} color={Colors.primary} />
            <Text style={styles.footerBrandText}>DropFly</Text>
          </View>
          <Text style={styles.footerTagline}>Made with care for service workers</Text>
        </View>
      </ScrollView>
    </View>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  titleColor?: string;
  onPress: () => void;
  isLast?: boolean;
}

function MenuItem({
  icon,
  iconColor = Colors.primary,
  title,
  subtitle,
  value,
  titleColor,
  onPress,
  isLast,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, iconColor === Colors.gold && styles.menuIconGold]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, titleColor && { color: titleColor }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
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
    fontWeight: '800',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowBlueSubtle,
  },
  avatarText: {
    fontSize: 24,
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
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subscriptionBannerPremium: {
    borderColor: Colors.gold + '40',
    backgroundColor: Colors.gold + '10',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  subscriptionTitlePremium: {
    color: Colors.gold,
  },
  subscriptionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upgradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  upgradeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconGold: {
    backgroundColor: Colors.gold + '15',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBrandText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerTagline: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
