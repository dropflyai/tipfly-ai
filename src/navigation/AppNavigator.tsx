// Main app navigation
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useUserStore } from '../store/userStore';
import { useAppLockStore } from '../store/appLockStore';
import { useAnimationStore } from '../store/animationStore';
import { supabase } from '../services/api/supabase';

// Deep linking
import {
  setupDeepLinkListener,
  getInitialDeepLink,
  handleReferralDeepLink,
  DeepLinkResult,
} from '../services/deepLink/deepLinkHandler';
import { initializeReferralData } from '../services/api/referrals';

// Import screens
import LandingScreen from '../screens/onboarding/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import UpgradeScreen from '../screens/subscription/UpgradeScreenV2';
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import BillSplitScreen from '../screens/premium/BillSplitScreen';
import TaxTrackingScreen from '../screens/premium/TaxTrackingScreen';
import GoalsScreen from '../screens/premium/GoalsScreen';
import ExportReportsScreen from '../screens/premium/ExportReportsScreen';
import IncomeVerificationScreen from '../screens/premium/IncomeVerificationScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import TipHistoryScreen from '../screens/history/TipHistoryScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import TeamDetailScreen from '../screens/teams/TeamDetailScreen';
import CreatePoolScreen from '../screens/pools/CreatePoolScreen';
import PoolDetailScreen from '../screens/pools/PoolDetailScreen';
import ContactSupportScreen from '../screens/settings/ContactSupportScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ReferralScreen from '../screens/referral/ReferralScreen';
import AchievementsScreen from '../screens/achievements/AchievementsScreen';
import LockScreen from '../components/LockScreen';
import SplashAnimation from '../components/SplashAnimation';
import CelebrationModal from '../components/CelebrationModal';
import BadgeCelebrationModal from '../components/BadgeCelebrationModal';
import { useGamificationStore } from '../store/gamificationStore';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, setUser, setLoading, hasCompletedOnboarding, completeOnboarding, resetOnboarding } = useUserStore();
  const [initializing, setInitializing] = useState(true);

  // Splash animation state
  const hasShownSplashThisSession = useAnimationStore((state) => state.hasShownSplashThisSession);
  const setHasShownSplashThisSession = useAnimationStore((state) => state.setHasShownSplashThisSession);
  const [showSplash, setShowSplash] = useState(true);

  // Goal celebration state
  const shouldShowGoalCelebration = useAnimationStore((state) => state.shouldShowGoalCelebration);
  const goalCelebrationData = useAnimationStore((state) => state.goalCelebrationData);
  const clearGoalCelebration = useAnimationStore((state) => state.clearGoalCelebration);

  // Badge celebration state
  const pendingBadgeCelebration = useGamificationStore((state) => state.pendingBadgeCelebration);
  const clearBadgeCelebration = useGamificationStore((state) => state.clearBadgeCelebration);

  // App Lock state
  const appState = useRef(AppState.currentState);
  const isAppLockEnabled = useAppLockStore((state) => state.isAppLockEnabled);
  const isLocked = useAppLockStore((state) => state.isLocked);
  const lock = useAppLockStore((state) => state.lock);
  const setLastBackgroundTime = useAppLockStore((state) => state.setLastBackgroundTime);
  const shouldLock = useAppLockStore((state) => state.shouldLock);

  // Handle app state changes for lock screen
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground
        console.log('[AppNavigator] App came to foreground');
        if (shouldLock()) {
          console.log('[AppNavigator] Locking app');
          lock();
        }
        setLastBackgroundTime(null);
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to background
        console.log('[AppNavigator] App went to background');
        if (isAppLockEnabled) {
          setLastBackgroundTime(Date.now());
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled, shouldLock, lock, setLastBackgroundTime]);

  // Navigation ref for deep linking
  const navigationRef = useRef<any>(null);

  // Handle deep links
  const handleDeepLink = async (result: DeepLinkResult) => {
    if (!result.handled) return;

    if (result.type === 'referral' && result.data?.code) {
      const response = await handleReferralDeepLink(result.data.code, !!user);
      if (response.message) {
        Alert.alert(
          response.success ? 'Welcome!' : 'Referral Code',
          response.message
        );
      }
    }

    if (result.type === 'reset-password') {
      // Navigate to reset password screen
      console.log('[AppNavigator] Password reset deep link received');
      // The supabase auth will handle the token exchange automatically
      // Just need to show the reset password screen
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.navigate('ResetPassword');
        }
      }, 500);
    }
  };

  // Set up deep link listener and check for initial link
  useEffect(() => {
    // Set up listener for links while app is running
    const cleanup = setupDeepLinkListener(handleDeepLink);

    // Check for link that opened the app
    getInitialDeepLink().then((result) => {
      if (result) {
        handleDeepLink(result);
      }
    });

    return cleanup;
  }, [user]);

  // Initialize referral data when user logs in
  useEffect(() => {
    if (user && hasCompletedOnboarding) {
      initializeReferralData();
    }
  }, [user, hasCompletedOnboarding]);

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
        console.log('[AppNavigator] DB onboarding_completed:', data.onboarding_completed);

        // Sync onboarding state from database (source of truth for new users)
        if (data.onboarding_completed) {
          completeOnboarding();
        } else {
          resetOnboarding();
        }

        console.log('[AppNavigator] Has completed onboarding (after sync):', data.onboarding_completed);
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

  // Handle splash animation completion
  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasShownSplashThisSession(true);
  };

  if (initializing) {
    return null; // Or a loading screen
  }

  // Show splash animation on first launch or cold start (before lock screen)
  const shouldShowSplashAnimation = showSplash && !hasShownSplashThisSession;

  // Show lock screen if enabled and locked
  if (user && hasCompletedOnboarding && isAppLockEnabled && isLocked) {
    return <LockScreen />;
  }

  return (
    <>
      {/* Splash Animation Overlay */}
      {shouldShowSplashAnimation && (
        <SplashAnimation onAnimationComplete={handleSplashComplete} />
      )}

      {/* Goal Celebration Modal */}
      <CelebrationModal
        visible={shouldShowGoalCelebration}
        type="goal"
        title={goalCelebrationData?.title}
        subtitle={goalCelebrationData?.subtitle}
        onClose={clearGoalCelebration}
      />

      {/* Badge Celebration Modal */}
      <BadgeCelebrationModal
        badge={pendingBadgeCelebration}
        onClose={clearBadgeCelebration}
      />

      <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth flow - Landing first, then direct to Signup or Login
          <>
            <Stack.Screen name="Landing">
              {(props) => (
                <LandingScreen
                  onSignUp={() => props.navigation.navigate('Signup')}
                  onLogin={() => props.navigation.navigate('Login')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
                headerShown: false,
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
              name="IncomeVerification"
              component={IncomeVerificationScreen}
              options={{
                headerShown: true,
                title: 'Income Summary Report'
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
            <Stack.Screen
              name="PrivacySettings"
              component={PrivacySettingsScreen}
              options={{
                headerShown: false,
                title: 'Privacy Settings'
              }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{
                headerShown: false,
                title: 'Notifications'
              }}
            />
            <Stack.Screen
              name="Referral"
              component={ReferralScreen}
              options={{
                headerShown: false,
                title: 'Invite Friends'
              }}
            />
            <Stack.Screen
              name="Achievements"
              component={AchievementsScreen}
              options={{
                headerShown: false,
                title: 'Achievements'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
