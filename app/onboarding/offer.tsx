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

export default function OfferScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const imageH = Math.round(height * 0.22);

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
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.6}
          style={{ position: 'absolute', right: Spacing.lg, top: insets.top + Spacing.md, zIndex: 10 }}
        >
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: Colors.textSecondary }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl }}>

        {/* Mascot */}
        <Image
          source={require('@/assets/images/splish-default.png')}
          style={{ width: imageH * (260 / 300), height: imageH }}
          resizeMode="contain"
        />

        {/* Text */}
        <View style={{ alignItems: 'center', gap: Spacing.md }}>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 28, color: Colors.navy, textAlign: 'center', lineHeight: 35 }}>
            A special offer,{'\n'}just for you
          </Text>
          <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 280 }}>
            Because you're here, enjoy{' '}
            <Text style={{ fontFamily: FontFamily.extrabold, color: Colors.navy }}>3 days of Premium</Text>
            {', on us. We\'ll remind you the day before it ends.'}
          </Text>
        </View>

        {/* Perks */}
        <View style={{ width: '100%', gap: Spacing.sm }}>
          {[
            { emoji: '📊', text: 'Detailed hydration insights' },
            { emoji: '🎨', text: 'Custom themes & widgets' },
            { emoji: '🔔', text: 'Smart reminders & streaks' },
          ].map((p) => (
            <View key={p.text} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              backgroundColor: Colors.white,
              borderRadius: Radius.md,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
            }}>
              <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
              <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.navy }}>{p.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA button */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
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
            Start free trial
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
