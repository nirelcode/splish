import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="gender" />
      <Stack.Screen name="age" />
      <Stack.Screen name="weight" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="weather" />
      <Stack.Screen name="drink-current" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="notify-permission" />
      <Stack.Screen name="trial-step1" options={{ gestureEnabled: false }} />
      <Stack.Screen name="trial-step2" options={{ gestureEnabled: false }} />
      <Stack.Screen name="trial-step3" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
