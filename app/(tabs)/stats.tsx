import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore, useTodayEntries, useProgress } from '@/store/useWaterStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const TODAY_KEY = dateKey(new Date());

function getWeekDays(weekOffset: number): { date: Date; key: string; label: string }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d, key: dateKey(d), label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2) };
  });
}

function formatWeekRange(days: { date: Date }[]) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${days[0].date.toLocaleDateString('en', opts)} – ${days[6].date.toLocaleDateString('en', opts)}`;
}

function formatEntryTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function friendlyDayLabel(key: string): string {
  if (key === TODAY_KEY) return "Today's drinks";
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (key === dateKey(yesterday)) return "Yesterday's drinks";
  return new Date(key + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' }) + "'s drinks";
}

// ── Bar chart (tappable) ───────────────────────────────────────────────────────
const BAR_MAX_H = 80;

function WeekBarChart({
  mlValues, labels, goal, selectedIndex, onBarPress,
}: {
  mlValues: number[];
  labels: string[];
  goal: number;
  selectedIndex: number | null;
  onBarPress: (i: number) => void;
}) {
  const max = Math.max(...mlValues, goal, 1);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: BAR_MAX_H + 12, backgroundColor: Colors.ice, borderRadius: Radius.md, paddingHorizontal: 10, paddingTop: 12, position: 'relative' }}>
        {/* Goal line + label */}
        <View style={{ position: 'absolute', left: 10, right: 10, bottom: (goal / max) * BAR_MAX_H, height: 1.5, backgroundColor: Colors.orange, opacity: 0.6 }} />
        <View style={{ position: 'absolute', right: 14, bottom: (goal / max) * BAR_MAX_H + 4 }}>
          <View style={{ backgroundColor: Colors.orange, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: 8, color: Colors.white }}>GOAL</Text>
          </View>
        </View>

        {mlValues.map((ml, i) => {
          const ratio = ml / max;
          const hitGoal = ml >= goal;
          const isSelected = selectedIndex === i;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onBarPress(i)}
              activeOpacity={0.75}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX_H }}
            >
              <View style={{
                width: '80%',
                height: Math.max(ratio * BAR_MAX_H, ml > 0 ? 4 : 0),
                backgroundColor: isSelected
                  ? Colors.orange
                  : hitGoal ? Colors.navy : Colors.blue,
                borderRadius: 5,
                opacity: selectedIndex !== null && !isSelected ? 0.4 : 1,
              }} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 10, marginTop: 5 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{
            flex: 1, textAlign: 'center',
            fontFamily: selectedIndex === i ? FontFamily.black : FontFamily.bold,
            fontSize: 10,
            color: selectedIndex === i ? Colors.orange : Colors.textMuted,
          }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// ── Hourly bar chart (non-tappable) ───────────────────────────────────────────
function HourBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: BAR_MAX_H + 12, backgroundColor: Colors.ice, borderRadius: Radius.md, paddingHorizontal: 10, paddingTop: 12 }}>
        {data.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_MAX_H }}>
            <View style={{ width: '75%', height: Math.max((v / max) * BAR_MAX_H, v > 0 ? 4 : 0), backgroundColor: Colors.blue, borderRadius: 5 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 10, marginTop: 5 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: FontFamily.bold, fontSize: 10, color: Colors.textMuted }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// ── Drink log list ─────────────────────────────────────────────────────────────
function DrinkLog({ entries, label }: { entries: { id: string; ml: number; timestamp: number }[]; label: string }) {
  return (
    <>
      <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted, marginBottom: Spacing.sm }}>
        {label}
      </Text>
      <View style={{ backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.lg }}>
        {entries.length === 0 ? (
          <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textMuted }}>No drinks logged</Text>
          </View>
        ) : (
          [...entries].reverse().map((entry, i, arr) => (
            <View key={entry.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.sky, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16 }}>💧</Text>
                  </View>
                  <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.text }}>{entry.ml} ml</Text>
                </View>
                <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: Colors.textMuted }}>
                  {formatEntryTime(entry.timestamp)}
                </Text>
              </View>
              {i < arr.length - 1 && (
                <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md + 34 + Spacing.sm }} />
              )}
            </View>
          ))
        )}
      </View>
    </>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 2 }}>{emoji}</Text>
      <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy }}>{value}</Text>
      <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Week navigation — only affects the weekly bar chart
  const [weekOffset, setWeekOffset] = useState(0);
  // Which bar in the weekly chart is selected (null = none = show today's log)
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  const log = useWaterStore((s) => s.log);
  const streak = useWaterStore((s) => s.streak);
  const { todayMl, goal } = useProgress();
  const todayEntries = useTodayEntries();

  // Weekly chart data
  const weekDays = getWeekDays(weekOffset);
  const weeklyMl = weekDays.map(({ key }) => (log[key] ?? []).reduce((s, e) => s + e.ml, 0));
  const weeklyMax = Math.max(...weeklyMl, goal);

  // All-time best
  const bestDayMl = Object.values(log).reduce((best, entries) => {
    const total = entries.reduce((s, e) => s + e.ml, 0);
    return Math.max(best, total);
  }, 0);

  // 7-day average
  const currentWeekDays = getWeekDays(0);
  const avgMl = Math.round(
    currentWeekDays.reduce((sum, { key }) => sum + (log[key] ?? []).reduce((s, e) => s + e.ml, 0), 0) / 7
  );

  // Today's hourly breakdown (always shows today regardless of week nav)
  const hourlyMap: Record<number, number> = {};
  todayEntries.forEach((e) => {
    const h = new Date(e.timestamp).getHours();
    hourlyMap[h] = (hourlyMap[h] ?? 0) + e.ml;
  });
  const HOUR_KEYS = [6, 8, 10, 12, 14, 16, 18, 20];
  const hourlyData = HOUR_KEYS.map((h) => hourlyMap[h] ?? 0);

  // Drink log: if a bar is selected, show that day; otherwise show today
  const logDayKey = selectedBarIndex !== null ? weekDays[selectedBarIndex].key : TODAY_KEY;
  const logEntries = log[logDayKey] ?? (logDayKey === TODAY_KEY ? todayEntries : []);
  const logLabel = friendlyDayLabel(logDayKey);
  const logDayMl = (log[logDayKey] ?? []).reduce((s, e) => s + e.ml, 0);

  function handleBarPress(i: number) {
    setSelectedBarIndex((prev) => (prev === i ? null : i));
  }

  function handleWeekChange(delta: number) {
    const next = weekOffset + delta;
    if (next > 0) return;
    setWeekOffset(next);
    setSelectedBarIndex(null); // reset selection when switching weeks
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
    >
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm }}>
            <Ionicons name="chevron-back" size={20} color={Colors.navy} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 26, color: Colors.navy }}>Stats</Text>
        </View>

        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <StatCard emoji="🔥" value={String(streak)} label="Day streak" />
          <StatCard emoji="🏆" value={bestDayMl > 0 ? `${(bestDayMl / 1000).toFixed(1)}L` : '—'} label="Best day" />
          <StatCard emoji="⌀" value={avgMl > 0 ? `${(avgMl / 1000).toFixed(1)}L` : '—'} label="7-day avg" />
        </View>

        {/* Today's hourly breakdown — always visible */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: Spacing.sm }}>
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted }}>
            Today
          </Text>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textMuted }}>
            · {(todayMl / 1000).toFixed(1)}L · by hour
          </Text>
        </View>
        <View style={{ backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg }}>
          <HourBarChart data={hourlyData} labels={HOUR_KEYS.map(String)} />
        </View>

        {/* Weekly bar chart — navigable, tappable bars */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted }}>
            {weekOffset === 0 ? 'This week' : formatWeekRange(weekDays)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={() => handleWeekChange(-1)}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={16} color={Colors.navy} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleWeekChange(1)}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', opacity: weekOffset === 0 ? 0.3 : 1 }}
              activeOpacity={weekOffset === 0 ? 1 : 0.7}
              disabled={weekOffset === 0}>
              <Ionicons name="chevron-forward" size={16} color={Colors.navy} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg }}>
          <WeekBarChart
            mlValues={weeklyMl}
            labels={weekDays.map((d) => d.label)}
            goal={goal}
            selectedIndex={selectedBarIndex}
            onBarPress={handleBarPress}
          />
          {/* Legend */}
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.navy }} />
              <Text style={{ fontFamily: FontFamily.semibold, fontSize: 10, color: Colors.textSecondary }}>Goal hit</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.blue }} />
              <Text style={{ fontFamily: FontFamily.semibold, fontSize: 10, color: Colors.textSecondary }}>Below goal</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border }}>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textSecondary }}>Week total</Text>
            <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.sm, color: Colors.navy }}>
              {(weeklyMl.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}L
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textSecondary }}>Goal reached</Text>
            <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.sm, color: Colors.navy }}>
              {weeklyMl.filter((ml) => ml >= goal).length} / 7 days
            </Text>
          </View>
        </View>

        {/* Drink log — changes based on selected bar, otherwise shows today */}
        <DrinkLog
          entries={logEntries}
          label={selectedBarIndex !== null
            ? `${logLabel} · ${(logDayMl / 1000).toFixed(1)}L`
            : `Today's drinks · ${(todayMl / 1000).toFixed(1)}L`
          }
        />

      </View>
    </ScrollView>
  );
}
