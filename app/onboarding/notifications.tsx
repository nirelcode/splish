import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, useWindowDimensions, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore } from '@/store/useWaterStore';

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

type Period = 'AM' | 'PM';
interface Time { hour: number; minute: number; period: Period }

function formatTime(t: Time) {
  return `${t.hour}:${String(t.minute).padStart(2, '0')} ${t.period}`;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function TimePicker({
  value,
  onConfirm,
  onClose,
}: {
  value: Time;
  onConfirm: (t: Time) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Time>(value);

  return (
    <View style={{
      backgroundColor: Colors.cream,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      gap: Spacing.lg,
    }}>
      {/* Handle */}
      <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center' }} />

      {/* Hours grid */}
      <View>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Hour</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {HOURS.map((h) => {
            const sel = draft.hour === h;
            return (
              <TouchableOpacity
                key={h}
                onPress={() => setDraft(d => ({ ...d, hour: h }))}
                style={{
                  width: 52, height: 44,
                  borderRadius: Radius.md,
                  backgroundColor: sel ? Colors.navy : Colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: sel ? Colors.navy : 'transparent',
                }}
              >
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: sel ? Colors.white : Colors.text }}>
                  {h}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Minutes */}
      <View>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Minute</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {[0, 30].map((m) => {
            const sel = draft.minute === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setDraft(d => ({ ...d, minute: m }))}
                style={{
                  flex: 1, height: 44,
                  borderRadius: Radius.md,
                  backgroundColor: sel ? Colors.navy : Colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: sel ? Colors.navy : 'transparent',
                }}
              >
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: sel ? Colors.white : Colors.text }}>
                  :{String(m).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* AM / PM */}
      <View>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Period</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {(['AM', 'PM'] as Period[]).map((p) => {
            const sel = draft.period === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setDraft(d => ({ ...d, period: p }))}
                style={{
                  flex: 1, height: 44,
                  borderRadius: Radius.md,
                  backgroundColor: sel ? Colors.navy : Colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: sel ? Colors.navy : 'transparent',
                }}
              >
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: sel ? Colors.white : Colors.text }}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Confirm */}
      <TouchableOpacity
        onPress={() => { onConfirm(draft); onClose(); }}
        style={{
          backgroundColor: Colors.navy,
          borderRadius: Radius.pill,
          paddingVertical: 16,
          alignItems: 'center',
          boxShadow: `0 4px 0px ${Colors.navyDark}`,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>
          Confirm
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { setNotifications, finishOnboarding } = useWaterStore();

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

  const [count, setCount] = useState(5);
  const [startTime, setStartTime] = useState<Time>({ hour: 9, minute: 0, period: 'AM' });
  const [endTime, setEndTime] = useState<Time>({ hour: 10, minute: 0, period: 'PM' });
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const handleNext = () => {
    setNotifications({ start: startTime, end: endTime, count });
    finishOnboarding();
    router.push('/onboarding/widget');
  };

  const Row = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
      }}
    >
      <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy }}>{label}</Text>
      <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.navy }}>{value}</Text>
    </TouchableOpacity>
  );

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
      </View>

      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, gap: Spacing.lg, justifyContent: 'center' }}>

        {/* Title */}
        <View style={{ gap: Spacing.xs }}>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 28, color: Colors.navy, lineHeight: 34 }}>
            Get reminders{'\n'}throughout the day
          </Text>
          <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 }}>
            Let me know when you'd like{'\n'}to hear from me
          </Text>
        </View>

        {/* Mock notification preview */}
        <View style={{ backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, gap: 8 }}>
          {[
            { title: 'Time to hydrate! 💧', body: "You're halfway to your daily goal. Keep it up!" },
            { title: 'Splish reminder 💧', body: 'Your body will thank you later' },
          ].map((n, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              opacity: i === 0 ? 1 : 0.45,
              paddingBottom: i === 0 ? 8 : 0,
              borderBottomWidth: i === 0 ? 1 : 0,
              borderBottomColor: Colors.border,
            }}>
              <View style={{
                width: 36, height: 36,
                borderRadius: 10,
                backgroundColor: Colors.sky,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>💧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.navy }}>{n.title}</Text>
                <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary }}>{n.body}</Text>
              </View>
              <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textMuted }}>{i === 0 ? 'now' : '1min'}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={{ backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.md }}>

          {/* How many */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy }}>How many</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setCount(c => Math.max(1, c - 1))}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ice, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: FontFamily.black, fontSize: 20, color: Colors.navy, lineHeight: 22 }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy, minWidth: 36, textAlign: 'center' }}>
                {count}x
              </Text>
              <TouchableOpacity
                onPress={() => setCount(c => Math.min(20, c + 1))}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ice, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: FontFamily.black, fontSize: 20, color: Colors.navy, lineHeight: 22 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start at */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <Row label="Start at" value={formatTime(startTime)} onPress={() => setActivePicker('start')} />
          </View>

          {/* End at */}
          <Row label="End at" value={formatTime(endTime)} onPress={() => setActivePicker('end')} />
        </View>

        {/* Summary */}
        <Text style={{
          fontFamily: FontFamily.medium,
          fontSize: FontSize.sm,
          color: Colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        }}>
          You'll receive {count} reminder{count !== 1 ? 's' : ''} per day between{'\n'}
          {formatTime(startTime)} and {formatTime(endTime)}
        </Text>
      </View>

      {/* Next button */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={handleNext}
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
            Let's Splash! 💧
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time picker modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <TouchableOpacity activeOpacity={1}>
            <TimePicker
              value={activePicker === 'start' ? startTime : endTime}
              onConfirm={(t) => activePicker === 'start' ? setStartTime(t) : setEndTime(t)}
              onClose={() => setActivePicker(null)}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
