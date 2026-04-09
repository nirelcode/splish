import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore } from '@/store/useWaterStore';

export default function CalculatingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const { dailyGoalMl, activity, climate, mainGoal } = useWaterStore();
  const goalL = (dailyGoalMl / 1000).toFixed(1);

  const factors = [
    activity && { label: 'Activity', value: activity },
    climate && { label: 'Climate', value: climate },
    mainGoal && { label: 'Goal', value: mainGoal },
  ].filter(Boolean) as { label: string; value: string }[];

  const [phase, setPhase] = useState<'calculating' | 'result'>('calculating');

  const dotOpacity1 = useRef(new Animated.Value(0)).current;
  const dotOpacity2 = useRef(new Animated.Value(0)).current;
  const dotOpacity3 = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.85)).current;
  const mascotBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(dotOpacity1, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(dotOpacity2, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(dotOpacity3, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ])
    );
    dotLoop.start();

    const timeout = setTimeout(() => {
      dotLoop.stop();
      setPhase('result');
      Animated.parallel([
        Animated.spring(resultOpacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(resultScale, { toValue: 1, damping: 14, stiffness: 150, useNativeDriver: true }),
      ]).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(mascotBounce, { toValue: -10, duration: 400, useNativeDriver: true }),
          Animated.timing(mascotBounce, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        { iterations: 2 }
      ).start();
    }, 2200);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => { router.prefetch('/onboarding/notifications'); }, []);

  const imageH = Math.round(height * 0.22);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.lg }}>

        <Animated.Image
          source={require('@/assets/images/splish-default.png')}
          style={{ width: imageH * (260 / 300), height: imageH, transform: [{ translateY: mascotBounce }] }}
          resizeMode="contain"
        />

        {phase === 'calculating' ? (
          <View style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: 26, color: Colors.navy, textAlign: 'center' }}>
              Calculating your goal
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {[dotOpacity1, dotOpacity2, dotOpacity3].map((op, i) => (
                <Animated.View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.navy, opacity: op }} />
              ))}
            </View>
          </View>
        ) : (
          <Animated.View style={{ alignItems: 'center', opacity: resultOpacity, transform: [{ scale: resultScale }], width: '100%', gap: Spacing.md }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: 22, color: Colors.navy, textAlign: 'center' }}>
              Your daily water goal 🎉
            </Text>

            <View style={{ backgroundColor: Colors.sky, borderRadius: Radius.xl, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xxl, alignItems: 'center', width: '100%' }}>
              <Text style={{ fontFamily: FontFamily.black, fontSize: 64, color: Colors.navy, lineHeight: 70 }}>
                {goalL}
              </Text>
              <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.xl, color: Colors.navy, opacity: 0.7 }}>
                litres / day
              </Text>
            </View>

            <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: Colors.textSecondary }}>
              Based on your profile
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
              {factors.map((f) => (
                <View key={f.label} style={{ backgroundColor: Colors.white, borderRadius: Radius.pill, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderWidth: 1.5, borderColor: Colors.border }}>
                  <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.navy }}>
                    {f.label}: {f.value}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </View>

      {phase === 'result' && (
        <Animated.View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm, opacity: resultOpacity }}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding/notifications')}
            style={{ backgroundColor: Colors.navy, borderRadius: Radius.pill, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', boxShadow: `0 5px 0px ${Colors.navyDark}` }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>
              Let's Go!
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
