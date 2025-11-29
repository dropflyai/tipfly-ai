import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useAppLockStore } from '../../store/appLockStore';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  const isAppLockEnabled = useAppLockStore((state) => state.isAppLockEnabled);
  const setAppLockEnabled = useAppLockStore((state) => state.setAppLockEnabled);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(hasHardware && isEnrolled);

      // Get the type of biometrics available
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris Scan');
      }
    } catch (error) {
      console.error('[PrivacySettings] Error checking biometrics:', error);
      setBiometricsAvailable(false);
    }
  };

  const handleToggleAppLock = async (enabled: boolean) => {
    lightHaptic();

    if (enabled) {
      // Verify biometrics work before enabling
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable App Lock',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          mediumHaptic();
          setAppLockEnabled(true);
          Alert.alert(
            'App Lock Enabled',
            `Your app will now require ${biometricType} to access.`
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable App Lock. Please try again.');
      }
    } else {
      // Verify before disabling
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to disable App Lock',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          mediumHaptic();
          setAppLockEnabled(false);
          Alert.alert('App Lock Disabled', 'Your app no longer requires authentication.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to disable App Lock. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Lock Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print'}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>App Lock</Text>
                <Text style={styles.settingDescription}>
                  Require {biometricType} to open the app
                </Text>
              </View>
              <Switch
                value={isAppLockEnabled}
                onValueChange={handleToggleAppLock}
                disabled={!biometricsAvailable}
                trackColor={{ false: Colors.gray600, true: Colors.primary + '80' }}
                thumbColor={isAppLockEnabled ? Colors.primary : Colors.gray400}
              />
            </View>

            {!biometricsAvailable && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={styles.warningText}>
                  {biometricType} is not available or not set up on this device
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About App Lock</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Protects your financial data from unauthorized access
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                App locks after 30 seconds in background
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="key" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Falls back to device passcode if biometrics fail
              </Text>
            </View>
          </View>
        </View>

        {/* Other Privacy Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Privacy</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="cloud-offline" size={24} color={Colors.info} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Local Data</Text>
                <Text style={styles.settingDescription}>
                  Your data is stored securely in the cloud with Supabase
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="analytics-outline" size={24} color={Colors.success} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>No Analytics</Text>
                <Text style={styles.settingDescription}>
                  We don't track your usage or collect analytics data
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
