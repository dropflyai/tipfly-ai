import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, GradientColors } from '../../constants/colors';
import { Job, JobStatistics } from '../../types';
import {
  getJobs,
  getJobStatistics,
  setPrimaryJob,
  deactivateJob,
  deleteJob,
} from '../../services/api/jobs';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/formatting';
import { useUserStore } from '../../store/userStore';
import CreateJobModal from './CreateJobModal';
import EditJobModal from './EditJobModal';

const FREE_JOB_LIMIT = 1;

export default function JobsScreen() {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState<JobStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const [jobsData, statsData] = await Promise.all([
        getJobs(true), // Only active jobs
        getJobStatistics(true),
      ]);
      setJobs(jobsData);
      setJobStats(statsData);
    } catch (error) {
      console.error('[JobsScreen] Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs();
  }, []);

  const handleCreateJob = () => {
    lightHaptic();

    // Check premium gating - free users limited to 1 job
    if (!isPremium && jobs.length >= FREE_JOB_LIMIT) {
      Alert.alert(
        'Upgrade to Premium',
        'Free tier includes 1 job. Upgrade to Premium for unlimited job tracking across all your workplaces!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade for $2.99/month', onPress: () => {
            navigation.navigate('Upgrade' as never);
          }},
        ]
      );
      return;
    }

    setCreateModalVisible(true);
  };

  const handleEditJob = (job: Job) => {
    lightHaptic();
    setSelectedJob(job);
    setEditModalVisible(true);
  };

  const handleJobCreated = (newJob: Job) => {
    mediumHaptic();
    setCreateModalVisible(false);
    loadJobs(); // Reload to get stats
  };

  const handleJobUpdated = (updatedJob: Job) => {
    mediumHaptic();
    setEditModalVisible(false);
    setSelectedJob(null);
    loadJobs(); // Reload to get stats
  };

  const handleSetPrimary = async (jobId: string) => {
    try {
      lightHaptic();
      await setPrimaryJob(jobId);
      loadJobs();
      Alert.alert('Success', 'Primary job updated');
    } catch (error) {
      console.error('[JobsScreen] Error setting primary job:', error);
      Alert.alert('Error', 'Failed to set primary job');
    }
  };

  const handleDeactivate = (job: Job) => {
    Alert.alert(
      'Deactivate Job',
      `Are you sure you want to deactivate "${job.name}"? You can reactivate it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              mediumHaptic();
              await deactivateJob(job.id);
              loadJobs();
              Alert.alert('Success', 'Job deactivated');
            } catch (error) {
              console.error('[JobsScreen] Error deactivating job:', error);
              Alert.alert('Error', 'Failed to deactivate job');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (job: Job) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to permanently delete "${job.name}"? This action cannot be undone. Existing tip entries will remain but won't be associated with this job.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              mediumHaptic();
              await deleteJob(job.id);
              loadJobs();
              Alert.alert('Success', 'Job deleted');
            } catch (error) {
              console.error('[JobsScreen] Error deleting job:', error);
              Alert.alert('Error', 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GradientColors.primary} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Jobs</Text>
            <Text style={styles.headerSubtitle}>
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} • Track tips across workplaces
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateJob}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Premium Banner */}
        {!isPremium && (
          <View style={styles.premiumBanner}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.premiumBannerText}>
              Free: 1 job • Premium: Unlimited jobs
            </Text>
          </View>
        )}

        {jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="briefcase-outline" size={64} color={Colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>No Jobs Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first job to start tracking tips across different workplaces
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={handleCreateJob}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={24} color={Colors.white} />
              <Text style={styles.emptyActionText}>Create Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {jobs.map((job) => {
              const stats = jobStats.find(s => s.id === job.id);
              return (
                <View key={job.id} style={styles.jobCard}>
                  {/* Job Header */}
                  <View style={styles.jobHeader}>
                    <View style={styles.jobHeaderLeft}>
                      <View style={[styles.jobColorBar, { backgroundColor: job.color }]} />
                      <View style={styles.jobTitleContainer}>
                        <Text style={styles.jobName}>{job.name}</Text>
                        {job.job_type && (
                          <Text style={styles.jobType}>{formatJobType(job.job_type)}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEditJob(job)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Primary Badge */}
                  {job.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Ionicons name="star" size={14} color={Colors.warning} />
                      <Text style={styles.primaryBadgeText}>Primary Job</Text>
                    </View>
                  )}

                  {/* Stats */}
                  {stats && (
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Ionicons name="cash-outline" size={20} color={Colors.primary} />
                        <Text style={styles.statValue}>{formatCurrency(stats.total_tips)}</Text>
                        <Text style={styles.statLabel}>Total Tips</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={20} color={Colors.info} />
                        <Text style={styles.statValue}>{stats.total_hours.toFixed(1)}h</Text>
                        <Text style={styles.statLabel}>Hours</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="trending-up-outline" size={20} color={Colors.success} />
                        <Text style={styles.statValue}>
                          {formatCurrency(stats.avg_hourly_rate)}
                        </Text>
                        <Text style={styles.statLabel}>Avg/Hour</Text>
                      </View>
                    </View>
                  )}

                  {/* Quick Actions */}
                  <View style={styles.actionsContainer}>
                    {!job.is_primary && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetPrimary(job.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star-outline" size={16} color={Colors.warning} />
                        <Text style={styles.actionButtonText}>Set Primary</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => handleDeactivate(job)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pause-circle-outline" size={16} color={Colors.danger} />
                      <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                        Deactivate
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Create Modal */}
      <CreateJobModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onJobCreated={handleJobCreated}
      />

      {/* Edit Modal */}
      {selectedJob && (
        <EditJobModal
          visible={editModalVisible}
          job={selectedJob}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedJob(null);
          }}
          onJobUpdated={handleJobUpdated}
          onJobDeleted={() => {
            setEditModalVisible(false);
            setSelectedJob(null);
            loadJobs();
          }}
        />
      )}
    </View>
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
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.white + 'CC',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  jobColorBar: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  jobType: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundTertiary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonDanger: {
    backgroundColor: Colors.danger + '10',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButtonTextDanger: {
    color: Colors.danger,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  premiumBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
