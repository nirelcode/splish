import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore, calcGoal } from '@/store/useWaterStore';

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = 'AM' | 'PM';
interface Time { hour: number; minute: number; period: Period }
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function formatTime(t: Time) {
  return `${t.hour}:${String(t.minute).padStart(2, '0')} ${t.period}`;
}

function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ── Shared sheet wrapper ───────────────────────────────────────────────────────
function Sheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1}>
          <View style={{ backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center' }} />
            <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy, textAlign: 'center' }}>{title}</Text>
            {children}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Number stepper modal ───────────────────────────────────────────────────────
function NumberModal({ visible, title, value, unit, min, max, onSave, onClose }: {
  visible: boolean; title: string; value: number; unit: string;
  min: number; max: number; onSave: (v: number) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xl }}>
          <TouchableOpacity
            onPress={() => setDraft((v) => Math.max(v - 1, min))}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy, lineHeight: 28 }}>−</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', minWidth: 100 }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: 52, color: Colors.navy, lineHeight: 58 }}>{draft}</Text>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textSecondary }}>{unit}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setDraft((v) => Math.min(v + 1, max))}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy, lineHeight: 28 }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => { onSave(draft); onClose(); }}
        style={{ backgroundColor: Colors.navy, borderRadius: Radius.pill, paddingVertical: 16, alignItems: 'center' }}
        activeOpacity={0.85}
      >
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>Save</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

// ── Daily goal modal ───────────────────────────────────────────────────────────
const GOAL_STEP = 100;
const GOAL_MIN  = 500;
const GOAL_MAX  = 5000;

function GoalModal({ visible, current, recommended, onSave, onClose }: {
  visible: boolean; current: number; recommended: number; onSave: (ml: number) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(current);
  const isRecommended = draft === recommended;

  return (
    <Sheet visible={visible} onClose={onClose} title="Daily goal">
      {/* Stepper */}
      <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xl }}>
          <TouchableOpacity
            onPress={() => setDraft((v) => Math.max(v - GOAL_STEP, GOAL_MIN))}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy, lineHeight: 28 }}>−</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', minWidth: 110 }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: 52, color: Colors.navy, lineHeight: 58 }}>
              {(draft / 1000).toFixed(1)}
            </Text>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textSecondary }}>litres / day</Text>
          </View>

          <TouchableOpacity
            onPress={() => setDraft((v) => Math.min(v + GOAL_STEP, GOAL_MAX))}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy, lineHeight: 28 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended chip */}
        <TouchableOpacity
          onPress={() => setDraft(recommended)}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: isRecommended ? Colors.orange : Colors.white,
            borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8,
            borderWidth: 1.5, borderColor: isRecommended ? Colors.orange : Colors.border,
          }}
        >
          {isRecommended && <Ionicons name="checkmark-circle" size={16} color={Colors.white} />}
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: isRecommended ? Colors.white : Colors.textSecondary }}>
            {isRecommended ? 'Using recommended' : `✨ Recommended: ${(recommended / 1000).toFixed(1)}L`}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => { onSave(draft); onClose(); }}
        style={{ backgroundColor: Colors.navy, borderRadius: Radius.pill, paddingVertical: 16, alignItems: 'center' }}
        activeOpacity={0.85}
      >
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>Save</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

// ── Time picker ────────────────────────────────────────────────────────────────
function TimePicker({ value, onConfirm, onClose }: {
  value: Time; onConfirm: (t: Time) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<Time>(value);
  return (
    <View style={{ backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.lg }}>
      <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center' }} />
      <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy, textAlign: 'center' }}>Pick time</Text>
      <View>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Hour</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {HOURS.map((h) => {
            const sel = draft.hour === h;
            return (
              <TouchableOpacity key={h} onPress={() => setDraft(d => ({ ...d, hour: h }))}
                style={{ width: 52, height: 44, borderRadius: Radius.md, backgroundColor: sel ? Colors.orange : Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: sel ? Colors.orange : 'transparent' }}>
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: sel ? Colors.white : Colors.text }}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Minute</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {[0, 15, 30, 45].map((m) => {
            const sel = draft.minute === m;
            return (
              <TouchableOpacity key={m} onPress={() => setDraft(d => ({ ...d, minute: m }))}
                style={{ flex: 1, height: 44, borderRadius: Radius.md, backgroundColor: sel ? Colors.orange : Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: sel ? Colors.orange : 'transparent' }}>
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: sel ? Colors.white : Colors.text }}>:{String(m).padStart(2, '0')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Period</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {(['AM', 'PM'] as Period[]).map((p) => {
            const sel = draft.period === p;
            return (
              <TouchableOpacity key={p} onPress={() => setDraft(d => ({ ...d, period: p }))}
                style={{ flex: 1, height: 44, borderRadius: Radius.md, backgroundColor: sel ? Colors.orange : Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: sel ? Colors.orange : 'transparent' }}>
                <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.md, color: sel ? Colors.white : Colors.text }}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <TouchableOpacity onPress={() => { onConfirm(draft); onClose(); }}
        style={{ backgroundColor: Colors.navy, borderRadius: Radius.pill, paddingVertical: 16, alignItems: 'center' }}
        activeOpacity={0.85}>
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Gender modal ───────────────────────────────────────────────────────────────
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function GenderModal({ visible, current, onSave, onClose }: {
  visible: boolean; current: string; onSave: (v: string) => void; onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Gender">
      {GENDERS.map((g) => (
        <TouchableOpacity key={g} onPress={() => { onSave(g); onClose(); }}
          style={{ backgroundColor: current === g ? Colors.orange : Colors.white, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' }}
          activeOpacity={0.75}>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: current === g ? Colors.white : Colors.text }}>{g}</Text>
        </TouchableOpacity>
      ))}
    </Sheet>
  );
}

// ── Notifications modal ────────────────────────────────────────────────────────
function NotifModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { notifStart, notifEnd, notifCount, setNotifications } = useWaterStore();
  const [sub, setSub] = useState<'start' | 'end' | 'count' | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => { if (sub) setSub(null); else onClose(); }}>
        <TouchableOpacity activeOpacity={1}>
          {sub === 'start' || sub === 'end' ? (
            <TimePicker
              value={sub === 'start' ? notifStart : notifEnd}
              onConfirm={(t) => setNotifications({ start: sub === 'start' ? t : notifStart, end: sub === 'end' ? t : notifEnd, count: notifCount })}
              onClose={() => setSub(null)}
            />
          ) : sub === 'count' ? (
            <View style={{ backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center' }} />
              <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy, textAlign: 'center' }}>Reminders / day</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {[3, 4, 5, 6, 8, 10].map((n) => {
                  const sel = notifCount === n;
                  return (
                    <TouchableOpacity key={n} onPress={() => { setNotifications({ start: notifStart, end: notifEnd, count: n }); setSub(null); }}
                      style={{ flex: 1, minWidth: 80, height: 52, borderRadius: Radius.md, backgroundColor: sel ? Colors.orange : Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: sel ? Colors.orange : 'transparent' }}>
                      <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: sel ? Colors.white : Colors.text }}>{n}×</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.xs }} />
              <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy, textAlign: 'center', marginBottom: Spacing.xs }}>Notifications</Text>
              <SettingsCard>
                <SettingsRow icon="sunny-outline" label="Start time" value={formatTime(notifStart)} onPress={() => setSub('start')} />
                <Divider />
                <SettingsRow icon="moon-outline" label="End time" value={formatTime(notifEnd)} onPress={() => setSub('end')} />
                <Divider />
                <SettingsRow icon="timer-outline" label="Reminders / day" value={`${notifCount}×`} onPress={() => setSub('count')} />
              </SettingsCard>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Shared row components ──────────────────────────────────────────────────────
function SettingsRow({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.65 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: Spacing.md }}>
      <Ionicons name={icon as any} size={22} color={danger ? '#FF3B30' : Colors.textSecondary} style={{ width: 32 }} />
      <Text style={{ flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.md, color: danger ? '#FF3B30' : Colors.text }}>{label}</Text>
      {value !== undefined && (
        <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.md, color: Colors.textSecondary, marginRight: 6 }}>{value}</Text>
      )}
      {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.border_cream, marginLeft: 48 }} />;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md }}>
      {children}
    </View>
  );
}

// ── Streak calendar ────────────────────────────────────────────────────────────
function StreakCalendar() {
  const { streak, log, dailyGoalMl } = useWaterStore();
  const weekDays = getWeekDays();
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <View style={{ backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <View style={{ alignItems: 'center', minWidth: 64 }}>
        <Text style={{ fontFamily: FontFamily.black, fontSize: 48, color: Colors.orange, lineHeight: 52 }}>{streak}</Text>
        <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.orange }}>days</Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
        {weekDays.map((day, i) => {
          const key = day.toISOString().slice(0, 10);
          const isToday = key === todayKey;
          const totalMl = (log[key] ?? []).reduce((s, e) => s + e.ml, 0);
          const goalMet = totalMl >= dailyGoalMl;
          const isPast = key <= todayKey;
          return (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: isToday ? FontFamily.black : FontFamily.semibold, fontSize: FontSize.xs, color: isToday ? Colors.navy : Colors.textSecondary }}>
                {DAY_LABELS[i]}
              </Text>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: goalMet ? Colors.orange : isPast ? '#EEE8DF' : 'transparent', borderWidth: isPast && !goalMet ? 1.5 : 0, borderColor: '#DDD4C6', alignItems: 'center', justifyContent: 'center' }}>
                {goalMet && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useWaterStore();
  const { gender, age, weightKg, dailyGoalMl, setDailyGoal, setGender, setOnboarding, reset } = store;

  const [genderModal, setGenderModal]   = useState(false);
  const [weightModal, setWeightModal]   = useState(false);
  const [ageModal, setAgeModal]         = useState(false);
  const [goalModal, setGoalModal]       = useState(false);
  const [notifModal, setNotifModal]     = useState(false);

  const goalL = (dailyGoalMl / 1000).toFixed(1);

  // Recommended goal based on current profile
  const recommendedGoal = calcGoal({
    weightKg: store.weightKg,
    activity: store.activity,
    climate: store.climate,
    mainGoal: store.mainGoal,
  });

  const handleReset = () => {
    router.back();
    setTimeout(() => { reset(); router.replace('/'); }, 300);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.cream }} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg }}>

        {/* ── Header — same style as stats ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm }}>
            <Ionicons name="chevron-back" size={20} color={Colors.navy} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 26, color: Colors.navy }}>Settings</Text>
        </View>

        {/* ── Mascot ── */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <Image source={require('@/assets/images/splish-default.png')} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>

        {/* ── Streak ── */}
        <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xxl, color: Colors.navy, marginBottom: Spacing.sm }}>Your streak</Text>
        <StreakCalendar />

        {/* ── Settings ── */}
        <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xxl, color: Colors.navy, marginBottom: Spacing.sm, marginTop: Spacing.xs }}>Settings</Text>

        {/* Profile */}
        <SettingsCard>
          <SettingsRow icon="male-female-outline" label="Gender" value={gender ?? '—'} onPress={() => setGenderModal(true)} />
          <Divider />
          <SettingsRow icon="barbell-outline" label="Weight" value={weightKg ? `${weightKg} kg` : '—'} onPress={() => setWeightModal(true)} />
          <Divider />
          <SettingsRow icon="calendar-outline" label="Age" value={age ?? '—'} onPress={() => setAgeModal(true)} />
        </SettingsCard>

        {/* Hydration */}
        <SettingsCard>
          <SettingsRow icon="water-outline" label="Daily goal" value={`${goalL} L`} onPress={() => setGoalModal(true)} />
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard>
          <SettingsRow icon="notifications-outline" label="Notifications" onPress={() => setNotifModal(true)} />
        </SettingsCard>

        {/* About */}
        <SettingsCard>
          <SettingsRow icon="star-outline" label="Rate Splish" onPress={() => {}} />
          <Divider />
          <SettingsRow icon="chatbubble-outline" label="Make a feedback" onPress={() => {}} />
          <Divider />
          <SettingsRow icon="information-circle-outline" label="Version 1.0.0" />
        </SettingsCard>

        {/* Dev */}
        <SettingsCard>
          <SettingsRow icon="refresh-outline" label="Redo onboarding" onPress={() => { reset(); router.replace('/onboarding/gender'); }} />
          <Divider />
          <SettingsRow icon="trash-outline" label="Reset all data" onPress={handleReset} danger />
        </SettingsCard>

      </View>

      {/* ── Modals ── */}
      <GenderModal visible={genderModal} current={gender ?? ''} onSave={setGender} onClose={() => setGenderModal(false)} />

      <NumberModal
        visible={weightModal}
        title="Weight"
        value={weightKg || 70}
        unit="kg"
        min={30} max={250}
        onSave={(v) => setOnboarding({ weightKg: v })}
        onClose={() => setWeightModal(false)}
      />

      <NumberModal
        visible={ageModal}
        title="Age"
        value={age ? parseInt(age) : 25}
        unit="years"
        min={10} max={100}
        onSave={(v) => setOnboarding({ age: String(v) })}
        onClose={() => setAgeModal(false)}
      />

      <GoalModal
        visible={goalModal}
        current={dailyGoalMl}
        recommended={recommendedGoal}
        onSave={setDailyGoal}
        onClose={() => setGoalModal(false)}
      />

      <NotifModal visible={notifModal} onClose={() => setNotifModal(false)} />
    </ScrollView>
  );
}
