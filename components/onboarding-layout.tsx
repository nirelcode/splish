import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useEffect, useRef } from 'react';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  showImage?: boolean;
  children: React.ReactNode;
}

const ONBOARDING_STEPS = [
  '/onboarding/gender',
  '/onboarding/age',
  '/onboarding/weight',
  '/onboarding/activity',
  '/onboarding/weather',
  '/onboarding/drink-current',
  '/onboarding/goal',
  '/onboarding/notifications',
  '/onboarding/widget',
  '/onboarding/offer',
];

export default function OnboardingLayout({
  title,
  subtitle = 'help me personalize your experience',
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  showBack = true,
  showImage = true,
  children,
}: OnboardingLayoutProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Progress
  const currentIndex = ONBOARDING_STEPS.indexOf(pathname);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const targetProgress = (safeIndex + 1) / ONBOARDING_STEPS.length;
  // Start at the *previous* step so the bar animates forward by one increment
  const startProgress = safeIndex / ONBOARDING_STEPS.length;

  const mascotFloat = useRef(new Animated.Value(0)).current;
  // Initialize at previous step value — avoids the "springs from 0" bug
  const progressAnim = useRef(new Animated.Value(startProgress)).current;

  useEffect(() => {
    // Mascot float loop
    if (showImage) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(mascotFloat, { toValue: -8, duration: 1600, useNativeDriver: true }),
          Animated.timing(mascotFloat, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      ).start();
    }

    // Animate progress forward by one step
    Animated.spring(progressAnim, {
      toValue: targetProgress,
      friction: 9,
      tension: 70,
      useNativeDriver: false, // width % can't use native driver
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        }}
      >
        {/* Left: back button (or spacer to keep bar centered) */}
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 }}
          >
            <FontAwesome5 name="chevron-left" size={15} color={Colors.navy} />
            <Text style={{ fontFamily: FontFamily.black, fontSize: 16, color: Colors.navy }}>
              Back
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ minWidth: 60 }} />
        )}

        {/* Center: progress bar */}
        <View style={{ flex: 1, height: 7, backgroundColor: Colors.border, borderRadius: 4 }}>
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: Colors.navy,
              borderRadius: 4,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Right spacer to balance back button */}
        <View style={{ minWidth: 60 }} />
      </View>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          alignItems: 'center',
          paddingTop: Spacing.xs,
          paddingBottom: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Mascot */}
        {showImage && (
          <Animated.Image
            source={require('@/assets/images/splish-default.png')}
            style={{
              width: 180,
              height: 200,
              marginBottom: -Spacing.xs,
              transform: [{ translateY: mascotFloat }],
            }}
            resizeMode="contain"
          />
        )}

        {/* Title */}
        <Text
          style={{
            fontFamily: FontFamily.black,
            fontSize: 26,
            color: Colors.navy,
            textAlign: 'center',
            lineHeight: 32,
            marginBottom: Spacing.xs,
          }}
        >
          {title}
        </Text>

        {/* Subtitle */}
        {subtitle ? (
          <Text
            style={{
              fontFamily: FontFamily.semibold,
              fontSize: FontSize.sm,
              color: Colors.textSecondary,
              textAlign: 'center',
              marginBottom: Spacing.lg,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {/* Option cards */}
        <View style={{ width: '100%', gap: Spacing.sm }}>{children}</View>
      </ScrollView>

      {/* ── Next button pinned at bottom ───────────────────────── */}
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.md,
          paddingTop: Spacing.sm,
          backgroundColor: Colors.cream,
        }}
      >
        <TouchableOpacity
          onPress={onNext}
          disabled={nextDisabled}
          style={{
            backgroundColor: nextDisabled ? Colors.border : Colors.navy,
            borderRadius: Radius.pill,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: nextDisabled ? 'none' : `0 5px 0px ${Colors.navyDark}`,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: FontFamily.extrabold,
              fontSize: FontSize.lg,
              color: nextDisabled ? Colors.textSecondary : Colors.white,
            }}
          >
            {nextLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
