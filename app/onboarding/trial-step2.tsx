import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export default function TrialStep2Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl }}>

        {/* Bell emoji */}
        <Text style={{ fontSize: 80 }}>🔔</Text>

        <View style={{ gap: Spacing.sm, alignItems: 'center' }}>
          <Text style={{
            fontFamily: FontFamily.black,
            fontSize: 28,
            color: Colors.navy,
            textAlign: 'center',
            lineHeight: 36,
          }}>
            We'll send you a reminder{'\n'}1 day before your trial ends
          </Text>

          <Text style={{
            fontFamily: FontFamily.medium,
            fontSize: FontSize.md,
            color: Colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
          }}>
            No surprise, no pressure
          </Text>
        </View>

      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/trial-step3')}
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
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
