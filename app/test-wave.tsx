import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSpring, withDelay, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FontFamily, Colors, Radius, Spacing } from '@/constants/theme';

const BG_TOP      = '#e8f4fb';
const WATER_BACK  = '#3a8fc7';
const WATER_MID   = '#4fa3d8';
const WATER_FRONT = '#65b0d7';
const WAVE_STROKE = '#a8d8f0';   // colour of the spread-wave arcs

const WAVE_H     = 54;
const CHAR_SIZE  = 220;          // bigger character
const MIN_LEVEL  = 5;
const MAX_LEVEL  = 95;
const LEVEL_STEP = 10;

// Spread wave: starts narrow, expands to MAX_W, then repeats
const SPREAD_MAX_W    = 350;     // max width of spread wave (px)
const SPREAD_DURATION = 1800;    // ms for one wave to travel out
// 8 evenly-spaced directions — each fires offset in time so they stagger
const SPREAD_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const AMP_OPTIONS   = [6, 14, 22, 32] as const;
const SPEED_OPTIONS = [5000, 3200, 2000, 1200] as const;
type Amp   = (typeof AMP_OPTIONS)[number];
type Speed = (typeof SPEED_OPTIONS)[number];

const CHARACTER = require('@/assets/images/character.png');

// Background wave path (tiles across 3 screen widths)
function makeBgPath(W: number, A: number, phaseShift = 0): string {
  const mid = WAVE_H / 2, o = phaseShift;
  return [
    `M ${o} ${mid}`,
    `C ${o+W*.25} ${mid-A}, ${o+W*.75} ${mid+A}, ${o+W} ${mid}`,
    `C ${o+W*1.25} ${mid-A}, ${o+W*1.75} ${mid+A}, ${o+W*2} ${mid}`,
    `C ${o+W*2.25} ${mid-A}, ${o+W*2.75} ${mid+A}, ${o+W*3} ${mid}`,
    `L ${o+W*3} ${WAVE_H} L ${o} ${WAVE_H} Z`,
  ].join(' ');
}

// Spread-wave arc path — a single sine curve (no fill, just a stroke-like thin shape)
// w = current width, h = height of the arc
function makeSpreadPath(w: number, h: number): string {
  if (w < 2) return `M 0 ${h} L 0 ${h}`;
  const half = w / 2;
  return [
    `M ${-half} ${h}`,
    `C ${-half * 0.5} ${h - h * 1.4}, ${half * 0.5} ${h - h * 1.4}, ${half} ${h}`,
  ].join(' ');
}

// A single animated spread wave — rotates to face any direction
function SpreadWave({ delay, color, rotation }: { delay: number; color: string; rotation: number }) {
  const prog = useSharedValue(0);

  useEffect(() => {
    prog.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: SPREAD_DURATION, easing: Easing.out(Easing.quad) }),
        -1, false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const p = prog.value;
    return {
      opacity: p < 0.15 ? p / 0.15 : 1 - p,
      transform: [
        { rotate: `${rotation}deg` },   // face the right direction
        { scaleX: 0.05 + p * 0.95 },    // expand outward from center
      ],
    };
  });

  const arcH = 20;
  const path = makeSpreadPath(SPREAD_MAX_W, arcH);

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        // center the arc on the character's waterline contact point
        top: -arcH / 2,
        left: -SPREAD_MAX_W / 2,
        width: SPREAD_MAX_W,
      }, style]}
      pointerEvents="none"
    >
      <Svg width={SPREAD_MAX_W} height={arcH + 4} viewBox={`${-SPREAD_MAX_W / 2} 0 ${SPREAD_MAX_W} ${arcH + 4}`}>
        <Path d={path} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

export default function TestWave() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [level, setLevel] = useState(50);
  const [amp,   setAmp]   = useState<Amp>(14);
  const [speed, setSpeed] = useState<Speed>(3200);

  // ── Water height ──────────────────────────────────────────────────────────
  const waterH = useSharedValue(height * 0.5);
  useEffect(() => {
    waterH.value = withSpring(height * (level / 100), { damping: 18, stiffness: 80 });
  }, [level, height]);
  const waterStyle = useAnimatedStyle(() => ({ height: waterH.value }));

  // ── Background wave scroll ────────────────────────────────────────────────
  const wX1 = useSharedValue(0);
  const wX2 = useSharedValue(0);
  const wX3 = useSharedValue(0);
  useEffect(() => {
    wX1.value = withRepeat(withTiming(-width, { duration: speed,       easing: Easing.linear }), -1, false);
    wX2.value = withRepeat(withTiming(-width, { duration: speed * 1.6, easing: Easing.linear }), -1, false);
    wX3.value = withRepeat(withTiming(-width, { duration: speed * 2.4, easing: Easing.linear }), -1, false);
  }, [width, speed]);
  const wave1Style = useAnimatedStyle(() => ({ transform: [{ translateX: wX1.value }] }));
  const wave2Style = useAnimatedStyle(() => ({ transform: [{ translateX: wX2.value }] }));
  const wave3Style = useAnimatedStyle(() => ({ transform: [{ translateX: wX3.value }] }));

  const path1 = makeBgPath(width, amp);
  const path2 = makeBgPath(width, amp * 0.75, -width * 0.25);
  const path3 = makeBgPath(width, amp * 0.45, -width * 0.55);

  // ── Character drag ────────────────────────────────────────────────────────
  const charX = useSharedValue(0);
  const charY = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  const dragGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartX.value = charX.value;
      dragStartY.value = charY.value;
    })
    .onUpdate((e) => {
      charX.value = dragStartX.value + e.translationX;
      charY.value = dragStartY.value + e.translationY;
    });

  // ── Bob animation ─────────────────────────────────────────────────────────
  const bobY  = useSharedValue(0);
  const tiltZ = useSharedValue(0);
  useEffect(() => {
    bobY.value = withRepeat(
      withTiming(-12, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
    tiltZ.value = withRepeat(
      withTiming(5, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, []);

  const charStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: charX.value },
      { translateY: charY.value + bobY.value },
      { rotate: `${tiltZ.value}deg` },
    ],
  }));

  // Waterline anchor: follows waterH
  const anchorStyle = useAnimatedStyle(() => ({
    marginBottom: waterH.value - CHAR_SIZE * 0.52,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: BG_TOP }}>

      {/* ── WATER + WAVES ───────────────────────────────────────────────────── */}
      <Animated.View style={[{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: WATER_BACK, overflow: 'visible',
      }, waterStyle]}>

        <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 2,  left: 0 }, wave3Style]} pointerEvents="none">
          <Svg width={width * 3} height={WAVE_H}><Path d={path3} fill={WATER_BACK} opacity={0.55} /></Svg>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 8,  left: 0 }, wave2Style]} pointerEvents="none">
          <Svg width={width * 3} height={WAVE_H}><Path d={path2} fill={WATER_MID}  opacity={0.75} /></Svg>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 16, left: 0 }, wave1Style]} pointerEvents="none">
          <Svg width={width * 3} height={WAVE_H}><Path d={path1} fill={WATER_FRONT} /></Svg>
        </Animated.View>

      </Animated.View>

      {/* ── CHARACTER + SPREAD WAVES ─────────────────────────────────────────
          The anchor view sits at the waterline (follows waterH via marginBottom).
          The spread waves are rendered inside it, at bottom: 0, so they appear
          right at the water surface where the character touches it.           */}
      <Animated.View style={[{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        alignItems: 'center', overflow: 'visible',
        pointerEvents: 'box-none',
      }, anchorStyle]}>

        {/* Draggable character */}
        <GestureDetector gesture={dragGesture}>
          <Animated.View style={[{ width: CHAR_SIZE, height: CHAR_SIZE }, charStyle]}>
            <Image source={CHARACTER} style={{ width: CHAR_SIZE, height: CHAR_SIZE }} resizeMode="contain" />

            {/* Spread waves — centered on the life ring (≈38% from bottom of char) */}
            <View style={{
              position: 'absolute',
              bottom: CHAR_SIZE * 0.38,
              left: CHAR_SIZE / 2,
              width: 0, height: 0,
              overflow: 'visible',
            }} pointerEvents="none">
              {SPREAD_ANGLES.map((angle, i) => (
                <SpreadWave
                  key={angle}
                  rotation={angle}
                  delay={(SPREAD_DURATION / SPREAD_ANGLES.length) * i}
                  color={WAVE_STROKE}
                />
              ))}
            </View>

          </Animated.View>
        </GestureDetector>

      </Animated.View>

      {/* ── CONTROLS ────────────────────────────────────────────────────────── */}
      <View style={{
        position: 'absolute', bottom: insets.bottom + 20,
        left: Spacing.xl, right: Spacing.xl, gap: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <TouchableOpacity onPress={() => setLevel(l => Math.max(MIN_LEVEL, l - LEVEL_STEP))} style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>−</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', minWidth: 90 }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: 36, color: Colors.navy, lineHeight: 40 }}>{level}%</Text>
            <Text style={{ fontFamily: FontFamily.semibold, fontSize: 11, color: Colors.navy, opacity: 0.45, textTransform: 'uppercase', letterSpacing: 1 }}>Water Level</Text>
          </View>
          <TouchableOpacity onPress={() => setLevel(l => Math.min(MAX_LEVEL, l + LEVEL_STEP))} style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <SegmentRow label="Wave size" options={AMP_OPTIONS}   labels={['flat','low','med','big']}   value={amp}   onChange={v => setAmp(v as Amp)} />
        <SegmentRow label="Speed"     options={SPEED_OPTIONS} labels={['slow','norm','fast','wild']} value={speed} onChange={v => setSpeed(v as Speed)} />
      </View>
    </View>
  );
}

function SegmentRow<T extends number>({ label, options, labels, value, onChange }: {
  label: string; options: readonly T[]; labels: string[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: FontFamily.semibold, fontSize: 11, color: Colors.navy, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, width: 64 }}>
        {label}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
        {options.map((opt, i) => {
          const active = opt === value;
          return (
            <TouchableOpacity key={opt} onPress={() => onChange(opt)} activeOpacity={0.75} style={{
              flex: 1, paddingVertical: 9, borderRadius: Radius.md,
              backgroundColor: active ? Colors.navy : 'rgba(0,0,0,0.07)', alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: FontFamily.black, fontSize: 11,
                color: active ? Colors.white : Colors.navy,
                textTransform: 'uppercase', letterSpacing: 0.5, opacity: active ? 1 : 0.55,
              }}>{labels[i]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = {
  circleBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.navy,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  circleBtnText: { fontSize: 30, color: Colors.white, fontFamily: FontFamily.black, lineHeight: 34 },
};
