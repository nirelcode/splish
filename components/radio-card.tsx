import { TouchableOpacity, View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface RadioCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function RadioCard({ label, selected, onPress }: RadioCardProps) {
  const scale = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [selected]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.white,
        borderRadius: Radius.pill,
        borderWidth: 2,
        borderColor: selected ? Colors.navy : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: FontFamily.bold,
          fontSize: FontSize.md,
          color: Colors.text,
        }}
      >
        {label}
      </Text>

      {/* Radio ring */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2.5,
          borderColor: selected ? Colors.navy : Colors.border_cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: Colors.navy,
            },
            dotStyle,
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}
