import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, GradientColors } from '../../constants/colors';
import { TipPool, WorkplaceWithMembers } from '../../types/teams';
import { getPoolDetails, confirmPoolShare, cancelPool } from '../../services/api/tipPools';
import { getCurrentUser } from '../../services/api/supabase';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { successHaptic, errorHaptic, lightHaptic } from '../../utils/haptics';

type RouteParams = {
  PoolDetail: {
    pool: TipPool;
    team: WorkplaceWithMembers;
  };
};

type PoolDetailRouteProp = RouteProp<RouteParams, 'PoolDetail'>;
type PoolDetailNavProp = StackNavigationProp<any>;

export default function PoolDetailScreen() {
  const route = useRoute<PoolDetailRouteProp>();
  const navigation = useNavigation<PoolDetailNavProp>();
  const { pool: initialPool, team } = route.params;

  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadCurrentUser();
    loadPoolDetails();
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadPoolDetails = async () => {
    try {
      const details = await getPoolDetails(initialPool.id);
      setPool(details);
    } catch (error) {
      console.error('Error loading pool details:', error);
      Alert.alert('Error', 'Failed to load pool details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPoolDetails();
  }, []);

  const handleConfirmShare = async () => {
    if (!pool || !currentUserId) return;

    const myParticipation = pool.participants?.find(
      (p: any) => p.user_id === currentUserId
    );

    if (!myParticipation) {
      errorHaptic();
      Alert.alert('Error', 'You are not a participant in this pool');
      return;
    }

    if (myParticipation.confirmed) {
      Alert.alert('Already Confirmed', 'You have already confirmed your share');
      return;
    }

    Alert.alert(
      'Confirm Share',
      `Confirm your share of ${formatCurrency(parseFloat(myParticipation.share_amount))}?\n\nThis will add this amount to your tip history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setConfirming(true);
              await confirmPoolShare({
                pool_id: pool.id,
                participant_id: myParticipation.id,
              });

              successHaptic();
              Alert.alert(
                'Confirmed!',
                'Your share has been added to your tips',
                [{ text: 'OK', onPress: () => loadPoolDetails() }]
              );
            } catch (error: any) {
              errorHaptic();
              console.error('Error confirming share:', error);
              Alert.alert('Error', error.message || 'Failed to confirm share');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelPool = async () => {
    if (!pool) return;

    Alert.alert(
      'Cancel Pool',
      'Are you sure you want to cancel this tip pool? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelPool(pool.id);
              successHaptic();
              Alert.alert('Cancelled', 'Pool has been cancelled', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              errorHaptic();
              Alert.alert('Error', error.message || 'Failed to cancel pool');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return Colors.warning;
      case 'finalized':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.gray400;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Pending Confirmations';
      case 'finalized':
        return 'Finalized';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading || !pool) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isCreator = pool.created_by === currentUserId;
  const myParticipation = pool.participants?.find(
    (p: any) => p.user_id === currentUserId
  );
  const confirmedCount = pool.participants?.filter((p: any) => p.confirmed).length || 0;
  const totalParticipants = pool.participants?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pool Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Pool Header */}
        <LinearGradient
          colors={GradientColors.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.poolHeader}
        >
          <Text style={styles.poolDate}>
            {formatDate(new Date(pool.date))}
          </Text>
          {pool.shift_type && (
            <Text style={styles.poolShift}>
              {pool.shift_type.charAt(0).toUpperCase() + pool.shift_type.slice(1)} Shift
            </Text>
          )}
          <Text style={styles.poolAmount}>
            {formatCurrency(parseFloat(pool.total_amount))}
          </Text>
          <Text style={styles.poolAmountLabel}>Total Pool</Text>
        </LinearGradient>

        {/* Status */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(pool.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(pool.status)}
            </Text>
          </View>

          {pool.status === 'draft' && (
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {confirmedCount} of {totalParticipants} confirmed
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(confirmedCount / totalParticipants) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Split Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Method</Text>
          <View style={styles.splitInfo}>
            <Ionicons
              name={pool.split_type === 'equal_hours' ? 'time' : 'pie-chart'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.splitInfoText}>
              {pool.split_type === 'equal_hours'
                ? 'Equal Hours Split'
                : 'Custom Percentage Split'}
            </Text>
          </View>

          {pool.split_type === 'equal_hours' && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Hourly Rate:</Text>
              <Text style={styles.metaValue}>
                {formatCurrency(
                  parseFloat(pool.total_amount) /
                    pool.participants.reduce(
                      (sum: number, p: any) => sum + (p.hours_worked || 0),
                      0
                    )
                )}
                /hr
              </Text>
            </View>
          )}
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {pool.participants?.map((participant: any) => {
            const isMe = participant.user_id === currentUserId;
            return (
              <View
                key={participant.id}
                style={[
                  styles.participantCard,
                  isMe && styles.participantCardHighlight,
                ]}
              >
                <View style={styles.participantHeader}>
                  <View style={styles.participantLeft}>
                    <Ionicons
                      name={participant.confirmed ? 'checkmark-circle' : 'time'}
                      size={24}
                      color={participant.confirmed ? Colors.success : Colors.warning}
                    />
                    <Text style={styles.participantName}>
                      {isMe ? 'You' : 'Team Member'}
                    </Text>
                  </View>
                  <Text style={styles.participantShare}>
                    {formatCurrency(parseFloat(participant.share_amount))}
                  </Text>
                </View>

                <View style={styles.participantDetails}>
                  {pool.split_type === 'equal_hours' ? (
                    <Text style={styles.participantMeta}>
                      {participant.hours_worked} hours
                    </Text>
                  ) : (
                    <Text style={styles.participantMeta}>
                      {participant.percentage}%
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.participantStatus,
                      participant.confirmed && styles.participantStatusConfirmed,
                    ]}
                  >
                    {participant.confirmed ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {pool.status === 'draft' && (
        <View style={styles.footer}>
          {myParticipation && !myParticipation.confirmed && (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                confirming && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmShare}
              disabled={confirming}
            >
              <LinearGradient
                colors={GradientColors.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmButtonGradient}
              >
                {confirming ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
                    <Text style={styles.confirmButtonText}>
                      Confirm My Share ({formatCurrency(parseFloat(myParticipation.share_amount))})
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {myParticipation && myParticipation.confirmed && (
            <View style={styles.confirmedBanner}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.confirmedText}>You've confirmed your share</Text>
            </View>
          )}

          {isCreator && (
            <View style={styles.creatorActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelPool}
              >
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.cancelButtonText}>Cancel Pool</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {pool.status === 'finalized' && (
        <View style={styles.footer}>
          <View style={styles.finalizedBanner}>
            <Ionicons name="checkmark-done-circle" size={28} color={Colors.success} />
            <Text style={styles.finalizedText}>Pool Finalized</Text>
            <Text style={styles.finalizedSubtext}>
              All shares confirmed and added to tips
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  poolHeader: {
    padding: 24,
    alignItems: 'center',
  },
  poolDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },
  poolShift: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  poolAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 16,
  },
  poolAmountLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  statusSection: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressRow: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  splitInfoText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  participantCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  participantCardHighlight: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  participantShare: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  participantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  participantStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
  },
  participantStatusConfirmed: {
    color: Colors.success,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  confirmedText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  creatorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  finalizedBanner: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
  },
  finalizedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
    marginTop: 8,
  },
  finalizedSubtext: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 4,
  },
});
