import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useWaterStore } from '@/store/useWaterStore';
import { useScheduleNotifications, useHardModeNotificationListener } from '@/hooks/use-notifications';
import { HardModeLockScreen } from '@/components/hard-mode/lock-screen';
import { useWidgetSync } from '@/hooks/use-widget-sync';
import { startHardModeLock, stopHardModeLock } from '@/lib/hard-mode-lock';
import { initPurchases } from '@/lib/purchases';

SplashScreen.preventAutoHideAsync();
initPurchases();

function AppServices() {
  useScheduleNotifications();
  useHardModeNotificationListener();
  useWidgetSync();

  const hardModePendingAt = useWaterStore((s) => s.hardModePendingAt);
  const clearHardModePending = useWaterStore((s) => s.clearHardModePending);

  // Drive Android overlay service from the pending state
  useEffect(() => {
    if (hardModePendingAt !== null) {
      startHardModeLock();
    } else {
      stopHardModeLock();
    }
  }, [hardModePendingAt]);

  useEffect(() => {
    // Check streak on launch and every time app comes to foreground
    useWaterStore.getState().checkStreak();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useWaterStore.getState().checkStreak();
    });
    return () => sub.remove();
  }, []);

  return (
    <HardModeLockScreen
      visible={hardModePendingAt !== null}
      onSnooze={clearHardModePending}
    />
  );
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // Hide splash when fonts load OR if there's an error (don't hang forever)
  useEffect(() => {
    if (loaded || fontError) SplashScreen.hideAsync();
  }, [loaded, fontError]);

  // Safety net: hide splash after 3s regardless
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync(), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!loaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppServices />
          <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="dark" />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
