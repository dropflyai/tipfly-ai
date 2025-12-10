// Edit Profile Screen - Update user profile information
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../services/api/supabase';
import { AppConfig } from '../../constants/config';

export default function EditProfileScreen() {
  const { user, setUser } = useUserStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [saving, setSaving] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);

  const jobTypes = AppConfig.JOB_TYPES;

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to change your profile picture.'
        );
        return;
      }

      // Show action sheet on iOS, direct picker on Android
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Library'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              // Take Photo
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed to take photos.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                Alert.alert('Photo Selected', 'Profile photo upload will be available soon!');
              }
            } else if (buttonIndex === 2) {
              // Choose from Library
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                Alert.alert('Photo Selected', 'Profile photo upload will be available soon!');
              }
            }
          }
        );
      } else {
        // Android: directly show picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled) {
          Alert.alert('Photo Selected', 'Profile photo upload will be available soon!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!jobTitle) {
      Alert.alert('Error', 'Please select your job type');
      return;
    }

    try {
      setSaving(true);

      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          job_title: jobTitle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (data) {
        setUser(data);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!email) {
      Alert.alert('Error', 'No email address found for your account');
      return;
    }

    Alert.alert(
      'Change Password',
      `We'll send a password reset link to:\n\n${email}\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              setSendingPasswordReset(true);

              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'tipfly://reset-password',
              });

              if (error) throw error;

              Alert.alert(
                'Email Sent!',
                'Check your inbox for the password reset link. The link will expire in 1 hour.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('Error sending password reset:', error);
              Alert.alert('Error', error.message || 'Failed to send password reset email');
            } finally {
              setSendingPasswordReset(false);
            }
          },
        },
      ]
    );
  };

  const selectedJob = jobTypes.find(j => j.id === jobTitle);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Icon */}
        <View style={styles.profileIconContainer}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>
              {fullName?.charAt(0)?.toUpperCase() || user?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.inputPlaceholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={[styles.input, styles.inputDisabledText]}
                value={email}
                editable={false}
                placeholderTextColor={Colors.inputPlaceholder}
              />
              <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.helpText}>Email cannot be changed</Text>
          </View>

          {/* Job Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Job Type</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowJobPicker(!showJobPicker)}
            >
              <View style={styles.selectLeft}>
                <Ionicons name="briefcase-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.selectText}>
                  {selectedJob ? selectedJob.label : 'Select your job type'}
                </Text>
              </View>
              <Ionicons
                name={showJobPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Job Type Picker */}
          {showJobPicker && (
            <View style={styles.jobPicker}>
              {jobTypes.map(job => (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.jobOption,
                    jobTitle === job.id && styles.jobOptionSelected,
                  ]}
                  onPress={() => {
                    setJobTitle(job.id);
                    setShowJobPicker(false);
                  }}
                >
                  <View style={styles.jobOptionLeft}>
                    <Ionicons
                      name={jobTitle === job.id ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={jobTitle === job.id ? Colors.primary : Colors.gray400}
                    />
                    <Text
                      style={[
                        styles.jobOptionText,
                        jobTitle === job.id && styles.jobOptionTextSelected,
                      ]}
                    >
                      {job.label}
                    </Text>
                  </View>
                  {jobTitle === job.id && (
                    <Ionicons name="checkmark" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Change Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity
              style={[styles.changePasswordButton, sendingPasswordReset && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={sendingPasswordReset}
            >
              <View style={styles.changePasswordLeft}>
                <Ionicons name="key-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.changePasswordText}>Change Password</Text>
              </View>
              {sendingPasswordReset ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
            <Text style={styles.helpText}>We'll send a reset link to your email</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Your profile information is private and will never be shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  },
  profileIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowBlue,
  },
  profileIconText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.backgroundDark,
    ...Shadows.glowGoldSubtle,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.inputText,
  },
  inputDisabledText: {
    color: Colors.textSecondary,
  },
  helpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text,
  },
  jobPicker: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: 'hidden',
    marginTop: -12,
  },
  jobOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jobOptionSelected: {
    backgroundColor: Colors.primary + '20',
  },
  jobOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  jobOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  jobOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  changePasswordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changePasswordText: {
    fontSize: 16,
    color: Colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    ...Shadows.buttonBlue,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
