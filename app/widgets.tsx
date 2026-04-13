import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { requestPinWidget } from '@/modules/widget-sync';

// ── Widget preview components ─────────────────────────────────────────────────

function WaterFill({ pct }: { pct: number }) {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct}%`, backgroundColor: '#2FA3D5BB', borderRadius: 0 }} />
  );
}

function PreviewSmallWater() {
  return (
    <View style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#7EC8E3', overflow: 'hidden' }}>
      <WaterFill pct={62} />
      <Text style={{ position: 'absolute', top: 6, left: 8, fontSize: 7, fontFamily: FontFamily.black, color: '#FFFFFFAA', letterSpacing: 1 }}>SPLISH</Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 }}>
        <Text style={{ fontSize: 26 }}>💧</Text>
        <Text style={{ fontSize: 11, fontFamily: FontFamily.black, color: '#fff', marginTop: 2 }}>62%</Text>
      </View>
    </View>
  );
}

function PreviewSmallRing() {
  const size = 100; const cx = size / 2; const r = 34; const sw = 7;
  const circ = 2 * Math.PI * r; const pct = 0.62; const dash = circ * pct;
  return (
    <View style={{ width: size, height: size, borderRadius: 16, backgroundColor: '#152D5C', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.68, height: size * 0.68, borderRadius: 999, borderWidth: sw, borderColor: '#FFFFFF15' }} />
      <View style={{ position: 'absolute', width: size * 0.68, height: size * 0.68, borderRadius: 999, borderWidth: sw, borderColor: '#7EC8E3', borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '-45deg' }] }} />
      <Text style={{ fontSize: 13, fontFamily: FontFamily.black, color: '#fff', lineHeight: 16 }}>1.5L</Text>
      <Text style={{ fontSize: 7, fontFamily: FontFamily.bold, color: '#7EC8E3' }}>of 2.4L</Text>
      <Text style={{ position: 'absolute', bottom: 7, fontSize: 6, fontFamily: FontFamily.black, color: '#8A9BB5', letterSpacing: 1 }}>SPLISH</Text>
    </View>
  );
}

function PreviewSmallStreak() {
  return (
    <View style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#F5834A', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ position: 'absolute', top: 6, right: 8, fontSize: 6, fontFamily: FontFamily.black, color: '#FFFFFF99', letterSpacing: 1 }}>SPLISH</Text>
      <Text style={{ fontSize: 20 }}>🔥</Text>
      <Text style={{ fontSize: 30, fontFamily: FontFamily.black, color: '#fff', lineHeight: 34 }}>14</Text>
      <Text style={{ fontSize: 8, fontFamily: FontFamily.bold, color: '#FFFFFFCC', letterSpacing: 1 }}>DAY STREAK</Text>
    </View>
  );
}

function PreviewMediumQuickAdd() {
  return (
    <View style={{ width: 220, height: 100, borderRadius: 16, flexDirection: 'row', overflow: 'hidden' }}>
      {/* Left */}
      <View style={{ width: 80, height: '100%', backgroundColor: '#7EC8E3', overflow: 'hidden' }}>
        <WaterFill pct={62} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 }}>
          <Text style={{ fontSize: 22 }}>💧</Text>
          <Text style={{ fontSize: 7, fontFamily: FontFamily.black, color: '#fff' }}>62% done</Text>
        </View>
      </View>
      {/* Right */}
      <View style={{ flex: 1, backgroundColor: '#0D1F40', padding: 10, justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
            <Text style={{ fontSize: 18, fontFamily: FontFamily.black, color: '#fff' }}>1.5L</Text>
            <Text style={{ fontSize: 8, fontFamily: FontFamily.bold, color: '#8A9BB5' }}>/ 2.4L</Text>
          </View>
          <View style={{ height: 3, backgroundColor: '#FFFFFF20', borderRadius: 2, marginTop: 4 }}>
            <View style={{ width: '62%', height: '100%', backgroundColor: '#7EC8E3', borderRadius: 2 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {['+150ml', '+250ml', '+500ml'].map((label, i) => (
            <View key={label} style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: i === 1 ? '#2FA3D5' : '#152D5C', alignItems: 'center', justifyContent: 'center', borderWidth: i === 1 ? 0 : 1, borderColor: '#2FA3D555' }}>
              <Text style={{ fontSize: 6.5, fontFamily: FontFamily.black, color: i === 1 ? '#fff' : '#7EC8E3' }}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 6, fontFamily: FontFamily.black, color: '#8A9BB530', textAlign: 'right', letterSpacing: 1 }}>SPLISH</Text>
      </View>
    </View>
  );
}

function PreviewMediumDaily() {
  return (
    <View style={{ width: 220, height: 100, borderRadius: 16, backgroundColor: '#152D5C', padding: 12, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10, fontFamily: FontFamily.black, color: '#fff' }}>💧 Today</Text>
        <Text style={{ fontSize: 8, fontFamily: FontFamily.medium, color: '#8A9BB5' }}>Sat, Apr 12</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 26 }}>💧</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: FontFamily.black, color: '#fff' }}>1.5L</Text>
          <Text style={{ fontSize: 8, fontFamily: FontFamily.medium, color: '#8A9BB5' }}>of 2.4L goal</Text>
          <View style={{ height: 4, backgroundColor: '#FFFFFF20', borderRadius: 2, marginTop: 4 }}>
            <View style={{ width: '62%', height: '100%', backgroundColor: '#7EC8E3', borderRadius: 2 }} />
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[{ icon: '🔥', val: '14', key: 'streak' }, { icon: '🥤', val: '6', key: 'drinks' }].map(({ icon, val, key }) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={{ fontSize: 10 }}>{icon}</Text>
            <View>
              <Text style={{ fontSize: 9, fontFamily: FontFamily.black, color: '#fff' }}>{val}</Text>
              <Text style={{ fontSize: 7, fontFamily: FontFamily.bold, color: '#8A9BB5' }}>{key}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PreviewMediumWeekly() {
  const vals = [85, 100, 50, 90, 95, 40, 62];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'T'];
  return (
    <View style={{ width: 220, height: 100, borderRadius: 16, backgroundColor: '#0D1F40', padding: 12, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10, fontFamily: FontFamily.black, color: '#fff' }}>📊 This Week</Text>
        <Text style={{ fontSize: 8, fontFamily: FontFamily.bold, color: '#7EC8E3' }}>avg 1.9L</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 3 }}>
        {vals.map((v, i) => (
          <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            <View style={{ height: `${v}%`, borderRadius: 3, backgroundColor: i === 6 ? '#7EC8E3' : v >= 90 ? '#2FA3D580' : '#152D5C' }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 8, fontFamily: FontFamily.bold, color: '#F5834A' }}>🔥 14-day streak</Text>
        <Text style={{ fontSize: 6, fontFamily: FontFamily.black, color: '#8A9BB540', letterSpacing: 1 }}>SPLISH</Text>
      </View>
    </View>
  );
}

function PreviewLargeDashboard() {
  return (
    <View style={{ width: 220, height: 220, borderRadius: 16, backgroundColor: '#7EC8E3', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', backgroundColor: '#1A6D99CC' }} />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontFamily: FontFamily.black, color: '#fff' }}>💧 Splish</Text>
          <View style={{ backgroundColor: '#F5834A', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 8, fontFamily: FontFamily.black, color: '#fff' }}>🔥 14 days</Text>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 56 }}>💧</Text>
      </View>
      <View style={{ padding: 12, paddingTop: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <Text style={{ fontSize: 22, fontFamily: FontFamily.black, color: '#fff' }}>1.5L</Text>
          <Text style={{ fontSize: 10, fontFamily: FontFamily.bold, color: '#FFFFFFB0' }}>of 2.4L</Text>
        </View>
        <View style={{ height: 6, backgroundColor: '#FFFFFF33', borderRadius: 3, marginBottom: 8 }}>
          <View style={{ width: '62%', height: '100%', backgroundColor: '#fff', borderRadius: 3 }} />
        </View>
        {[['💧 250ml', '2:15 PM'], ['💧 500ml', '12:30 PM']].map(([ml, time]) => (
          <View key={time} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF26', borderRadius: 6, padding: 5, marginBottom: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: FontFamily.bold, color: '#fff' }}>{ml}</Text>
            <Text style={{ fontSize: 8, fontFamily: FontFamily.medium, color: '#FFFFFFAA' }}>{time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Widget card ───────────────────────────────────────────────────────────────

type WidgetType = 'small' | 'ring' | 'streak' | 'medium' | 'daily' | 'weekly' | 'large';

interface WidgetDef {
  type: WidgetType;
  name: string;
  desc: string;
  size: string;
  preview: React.ReactNode;
}

const WIDGETS: WidgetDef[] = [
  { type: 'small',   name: 'Water Level Mini',   size: 'Small (2×2)',   desc: 'Animated water fill + hydration %', preview: <PreviewSmallWater /> },
  { type: 'ring',    name: 'Progress Ring',       size: 'Small (2×2)',   desc: 'Circular ring showing daily intake', preview: <PreviewSmallRing /> },
  { type: 'streak',  name: 'Streak Badge',        size: 'Small (2×2)',   desc: 'Your current hydration streak', preview: <PreviewSmallStreak /> },
  { type: 'medium',  name: 'Quick Add ⭐',        size: 'Medium (4×2)',  desc: 'Log water right from your home screen', preview: <PreviewMediumQuickAdd /> },
  { type: 'daily',   name: 'Daily Overview',      size: 'Medium (4×2)',  desc: "Today's intake, streak and drink count", preview: <PreviewMediumDaily /> },
  { type: 'weekly',  name: 'Weekly Sparkline',    size: 'Medium (4×2)',  desc: 'Bar chart of your week + streak', preview: <PreviewMediumWeekly /> },
  { type: 'large',   name: 'Full Dashboard',      size: 'Large (4×4)',   desc: 'Complete overview with recent logs', preview: <PreviewLargeDashboard /> },
];

function WidgetCard({ widget }: { widget: WidgetDef }) {
  const isAndroid = Platform.OS === 'android';

  function handleAdd() {
    if (isAndroid) {
      requestPinWidget(widget.type);
    }
  }

  return (
    <View style={{
      backgroundColor: Colors.white, borderRadius: Radius.xl,
      padding: Spacing.lg, marginBottom: Spacing.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
      elevation: 3,
    }}>
      {/* Size badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
        <View style={{ backgroundColor: Colors.ice, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: 10, color: Colors.textSecondary }}>{widget.size}</Text>
        </View>
      </View>

      {/* Preview */}
      <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
        {widget.preview}
      </View>

      {/* Info */}
      <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.lg, color: Colors.navy, marginBottom: 4 }}>
        {widget.name}
      </Text>
      <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md }}>
        {widget.desc}
      </Text>

      {/* Add button */}
      {isAndroid ? (
        <TouchableOpacity
          onPress={handleAdd}
          activeOpacity={0.85}
          style={{
            backgroundColor: Colors.navy, borderRadius: Radius.pill,
            paddingVertical: 13, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: Colors.white }}>
            Add to Home Screen
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ backgroundColor: Colors.ice, borderRadius: Radius.pill, paddingVertical: 13, alignItems: 'center' }}>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textSecondary }}>
            Long-press your home screen → Widgets → Splish
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WidgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6} style={{ padding: 4 }}>
          <FontAwesome5 name="chevron-left" size={18} color={Colors.navy} />
        </TouchableOpacity>
        <Text style={{ fontFamily: FontFamily.black, fontSize: 22, color: Colors.navy }}>
          Widgets
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: 0, paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg }}>
          Add a Splish widget to your home screen to track hydration at a glance.
        </Text>

        {WIDGETS.map((w) => (
          <WidgetCard key={w.type} widget={w} />
        ))}
      </ScrollView>
    </View>
  );
}
