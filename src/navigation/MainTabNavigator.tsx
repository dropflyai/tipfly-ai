// Bottom tab navigation for main app screens
import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Modal, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { BlurView } from 'expo-blur';
import { mediumHaptic } from '../utils/haptics';
import { usePendingPoolsStore } from '../store/pendingPoolsStore';

// Import screens
import DashboardScreen from '../screens/main/DashboardScreen';
import AddTipScreen from '../screens/main/AddTipScreen';
import StatsScreen from '../screens/main/StatsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import TeamsScreen from '../screens/teams/TeamsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const [showAddTipModal, setShowAddTipModal] = useState(false);
  const pendingCount = usePendingPoolsStore((state) => state.pendingCount);
  const fetchPendingPools = usePendingPoolsStore((state) => state.fetchPendingPools);

  // Fetch pending pools on mount
  useEffect(() => {
    fetchPendingPools();
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
          component={DashboardScreen}
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
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 90,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
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
