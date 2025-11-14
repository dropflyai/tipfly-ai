// Main app navigation
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '../store/userStore';
import { supabase } from '../services/api/supabase';

// Import screens
import JobSelectionScreen from '../screens/onboarding/JobSelectionScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import MainTabNavigator from './MainTabNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import UpgradeScreen from '../screens/subscription/UpgradeScreen';
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import BillSplitScreen from '../screens/premium/BillSplitScreen';
import TaxTrackingScreen from '../screens/premium/TaxTrackingScreen';
import GoalsScreen from '../screens/premium/GoalsScreen';
import ExportReportsScreen from '../screens/premium/ExportReportsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import TipHistoryScreen from '../screens/history/TipHistoryScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import TeamDetailScreen from '../screens/teams/TeamDetailScreen';
import CreatePoolScreen from '../screens/pools/CreatePoolScreen';
import PoolDetailScreen from '../screens/pools/PoolDetailScreen';
import ContactSupportScreen from '../screens/settings/ContactSupportScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, setUser, setLoading, hasCompletedOnboarding } = useUserStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AppNavigator] Initial session check:', session ? 'User logged in' : 'No session');
      if (session?.user) {
        console.log('[AppNavigator] User ID:', session.user.id);
        console.log('[AppNavigator] Email confirmed:', session.user.email_confirmed_at);
        // Fetch user profile
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
        setInitializing(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AppNavigator] Auth state changed:', event);
      console.log('[AppNavigator] Session:', session ? 'User logged in' : 'No session');
      if (session?.user) {
        console.log('[AppNavigator] User ID:', session.user.id);
        console.log('[AppNavigator] Email confirmed:', session.user.email_confirmed_at);
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log(`[AppNavigator] Fetching user profile for ID: ${userId} (attempt ${retryCount + 1})`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AppNavigator] Error fetching user profile:', error);

        // Retry up to 3 times with delay (profile might not be created yet by trigger)
        if (retryCount < 3) {
          console.log('[AppNavigator] Retrying in 1 second...');
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, 1000);
          return;
        }

        throw error;
      }

      if (data) {
        console.log('[AppNavigator] User profile fetched successfully:', data.email);
        console.log('[AppNavigator] Has completed onboarding:', hasCompletedOnboarding);
        setUser(data);
      } else {
        console.log('[AppNavigator] No user profile data returned');
      }
    } catch (error) {
      console.error('[AppNavigator] Fatal error fetching user profile:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  if (initializing) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth flow
          <>
            <Stack.Screen name="JobSelection" component={JobSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !hasCompletedOnboarding ? (
          // Interactive tutorial onboarding
          <>
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          </>
        ) : (
          // Main app
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="Upgrade"
              component={UpgradeScreen}
              options={{
                headerShown: true,
                title: 'Upgrade to Premium'
              }}
            />
            <Stack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{
                headerShown: true,
                title: 'Terms of Service'
              }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{
                headerShown: true,
                title: 'Privacy Policy'
              }}
            />
            <Stack.Screen
              name="BillSplit"
              component={BillSplitScreen}
              options={{
                headerShown: true,
                title: 'Bill Split Calculator'
              }}
            />
            <Stack.Screen
              name="TaxTracking"
              component={TaxTrackingScreen}
              options={{
                headerShown: true,
                title: 'Tax Tracking'
              }}
            />
            <Stack.Screen
              name="Goals"
              component={GoalsScreen}
              options={{
                headerShown: true,
                title: 'Goals'
              }}
            />
            <Stack.Screen
              name="ExportReports"
              component={ExportReportsScreen}
              options={{
                headerShown: true,
                title: 'Export Reports'
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: true,
                title: 'Edit Profile'
              }}
            />
            <Stack.Screen
              name="TipHistory"
              component={TipHistoryScreen}
              options={{
                headerShown: false,
                title: 'Tip History'
              }}
            />
            <Stack.Screen
              name="Jobs"
              component={JobsScreen}
              options={{
                headerShown: false,
                title: 'Jobs'
              }}
            />
            <Stack.Screen
              name="TeamDetail"
              component={TeamDetailScreen}
              options={{
                headerShown: false,
                title: 'Team'
              }}
            />
            <Stack.Screen
              name="CreatePool"
              component={CreatePoolScreen}
              options={{
                headerShown: false,
                title: 'Create Pool'
              }}
            />
            <Stack.Screen
              name="PoolDetail"
              component={PoolDetailScreen}
              options={{
                headerShown: false,
                title: 'Pool Details'
              }}
            />
            <Stack.Screen
              name="ContactSupport"
              component={ContactSupportScreen}
              options={{
                headerShown: false,
                title: 'Contact Support'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
