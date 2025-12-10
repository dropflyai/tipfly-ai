import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, GradientColors } from '../constants/colors';
import { useAppLockStore } from '../store/appLockStore';
import { mediumHaptic, lightHaptic } from '../utils/haptics';

export default function LockScreen() {
  const [authenticating, setAuthenticating] = useState(false);
  const [authType, setAuthType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const unlock = useAppLockStore((state) => state.unlock);

  useEffect(() => {
    checkAuthType();
    // Auto-prompt for authentication when screen mounts
    authenticate();
  }, []);

  const checkAuthType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setAuthType('facial');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setAuthType('fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setAuthType('iris');
      } else {
        setAuthType('none');
      }
    } catch (error) {
      console.error('[LockScreen] Error checking auth type:', error);
    }
  };

  const authenticate = async () => {
    if (authenticating) return;

    try {
      setAuthenticating(true);

      // Check if biometric auth is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        Alert.alert(
          'Not Supported',
          'Your device does not support biometric authentication. App Lock has been disabled.',
          [{ text: 'OK', onPress: () => unlock() }]
        );
        return;
      }

      if (!isEnrolled) {
        Alert.alert(
          'Not Set Up',
          'Please set up Face ID or Touch ID in your device settings first.',
          [{ text: 'OK', onPress: () => unlock() }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock TipFly AI',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        mediumHaptic();
        unlock();
      } else {
        lightHaptic();
        // User cancelled or failed - they can try again by tapping
      }
    } catch (error) {
      console.error('[LockScreen] Authentication error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const getAuthIcon = () => {
    switch (authType) {
      case 'facial':
        return 'scan-outline';
      case 'fingerprint':
        return 'finger-print';
      case 'iris':
        return 'eye-outline';
      default:
        return 'lock-closed';
    }
  };

  const getAuthLabel = () => {
    switch (authType) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometrics';
    }
  };

  return (
    <LinearGradient
      colors={GradientColors.background}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* App Icon/Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={GradientColors.primary}
            style={styles.logoGradient}
          >
            <Ionicons name="wallet" size={48} color={Colors.white} />
          </LinearGradient>
        </View>

        <Text style={styles.appName}>TipFly AI</Text>
        <Text style={styles.subtitle}>App Locked</Text>

        {/* Auth Button */}
        <TouchableOpacity
          style={styles.authButton}
          onPress={authenticate}
          disabled={authenticating}
          activeOpacity={0.7}
        >
          {authenticating ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getAuthIcon() as any}
                  size={56}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.authLabel}>
                Tap to unlock with {getAuthLabel()}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Your data is secured with biometric authentication
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 48,
  },
  authButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 150,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 48,
  },
});
