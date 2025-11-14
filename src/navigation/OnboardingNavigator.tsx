import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
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
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome">
        {(props) => (
          <WelcomeScreen
            onNext={() => props.navigation.navigate('AddFirstTip')}
          />
        )}
      </Stack.Screen>
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
