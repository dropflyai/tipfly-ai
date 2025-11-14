import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Job } from '../../types';
import { getJobs } from '../../services/api/jobs';
import { lightHaptic } from '../../utils/haptics';

interface JobSelectorProps {
  selectedJobId?: string;
  onSelectJob: (job: Job | null) => void;
  allowNone?: boolean;
  label?: string;
}

export default function JobSelector({
  selectedJobId,
  onSelectJob,
  allowNone = false,
  label = 'Job',
}: JobSelectorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs(true); // Only active jobs
      setJobs(data);
    } catch (error) {
      console.error('[JobSelector] Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const handleSelectJob = (job: Job | null) => {
    lightHaptic();
    onSelectJob(job);
    setModalVisible(false);
  };

  const handleOpenModal = () => {
    lightHaptic();
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      {/* Job Selector Button */}
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={handleOpenModal}
          activeOpacity={0.7}
        >
          {selectedJob ? (
            <View style={styles.selectedJobContainer}>
              <View style={[styles.colorIndicator, { backgroundColor: selectedJob.color }]} />
              <Text style={styles.selectedJobText}>{selectedJob.name}</Text>
              {selectedJob.is_primary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              {allowNone ? 'Select a job (optional)' : 'Select a job'}
            </Text>
          )}
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Job Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Job List */}
            <ScrollView style={styles.jobList} showsVerticalScrollIndicator={false}>
              {allowNone && (
                <TouchableOpacity
                  style={[
                    styles.jobItem,
                    !selectedJobId && styles.jobItemSelected,
                  ]}
                  onPress={() => handleSelectJob(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobItemLeft}>
                    <View style={[styles.jobColorDot, { backgroundColor: Colors.gray300 }]} />
                    <Text style={styles.jobItemName}>No Job Selected</Text>
                  </View>
                  {!selectedJobId && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}

              {jobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.jobItem,
                    selectedJobId === job.id && styles.jobItemSelected,
                  ]}
                  onPress={() => handleSelectJob(job)}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobItemLeft}>
                    <View style={[styles.jobColorDot, { backgroundColor: job.color }]} />
                    <View>
                      <Text style={styles.jobItemName}>{job.name}</Text>
                      {job.job_type && (
                        <Text style={styles.jobItemType}>{formatJobType(job.job_type)}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.jobItemRight}>
                    {job.is_primary && (
                      <View style={styles.primaryBadgeSmall}>
                        <Text style={styles.primaryBadgeSmallText}>Primary</Text>
                      </View>
                    )}
                    {selectedJobId === job.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {jobs.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={48} color={Colors.gray300} />
                  <Text style={styles.emptyTitle}>No Jobs Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create a job in the Jobs screen to start tracking tips by workplace
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function formatJobType(type: string): string {
  const types: Record<string, string> = {
    restaurant: 'Restaurant',
    bar: 'Bar',
    delivery: 'Delivery',
    rideshare: 'Rideshare',
    other: 'Other',
  };
  return types[type] || type;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedJobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  selectedJobText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  jobList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    marginBottom: 8,
  },
  jobItemSelected: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  jobItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  jobColorDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  jobItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  jobItemType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  jobItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBadgeSmall: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  primaryBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
