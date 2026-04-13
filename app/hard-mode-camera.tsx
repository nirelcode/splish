import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { detectWaterInPhoto } from '@/lib/water-detection';
import { useWaterStore } from '@/store/useWaterStore';
import { DrinkPickerSheet } from '@/components/hard-mode/drink-picker-sheet';

type Stage = 'camera' | 'analyzing' | 'verified' | 'fail';

export default function HardModeCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>('camera');
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [failMessage, setFailMessage] = useState('');
  const [estimatedMl, setEstimatedMl] = useState(250);
  const [showPicker, setShowPicker] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const addDrink = useWaterStore((s) => s.addDrink);
  const clearHardModePending = useWaterStore((s) => s.clearHardModePending);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        exif: false,
      });
      if (!photo?.base64) throw new Error('No image data');
      setPhotoUri(photo.uri);
      setStage('analyzing');

      const result = await detectWaterInPhoto(photo.base64);

      if (result.detected) {
        setEstimatedMl(result.estimatedMl);
        setStage('verified');
        scale.value = withSequence(withSpring(1.15), withSpring(1));
        // Small delay so user sees the success state, then show picker
        setTimeout(() => setShowPicker(true), 600);
      } else {
        setFailMessage(result.message);
        setStage('fail');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong. Try again.');
      setStage('camera');
    }
  }, [scale]);

  const handleConfirmDrink = useCallback((ml: number) => {
    addDrink(ml);
    clearHardModePending();
    setShowPicker(false);
    router.back();
  }, [addDrink, clearHardModePending, router]);

  const retry = useCallback(() => {
    setPhotoUri(null);
    setFailMessage('');
    setStage('camera');
  }, []);

  // ── Permission not granted ───────────────────────────────────────────────────
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emoji}>📷</Text>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.subtitle}>
          Splish needs your camera to verify you've drunk water.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Analyzing ────────────────────────────────────────────────────────────────
  if (stage === 'analyzing') {
    return (
      <View style={[styles.container, styles.center]}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImg} />}
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={Colors.blue} />
          <Text style={styles.analyzingText}>Checking your drink...</Text>
        </View>
      </View>
    );
  }

  // ── Verified (waiting for picker) ────────────────────────────────────────────
  if (stage === 'verified') {
    return (
      <View style={[styles.container, styles.center]}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImg} />}
        <View style={styles.analyzingOverlay}>
          <Animated.Text style={[{ fontSize: 56 }, animStyle]}>✅</Animated.Text>
          <Text style={styles.analyzingText}>Drink detected!</Text>
          <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            Gemini estimated ~{estimatedMl}ml
          </Text>
        </View>

        <DrinkPickerSheet
          visible={showPicker}
          defaultMl={estimatedMl}
          onConfirm={handleConfirmDrink}
        />
      </View>
    );
  }

  // ── Fail ─────────────────────────────────────────────────────────────────────
  if (stage === 'fail') {
    return (
      <View style={[styles.container, styles.center, { padding: Spacing.xl }]}>
        <Text style={styles.emoji}>🤔</Text>
        <Text style={[styles.title, { color: Colors.orange }]}>No drink detected</Text>
        <Text style={styles.subtitle}>{failMessage || 'Make sure your cup or bottle is clearly visible.'}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={retry}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={styles.skipText}>Skip this reminder</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Show your drink 💧</Text>
        <TouchableOpacity
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
          style={styles.iconBtn}
        >
          <Ionicons name="camera-reverse-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>Point your camera at your cup, glass, or bottle</Text>
      </View>

      {/* Shutter */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.shutter} onPress={takePicture} activeOpacity={0.8}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: 'white' },
  iconBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20,
  },
  hintBox: {
    position: 'absolute', bottom: 160, left: Spacing.xl, right: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.sm, padding: 12,
    alignItems: 'center',
  },
  hintText: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: 'white', textAlign: 'center' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center',
  },
  shutter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: 'white',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  previewImg: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  analyzingOverlay: {
    alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: Radius.md,
    padding: Spacing.xl,
  },
  analyzingText: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: 'white' },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontFamily: FontFamily.black, fontSize: FontSize.xxl, color: 'white', textAlign: 'center' },
  subtitle: {
    fontFamily: FontFamily.regular, fontSize: FontSize.md, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: Colors.blue, borderRadius: Radius.pill,
    paddingHorizontal: 40, paddingVertical: 14, marginTop: 8,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: 'white' },
  skipText: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)' },
});
