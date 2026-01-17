// Bottom tab navigation for main app screens
import React, { useState, useEffect, useCallback } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Modal, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { BlurView } from 'expo-blur';
import { mediumHaptic } from '../utils/haptics';
import { usePendingPoolsStore } from '../store/pendingPoolsStore';
import { useUserStore } from '../store/userStore';
import AppTour, { TourStep } from '../components/AppTour';

// Tab param list type for navigation
type TabParamList = {
  Home: undefined;
  Analytics: undefined;
  Teams: undefined;
  Profile: undefined;
};

// Import screens
import DashboardScreen from '../screens/main/DashboardScreenV2';
import AddTipScreen from '../screens/main/AddTipScreen';
import StatsScreen from '../screens/main/StatsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import TeamsScreen, { triggerCreateTeamModal } from '../screens/teams/TeamsScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate tab positions based on 4 tabs evenly distributed
const TAB_WIDTH = SCREEN_WIDTH / 4;
const TAB_BAR_HEIGHT = 70;
const TAB_ICON_SIZE = 28;
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0;

// FAB position
const FAB_SIZE = 64;
const FAB_BOTTOM = Platform.OS === 'ios' ? 90 : 90;
const FAB_RIGHT = 20;

// Interactive tour steps - user learns by doing!
const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    type: 'tap_anywhere',
    title: 'Welcome to TipFly! 🎉',
    description: 'Let\'s take a quick interactive tour. You\'ll learn by tapping the actual buttons!',
    icon: 'sparkles',
    spotlightPosition: {
      x: SCREEN_WIDTH / 2 - 50,
      y: SCREEN_HEIGHT / 2 - 50,
      width: 100,
      height: 100,
    },
    tooltipPosition: 'bottom',
    buttonText: 'Tap to Start',
  },
  {
    id: 'dashboard',
    type: 'info',
    title: 'Your Dashboard',
    description: 'This is your home base! See today\'s tips, weekly earnings, and quick stats at a glance.',
    icon: 'home',
    spotlightPosition: {
      x: 20,
      y: 100,
      width: SCREEN_WIDTH - 40,
      height: 200,
    },
    tooltipPosition: 'bottom',
    navigateToTab: 'Home',
  },
  {
    id: 'add-tip',
    type: 'tap_element',
    title: 'Add Your Tips',
    description: 'This golden button is your best friend! Tap it to log tips after every shift.',
    icon: 'add-circle',
    spotlightPosition: {
      // FAB is positioned at bottom: 90, right: 20
      // Raise spotlight higher to center on FAB
      x: SCREEN_WIDTH - FAB_RIGHT - FAB_SIZE,
      y: SCREEN_HEIGHT - FAB_BOTTOM - FAB_SIZE - 20,
      width: FAB_SIZE,
      height: FAB_SIZE,
    },
    tooltipPosition: 'top',
    navigateToTab: 'Home',
    action: 'open_add_tip',
  },
  {
    id: 'analytics-tab',
    type: 'tap_element',
    title: 'View Your Analytics',
    description: 'Tap the Analytics tab to see your earnings trends and insights.',
    icon: 'analytics',
    spotlightPosition: {
      // Analytics is 2nd tab (index 1), center it on the tab icon
      x: TAB_WIDTH * 1 + (TAB_WIDTH / 2) - 28,
      y: SCREEN_HEIGHT - TAB_BAR_HEIGHT - 20,
      width: 56,
      height: 56,
    },
    tooltipPosition: 'top',
    navigateToTab: 'Home',
    action: 'navigate_analytics',
  },
  {
    id: 'analytics-explain',
    type: 'info',
    title: 'Analytics & Insights',
    description: 'Scroll down to see your earnings charts and trends. Discover your best-earning days and track weekly progress!',
    icon: 'bar-chart',
    spotlightPosition: {
      x: 20,
      y: 150,
      width: SCREEN_WIDTH - 40,
      height: 250,
    },
    tooltipPosition: 'bottom',
    navigateToTab: 'Analytics',
  },
  {
    id: 'teams-tab',
    type: 'tap_element',
    title: 'Team Tip Pools',
    description: 'Tap the Teams tab to manage tip pools with coworkers.',
    icon: 'people',
    spotlightPosition: {
      // Teams is 3rd tab (index 2), center it on the tab icon
      x: TAB_WIDTH * 2 + (TAB_WIDTH / 2) - 28,
      y: SCREEN_HEIGHT - TAB_BAR_HEIGHT - 20,
      width: 56,
      height: 56,
    },
    tooltipPosition: 'top',
    navigateToTab: 'Analytics',
    action: 'navigate_teams',
  },
  {
    id: 'teams-create',
    type: 'tap_element',
    title: 'Create Your First Team',
    description: 'Tap the + button to create a team. You\'ll name it and invite coworkers!',
    icon: 'add-circle',
    spotlightPosition: {
      x: SCREEN_WIDTH - 56,
      y: 48,
      width: 40,
      height: 40,
    },
    tooltipPosition: 'bottom',
    navigateToTab: 'Teams',
    action: 'navigate_create_team',
  },
  {
    id: 'profile-tab',
    type: 'tap_element',
    title: 'Your Profile',
    description: 'Finally, tap Profile to manage your account and settings.',
    icon: 'person',
    spotlightPosition: {
      // Profile is 4th tab (index 3), center it on the tab icon
      x: TAB_WIDTH * 3 + (TAB_WIDTH / 2) - 28,
      y: SCREEN_HEIGHT - TAB_BAR_HEIGHT - 20,
      width: 56,
      height: 56,
    },
    tooltipPosition: 'top',
    navigateToTab: 'Teams',
    action: 'navigate_profile',
  },
  {
    id: 'complete',
    type: 'tap_anywhere',
    title: 'You\'re All Set! 🚀',
    description: 'Start tracking your tips and watch your earnings grow. Happy earning!',
    icon: 'checkmark-circle',
    spotlightPosition: {
      x: SCREEN_WIDTH / 2 - 50,
      y: SCREEN_HEIGHT / 2 - 50,
      width: 100,
      height: 100,
    },
    tooltipPosition: 'bottom',
    navigateToTab: 'Profile',
    buttonText: "Let's Go!",
  },
];

const Tab = createBottomTabNavigator<TabParamList>();

// Global state for tour navigation (allows navigation from outside navigator context)
let globalTabNavigate: ((tabName: keyof TabParamList) => void) | null = null;

// Wrapper component to capture navigation from within the tab navigator
function DashboardScreenWrapper(props: any) {
  // Store navigation function globally when this screen mounts
  useEffect(() => {
    globalTabNavigate = (tabName: keyof TabParamList) => {
      props.navigation.navigate(tabName);
    };
  }, [props.navigation]);

  return <DashboardScreen {...props} />;
}

export default function MainTabNavigator() {
  const pendingCount = usePendingPoolsStore((state) => state.pendingCount);
  const fetchPendingPools = usePendingPoolsStore((state) => state.fetchPendingPools);
  const hasCompletedTour = useUserStore((state) => state.hasCompletedTour);
  const completeTour = useUserStore((state) => state.completeTour);

  const [showAddTipModal, setShowAddTipModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Fetch pending pools on mount
  useEffect(() => {
    fetchPendingPools();
  }, []);

  // Show tour for users who haven't seen it yet
  useEffect(() => {
    if (!hasCompletedTour) {
      // Small delay to let the main UI render first
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  const handleTourComplete = useCallback(() => {
    setShowTour(false);
    completeTour();
    // Navigate back to Home after tour
    if (globalTabNavigate) {
      globalTabNavigate('Home');
    }
    console.log('[MainTabNavigator] Tour completed');
  }, [completeTour]);

  const handleTourNavigate = useCallback((tabName: string) => {
    console.log('[MainTabNavigator] Tour navigating to:', tabName);
    // Use global navigate function directly
    if (globalTabNavigate) {
      globalTabNavigate(tabName as keyof TabParamList);
    }
  }, []);

  // Handle tour actions (interactive elements)
  const handleTourAction = useCallback((action: string) => {
    console.log('[MainTabNavigator] Tour action:', action);

    switch (action) {
      case 'open_add_tip':
        // Brief flash to show the modal would open
        mediumHaptic();
        setShowAddTipModal(true);
        // Auto-close after a brief moment so tour can continue
        setTimeout(() => {
          setShowAddTipModal(false);
        }, 1500);
        break;
      case 'navigate_analytics':
        if (globalTabNavigate) {
          globalTabNavigate('Analytics');
        }
        break;
      case 'navigate_teams':
        if (globalTabNavigate) {
          globalTabNavigate('Teams');
        }
        break;
      case 'navigate_profile':
        if (globalTabNavigate) {
          globalTabNavigate('Profile');
        }
        break;
      case 'navigate_create_team':
        // Open the create team modal
        mediumHaptic();
        // Small delay to let the Teams screen fully render
        setTimeout(() => {
          triggerCreateTeamModal();
        }, 300);
        break;
    }
  }, []);

  const handleFABPress = () => {
    mediumHaptic();
    setShowAddTipModal(true);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.backgroundSecondary,
            borderTopWidth: 1,
            borderTopColor: Colors.borderBlue,
            elevation: 0,
            height: 70,
            paddingBottom: Platform.OS === 'ios' ? 20 : 12,
            paddingTop: 8,
            bottom: Platform.OS === 'ios' ? 0 : 8,
          },
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView
                tint="dark"
                intensity={95}
                style={StyleSheet.absoluteFill}
              />
            ) : null
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreenWrapper}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={StatsScreen}
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons name={focused ? "analytics" : "analytics-outline"} size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Teams"
          component={TeamsScreen}
          options={{
            title: 'Teams',
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarBadgeStyle: pendingCount > 0 ? styles.badge : undefined,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={SettingsScreen}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating Action Button - Gold for "add money" */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFABPress}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* Add Tip Modal */}
      <Modal
        visible={showAddTipModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTipModal(false)}
      >
        <AddTipScreen onClose={() => setShowAddTipModal(false)} />
      </Modal>

      {/* App Tour */}
      <AppTour
        visible={showTour}
        onComplete={handleTourComplete}
        steps={tourSteps}
        onNavigateToTab={handleTourNavigate}
        onAction={handleTourAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: FAB_BOTTOM,
    right: FAB_RIGHT,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.buttonGold,
  },
  activeIconContainer: {
    // Subtle glow effect for active tab
    ...Shadows.glowBlueSubtle,
  },
  badge: {
    backgroundColor: Colors.error,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 18,
    height: 18,
  },
});
