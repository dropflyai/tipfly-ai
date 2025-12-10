import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, GlassStyles } from '../../constants/colors';
import { joinWorkplace, getUserWorkplaces } from '../../services/api/teams';
import { WorkplaceWithMembers } from '../../types/teams';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';

interface JoinTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (team: WorkplaceWithMembers) => void;
}

export default function JoinTeamModal({
  visible,
  onClose,
  onSuccess,
}: JoinTeamModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleClose = () => {
    lightHaptic();
    setInviteCode('');
    onClose();
  };

  const handleInviteCodeChange = (text: string) => {
    // Remove spaces only - keep original case since lookup is case-insensitive
    const cleaned = text.replace(/\s/g, '');
    setInviteCode(cleaned);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Required', 'Please enter an invite code');
      return;
    }

    if (inviteCode.length !== 6) {
      Alert.alert('Invalid Code', 'Invite code must be 6 characters');
      return;
    }

    try {
      mediumHaptic();
      setLoading(true);

      const workplace = await joinWorkplace({ invite_code: inviteCode });

      // Fetch the full workplace data with member count
      const workplaces = await getUserWorkplaces();
      const joinedWorkplace = workplaces.find((w) => w.id === workplace.id);

      if (!joinedWorkplace) {
        throw new Error('Failed to load team details');
      }

      setInviteCode('');
      onSuccess(joinedWorkplace);
    } catch (error: any) {
      console.error('Error joining team:', error);
      Alert.alert('Error', error.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = inviteCode.length === 6;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="enter-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Join Team</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invite Code</Text>
            <View style={[
              styles.codeInputWrapper,
              inputFocused && styles.codeInputWrapperFocused,
              isCodeComplete && styles.codeInputWrapperComplete
            ]}>
              <TextInput
                style={styles.codeInput}
                placeholder="ABC123"
                placeholderTextColor={Colors.inputPlaceholder}
                value={inviteCode}
                onChangeText={handleInviteCodeChange}
                autoFocus
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                selectionColor={Colors.primary}
              />
            </View>
            <View style={styles.charCountContainer}>
              <View style={[
                styles.charCountBadge,
                isCodeComplete && styles.charCountBadgeComplete
              ]}>
                <Text style={[
                  styles.charCount,
                  isCodeComplete && styles.charCountComplete
                ]}>
                  {inviteCode.length}/6
                </Text>
                {isCodeComplete && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                )}
              </View>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.infoText}>
              Ask your coworker for the 6-digit team code
            </Text>
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              !isCodeComplete && styles.joinButtonDisabled,
              loading && styles.joinButtonDisabled
            ]}
            onPress={handleJoin}
            disabled={loading || !isCodeComplete}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.joinButtonText}>Join Team</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    ...GlassStyles.modal,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  codeInputWrapper: {
    backgroundColor: 'rgba(26, 35, 50, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(0, 168, 232, 0.3)',
    borderRadius: 16,
    padding: 16,
  },
  codeInputWrapperFocused: {
    borderColor: Colors.primary,
    ...Shadows.glowBlueSubtle,
  },
  codeInputWrapperComplete: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
  },
  codeInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  charCountContainer: {
    alignItems: 'flex-end',
  },
  charCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  charCountBadgeComplete: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  charCountComplete: {
    color: Colors.success,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...Shadows.buttonBlue,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
