import { View, Text, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

const FEATURES = [
  {
    icon: '💧',
    text: 'Get gentle reminders throughout the day',
  },
  {
    icon: '🔥',
    text: 'Stay consistent with your daily streak',
  },
  {
    icon: '🎯',
    text: 'Get notified when you hit your daily goal',
  },
];

export default function NotifyPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  async function handleEnable() {
    await Notifications.requestPermissionsAsync();
    router.push('/onboarding/trial-step1');
  }

  function handleSkip() {
    router.push('/onboarding/trial-step1');
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>

      {/* Skip button top right */}
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'flex-end',
      }}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.6} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textSecondary }}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center', gap: Spacing.xl }}>

        {/* Mascot */}
        <Animated.Image
          source={require('@/assets/images/splish-default.png')}
          style={[{ width: 180, height: 200, alignSelf: 'center' }, floatStyle]}
          resizeMode="contain"
        />

        {/* Title + subtitle */}
        <View style={{ gap: Spacing.sm, alignItems: 'center' }}>
          <Text style={{
            fontFamily: FontFamily.black,
            fontSize: 28,
            color: Colors.navy,
            textAlign: 'center',
            lineHeight: 34,
          }}>
            Splish works best{'\n'}with notifications
          </Text>
          <Text style={{
            fontFamily: FontFamily.medium,
            fontSize: FontSize.md,
            color: Colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Reminders are what turn a goal into a habit.{'\n'}Enable them to get the full Splish experience.
          </Text>
        </View>

        {/* Feature rows */}
        <View style={{ gap: Spacing.md }}>
          {FEATURES.map((f, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              backgroundColor: Colors.white,
              borderRadius: Radius.lg,
              padding: Spacing.md,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: Colors.sky,
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              </View>
              <Text style={{
                flex: 1,
                fontFamily: FontFamily.semibold,
                fontSize: FontSize.md,
                color: Colors.navy,
                lineHeight: 20,
              }}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

      </View>

      {/* Enable button */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={handleEnable}
          style={{
            backgroundColor: Colors.navy,
            borderRadius: Radius.pill,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 5px 0px ${Colors.navyDark}`,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>
            Enable notifications
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
