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
      <Stack.Screen name="widget" />
      <Stack.Screen name="offer" />
    </Stack>
  );
}
