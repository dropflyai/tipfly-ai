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
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, GlassStyles } from '../../constants/colors';
import { WorkplaceWithMembers } from '../../types/teams';
import { getUserWorkplaces, leaveWorkplace } from '../../services/api/teams';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useUserStore } from '../../store/userStore';
import { useNavigation } from '@react-navigation/native';
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

export default function TeamsScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const isPremium = useUserStore((state) => state.isPremium());
  const [teams, setTeams] = useState<WorkplaceWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  // Register global callback for tour
  useEffect(() => {
    globalShowCreateTeamModal = () => {
      setCreateModalVisible(true);
    };
    return () => {
      globalShowCreateTeamModal = null;
    };
  }, []);

  const loadTeams = async () => {
    try {
      const workplaces = await getUserWorkplaces();
      setTeams(workplaces);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTeams();
  }, []);

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
            // TODO: Navigate to premium upgrade screen
            console.log('Navigate to premium upgrade');
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
            // TODO: Navigate to premium upgrade screen
            console.log('Navigate to premium upgrade');
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
    setTeams([newTeam, ...teams]);
    Alert.alert('Team Created!', `Share invite code: ${newTeam.invite_code}`);
  };

  const handleTeamJoined = (joinedTeam: WorkplaceWithMembers) => {
    mediumHaptic();
    setJoinModalVisible(false);
    setTeams([joinedTeam, ...teams]);
    Alert.alert('Success!', `You joined ${joinedTeam.name}`);
  };

  const handleCopyInviteCode = (code: string, teamName: string) => {
    lightHaptic();
    Clipboard.setString(code);
    Alert.alert('Copied!', `Invite code ${code} copied to clipboard`);
  };

  const handleLeaveTeam = (team: WorkplaceWithMembers) => {
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

  if (loading) {
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
        {/* Premium Badge - Glass with gold accent */}
        {!isPremium && (
          <View style={styles.premiumBanner}>
            <Ionicons name="star" size={16} color={Colors.gold} />
            <Text style={styles.premiumBannerText}>
              Free: 1 team • Premium: Unlimited teams
            </Text>
          </View>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Teams Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a team or join one with an invite code
            </Text>
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
                {/* Team Name */}
                <View style={styles.teamHeader}>
                  <View style={styles.teamIconContainer}>
                    <Ionicons name="briefcase" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.teamName}>{team.name}</Text>
                </View>

                {/* Member Count */}
                <View style={styles.teamDetail}>
                  <Ionicons name="people" size={16} color={Colors.primary} />
                  <Text style={styles.teamDetailText}>
                    {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                  </Text>
                </View>

                {/* Invite Code */}
                <TouchableOpacity
                  style={styles.inviteCodeRow}
                  onPress={() => handleCopyInviteCode(team.invite_code, team.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key" size={16} color={Colors.primary} />
                  <Text style={styles.inviteCode}>{team.invite_code}</Text>
                  <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Role Badge - Gold for owner, blue tint for member */}
                <View
                  style={[
                    styles.roleBadge,
                    team.user_role === 'owner'
                      ? styles.roleBadgeOwner
                      : styles.roleBadgeMember,
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
            </TouchableOpacity>
          ))
        )}

        {/* Join Team Button - Glass with dashed blue border */}
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
    fontWeight: 'bold',
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
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...GlassStyles.card,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  premiumBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Team Card - Glass style
  teamCard: {
    ...GlassStyles.card,
    padding: 20,
    marginBottom: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  teamIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  teamDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  teamDetailText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 232, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  inviteCode: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  roleBadgeOwner: {
    backgroundColor: Colors.gold,
    ...Shadows.glowGoldSubtle,
  },
  roleBadgeMember: {
    backgroundColor: 'rgba(0, 168, 232, 0.2)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  roleBadgeTextOwner: {
    color: Colors.background,
  },
  // Join Button - Glass with dashed blue border
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    ...GlassStyles.card,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    padding: 20,
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
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  joinButtonSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});
