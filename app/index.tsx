import { View, Text, TouchableOpacity, Image, useWindowDimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore } from '@/store/useWaterStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onboardingDone = useWaterStore((s) => s.onboardingDone);

  // If onboarding already complete, skip straight to app
  useEffect(() => {
    if (onboardingDone) router.replace('/(tabs)');
  }, [onboardingDone]);
  const { height, width } = useWindowDimensions();

  // Animation values
  const dropAnim = useRef(new Animated.Value(-height)).current; // Start above screen

  useEffect(() => {
    router.prefetch('/onboarding/gender');
    
    // Start falling animation
    Animated.spring(dropAnim, {
      toValue: 0,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, overflow: 'hidden' }}>
      {/* Blue sky hero */}
      <View
        style={{
          height: height * 0.52,
          backgroundColor: Colors.sky,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
        }}
      >
        <Animated.Image
          source={require('@/assets/images/splish-default.png')}
          style={{ 
            width: height * 0.52, 
            height: height * 0.52,
            transform: [{ translateY: dropAnim }]
          }}
          resizeMode="contain"
        />
      </View>

      {/* White card content */}
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.cream,
          marginTop: -30,
          paddingHorizontal: Spacing.xl,
          paddingTop: 60,
          paddingBottom: insets.bottom + Spacing.lg,
          alignItems: 'center',
          gap: Spacing.sm,
          overflow: 'hidden',
        }}
      >
        {/* Gentle Arc Background */}
        <View 
          style={{
            position: 'absolute',
            top: -40,
            left: (width - (width * 4)) / 2,
            width: width * 4,
            height: width * 4,
            borderRadius: width * 2,
            backgroundColor: Colors.cream,
            zIndex: -1,
          }}
        />
        <Text
          style={{
            fontFamily: FontFamily.black,
            fontSize: 28,
            color: Colors.navy,
            textAlign: 'center',
          }}
        >
          Hey, I'm Splish !
        </Text>

        <Text
          style={{
            fontFamily: FontFamily.bold,
            fontSize: FontSize.md,
            color: Colors.textSecondary,
            textAlign: 'center',
          }}
        >
          I'm here to hydrate your day
        </Text>

        <Text
          style={{
            fontFamily: FontFamily.medium,
            fontSize: FontSize.sm,
            color: Colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          Let's start your journey to better health with gentle daily reminders that help you stay hydrated.
        </Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA button */}
        <TouchableOpacity
          onPress={() => router.push('/onboarding/gender')}
          style={{
            backgroundColor: Colors.navy,
            borderRadius: Radius.pill,
            paddingVertical: 17,
            width: '100%',
            alignItems: 'center',
            boxShadow: `0 5px 0px ${Colors.navyDark}`,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: FontFamily.extrabold,
              fontSize: FontSize.lg,
              color: Colors.white,
            }}
          >
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
