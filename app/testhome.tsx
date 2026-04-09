import { View, Text, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const BG_TOP    = '#fff9ef';
const BG_BOTTOM = '#65b0d7';
const TRACK_H   = 200;
const WAVE_H    = 40;
const WAVE_AMP  = 14;

export default function TestHomeScreen() {
  const { width, height } = useWindowDimensions();
  const [sliderPct, setSliderPct] = useState(50);

  // Water level slider
  const thumbY = useSharedValue(TRACK_H / 2);
  const waterSectionStyle = useAnimatedStyle(() => ({
    height: (1 - thumbY.value / TRACK_H) * height,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: thumbY.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: thumbY.value }],
  }));
  const sliderGesture = Gesture.Pan().onChange((e) => {
    thumbY.value = Math.min(Math.max(thumbY.value + e.changeY, 0), TRACK_H);
    runOnJS(setSliderPct)(Math.round((1 - thumbY.value / TRACK_H) * 100));
  });

  // Wave animations — two waves at different speeds for depth
  const waveX1 = useSharedValue(0);
  const waveX2 = useSharedValue(0);

  useEffect(() => {
    waveX1.value = withRepeat(
      withTiming(-width, { duration: 3200, easing: Easing.linear }),
      -1, false
    );
    waveX2.value = withRepeat(
      withTiming(-width, { duration: 5000, easing: Easing.linear }),
      -1, false
    );
  }, [width]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: waveX1.value }],
  }));
  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: waveX2.value }],
  }));

  // SVG wave path — 3 periods wide so translateX: 0 → -width loops seamlessly
  const W = width;
  const mid = WAVE_H / 2;
  const A = WAVE_AMP;
  const path = [
    `M 0 ${mid}`,
    `C ${W*0.25} ${mid - A}, ${W*0.75} ${mid + A}, ${W} ${mid}`,
    `C ${W*1.25} ${mid - A}, ${W*1.75} ${mid + A}, ${W*2} ${mid}`,
    `C ${W*2.25} ${mid - A}, ${W*2.75} ${mid + A}, ${W*3} ${mid}`,
    `L ${W*3} ${WAVE_H} L 0 ${WAVE_H} Z`,
  ].join(' ');

  // Second wave is the same path but phase-shifted by half a period visually
  // achieved by starting it at -W/2 offset
  const path2 = [
    `M ${-W*0.5} ${mid}`,
    `C ${-W*0.25} ${mid + A}, ${W*0.25} ${mid - A}, ${W*0.5} ${mid}`,
    `C ${W*0.75} ${mid + A}, ${W*1.25} ${mid - A}, ${W*1.5} ${mid}`,
    `C ${W*1.75} ${mid + A}, ${W*2.25} ${mid - A}, ${W*2.5} ${mid}`,
    `C ${W*2.75} ${mid + A}, ${W*3.25} ${mid - A}, ${W*3.5} ${mid}`,
    `L ${W*3.5} ${WAVE_H} L ${-W*0.5} ${WAVE_H} Z`,
  ].join(' ');

  return (
    <View style={{ flex: 1, backgroundColor: BG_TOP }}>

      <View style={{ flex: 1 }} />

      {/* Water section */}
      <Animated.View style={[{ overflow: 'visible' }, waterSectionStyle]}>

        {/* Wave 1 — front, full opacity */}
        <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 6, left: 0 }, wave1Style]}>
          <Svg width={width * 3} height={WAVE_H}>
            <Path d={path} fill={BG_BOTTOM} />
          </Svg>
        </Animated.View>

        {/* Wave 2 — back, semi-transparent, slower */}
        <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 2, left: 0, opacity: 0.5 }, wave2Style]}>
          <Svg width={width * 3.5} height={WAVE_H}>
            <Path d={path2} fill={BG_BOTTOM} />
          </Svg>
        </Animated.View>

        {/* Solid water fill below the waves */}
        <View style={{ position: 'absolute', top: 6, left: 0, right: 0, bottom: 0, backgroundColor: BG_BOTTOM }} />

      </Animated.View>

      {/* Vertical slider */}
      <View style={{
        position: 'absolute',
        right: 16,
        top: (height - TRACK_H) / 2,
        width: 28,
        height: TRACK_H,
        alignItems: 'center',
      }}>
        <View style={{
          position: 'absolute', top: 0, bottom: 0,
          width: 3, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 999,
        }} />
        <GestureDetector gesture={sliderGesture}>
          <Animated.View style={[{
            position: 'absolute', top: -11, left: 3,
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: Colors.navy, opacity: 0.7,
          }, thumbStyle]} />
        </GestureDetector>
        <Animated.View style={[{ position: 'absolute', top: -10, right: 34 }, labelStyle]} pointerEvents="none">
          <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 12, color: Colors.navy, opacity: 0.7 }}>
            {sliderPct}%
          </Text>
        </Animated.View>
      </View>

    </View>
  );
}
