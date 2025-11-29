import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FeatureTourScreen from '../screens/onboarding/FeatureTourScreen';
import AddFirstTipScreen from '../screens/onboarding/AddFirstTipScreen';
import SuccessScreen from '../screens/onboarding/SuccessScreen';
import { useUserStore } from '../store/userStore';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  const [hasAddedTip, setHasAddedTip] = useState(false);
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {/* Feature Tour - 3 swipeable screens */}
      <Stack.Screen name="FeatureTour">
        {(props) => (
          <FeatureTourScreen
            onComplete={() => props.navigation.navigate('AddFirstTip')}
            onSkip={() => {
              setHasAddedTip(false);
              props.navigation.navigate('Success');
            }}
          />
        )}
      </Stack.Screen>

      {/* Add First Tip - with pre-filled example */}
      <Stack.Screen name="AddFirstTip">
        {(props) => (
          <AddFirstTipScreen
            {...props}
            onNext={() => {
              setHasAddedTip(true);
              props.navigation.navigate('Success');
            }}
            onSkip={() => {
              setHasAddedTip(false);
              props.navigation.navigate('Success');
            }}
          />
        )}
      </Stack.Screen>

      {/* Success - celebration screen */}
      <Stack.Screen name="Success">
        {(props) => (
          <SuccessScreen
            {...props}
            hasAddedTip={hasAddedTip}
            onFinish={completeOnboarding}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
