import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/api/supabase';
import { useUserStore } from '../store/userStore';

export default function EmailVerificationBanner() {
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if email is already verified or user dismissed it
  if (!user || user.email_confirmed_at || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    if (!user.email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      Alert.alert(
        'Email Sent',
        'Verification email has been sent. Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={20} color={Colors.warning} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          Verify your email to unlock tax exports and secure your account
        </Text>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.warning} />
          ) : (
            <Text style={styles.resendButtonText}>Resend Verification Email</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => setDismissed(true)}
      >
        <Ionicons name="close" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED', // Warm orange tint
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  resendButton: {
    alignSelf: 'flex-start',
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
