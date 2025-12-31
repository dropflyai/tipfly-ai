import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeStep from '../screens/onboarding/WelcomeStep';
import JobSelectionScreen from '../screens/onboarding/JobSelectionScreen';
import AddFirstTipScreen from '../screens/onboarding/AddFirstTipScreen';
import SuccessScreen from '../screens/onboarding/SuccessScreen';
import { useUserStore } from '../store/userStore';
import { JobType } from '../types';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(null);
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const setJobType = useUserStore((state) => state.setJobType);

  const handleJobSelected = (jobType: JobType, navigation: any) => {
    setSelectedJobType(jobType);
    setJobType(jobType);
    navigation.navigate('AddFirstTip');
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {/* Welcome Step - Introduction */}
      <Stack.Screen name="Welcome">
        {(props) => (
          <WelcomeStep
            onNext={() => props.navigation.navigate('JobSelection')}
          />
        )}
      </Stack.Screen>

      {/* Job Selection - Required */}
      <Stack.Screen name="JobSelection">
        {(props) => (
          <JobSelectionScreen
            onNext={(jobType) => handleJobSelected(jobType, props.navigation)}
          />
        )}
      </Stack.Screen>

      {/* Add First Tip - Required */}
      <Stack.Screen name="AddFirstTip">
        {(props) => (
          <AddFirstTipScreen
            jobType={selectedJobType || undefined}
            onNext={() => props.navigation.navigate('Success')}
          />
        )}
      </Stack.Screen>

      {/* Success - Celebration screen */}
      <Stack.Screen name="Success">
        {() => (
          <SuccessScreen
            onFinish={completeOnboarding}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
