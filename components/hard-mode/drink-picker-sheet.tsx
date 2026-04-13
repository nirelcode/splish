import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

const PRESETS = [
  { label: 'Small glass', ml: 200 },
  { label: 'Regular glass', ml: 300 },
  { label: 'Large glass', ml: 400 },
  { label: 'Small bottle', ml: 350 },
  { label: 'Standard bottle', ml: 500 },
  { label: 'Large bottle', ml: 750 },
];

interface Props {
  visible: boolean;
  defaultMl: number;           // Gemini's estimate
  onConfirm: (ml: number) => void;
}

export function DrinkPickerSheet({ visible, defaultMl, onConfirm }: Props) {
  // Snap defaultMl to nearest preset, or keep as custom
  const nearest = PRESETS.reduce((prev, curr) =>
    Math.abs(curr.ml - defaultMl) < Math.abs(prev.ml - defaultMl) ? curr : prev
  );
  const [selected, setSelected] = useState(nearest.ml);
  const [custom, setCustom] = useState(defaultMl);
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');

  const finalMl = mode === 'custom' ? custom : selected;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How much did you drink?</Text>
            <View style={styles.geminiTag}>
              <Text style={styles.geminiText}>✨ Gemini estimated {defaultMl}ml</Text>
            </View>
          </View>

          {/* Tab switch */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'presets' && styles.tabActive]}
              onPress={() => setMode('presets')}
            >
              <Text style={[styles.tabText, mode === 'presets' && styles.tabTextActive]}>
                Quick pick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'custom' && styles.tabActive]}
              onPress={() => setMode('custom')}
            >
              <Text style={[styles.tabText, mode === 'custom' && styles.tabTextActive]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Presets grid */}
          {mode === 'presets' && (
            <View style={styles.grid}>
              {PRESETS.map((p) => {
                const isSelected = selected === p.ml;
                const isGemini = p.ml === nearest.ml;
                return (
                  <TouchableOpacity
                    key={p.ml}
                    style={[styles.preset, isSelected && styles.presetSelected]}
                    onPress={() => setSelected(p.ml)}
                    activeOpacity={0.75}
                  >
                    {isGemini && <Text style={styles.geminiDot}>✨</Text>}
                    <Text style={[styles.presetMl, isSelected && styles.presetMlSelected]}>
                      {p.ml}ml
                    </Text>
                    <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Custom stepper */}
          {mode === 'custom' && (
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setCustom((v) => Math.max(50, v - 50))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValue}>
                <Text style={styles.stepMl}>{custom}</Text>
                <Text style={styles.stepUnit}>ml</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setCustom((v) => Math.min(2000, v + 50))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Confirm */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(finalMl)}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>Log {finalMl}ml 💧</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center',
  },
  header: { alignItems: 'center', gap: 6 },
  title: {
    fontFamily: FontFamily.black, fontSize: FontSize.xl, color: Colors.navy,
  },
  geminiTag: {
    backgroundColor: '#f0f7ff',
    borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#c8e0ff',
  },
  geminiText: {
    fontFamily: FontFamily.semibold, fontSize: FontSize.xs, color: Colors.deep,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.md - 2, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.navy },
  tabText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  preset: {
    width: '30%', flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
    position: 'relative',
  },
  presetSelected: {
    borderColor: Colors.blue,
    backgroundColor: '#e8f5fb',
  },
  geminiDot: { position: 'absolute', top: 4, right: 6, fontSize: 10 },
  presetMl: {
    fontFamily: FontFamily.black, fontSize: FontSize.lg, color: Colors.navy,
  },
  presetMlSelected: { color: Colors.deep },
  presetLabel: {
    fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 2,
  },
  presetLabelSelected: { color: Colors.deep },

  stepper: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  stepBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: {
    fontFamily: FontFamily.black, fontSize: 24, color: Colors.navy, lineHeight: 28,
  },
  stepValue: { alignItems: 'center', minWidth: 100 },
  stepMl: { fontFamily: FontFamily.black, fontSize: 48, color: Colors.navy, lineHeight: 54 },
  stepUnit: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textSecondary },

  confirmBtn: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmText: {
    fontFamily: FontFamily.black, fontSize: FontSize.lg, color: Colors.white,
  },
});
