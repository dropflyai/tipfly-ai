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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, GlassStyles } from '../../constants/colors';
import { createWorkplace } from '../../services/api/teams';
import { WorkplaceWithMembers } from '../../types/teams';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';

interface CreateTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (team: WorkplaceWithMembers) => void;
}

export default function CreateTeamModal({
  visible,
  onClose,
  onSuccess,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleClose = () => {
    lightHaptic();
    setTeamName('');
    onClose();
  };

  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert('Required', 'Please enter a team name');
      return;
    }

    if (teamName.trim().length < 2) {
      Alert.alert('Too Short', 'Team name must be at least 2 characters');
      return;
    }

    try {
      mediumHaptic();
      setLoading(true);

      const workplace = await createWorkplace({ name: teamName.trim() });

      // Convert to WorkplaceWithMembers format
      const workplaceWithMembers: WorkplaceWithMembers = {
        ...workplace,
        member_count: 1,
        user_role: 'owner',
      };

      setTeamName('');
      onSuccess(workplaceWithMembers);
    } catch (error: any) {
      console.error('Error creating team:', error);
      Alert.alert('Error', error.message || 'Failed to create team');
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
            <View style={styles.headerIconContainer}>
              <Ionicons name="people-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Create Team</Text>
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
            <Text style={styles.label}>Team Name</Text>
            <View style={[
              styles.inputWrapper,
              inputFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={inputFocused ? Colors.primary : Colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Joe's Diner"
                placeholderTextColor={Colors.inputPlaceholder}
                value={teamName}
                onChangeText={setTeamName}
                autoFocus
                maxLength={100}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                selectionColor={Colors.primary}
              />
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="key-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.infoText}>
              You'll get a 6-digit code to share with teammates
            </Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.createButtonText}>Create Team</Text>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GlassStyles.input,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputWrapperFocused: {
    ...GlassStyles.inputFocus,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...Shadows.buttonBlue,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
