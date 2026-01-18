import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { useSubscriptionStore } from './src/store/subscriptionStore';
import { AlertProvider } from './src/contexts/AlertContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);

  useEffect(() => {
    // Initialize RevenueCat for in-app purchases
    initializeSubscriptions().catch((error) => {
      console.warn('[App] RevenueCat initialization failed:', error);
    });

    // Hide splash screen after a short delay to ensure app is ready
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AppNavigator />
      </AlertProvider>
    </SafeAreaProvider>
  );
}
