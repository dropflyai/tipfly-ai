// Bottom tab navigation for main app screens
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { BlurView } from 'expo-blur';
import { mediumHaptic } from '../utils/haptics';

// Import screens
import DashboardScreen from '../screens/main/DashboardScreen';
import AddTipScreen from '../screens/main/AddTipScreen';
import StatsScreen from '../screens/main/StatsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import TeamsScreen from '../screens/teams/TeamsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const [showAddTipModal, setShowAddTipModal] = useState(false);

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
            borderTopColor: Colors.border,
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={StatsScreen}
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Teams"
          component={TeamsScreen}
          options={{
            title: 'Teams',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={SettingsScreen}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating Action Button */}
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
