import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence,
  withSpring, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface Props {
  visible: boolean;
  onSnooze?: () => void;
}

export function HardModeLockScreen({ visible, onSnooze }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Wave animation
  const waveX = useSharedValue(0);
  const dropScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    waveX.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1, false,
    );
    dropScale.value = withRepeat(
      withSequence(
        withSpring(1.08, { damping: 4 }),
        withSpring(1, { damping: 4 }),
      ),
      -1, true,
    );
  }, [visible]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -waveX.value * 60 }],
  }));
  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropScale.value }],
  }));

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <LinearGradient
        colors={['#7ec8e3', '#b8e4f9', '#d8f0fb', '#e8f6fc']}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated water fill at bottom */}
      <View style={styles.waterContainer}>
        <Animated.View style={[styles.waveWrapper, waveStyle]}>
          <Svg width={800} height={60} viewBox="0 0 800 60">
            <Path
              d="M0,30 C80,0 160,60 240,30 C320,0 400,60 480,30 C560,0 640,60 720,30 C760,15 780,22 800,30 L800,60 L0,60 Z"
              fill="#2FA3D5"
            />
          </Svg>
        </Animated.View>
        <View style={styles.waterFill} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>

        {/* Top label */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚡ HARD MODE</Text>
        </View>

        {/* Character */}
        <Animated.Text style={[styles.dropEmoji, dropStyle]}>💧</Animated.Text>

        {/* Text */}
        <Text style={styles.title}>Time to hydrate!</Text>
        <Text style={styles.subtitle}>
          Take a photo of your drink to{'\n'}continue using your phone
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>💧</Text>
            <Text style={styles.statLabel}>drink water</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>📸</Text>
            <Text style={styles.statLabel}>take photo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>✅</Text>
            <Text style={styles.statLabel}>unlock</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/hard-mode-camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>📸  Take Photo to Unlock</Text>
        </TouchableOpacity>

        {/* Snooze */}
        {onSnooze && (
          <TouchableOpacity onPress={onSnooze} style={styles.snoozeBtn}>
            <Text style={styles.snoozeText}>Remind me in 10 min</Text>
          </TouchableOpacity>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  waterContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 220,
  },
  waveWrapper: {
    position: 'absolute',
    top: 0, left: -60,
    width: 860,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    top: 30,
    backgroundColor: '#2FA3D5',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },

  badge: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.sky,
    letterSpacing: 2,
  },

  dropEmoji: {
    fontSize: 80,
    marginBottom: 4,
  },

  title: {
    fontFamily: FontFamily.black,
    fontSize: 32,
    color: Colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.md,
    color: Colors.navy,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: 8,
    gap: 0,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 24 },
  statLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.navy,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },

  primaryBtn: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.white,
  },

  snoozeBtn: { marginTop: 4, padding: 8 },
  snoozeText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.navy,
    opacity: 0.55,
    textDecorationLine: 'underline',
  },
});
