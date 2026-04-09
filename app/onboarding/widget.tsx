import { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

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
  '/onboarding/offer'
];

function PhoneMockup() {
  return (
    <View style={{
      width: '100%',
      backgroundColor: Colors.white,
      borderRadius: Radius.xl,
      padding: Spacing.md,
      gap: Spacing.sm,
      borderWidth: 2,
      borderColor: Colors.border,
    }}>
      {/* Widget preview card */}
      <View style={{
        backgroundColor: Colors.sky,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: Colors.white,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>💧</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.navy }}>
            Stay hydrated!
          </Text>
          <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary }}>
            1.2 / 2.1 L today
          </Text>
        </View>
        <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.md, color: Colors.navy }}>57%</Text>
      </View>

      {/* App icon grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: '22%',
              aspectRatio: 1,
              backgroundColor: Colors.ice,
              borderRadius: Radius.sm,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function WidgetScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const imageH = Math.round(height * 0.16);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculate progress
  const currentIndex = ONBOARDING_STEPS.indexOf(pathname);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progressPercent = (safeIndex + 1) / ONBOARDING_STEPS.length;

  useEffect(() => { 
    // Progress bar fill
    Animated.spring(progressAnim, {
      toValue: progressPercent,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>

      {/* Header */}
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={{ position: 'absolute', left: Spacing.lg, top: insets.top + Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 2, zIndex: 10 }}
        >
          <FontAwesome5 name="chevron-left" size={20} color="#000000" />
          <Text style={{ fontFamily: FontFamily.black, fontSize: 18, color: '#000000', marginLeft: 6 }}>Back</Text>
        </TouchableOpacity>
        
        {/* Progress Bar Container */}
        <View style={{ width: '40%', height: 6, backgroundColor: Colors.border, borderRadius: 3, marginTop: 6 }}>
          <Animated.View 
            style={{ 
              height: '100%', 
              backgroundColor: Colors.navy, 
              borderRadius: 3, 
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
            }} 
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/onboarding/offer')}
          activeOpacity={0.6}
          style={{ position: 'absolute', right: Spacing.lg, top: insets.top + Spacing.md, zIndex: 10 }}
        >
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: Colors.textSecondary }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg }}>

        {/* Mascot */}
        <Image
          source={require('@/assets/images/splish-default.png')}
          style={{ width: imageH * (260 / 300), height: imageH }}
          resizeMode="contain"
        />

        {/* Title + subtitle */}
        <View style={{ alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 26, color: Colors.navy, textAlign: 'center', lineHeight: 33 }}>
            Add a widget to your{'\n'}home screen
          </Text>
          <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Keep your hydration visible throughout{'\n'}the day with our beautiful home screen widgets
          </Text>
        </View>

        {/* Phone mockup */}
        <PhoneMockup />
      </View>

      {/* Install button */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/offer')}
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
            Install widget
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
