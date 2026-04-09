import {
  View, Text, TouchableOpacity, Modal, Pressable, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore } from '@/store/useWaterStore';

const PRESETS = [
  { label: '100ml', value: 100 },
  { label: '250ml', value: 250 },
  { label: '500ml', value: 500 },
  { label: '750ml', value: 750 },
];

const MIN = 50;
const MAX = 1000;
const STEP = 25;

interface DrinkSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrinkSheet({ visible, onClose }: DrinkSheetProps) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(250);
  // Keep Modal mounted during dismiss animation
  const [modalOpen, setModalOpen] = useState(false);

  const addDrink = useWaterStore((s) => s.addDrink);

  const translateY = useSharedValue(800);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setModalOpen(true);
      // Slide up + fade backdrop in together
      translateY.value = withSpring(0, { damping: 30, stiffness: 320, mass: 0.9 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible]);

  const dismiss = () => {
    // Slide down + fade backdrop out
    translateY.value = withTiming(800, { duration: 260, easing: Easing.in(Easing.cubic) });
    backdropOpacity.value = withTiming(0, { duration: 220 });
    // Unmount modal after animation
    setTimeout(() => {
      setModalOpen(false);
      onClose();
    }, 260);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const increment = () => setAmount((v) => Math.min(v + STEP, MAX));
  const decrement = () => setAmount((v) => Math.max(v - STEP, MIN));

  return (
    <Modal
      transparent
      visible={modalOpen}
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Dim backdrop — fades in */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13,31,64,0.45)' }, backdropStyle]}
          pointerEvents="none"
        />
        {/* Tap outside to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

        {/* Sheet — slides up */}
        <Animated.View
          style={[sheetStyle, {
            backgroundColor: Colors.white,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
            paddingBottom: insets.bottom + Spacing.lg,
            paddingTop: Spacing.sm,
          }]}
        >
          {/* Drag handle */}
          <View style={{
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: Colors.border,
            alignSelf: 'center', marginBottom: Spacing.lg,
          }} />

          <Text style={{
            fontFamily: FontFamily.black, fontSize: FontSize.xl,
            color: Colors.navy, textAlign: 'center', marginBottom: Spacing.lg,
          }}>
            How much did you drink?
          </Text>

          {/* Preset chips */}
          <View style={{
            flexDirection: 'row', justifyContent: 'center',
            gap: Spacing.sm, marginBottom: Spacing.lg, paddingHorizontal: Spacing.lg,
          }}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setAmount(p.value)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: Radius.pill,
                  borderWidth: 2,
                  borderColor: amount === p.value ? Colors.blue : Colors.border,
                  backgroundColor: amount === p.value ? Colors.sky : Colors.white,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontFamily: FontFamily.extrabold, fontSize: FontSize.sm,
                  color: amount === p.value ? Colors.navy : Colors.textSecondary,
                }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount display + stepper */}
          <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
            <Text style={{
              fontFamily: FontFamily.black, fontSize: 48,
              color: Colors.navy, marginBottom: 16,
            }}>
              {amount}
              <Text style={{ fontSize: 26, color: Colors.textSecondary }}> ml</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xl }}>
              <TouchableOpacity
                onPress={decrement}
                style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: Colors.white, fontSize: 28, fontFamily: FontFamily.black, lineHeight: 30 }}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={increment}
                style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: Colors.white, fontSize: 28, fontFamily: FontFamily.black, lineHeight: 30 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add drink button */}
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <TouchableOpacity
              onPress={() => { addDrink(amount); dismiss(); }}
              style={{
                backgroundColor: Colors.navy,
                borderRadius: Radius.pill,
                paddingVertical: 17,
                alignItems: 'center',
                boxShadow: `0 4px 0px ${Colors.navyDark}`,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>
                + Add drink
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
