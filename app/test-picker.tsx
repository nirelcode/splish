import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  SharedValue,
  useAnimatedStyle,
  withDecay,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, FontFamily, Radius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 280

// Generate some dummy values (e.g., 30kg to 180kg)
const VALUES = Array.from({ length: 151 }, (_, i) => i + 30);

function ReanimatedPicker({ values, onChange }: { values: number[], onChange?: (val: number) => void }) {
  const maxTranslateY = 0; // Top limit (index 0)
  const minTranslateY = -(values.length - 1) * ITEM_HEIGHT; // Bottom limit
  
  const translateY = useSharedValue(0);
  
  const pan = Gesture.Pan()
    .onBegin(() => {
      // Cancel any ongoing animations so grabbing it feels instant
      cancelAnimation(translateY);
    })
    .onChange((e) => {
      translateY.value += e.changeY;
    })
    .onEnd((e) => {
      translateY.value = withDecay({
        velocity: e.velocityY,
        // Allow a slight overshoot so it visually bounces at the edges
        clamp: [minTranslateY - ITEM_HEIGHT, maxTranslateY + ITEM_HEIGHT],
      }, () => {
        // Once momentum runs out, calculate the EXACT nearest multiple of ITEM_HEIGHT
        let closestIndex = Math.round(Math.abs(translateY.value) / ITEM_HEIGHT);
        // Clamp it to prevent snapping to an out-of-bounds index
        closestIndex = Math.max(0, Math.min(closestIndex, values.length - 1));
        
        const snappedY = -closestIndex * ITEM_HEIGHT;
        
        // Execute a flawless spring animation onto the exact slot
        translateY.value = withSpring(snappedY, {
          damping: 18,
          stiffness: 150,
        }, () => {
          if (onChange) runOnJS(onChange)(values[closestIndex]);
        });
      });
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={styles.pickerContainer}>
        {/* Highlight Box */}
        <View style={styles.highlight} />
        
        {/* Render Items */}
        {values.map((val, index) => {
          return <PickerItem key={val} val={val} index={index} translateY={translateY} />;
        })}
      </Animated.View>
    </GestureDetector>
  );
}

function PickerItem({ val, index, translateY }: { val: number, index: number, translateY: SharedValue<number> }) {
  // Base offset of this specific item natively
  const itemY = index * ITEM_HEIGHT;
  
  const style = useAnimatedStyle(() => {
    // Calculate the item's physical position exactly at this frame
    const currentY = itemY + translateY.value;
    
    // The perfect center coordinate of the window is at index 2 (112px down).
    const distanceToCenter = Math.abs(currentY - ITEM_HEIGHT * 2);

    // Identical scaling and opacity logic from your old picker!
    const scale = interpolate(
      distanceToCenter,
      [0, ITEM_HEIGHT, ITEM_HEIGHT * 2],
      [1.1, 0.88, 0.75],
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      distanceToCenter,
      [0, ITEM_HEIGHT, ITEM_HEIGHT * 2],
      [1, 0.45, 0.2],
      Extrapolation.CLAMP
    );

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      transform: [
        { translateY: currentY },
        { scale }
      ],
      opacity,
      alignItems: 'center',
      justifyContent: 'center',
    };
  });

  return (
    <Animated.View style={style}>
      <Text style={styles.itemText}>{val} kg</Text>
    </Animated.View>
  );
}

export default function TestPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedReanimated, setSelectedReanimated] = useState(30);
  const [selectedNative, setSelectedNative] = useState(30);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.cream, paddingTop: insets.top }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontFamily: FontFamily.black, color: Colors.navy }} onPress={() => router.back()}>
          ← Back
        </Text>
        <Text style={{ fontSize: 20, fontFamily: FontFamily.extrabold, color: Colors.navy, marginTop: 20, textAlign: 'center' }}>
          Custom Selected: {selectedReanimated} kg
        </Text>
        <Text style={{ fontSize: 20, fontFamily: FontFamily.extrabold, color: Colors.navy, marginTop: 8, textAlign: 'center' }}>
          Native Selected: {selectedNative} kg
        </Text>
      </View>
      
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%' }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: FontFamily.bold, color: Colors.textSecondary, marginBottom: 20 }}>
            Custom Physics
          </Text>
          <ReanimatedPicker values={VALUES} onChange={setSelectedReanimated} />
        </View>

        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: FontFamily.bold, color: Colors.textSecondary, marginBottom: 20 }}>
            OS Native
          </Text>
          <View style={{ height: CONTAINER_HEIGHT, justifyContent: 'center' }}>
            <Picker
              selectedValue={selectedNative}
              onValueChange={(itemValue) => setSelectedNative(itemValue)}
              style={{ width: 150 }}
              itemStyle={{ fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy }}
            >
              {VALUES.map(val => (
                <Picker.Item key={val} label={`${val} kg`} value={val} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    height: CONTAINER_HEIGHT,
    width: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.ice,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  itemText: {
    fontFamily: FontFamily.black,
    fontSize: 24,
    color: Colors.navy,
  }
});
