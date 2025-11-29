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
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import { Colors, GradientColors } from '../../constants/colors';
import { WorkplaceWithMembers, TipPool } from '../../types/teams';
import { getWorkplacePools } from '../../services/api/tipPools';
import { getWorkplaceMembers } from '../../services/api/teams';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { formatCurrency, formatDate } from '../../utils/formatting';

type RouteParams = {
  TeamDetail: {
    team: WorkplaceWithMembers;
  };
};

type TeamDetailRouteProp = RouteProp<RouteParams, 'TeamDetail'>;
type TeamDetailNavProp = StackNavigationProp<any>;

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRouteProp>();
  const navigation = useNavigation<TeamDetailNavProp>();
  const { team } = route.params;

  const [pools, setPools] = useState<TipPool[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const handleCopyCode = async () => {
    lightHaptic();
    await Clipboard.setStringAsync(team.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    lightHaptic();
    try {
      await Share.share({
        message: `Join my team "${team.name}" on TipFly AI!\n\nInvite code: ${team.invite_code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const loadTeamData = async () => {
    try {
      // Get pools from last 2 months
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const allPools = await getWorkplacePools(team.id);
      const recentPools = allPools.filter(pool => {
        const poolDate = new Date(pool.date);
        return poolDate >= twoMonthsAgo;
      });

      setPools(recentPools);

      // Get team members
      const teamMembers = await getWorkplaceMembers(team.id);
      setMembers(teamMembers);
    } catch (error) {
      console.error('Error loading team data:', error);
      Alert.alert('Error', 'Failed to load team data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTeamData();
  }, []);

  const handleCreatePool = () => {
    lightHaptic();
    navigation.navigate('CreatePool', { team });
  };

  const handlePoolPress = (pool: TipPool) => {
    lightHaptic();
    navigation.navigate('PoolDetail', { pool, team });
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const obfuscateEmail = (email: string): string => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visibleChars = Math.min(2, local.length);
    return `${local.substring(0, visibleChars)}***@${domain}`;
  };

  const formatJoinDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Joined today';
    if (diffDays === 1) return 'Joined yesterday';
    if (diffDays < 7) return `Joined ${diffDays} days ago`;
    if (diffDays < 30) return `Joined ${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Joined ${Math.floor(diffDays / 30)} months ago`;
    return `Joined ${formatDate(date)}`;
  };

  const getStatusBadgeColor = (status: string) => {
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
        return 'Pending';
      case 'finalized':
        return 'Finalized';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading team...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{team.name}</Text>
          <Text style={styles.headerSubtitle}>
            {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
          </Text>
        </View>
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
        {/* Team Members Section - Member Cards */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Team Members ({members.length})
          </Text>
          {members.length === 0 ? (
            <Text style={styles.emptyMembersText}>No members yet</Text>
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                {/* Avatar with Initials */}
                <View style={[
                  styles.memberAvatar,
                  member.isCurrentUser && styles.memberAvatarCurrent
                ]}>
                  <Text style={styles.memberInitials}>
                    {getInitials(member.name || 'TM')}
                  </Text>
                </View>

                {/* Member Info */}
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name || 'Team Member'}</Text>
                    {member.role === 'owner' && (
                      <View style={styles.ownerBadge}>
                        <Ionicons name="star" size={12} color={Colors.warning} />
                        <Text style={styles.ownerBadgeText}>Owner</Text>
                      </View>
                    )}
                  </View>
                  {member.email && (
                    <Text style={styles.memberEmail}>
                      {obfuscateEmail(member.email)}
                    </Text>
                  )}
                  <Text style={styles.memberJoinDate}>
                    {formatJoinDate(member.joined_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Invite Code Section with Copy/Share */}
        <View style={styles.inviteSection}>
          <Text style={styles.sectionTitle}>Invite Team Members</Text>

          {/* Invite Code with Copy */}
          <View style={styles.inviteCodeCard}>
            <View style={styles.inviteCodeLeft}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
              <Text style={styles.inviteCodeText}>{team.invite_code}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={20}
                color={copied ? Colors.success : Colors.primary}
              />
              <Text style={[styles.copyButtonText, copied && styles.copiedText]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareCode}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
            <Text style={styles.shareButtonText}>Share Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Create Pool Button */}
        <TouchableOpacity
          style={styles.createPoolButton}
          onPress={handleCreatePool}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GradientColors.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createPoolGradient}
          >
            <Ionicons name="add-circle" size={28} color={Colors.white} />
            <Text style={styles.createPoolButtonText}>Create Tip Pool</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Pools Section */}
        <View style={styles.poolsSection}>
          <Text style={styles.sectionTitle}>
            Recent Pools ({pools.length})
          </Text>

          {pools.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No tip pools yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first pool to split tips with your team
              </Text>
            </View>
          ) : (
            pools.map((pool) => (
              <TouchableOpacity
                key={pool.id}
                onPress={() => handlePoolPress(pool)}
                activeOpacity={0.7}
              >
                <View style={styles.poolCard}>
                  <View style={styles.poolHeader}>
                    <View style={styles.poolHeaderLeft}>
                      <Text style={styles.poolDate}>
                        {formatDate(new Date(pool.date))}
                      </Text>
                      {pool.shift_type && (
                        <Text style={styles.poolShift}>
                          {pool.shift_type.charAt(0).toUpperCase() + pool.shift_type.slice(1)}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBadgeColor(pool.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(pool.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.poolContent}>
                    <View style={styles.poolAmount}>
                      <Text style={styles.poolAmountLabel}>Total Pool</Text>
                      <Text style={styles.poolAmountValue}>
                        {formatCurrency(pool.total_amount)}
                      </Text>
                    </View>

                    <View style={styles.poolMeta}>
                      <Ionicons name="people" size={14} color={Colors.gray500} />
                      <Text style={styles.poolMetaText}>
                        {pool.split_type === 'equal_hours' ? 'Equal Hours' : 'Custom %'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.poolFooter}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  membersSection: {
    marginBottom: 24,
  },
  emptyMembersText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarCurrent: {
    backgroundColor: Colors.primary,
  },
  memberInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 3,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  memberEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inviteSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  inviteCodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  inviteCodeLeft: {
    flex: 1,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  inviteCodeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 3,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  copiedText: {
    color: Colors.success,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  createPoolButton: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  createPoolGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  createPoolButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  poolsSection: {
    marginBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  poolCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poolHeaderLeft: {
    flex: 1,
  },
  poolDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  poolShift: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  poolContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poolAmount: {
    flex: 1,
  },
  poolAmountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  poolAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  poolMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  poolMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  poolFooter: {
    alignItems: 'flex-end',
  },
});
