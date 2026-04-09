import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { useWaterStore } from '@/store/useWaterStore';

// ── Data ──────────────────────────────────────────────────────────────────────

type Status = 'owned' | 'locked';

interface Theme {
  id: string; name: string; swatches: string[]; status: Status;
}
interface Skin {
  id: string; name: string; image: ImageSourcePropType; status: Status;
}
interface Achievement {
  id: string; emoji: string; name: string; desc: string;
  check: (s: ReturnType<typeof useWaterStore.getState>) => boolean;
}

const THEMES: Theme[] = [
  { id: 'ocean',    name: 'Ocean',    swatches: ['#152D5C', '#7EC5E3', '#FFF8F0'], status: 'owned'  },
  { id: 'sunset',   name: 'Sunset',   swatches: ['#C0392B', '#F39C12', '#FDF6EC'], status: 'locked' },
  { id: 'forest',   name: 'Forest',   swatches: ['#1A5C38', '#52B788', '#F0F7EE'], status: 'locked' },
  { id: 'midnight', name: 'Midnight', swatches: ['#1A1A2E', '#7B5EA7', '#F5F0FF'], status: 'locked' },
  { id: 'peach',    name: 'Peach',    swatches: ['#8B3A3A', '#E8927C', '#FFF5F0'], status: 'locked' },
  { id: 'arctic',   name: 'Arctic',   swatches: ['#0A3D62', '#60A3D9', '#EAF4FB'], status: 'locked' },
];

const SKINS: Skin[] = [
  { id: 'default',   name: 'Classic',   image: require('@/assets/images/splish-default.png'),  status: 'owned'  },
  { id: 'goal',      name: 'Glowing',   image: require('@/assets/images/splish-goal.png'),     status: 'owned'  },
  { id: 'lifering',  name: 'Lifeguard', image: require('@/assets/images/splish-lifering.png'), status: 'locked' },
  { id: 'astronaut', name: 'Astronaut', image: require('@/assets/images/splish-default.png'),  status: 'locked' },
  { id: 'chef',      name: 'Chef',      image: require('@/assets/images/splish-default.png'),  status: 'locked' },
  { id: 'ninja',     name: 'Ninja',     image: require('@/assets/images/splish-default.png'),  status: 'locked' },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_drop',
    emoji: '💧',
    name: 'First Drop',
    desc: 'Log your very first drink',
    check: (s) => Object.values(s.log).some((entries) => entries.length > 0),
  },
  {
    id: 'goal_getter',
    emoji: '🎯',
    name: 'Goal Getter',
    desc: 'Hit your daily goal for the first time',
    check: (s) => Object.values(s.log).some(
      (entries) => entries.reduce((sum, e) => sum + e.ml, 0) >= s.dailyGoalMl
    ),
  },
  {
    id: 'three_streak',
    emoji: '🔥',
    name: 'On Fire',
    desc: 'Reach a 3-day streak',
    check: (s) => s.streak >= 3,
  },
  {
    id: 'week_warrior',
    emoji: '⚡',
    name: 'Week Warrior',
    desc: 'Reach a 7-day streak',
    check: (s) => s.streak >= 7,
  },
  {
    id: 'month_legend',
    emoji: '🏆',
    name: 'Hydration Legend',
    desc: 'Reach a 30-day streak',
    check: (s) => s.streak >= 30,
  },
  {
    id: 'early_bird',
    emoji: '🌅',
    name: 'Early Bird',
    desc: 'Log a drink before 8am',
    check: (s) => Object.values(s.log).flat().some(
      (e) => new Date(e.timestamp).getHours() < 8
    ),
  },
  {
    id: 'night_owl',
    emoji: '🌙',
    name: 'Night Owl',
    desc: 'Log a drink after 9pm',
    check: (s) => Object.values(s.log).flat().some(
      (e) => new Date(e.timestamp).getHours() >= 21
    ),
  },
  {
    id: 'big_sipper',
    emoji: '🌊',
    name: 'Big Sipper',
    desc: 'Drink over 3L in a single day',
    check: (s) => Object.values(s.log).some(
      (entries) => entries.reduce((sum, e) => sum + e.ml, 0) >= 3000
    ),
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flex: 1, paddingVertical: 10,
        borderRadius: Radius.pill,
        backgroundColor: active ? Colors.orange : 'transparent',
        alignItems: 'center',
      }}
    >
      <Text style={{
        fontFamily: FontFamily.extrabold,
        fontSize: FontSize.sm,
        color: active ? Colors.white : Colors.textSecondary,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontFamily: FontFamily.extrabold, fontSize: FontSize.xs,
      textTransform: 'uppercase', letterSpacing: 1.2,
      color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: Spacing.md,
    }}>
      {text}
    </Text>
  );
}

function ThemeCard({ theme, active, onPress }: { theme: Theme; active: boolean; onPress: () => void }) {
  const locked = theme.status === 'locked';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
        padding: Spacing.md, borderWidth: 2.5,
        borderColor: active ? Colors.orange : 'transparent',
        opacity: locked ? 0.7 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: Spacing.sm }}>
        {theme.swatches.map((color, i) => (
          <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }} />
        ))}
      </View>
      <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.md, color: Colors.navy, marginBottom: 4 }}>
        {theme.name}
      </Text>
      {active ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.orange} />
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.orange }}>Active</Text>
        </View>
      ) : locked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="lock-closed" size={13} color={Colors.textMuted} />
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textMuted }}>Premium</Text>
        </View>
      ) : (
        <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textSecondary }}>Owned</Text>
      )}
    </TouchableOpacity>
  );
}

function SkinCard({ skin, active, onPress }: { skin: Skin; active: boolean; onPress: () => void }) {
  const locked = skin.status === 'locked';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
        padding: Spacing.md, alignItems: 'center',
        borderWidth: 2.5, borderColor: active ? Colors.orange : 'transparent',
      }}
    >
      <View style={{ width: 80, height: 80, marginBottom: Spacing.sm }}>
        <Image source={skin.image} style={{ width: 80, height: 80, opacity: locked ? 0.3 : 1 }} resizeMode="contain" />
        {locked && (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="lock-closed" size={16} color={Colors.white} />
            </View>
          </View>
        )}
      </View>
      <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.md, color: Colors.navy, marginBottom: 4 }}>
        {skin.name}
      </Text>
      {active ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.orange} />
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.orange }}>Active</Text>
        </View>
      ) : locked ? (
        <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textMuted }}>Premium</Text>
      ) : (
        <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textSecondary }}>Owned</Text>
      )}
    </TouchableOpacity>
  );
}

function AchievementRow({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.white, borderRadius: Radius.lg,
      padding: Spacing.md, marginBottom: Spacing.sm,
      opacity: unlocked ? 1 : 0.5,
    }}>
      {/* Badge */}
      <View style={{
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: unlocked ? Colors.orangeLight : Colors.ice,
        alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
        borderWidth: 2,
        borderColor: unlocked ? Colors.orange : 'transparent',
      }}>
        <Text style={{ fontSize: 24 }}>{achievement.emoji}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.md, color: Colors.navy }}>
          {achievement.name}
        </Text>
        <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.xs, color: Colors.textSecondary }}>
          {achievement.desc}
        </Text>
      </View>

      {/* Status */}
      {unlocked ? (
        <Ionicons name="checkmark-circle" size={22} color={Colors.orange} />
      ) : (
        <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
      )}
    </View>
  );
}

// ── Grid helper ───────────────────────────────────────────────────────────────
function renderGrid<T extends { id: string }>(
  items: T[],
  renderCard: (item: T) => React.ReactNode,
) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows.map((row, ri) => (
    <View key={ri} style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
      {row.map((item) => renderCard(item))}
      {row.length === 1 && <View style={{ flex: 1 }} />}
    </View>
  ));
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storeState = useWaterStore.getState();

  const [tab, setTab] = useState<'themes' | 'skins' | 'achievements'>('themes');
  const [activeTheme, setActiveTheme] = useState('ocean');
  const [activeSkin, setActiveSkin] = useState('default');

  const ownedThemes  = THEMES.filter((t) => t.status === 'owned');
  const lockedThemes = THEMES.filter((t) => t.status === 'locked');
  const ownedSkins   = SKINS.filter((s) => s.status === 'owned');
  const lockedSkins  = SKINS.filter((s) => s.status === 'locked');

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.check(storeState));
  const lockedAchievements   = ACHIEVEMENTS.filter((a) => !a.check(storeState));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
    >
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.navy} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 26, color: Colors.navy, flex: 1 }}>Shop</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: Colors.orangeLight,
            borderWidth: 1.5, borderColor: Colors.orange,
            borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Text style={{ fontSize: 14 }}>👑</Text>
            <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.sm, color: Colors.orange }}>Premium</Text>
          </View>
        </View>

        {/* Premium banner — white card with orange accent */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            backgroundColor: Colors.white,
            borderRadius: Radius.lg,
            padding: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.lg,
            borderWidth: 1.5,
            borderColor: Colors.border_cream,
          }}
        >
          <View style={{ gap: 3 }}>
            <Text style={{ fontFamily: FontFamily.black, fontSize: FontSize.lg, color: Colors.navy }}>
              Unlock everything 👑
            </Text>
            <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: Colors.textSecondary }}>
              All themes, skins & future content
            </Text>
          </View>
          <View style={{
            backgroundColor: Colors.orange,
            borderRadius: Radius.pill,
            paddingHorizontal: Spacing.md,
            paddingVertical: 8,
          }}>
            <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.sm, color: Colors.white }}>
              Get Premium
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tab selector */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: Colors.white,
          borderRadius: Radius.pill,
          padding: 4,
          marginBottom: Spacing.lg,
        }}>
          <TabPill label="Themes"       active={tab === 'themes'}       onPress={() => setTab('themes')} />
          <TabPill label="Skins"        active={tab === 'skins'}        onPress={() => setTab('skins')} />
          <TabPill label="Achievements" active={tab === 'achievements'} onPress={() => setTab('achievements')} />
        </View>

        {/* ── Themes ── */}
        {tab === 'themes' && (
          <>
            <SectionLabel text="Owned" />
            {renderGrid(ownedThemes, (t) => (
              <ThemeCard key={t.id} theme={t} active={activeTheme === t.id} onPress={() => { if (t.status === 'owned') setActiveTheme(t.id); }} />
            ))}
            <SectionLabel text="Premium" />
            {renderGrid(lockedThemes, (t) => (
              <ThemeCard key={t.id} theme={t} active={false} onPress={() => {}} />
            ))}
          </>
        )}

        {/* ── Skins ── */}
        {tab === 'skins' && (
          <>
            <SectionLabel text="Owned" />
            {renderGrid(ownedSkins, (s) => (
              <SkinCard key={s.id} skin={s} active={activeSkin === s.id} onPress={() => { if (s.status === 'owned') setActiveSkin(s.id); }} />
            ))}
            <SectionLabel text="Premium" />
            {renderGrid(lockedSkins, (s) => (
              <SkinCard key={s.id} skin={s} active={false} onPress={() => {}} />
            ))}
          </>
        )}

        {/* ── Achievements ── */}
        {tab === 'achievements' && (
          <>
            {unlockedAchievements.length > 0 && (
              <>
                <SectionLabel text={`Unlocked · ${unlockedAchievements.length}/${ACHIEVEMENTS.length}`} />
                {unlockedAchievements.map((a) => (
                  <AchievementRow key={a.id} achievement={a} unlocked />
                ))}
              </>
            )}
            <SectionLabel text="Locked" />
            {lockedAchievements.map((a) => (
              <AchievementRow key={a.id} achievement={a} unlocked={false} />
            ))}
          </>
        )}

      </View>
    </ScrollView>
  );
}
