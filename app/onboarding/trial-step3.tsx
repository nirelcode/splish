import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore } from '@/store/useWaterStore';
import { usePremium } from '@/hooks/use-premium';

const PERKS = [
  "Enjoy your first 3 days, it's free",
  'Cancel easily from the app',
  'Unlimited themes & skins',
  'Homescreen widgets',
  'Hard Mode & advanced features',
];

export default function TrialStep3Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finishOnboarding = useWaterStore((s) => s.finishOnboarding);
  const { packages, purchase, loading } = usePremium();

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  function finish() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  function handleTryFree() {
    Alert.alert('Coming soon', 'In-app purchases will be available very soon!', [
      { text: 'Continue to app', onPress: finish },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>

      {/* Skip top right */}
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'flex-end' }}>
        <TouchableOpacity onPress={finish} activeOpacity={0.6} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textSecondary }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center', gap: Spacing.xl }}>

        {/* Mascot */}
        <Animated.Image
          source={require('@/assets/images/splish-default.png')}
          style={[{ width: 180, height: 200, alignSelf: 'center' }, floatStyle]}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={{
          fontFamily: FontFamily.black,
          fontSize: 28,
          color: Colors.navy,
          textAlign: 'center',
        }}>
          What you'll get
        </Text>

        {/* Checklist */}
        <View style={{ gap: Spacing.md }}>
          {PERKS.map((perk, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Ionicons name="checkmark" size={22} color={Colors.navy} />
              <Text style={{
                flex: 1,
                fontFamily: FontFamily.semibold,
                fontSize: FontSize.md,
                color: Colors.navy,
                lineHeight: 22,
              }}>
                {perk}
              </Text>
            </View>
          ))}
        </View>

      </View>

      {/* Try for free button */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={handleTryFree}
          disabled={loading}
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
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>
              Try for free
            </Text>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}
