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
import { Colors } from '../../constants/colors';
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
            <Text style={styles.modalTitle}>Join Team</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invite Code</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC123"
              placeholderTextColor={Colors.gray400}
              value={inviteCode}
              onChangeText={handleInviteCodeChange}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={6}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            <Text style={styles.charCount}>{inviteCode.length}/6</Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              Ask your coworker for the 6-digit team code
            </Text>
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[styles.joinButton, loading && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={loading || inviteCode.length !== 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.joinButtonText}>Join Team</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  charCount: {
    position: 'absolute',
    right: 12,
    bottom: -20,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
