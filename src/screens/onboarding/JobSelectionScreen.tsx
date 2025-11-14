import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, JobType } from '../../types';
import { Colors } from '../../constants/colors';
import { AppConfig } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JobSelection'>;
};

export default function JobSelectionScreen({ navigation }: Props) {
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);

  const handleContinue = () => {
    if (selectedJob) {
      navigation.navigate('Signup');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>What do you do?</Text>
        <Text style={styles.subtitle}>
          This helps us customize your experience
        </Text>

        <View style={styles.jobGrid}>
          {AppConfig.JOB_TYPES.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[
                styles.jobCard,
                selectedJob === job.id && styles.jobCardSelected,
              ]}
              onPress={() => setSelectedJob(job.id as JobType)}
            >
              <Text style={styles.jobIcon}>{job.icon}</Text>
              <Text style={[
                styles.jobLabel,
                selectedJob === job.id && styles.jobLabelSelected,
              ]}>
                {job.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedJob && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedJob}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedJob && styles.continueButtonTextDisabled,
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  jobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  jobCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  jobCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  jobIcon: {
    fontSize: 48,
  },
  jobLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  jobLabelSelected: {
    color: Colors.primary,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: Colors.gray400,
  },
});
