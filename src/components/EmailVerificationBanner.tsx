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
  if (!user || user.email_confirmed_at || user.user_metadata?.email_verified || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    if (!user.email) {
      Alert.alert('Error', 'No email address found');
      return;
    }

    setLoading(true);
    try {
      console.log('[EmailVerificationBanner] Attempting to resend verification email to:', user.email);

      // Call Edge Function to send verification email via Resend
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'send-verification-email',
        {
          body: {
            email: user.email,
            userId: user.id,
          },
        }
      );

      console.log('[EmailVerificationBanner] Edge Function response:', { functionData, functionError });

      if (functionError) {
        console.error('[EmailVerificationBanner] Edge Function error:', functionError);
        throw functionError;
      }

      if (functionData?.error) {
        throw new Error(functionData.error);
      }

      Alert.alert(
        'Email Sent',
        'Verification email has been sent. Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      console.error('[EmailVerificationBanner] Failed to resend email:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send verification email. Please try again later or contact support.'
      );
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
    backgroundColor: Colors.warning + '20', // Dark-friendly warning tint
    borderWidth: 1,
    borderColor: Colors.warning + '40',
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
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
