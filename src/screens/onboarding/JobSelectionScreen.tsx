import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors, Shadows } from '../../constants/colors';
import { AppConfig } from '../../constants/config';
import { JobType } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import OnboardingProgress from '../../components/OnboardingProgress';

interface JobSelectionScreenProps {
  onNext: (jobType: JobType) => void;
}

export default function JobSelectionScreen({ onNext }: JobSelectionScreenProps) {
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);

  const handleJobSelect = (jobId: string) => {
    lightHaptic();
    setSelectedJob(jobId as JobType);
  };

  const handleContinue = () => {
    if (selectedJob) {
      mediumHaptic();
      onNext(selectedJob);
    }
  };

  return (
    <LinearGradient
      colors={GradientColors.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <OnboardingProgress currentStep={1} totalSteps={3} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What do you do?</Text>
          <Text style={styles.subtitle}>
            Select your main job to personalize your experience
          </Text>
        </View>

        {/* Job Grid */}
        <View style={styles.jobGrid}>
          {AppConfig.JOB_TYPES.map((job) => {
            const isSelected = selectedJob === job.id;
            return (
              <TouchableOpacity
                key={job.id}
                style={[
                  styles.jobCard,
                  isSelected && styles.jobCardSelected,
                ]}
                onPress={() => handleJobSelect(job.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.jobIconContainer,
                  isSelected && styles.jobIconContainerSelected,
                ]}>
                  <Text style={styles.jobIcon}>{job.icon}</Text>
                </View>
                <Text style={[
                  styles.jobLabel,
                  isSelected && styles.jobLabelSelected,
                ]}>
                  {job.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedJob && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedJob}
          activeOpacity={0.9}
        >
          {selectedJob ? (
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </LinearGradient>
          ) : (
            <View style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonTextDisabled}>Select your job</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  jobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  jobCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    position: 'relative',
  },
  jobCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 168, 232, 0.08)',
    ...Shadows.glowBlueSubtle,
  },
  jobIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobIconContainerSelected: {
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
  },
  jobIcon: {
    fontSize: 36,
  },
  jobLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  jobLabelSelected: {
    color: Colors.white,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 1,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    backgroundColor: Colors.backgroundTertiary,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  continueButtonTextDisabled: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
});
