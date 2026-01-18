import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { WorkplaceWithMembers, TipPoolWithDetails } from '../../types/teams';
import { getUserWorkplaces, leaveWorkplace } from '../../services/api/teams';
import { getPendingPools, getWorkplacePoolStats } from '../../services/api/tipPools';
import { formatCurrency } from '../../utils/formatting';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useUserStore } from '../../store/userStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import CreateTeamModal from './CreateTeamModal';
import JoinTeamModal from './JoinTeamModal';

// Global callback for tour to trigger create team modal
let globalShowCreateTeamModal: (() => void) | null = null;

export function triggerCreateTeamModal() {
  if (globalShowCreateTeamModal) {
    globalShowCreateTeamModal();
  }
}

interface PoolStats {
  totalEarned: number;
  pendingPools: number;
  activeTeams: number;
}

interface TeamWithStats extends WorkplaceWithMembers {
  poolStats?: {
    total_pools: number;
    total_amount: number;
    average_pool: number;
  };
  hasPendingPool?: boolean;
}

export default function TeamsScreenV2() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const isPremium = useUserStore((state) => state.isPremium());
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [pendingPools, setPendingPools] = useState<TipPoolWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  // Register global callback for tour
  useEffect(() => {
    globalShowCreateTeamModal = () => {
      setCreateModalVisible(true);
    };
    return () => {
      globalShowCreateTeamModal = null;
    };
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      // Load teams and pending pools in parallel
      const [workplaces, pools] = await Promise.all([
        getUserWorkplaces(),
        getPendingPools().catch(() => []), // Don't fail if pools API errors
      ]);

      // Load pool stats for each team
      const teamsWithStats = await Promise.all(
        workplaces.map(async (team) => {
          try {
            const poolStats = await getWorkplacePoolStats(team.id);
            const hasPendingPool = pools.some(p => p.workplace_id === team.id);
            return { ...team, poolStats, hasPendingPool };
          } catch {
            return { ...team };
          }
        })
      );

      setTeams(teamsWithStats);
      setPendingPools(pools);
    } catch (error) {
      console.error('Error loading teams data:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // Calculate aggregate stats
  const stats = useMemo((): PoolStats => {
    const totalEarned = teams.reduce((sum, t) => sum + (t.poolStats?.total_amount || 0), 0);
    return {
      totalEarned,
      pendingPools: pendingPools.length,
      activeTeams: teams.length,
    };
  }, [teams, pendingPools]);

  // Calculate user's pending share amount
  const pendingShareAmount = useMemo(() => {
    return pendingPools.reduce((sum, pool) => {
      const userParticipant = pool.participants?.find(p => !p.confirmed);
      return sum + (userParticipant?.share_amount || 0);
    }, 0);
  }, [pendingPools]);

  const handleCreateTeam = () => {
    lightHaptic();

    // Check premium gating
    if (!isPremium && teams.length >= 1) {
      Alert.alert(
        'Upgrade to Premium',
        'Free tier includes 1 team. Upgrade to Premium for unlimited team collaboration!',
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

  const handleJoinTeam = () => {
    lightHaptic();

    // Check premium gating
    if (!isPremium && teams.length >= 1) {
      Alert.alert(
        'Upgrade to Premium',
        'Free tier includes 1 team. Upgrade to Premium for unlimited team collaboration!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade for $2.99/month', onPress: () => {
            navigation.navigate('Upgrade' as never);
          }},
        ]
      );
      return;
    }

    setJoinModalVisible(true);
  };

  const handleTeamCreated = (newTeam: WorkplaceWithMembers) => {
    mediumHaptic();
    setCreateModalVisible(false);
    setTeams([{ ...newTeam }, ...teams]);
    Alert.alert('Team Created!', `Share invite code: ${newTeam.invite_code}`);
  };

  const handleTeamJoined = (joinedTeam: WorkplaceWithMembers) => {
    mediumHaptic();
    setJoinModalVisible(false);
    setTeams([{ ...joinedTeam }, ...teams]);
    Alert.alert('Success!', `You joined ${joinedTeam.name}`);
  };

  const handleCopyInviteCode = (code: string) => {
    lightHaptic();
    Clipboard.setString(code);
    Alert.alert('Copied!', `Invite code ${code} copied to clipboard`);
  };

  const handleLeaveTeam = (team: TeamWithStats) => {
    Alert.alert(
      'Leave Team',
      `Are you sure you want to leave ${team.name}?${
        team.user_role === 'owner' ? '\n\nAs the owner, this will delete the team for everyone.' : ''
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: team.user_role === 'owner' ? 'Delete Team' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              mediumHaptic();
              await leaveWorkplace(team.id);
              setTeams(teams.filter((t) => t.id !== team.id));
              Alert.alert('Success', `You left ${team.name}`);
            } catch (error: any) {
              console.error('Error leaving team:', error);
              Alert.alert('Error', error.message || 'Failed to leave team');
            }
          },
        },
      ]
    );
  };

  const handlePendingPoolPress = (pool: TipPoolWithDetails) => {
    lightHaptic();
    navigation.navigate('PoolDetail', { poolId: pool.id });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teams</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTeam}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
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
        {/* Hero Stats Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Your Pool Earnings</Text>
          <Text style={styles.heroAmount}>{formatCurrency(stats.totalEarned)}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Ionicons name="people" size={16} color={Colors.primary} />
              <Text style={styles.heroStatValue}>{stats.activeTeams}</Text>
              <Text style={styles.heroStatLabel}>Teams</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Ionicons name="time" size={16} color={pendingPools.length > 0 ? Colors.warning : Colors.textSecondary} />
              <Text style={[styles.heroStatValue, pendingPools.length > 0 && styles.pendingHighlight]}>
                {stats.pendingPools}
              </Text>
              <Text style={styles.heroStatLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Pending Pools Alert - Insight First! */}
        {pendingPools.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.pendingBadge}>
                <Ionicons name="notifications" size={14} color={Colors.white} />
                <Text style={styles.pendingBadgeText}>Action Required</Text>
              </View>
            </View>

            {pendingPools.map((pool) => {
              const userShare = pool.participants?.find(p => !p.confirmed)?.share_amount || 0;
              return (
                <TouchableOpacity
                  key={pool.id}
                  style={styles.pendingPoolCard}
                  onPress={() => handlePendingPoolPress(pool)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pendingPoolLeft}>
                    <View style={styles.pendingPoolIcon}>
                      <Ionicons name="cash" size={20} color={Colors.gold} />
                    </View>
                    <View style={styles.pendingPoolInfo}>
                      <Text style={styles.pendingPoolTeam}>{pool.workplace?.name}</Text>
                      <Text style={styles.pendingPoolDate}>
                        {new Date(pool.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })} • {pool.shift_type || 'Shift'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pendingPoolRight}>
                    <Text style={styles.pendingPoolAmount}>{formatCurrency(userShare)}</Text>
                    <Text style={styles.pendingPoolAction}>Confirm →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Premium Badge */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => navigation.navigate('Upgrade' as never)}
            activeOpacity={0.7}
          >
            <Ionicons name="star" size={16} color={Colors.gold} />
            <Text style={styles.premiumBannerText}>
              Free: 1 team • Upgrade for unlimited
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Teams Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Teams</Text>
          <Text style={styles.sectionCount}>{teams.length}</Text>
        </View>

        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Teams Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a team to start pooling tips with coworkers
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateButton}
              onPress={handleCreateTeam}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.emptyCreateText}>Create Team</Text>
            </TouchableOpacity>
          </View>
        ) : (
          teams.map((team) => (
            <TouchableOpacity
              key={team.id}
              activeOpacity={0.9}
              onPress={() => {
                lightHaptic();
                navigation.navigate('TeamDetail', { team });
              }}
              onLongPress={() => handleLeaveTeam(team)}
            >
              <View style={styles.teamCard}>
                {/* Team Header Row */}
                <View style={styles.teamHeader}>
                  <View style={styles.teamIconContainer}>
                    <Ionicons name="briefcase" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.teamHeaderInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMembers}>
                      {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                  {team.hasPendingPool && (
                    <View style={styles.pendingDot} />
                  )}
                  <View
                    style={[
                      styles.roleBadge,
                      team.user_role === 'owner' ? styles.roleBadgeOwner : styles.roleBadgeMember,
                    ]}
                  >
                    <Text style={[
                      styles.roleBadgeText,
                      team.user_role === 'owner' && styles.roleBadgeTextOwner,
                    ]}>
                      {team.user_role === 'owner' ? 'OWNER' : 'MEMBER'}
                    </Text>
                  </View>
                </View>

                {/* Pool Stats Row */}
                {team.poolStats && team.poolStats.total_pools > 0 && (
                  <View style={styles.teamStatsRow}>
                    <View style={styles.teamStat}>
                      <Text style={styles.teamStatValue}>{team.poolStats.total_pools}</Text>
                      <Text style={styles.teamStatLabel}>Pools</Text>
                    </View>
                    <View style={styles.teamStatDivider} />
                    <View style={styles.teamStat}>
                      <Text style={styles.teamStatValue}>{formatCurrency(team.poolStats.total_amount)}</Text>
                      <Text style={styles.teamStatLabel}>Total</Text>
                    </View>
                    <View style={styles.teamStatDivider} />
                    <View style={styles.teamStat}>
                      <Text style={styles.teamStatValue}>{formatCurrency(team.poolStats.average_pool)}</Text>
                      <Text style={styles.teamStatLabel}>Avg Pool</Text>
                    </View>
                  </View>
                )}

                {/* Invite Code Row */}
                <TouchableOpacity
                  style={styles.inviteCodeRow}
                  onPress={() => handleCopyInviteCode(team.invite_code)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key" size={14} color={Colors.primary} />
                  <Text style={styles.inviteCode}>{team.invite_code}</Text>
                  <Ionicons name="copy-outline" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Join Team Button */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinTeam}
          activeOpacity={0.7}
        >
          <View style={styles.joinIconContainer}>
            <Ionicons name="enter-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.joinButtonTextContainer}>
            <Text style={styles.joinButtonTitle}>Join a Team</Text>
            <Text style={styles.joinButtonSubtitle}>Enter invite code</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      <CreateTeamModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleTeamCreated}
      />
      <JoinTeamModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={handleTeamJoined}
      />
    </View>
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glowBlueSubtle,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Hero Stats Card
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    ...Shadows.glowBlue,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  heroStatLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pendingHighlight: {
    color: Colors.gold,
  },

  // Pending Pools Section
  pendingSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  pendingPoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  pendingPoolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingPoolIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPoolInfo: {
    gap: 2,
  },
  pendingPoolTeam: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  pendingPoolDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pendingPoolRight: {
    alignItems: 'flex-end',
  },
  pendingPoolAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  pendingPoolAction: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },

  // Premium Banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  premiumBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.glowBlueSubtle,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Team Card
  teamCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamHeaderInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  teamMembers: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.warning,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  roleBadgeOwner: {
    backgroundColor: Colors.gold,
  },
  roleBadgeMember: {
    backgroundColor: 'rgba(0, 168, 232, 0.2)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  roleBadgeTextOwner: {
    color: Colors.background,
  },

  // Team Stats Row
  teamStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  teamStat: {
    flex: 1,
    alignItems: 'center',
  },
  teamStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  teamStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  teamStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },

  // Invite Code Row
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 232, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  inviteCode: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },

  // Join Button
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  joinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonTextContainer: {
    flex: 1,
  },
  joinButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  joinButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});
