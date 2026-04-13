import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export default function TrialStep1Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg }}>

        {/* Mascot */}
        <Animated.Image
          source={require('@/assets/images/splish-default.png')}
          style={[{ width: 180, height: 200 }, floatStyle]}
          resizeMode="contain"
        />

        <Text style={{
          fontFamily: FontFamily.black,
          fontSize: 32,
          color: Colors.navy,
          textAlign: 'center',
          lineHeight: 40,
        }}>
          We offer 3 days of{'\n'}premium access,{'\n'}just for you
        </Text>

        <Text style={{
          fontFamily: FontFamily.medium,
          fontSize: FontSize.md,
          color: Colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
        }}>
          To help you stay hydrated and{'\n'}build a lasting habit
        </Text>

      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/trial-step2')}
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
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
