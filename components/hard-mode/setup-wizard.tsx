import { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Platform, Linking, AppState, ScrollView,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { canDrawOverlays, canAccessUsageStats } from '@/lib/hard-mode-lock';

interface Props {
  visible: boolean;
  onComplete: () => void;   // called when user finishes → enable hard mode
  onCancel: () => void;     // called if user exits wizard without completing
}

const TOTAL_STEPS = 4;

// ── Step 0: Welcome ────────────────────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      {/* Hero */}
      <View style={styles.heroCircle}>
        <Text style={styles.heroEmoji}>⚡</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>PREMIUM FEATURE</Text>
      </View>

      <Text style={styles.stepTitle}>Hard Mode</Text>
      <Text style={styles.stepSubtitle}>
        The ultimate hydration accountability tool.
        {'\n'}Lock your phone until you prove you've drunk water.
      </Text>

      {/* Warning strip */}
      <View style={styles.warningStrip}>
        <Ionicons name="warning-outline" size={18} color={Colors.orange} />
        <Text style={styles.warningText}>
          This feature restricts app access. Only enable if you're serious!
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Let's go →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 1: How it works ───────────────────────────────────────────────────────
function StepHowItWorks({ onNext }: { onNext: () => void }) {
  const steps = [
    {
      icon: 'notifications-outline',
      color: Colors.blue,
      title: 'Reminder fires',
      desc: 'Your normal hydration notification arrives as usual.',
    },
    {
      icon: 'timer-outline',
      color: Colors.orange,
      title: '10-minute grace period',
      desc: "Log a drink normally and Hard Mode won't activate.",
    },
    {
      icon: 'lock-closed-outline',
      color: '#FF3B30',
      title: 'Lock screen activates',
      desc: "If no drink is logged, a lock screen appears over your apps.",
    },
    {
      icon: 'camera-outline',
      color: Colors.deep,
      title: 'Photo to unlock',
      desc: 'Snap a photo of your water — AI verifies it, then you\'re free.',
    },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Here's how it works</Text>
      <Text style={styles.stepSubtitleSmall}>Four simple steps, one powerful habit.</Text>

      <View style={styles.stepsGrid}>
        {steps.map((s, i) => (
          <View key={i} style={styles.howRow}>
            <View style={[styles.howIcon, { backgroundColor: s.color + '20' }]}>
              <Ionicons name={s.icon as any} size={22} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>{s.title}</Text>
              <Text style={styles.howDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Got it →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 2: Permissions ────────────────────────────────────────────────────────
function StepPermissions({ onNext }: { onNext: () => void }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [notifGranted, setNotifGranted]   = useState(false);
  const [overlayDone, setOverlayDone]     = useState(false);
  const [usageAccess, setUsageAccess]     = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifGranted(status === 'granted');
    });
  }, []);

  // Re-check all permissions when app returns to foreground (user came back from Settings)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const { status } = await Notifications.getPermissionsAsync();
        setNotifGranted(status === 'granted');
      }
    });
    return () => sub.remove();
  }, []);

  const cameraGranted = cameraPermission?.granted ?? false;
  const isAndroid = Platform.OS === 'android';

  const canProceed = cameraGranted && notifGranted && (!isAndroid || (overlayDone && usageAccess));

  async function handleGrantCamera() {
    await requestCameraPermission();
  }

  async function handleGrantNotif() {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifGranted(status === 'granted');
  }

  async function handleOverlaySettings() {
    if (!isAndroid) return;
    try {
      await IntentLauncher.startActivityAsync(
        'android.settings.action.MANAGE_OVERLAY_PERMISSION',
        { data: 'package:com.splish.app' }
      );
    } catch {
      try {
        await IntentLauncher.startActivityAsync('android.settings.action.MANAGE_OVERLAY_PERMISSION');
      } catch {
        await Linking.openSettings();
      }
    }
  }

  async function handleUsageSettings() {
    if (!isAndroid) return;
    try {
      await IntentLauncher.startActivityAsync('android.settings.USAGE_ACCESS_SETTINGS');
    } catch {
      await Linking.openSettings();
    }
  }

  // Re-check overlay + usage access when app returns from Settings
  useEffect(() => {
    if (!isAndroid) return;
    canDrawOverlays().then(setOverlayDone);
    canAccessUsageStats().then(setUsageAccess);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        canDrawOverlays().then(setOverlayDone);
        canAccessUsageStats().then(setUsageAccess);
      }
    });
    return () => sub.remove();
  }, [isAndroid]);

  function PermRow({
    icon, color, title, desc, granted, actionLabel, onAction, comingSoon,
  }: {
    icon: string; color: string; title: string; desc: string;
    granted?: boolean; actionLabel?: string; onAction?: () => void; comingSoon?: boolean;
  }) {
    return (
      <View style={styles.permRow}>
        <View style={[styles.permIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.permTitle}>{title}</Text>
          <Text style={styles.permDesc}>{desc}</Text>
        </View>
        {comingSoon ? (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Soon</Text>
          </View>
        ) : granted ? (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color="#34C759" />
          </View>
        ) : (
          <TouchableOpacity style={styles.grantBtn} onPress={onAction} activeOpacity={0.75}>
            <Text style={styles.grantBtnText}>{actionLabel ?? 'Grant'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quick setup</Text>
      <Text style={styles.stepSubtitleSmall}>A few permissions make Hard Mode work.</Text>

      <View style={styles.permList}>
        <PermRow
          icon="camera-outline"
          color={Colors.deep}
          title="Camera"
          desc="To snap and verify your drink photo."
          granted={cameraGranted}
          actionLabel="Grant"
          onAction={handleGrantCamera}
        />
        <View style={styles.permDivider} />
        <PermRow
          icon="notifications-outline"
          color={Colors.orange}
          title="Notifications"
          desc="To fire reminders that trigger Hard Mode."
          granted={notifGranted}
          actionLabel="Grant"
          onAction={handleGrantNotif}
        />
        {isAndroid && (
          <>
            <View style={styles.permDivider} />
            <PermRow
              icon="bar-chart-outline"
              color="#0EA5E9"
              title="Usage access"
              desc="Lets Splish detect when you open other apps while locked."
              granted={usageAccess}
              actionLabel="Open Settings"
              onAction={handleUsageSettings}
            />
            <View style={styles.permDivider} />
            <PermRow
              icon="layers-outline"
              color="#8B5CF6"
              title="Display over other apps"
              desc={'Shows the lock screen above other apps.\nOn Samsung: also enable "Display pop-up windows".'}
              granted={overlayDone}
              actionLabel="Open Settings"
              onAction={handleOverlaySettings}
            />
          </>
        )}
        {Platform.OS === 'ios' && (
          <>
            <View style={styles.permDivider} />
            <PermRow
              icon="phone-portrait-outline"
              color="#8B5CF6"
              title="Screen Time (iOS)"
              desc="Full app-level locking via Apple Screen Time. Coming soon."
              comingSoon
            />
          </>
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.deep} />
        <Text style={styles.infoText}>
          {Platform.OS === 'ios'
            ? 'Hard Mode currently locks within Splish. Full OS-level locking is coming once our Apple entitlement is approved.'
            : 'Hard Mode locks within Splish and can show above other apps once you grant the overlay permission.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !canProceed && styles.primaryBtnDisabled]}
        onPress={canProceed ? onNext : undefined}
        activeOpacity={canProceed ? 0.85 : 1}
      >
        <Text style={styles.primaryBtnText}>
          {canProceed ? 'Continue →' : 'Grant permissions above'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 3: All set ────────────────────────────────────────────────────────────
function StepReady({ onComplete }: { onComplete: () => void }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.stepContainer, { alignItems: 'center' }]}>
      <Animated.View style={[styles.readyCircle, animStyle]}>
        <Text style={{ fontSize: 52 }}>✅</Text>
      </Animated.View>

      <Text style={[styles.stepTitle, { textAlign: 'center', marginTop: Spacing.md }]}>
        You're all set!
      </Text>
      <Text style={[styles.stepSubtitle, { textAlign: 'center' }]}>
        Hard Mode is now active.{'\n'}Stay hydrated — or face the lock screen 💧
      </Text>

      <View style={styles.summaryBox}>
        {[
          '⏱  10-min grace after each reminder',
          '📸  Photo verification to unlock',
          '💧  Drink amount logged automatically',
        ].map((line, i) => (
          <Text key={i} style={styles.summaryLine}>{line}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onComplete} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Activate Hard Mode ⚡</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────────
export function HardModeSetupWizard({ visible, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const translateX = useSharedValue(0);

  function goToStep(next: number) {
    // Slide out left then slide in from right
    translateX.value = withTiming(-30, { duration: 120 }, () => {
      translateX.value = 30;
    });
    setTimeout(() => {
      setStep(next);
      translateX.value = withSpring(0, { damping: 16, stiffness: 200 });
    }, 120);
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) goToStep(step + 1);
  }

  // Reset to step 0 when reopened
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(Math.abs(translateX.value), [0, 30], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle + close */}
          <View style={styles.sheetTop}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progress dots */}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step && styles.dotDone,
                ]}
              />
            ))}
          </View>

          {/* Step content */}
          <Animated.View style={[{ flex: 1 }, slideStyle]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.md }}
              keyboardShouldPersistTaps="handled"
            >
              {step === 0 && <StepWelcome onNext={handleNext} />}
              {step === 1 && <StepHowItWorks onNext={handleNext} />}
              {step === 2 && <StepPermissions onNext={handleNext} />}
              {step === 3 && <StepReady onComplete={onComplete} />}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    minHeight: '60%',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
  },
  sheetTop: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: Spacing.sm,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.navy,
  },
  dotDone: {
    backgroundColor: Colors.blue,
  },

  // ── Step shared ──
  stepContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  stepTitle: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xxl,
    color: Colors.navy,
  },
  stepSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stepSubtitleSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.xs,
  },

  // ── Step 0: Welcome ──
  heroCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  heroEmoji: { fontSize: 44 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.orange + '20',
    borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  badgeText: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.orange,
    letterSpacing: 0.8,
  },
  warningStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.orange + '12',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1, borderColor: Colors.orange + '30',
  },
  warningText: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.orange,
    lineHeight: 18,
  },

  // ── Step 1: How it works ──
  stepsGrid: { gap: Spacing.md },
  howRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  howIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  howTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.navy,
    marginBottom: 2,
  },
  howDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // ── Step 2: Permissions ──
  permList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  permDivider: {
    height: 1,
    backgroundColor: Colors.border_cream,
    marginLeft: 60,
  },
  permIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  permTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.navy,
  },
  permDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  checkBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8F8EC',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  soonBadge: {
    backgroundColor: '#F0EBFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
    flexShrink: 0,
  },
  soonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: '#8B5CF6',
  },
  grantBtn: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 7,
    flexShrink: 0,
  },
  grantBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.blue + '18',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.deep,
    lineHeight: 17,
  },

  // ── Step 3: Ready ──
  readyCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#E8F8EC',
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md,
  },
  summaryBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryLine: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },

  // ── Shared button ──
  primaryBtn: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  primaryBtnText: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
});
