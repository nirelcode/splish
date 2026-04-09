import { useRef, useEffect } from 'react';
import { View, Text, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '@/components/onboarding-layout';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

const TIMES: string[] = [];
for (let h = 4; h <= 23; h++) {
  TIMES.push(`${String(h).padStart(2, '0')}:00`);
  TIMES.push(`${String(h).padStart(2, '0')}:30`);
}
TIMES.push('00:00');

const ITEM_HEIGHT = 56;
const VISIBLE = 5;

function WheelPicker({ times, defaultIndex, label }: {
  times: string[];
  defaultIndex: number;
  label: string;
}) {
  const scrollY = useRef(new Animated.Value(defaultIndex * ITEM_HEIGHT)).current;
  const scrollRef = useRef<any>(null);
  const lastHapticIndex = useRef(defaultIndex);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollToOffset({ offset: defaultIndex * ITEM_HEIGHT, animated: false });
        scrollY.setValue(defaultIndex * ITEM_HEIGHT);
      }
    }, 50);
  }, []);

  const paddedTimes = [null, null, ...times, null, null];

  return (
    <View>
      <Text style={{
        fontFamily: FontFamily.extrabold,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        textAlign: 'center',
      }}>
        {label}
      </Text>

      <View style={{ height: ITEM_HEIGHT * VISIBLE, overflow: 'hidden' }}>
        {/* Center highlight */}
        <View pointerEvents="none" style={{
          position: 'absolute',
          top: ITEM_HEIGHT * 2,
          left: 0, right: 0,
          height: ITEM_HEIGHT,
          backgroundColor: Colors.ice,
          borderRadius: Radius.md,
          borderWidth: 2,
          borderColor: Colors.border,
        }} />

        <Animated.FlatList
          ref={scrollRef}
          data={paddedTimes as any[]}
          keyExtractor={(item, idx) => item !== null ? item.toString() + idx : `spacer-${idx}`}
          showsVerticalScrollIndicator={false}
          snapToOffsets={paddedTimes.map((_, i) => i * ITEM_HEIGHT)}
          snapToAlignment="start"
          disableIntervalMomentum={true}
          decelerationRate="fast"
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: (e: any) => {
                const y = e.nativeEvent.contentOffset.y;
                const index = Math.round(y / ITEM_HEIGHT);
                if (index >= 0 && index < times.length && index !== lastHapticIndex.current) {
                  lastHapticIndex.current = index;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }
            }
          )}
          onMomentumScrollEnd={(e: any) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          }}
          onScrollEndDrag={(e: any) => {
            const v = e.nativeEvent.velocity?.y || 0;
            if (Math.abs(v) < 0.2) {
              const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            }
          }}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          renderItem={({ item, index }: any) => {
            if (item === null) return <View style={{ height: ITEM_HEIGHT }} />;
            
            const valIndex = index - 2;
            const center = valIndex * ITEM_HEIGHT;
            const inputRange = [center - ITEM_HEIGHT * 2, center - ITEM_HEIGHT, center, center + ITEM_HEIGHT, center + ITEM_HEIGHT * 2];

            const scale = scrollY.interpolate({ inputRange, outputRange: [0.75, 0.88, 1.1, 0.88, 0.75], extrapolate: 'clamp' });
            const opacity = scrollY.interpolate({ inputRange, outputRange: [0.2, 0.45, 1, 0.45, 0.2], extrapolate: 'clamp' });

            return (
              <Animated.View
                style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', transform: [{ scale }], opacity }}
              >
                <Text style={{ fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy }}>
                  {item}
                </Text>
              </Animated.View>
            );
          }}
        />
      </View>
    </View>
  );
}

export default function WakeTimeScreen() {
  const router = useRouter();

  return (
    <OnboardingLayout
      title="When does your day start?"
      onNext={() => router.replace('/(tabs)')}
    >
      <View style={{ gap: Spacing.xl }}>
        <WheelPicker times={TIMES} defaultIndex={8} label="Wake up" />
        <View style={{ height: 1, backgroundColor: Colors.border }} />
        <WheelPicker times={TIMES} defaultIndex={28} label="Bedtime" />
      </View>
    </OnboardingLayout>
  );
}
