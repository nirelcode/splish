import { View, Text, Image, TouchableOpacity, useWindowDimensions, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, withSequence, interpolate, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import DrinkSheet from '@/components/drink-sheet';
import { useProgress, useWaterStore } from '@/store/useWaterStore';

const VIDEO_W = 1200;
const VIDEO_H = Math.round(VIDEO_W * (720 / 1280));
const CROP_TOP = 60;
const CROP_BOT = 180;
const VISIBLE_H = VIDEO_H - CROP_TOP - CROP_BOT;

const BG_TOP = '#fff9ef';
const BG_BOTTOM = '#65b0d7';
const TRACK_H = 200;

const VIDEO_SOURCE = require('@/assets/videos/Water_droplet_character.mp4');

const WAVE_H = 40;
const WAVE_AMP = 14;
const MIN_WATER_H = 130;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [skyDismissed, setSkyDismissed] = useState(false);
  const router = useRouter();

  const { todayMl, goal, pct } = useProgress();
  const streak = useWaterStore((s) => s.streak);
  const CURRENT = todayMl / 1000;
  const TOTAL_GOAL = goal / 1000;
  const PROGRESS = pct; // capped at 1
  const overGoal = todayMl > goal; // true the moment they exceed the target

  // Delay hiding video/gradient until the over-goal rise animation finishes
  const OVER_GOAL_DURATION = 4000; // ms — must match the withTiming duration below
  const [videoHidden, setVideoHidden] = useState(false);
  useEffect(() => {
    if (overGoal) {
      const t = setTimeout(() => setVideoHidden(true), OVER_GOAL_DURATION);
      return () => clearTimeout(t);
    } else {
      setVideoHidden(false);
      setSkyDismissed(false); // Reset so character hides and flow can trigger again
      pullY.value = withSpring(0, { damping: 18, stiffness: 120 });
    }
  }, [overGoal]);

  // After video hides: slowly reveal sky (stays open), settle water back to 100%
  useEffect(() => {
    if (!videoHidden) return;
    pullY.value = withTiming(REVEAL_H, { duration: 3500, easing: Easing.out(Easing.cubic) });
    displayProgress.value = withTiming(1.0, { duration: 2500, easing: Easing.out(Easing.cubic) });
  }, [videoHidden]);

  // Keep height in a shared value so Reanimated worklets react to resize
  const windowHeight = useSharedValue(height);
  useEffect(() => { windowHeight.value = height; }, [height]);

  // Measured height of the area below the nav (cream + water combined)
  const contentH = useSharedValue(0);

  const goalObjectY = useSharedValue(-height - 800); // start way above screen
  const goalObjectBobY = useSharedValue(0);
  useEffect(() => {
    goalObjectBobY.value = withRepeat(
      withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
  }, []);
  const goalObjectStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: goalObjectY.value }, { translateY: goalObjectBobY.value }]
  }));

  // Water bg rises to 110%, video/gradient rise to 130%
  const targetProgress = overGoal ? 1.1 : PROGRESS;
  const displayProgress = useSharedValue(targetProgress);
  // Extra upward offset for video/gradient to reach 130% while water stays at 110%
  const videoExtraY = useSharedValue(0);
  useEffect(() => {
    if (overGoal) {
      displayProgress.value = withTiming(1.1, { duration: OVER_GOAL_DURATION, easing: Easing.out(Easing.cubic) });
      videoExtraY.value = withTiming(1, { duration: OVER_GOAL_DURATION, easing: Easing.out(Easing.cubic) });
    } else {
      displayProgress.value = withSpring(targetProgress, { damping: 20, stiffness: 100 });
      videoExtraY.value = 0;
    }
  }, [targetProgress]);
  // The extra 20% offset applied to video and gradient
  const videoExtraStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -videoExtraY.value * (contentH.value > 0 ? contentH.value * 0.35 : windowHeight.value * 0.35) }],
  }));

  const thumbY = useSharedValue(TRACK_H * (1 - PROGRESS));
  useEffect(() => {
    thumbY.value = withSpring(TRACK_H * (1 - PROGRESS), { damping: 20, stiffness: 100 });
  }, [PROGRESS]);

  // ── GOAL CELEBRATION ANIMATIONS ──
  const [isCelebrating, setIsCelebrating] = useState(false);
  const congratsOpacity = useSharedValue(0);
  const congratsScale = useSharedValue(0.6);
  const flyProgress = useSharedValue(0);
  const flyStartX = useSharedValue(0);
  const flyStartY = useSharedValue(0);
  const flyEndX = useSharedValue(0);
  const flyEndY = useSharedValue(0);
  const streakBounceScale = useSharedValue(1);


  // Track goal transition (false → true) so animation only fires once per crossing
  const prevOverGoalRef = useRef(overGoal);
  useEffect(() => {
    const justReached = overGoal && !prevOverGoalRef.current;
    prevOverGoalRef.current = overGoal;
    if (!justReached) return;

    setIsCelebrating(true);

    // Phase 1: congrats text pops in
    congratsOpacity.value = withTiming(1, { duration: 400 });
    congratsScale.value = withSpring(1, { damping: 10, stiffness: 180 });

    // Phase 2: set up and launch flying 🔥 emoji toward streak badge
    flyStartX.value = width / 2 - 40;
    flyStartY.value = height / 2 - 100;
    flyEndX.value = Spacing.xl + 8;   // streak badge approx center-x
    flyEndY.value = insets.top + 6;   // streak badge approx top
    flyProgress.value = 0;
    setTimeout(() => {
      flyProgress.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) });
    }, 300);

    // Phase 3: streak badge pops when emoji lands
    setTimeout(() => {
      streakBounceScale.value = withSequence(
        withTiming(1.45, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 250, easing: Easing.inOut(Easing.cubic) }),
      );
    }, 1200);

    // Phase 4: congrats text fades out
    setTimeout(() => {
      congratsOpacity.value = withTiming(0, { duration: 500 });
      congratsScale.value = withTiming(0.6, { duration: 500 });
    }, 2200);

    // Phase 5: ensure cleanup
    setTimeout(() => {
      setIsCelebrating(false);
    }, 2800);
  }, [overGoal]);

  const waterSectionStyle = useAnimatedStyle(() => {
    const maxH = contentH.value > 0 ? contentH.value : windowHeight.value;
    const dp = displayProgress.value;
    if (dp <= 1) {
      return { height: MIN_WATER_H + dp * (maxH - MIN_WATER_H), transform: [] };
    } else {
      const overflowH = (dp - 1) * maxH;
      return {
        height: maxH + overflowH,
        transform: [{ translateY: -overflowH }],
      };
    }
  });

  // Congrats overlay style
  const congratsStyle = useAnimatedStyle(() => ({
    opacity: congratsOpacity.value,
    transform: [{ scale: congratsScale.value }],
  }));

  // Flying 🔥 emoji style
  const flyEmojiStyle = useAnimatedStyle(() => {
    const x = interpolate(flyProgress.value, [0, 1], [flyStartX.value, flyEndX.value]);
    const y = interpolate(flyProgress.value, [0, 1], [flyStartY.value, flyEndY.value]);
    const scale = interpolate(flyProgress.value, [0, 0.8, 1], [1, 0.85, 0.3]);
    const opacity = interpolate(flyProgress.value, [0, 0.7, 1], [1, 1, 0]);
    return { transform: [{ translateX: x }, { translateY: y }, { scale }], opacity };
  });

  // Streak badge pop style
  const streakBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakBounceScale.value }],
  }));

  // Pull-down to reveal sky
  const REVEAL_H = 600;
  const pullY = useSharedValue(0);
  const pullStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pullY.value }],
  }));
  // Shared value so the gesture worklet can read overGoal without runOnJS
  const overGoalSV = useSharedValue(overGoal ? 1 : 0);
  useEffect(() => { overGoalSV.value = (overGoal && !skyDismissed) ? 1 : 0; }, [overGoal, skyDismissed]);
  const pullGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (overGoalSV.value) return; // auto-revealed when goal reached, block manual drag
      pullY.value = Math.max(0, Math.min(e.translationY, REVEAL_H));
    })
    .onEnd(() => {
      if (overGoalSV.value) return;
      pullY.value = withSpring(0, { damping: 18, stiffness: 120 });
    });

  // Family bobbing animation
  const familyBobY = useSharedValue(0);
  useEffect(() => {
    familyBobY.value = withRepeat(
      withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);
  const familyBobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: familyBobY.value }]
  }));

  // Wave animation
  const waveX1 = useSharedValue(0);
  const waveX2 = useSharedValue(0);
  useEffect(() => {
    waveX1.value = withRepeat(withTiming(-width, { duration: 3200, easing: Easing.linear }), -1, false);
    waveX2.value = withRepeat(withTiming(-width, { duration: 5000, easing: Easing.linear }), -1, false);
  }, [width]);
  const wave1Style = useAnimatedStyle(() => ({ transform: [{ translateX: waveX1.value }] }));
  const wave2Style = useAnimatedStyle(() => ({ transform: [{ translateX: waveX2.value }] }));

  // Video player
  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 1.0;
  });

  useEffect(() => {
    let duration = 0;
    let scheduled = false;
    const loadSub = player.addListener('sourceLoad', (e) => { duration = e.duration; });
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && !player.playing) player.play();
    });
    player.timeUpdateEventInterval = 0.05;
    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      if (duration > 0 && currentTime >= duration - 0.4 && !scheduled) {
        scheduled = true;
        player.replay();
        setTimeout(() => { scheduled = false; }, 800);
      }
    });
    if (player.status === 'readyToPlay') player.play();
    return () => { loadSub.remove(); statusSub.remove(); timeSub.remove(); };
  }, [player]);

  useFocusEffect(useCallback(() => {
    if (player.status === 'readyToPlay' && !player.playing) player.play();
  }, [player]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && player.status === 'readyToPlay' && !player.playing) {
        player.play();
      }
    });
    return () => sub.remove();
  }, [player]);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>

      {/* ── MAIN SCREEN (slides down on pull) ── */}
      <Animated.View style={[{ flex: 1, backgroundColor: BG_TOP }, pullStyle]}>

        {/* Sky gradient — travels with screen and image */}
        <LinearGradient
          colors={['#7ec8e3', '#b8e4f9', '#d8f0fb', BG_TOP]}
          style={{ position: 'absolute', top: -REVEAL_H, left: 0, right: 0, height: REVEAL_H }}
        />

        {/* Family image — tap to dismiss sky when goal reach celebration is done */}
        <Animated.View style={[{ position: 'absolute', top: -640, alignSelf: 'center', width: 700, height: 600 }, familyBobStyle]} pointerEvents={videoHidden && !skyDismissed ? "auto" : "none"}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{ width: '100%', height: '100%' }}
            onPress={() => {
              if (skyDismissed) return;
              setSkyDismissed(true);
              pullY.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) });
              
              // Drop object slowly and smoothly without bouncing
              setTimeout(() => {
                goalObjectY.value = withTiming(0, { duration: 1400, easing: Easing.out(Easing.cubic) });
              }, 400); // starts falling mid-close
            }}
          >
            <Image
              source={require('@/assets/images/splish-family.png')}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: videoHidden && !skyDismissed ? 0 : 1 }}
              resizeMode="contain"
            />
            <Image
              source={require('@/assets/images/splish-family-goal.png')}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: videoHidden && !skyDismissed ? 1 : 0 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>


        {/* Spacer — reserves the height the top nav used to occupy in the flow */}
        <View style={{ height: insets.top + 88 }} />

        {/* ── CONTENT AREA (cream + water) — measured so water fills exactly to top at 100% ── */}
        <View style={{ flex: 1 }} onLayout={(e) => { contentH.value = e.nativeEvent.layout.height; }}>

          {/* ── CREAM SECTION ── */}
          <View style={{ flex: 1 }} />

          {/* ── WATER SECTION ── */}
          <Animated.View style={[{ backgroundColor: BG_BOTTOM, overflow: 'visible' }, waterSectionStyle]}>

            {/* Wave animation — visible when video is absent */}
            {(() => {
              const W = width, mid = WAVE_H / 2, A = WAVE_AMP;
              const path1 = [
                `M 0 ${mid}`,
                `C ${W * .25} ${mid - A}, ${W * .75} ${mid + A}, ${W} ${mid}`,
                `C ${W * 1.25} ${mid - A}, ${W * 1.75} ${mid + A}, ${W * 2} ${mid}`,
                `C ${W * 2.25} ${mid - A}, ${W * 2.75} ${mid + A}, ${W * 3} ${mid}`,
                `L ${W * 3} ${WAVE_H} L 0 ${WAVE_H} Z`,
              ].join(' ');
              const path2 = [
                `M ${-W * .5} ${mid}`,
                `C ${-W * .25} ${mid + A}, ${W * .25} ${mid - A}, ${W * .5} ${mid}`,
                `C ${W * .75} ${mid + A}, ${W * 1.25} ${mid - A}, ${W * 1.5} ${mid}`,
                `C ${W * 1.75} ${mid + A}, ${W * 2.25} ${mid - A}, ${W * 2.5} ${mid}`,
                `C ${W * 2.75} ${mid + A}, ${W * 3.25} ${mid - A}, ${W * 3.5} ${mid}`,
                `L ${W * 3.5} ${WAVE_H} L ${-W * .5} ${WAVE_H} Z`,
              ].join(' ');
              return (
                <>
                  <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 6, left: 0 }, wave1Style]} pointerEvents="none">
                    <Svg width={width * 3} height={WAVE_H}>
                      <Path d={path1} fill={BG_BOTTOM} />
                    </Svg>
                  </Animated.View>
                  <Animated.View style={[{ position: 'absolute', top: -WAVE_H + 2, left: 0, opacity: 0.5 }, wave2Style]} pointerEvents="none">
                    <Svg width={width * 3.5} height={WAVE_H}>
                      <Path d={path2} fill={BG_BOTTOM} />
                    </Svg>
                  </Animated.View>
                </>
              );
            })()}

            {/* Video band + gradient — travel extra 20% upward, hidden when animation done */}
            {!videoHidden && (
              <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, videoExtraStyle]} pointerEvents="none">
                <View style={{
                  position: 'absolute',
                  top: -(VISIBLE_H / 2),
                  left: 0, right: 0,
                  height: VISIBLE_H,
                  overflow: 'hidden',
                }}>
                  <VideoView
                    player={player}
                    style={{
                      position: 'absolute',
                      top: -CROP_TOP,
                      width: VIDEO_W,
                      height: VIDEO_H,
                      left: (width - VIDEO_W) / 2,
                    }}
                    contentFit="fill"
                    nativeControls={false}
                  />
                </View>

                {/* TODO: when animating back to 100%, show gradient again by restoring this outside the conditional */}
                <Svg
                  width={width} height={100}
                  style={{ position: 'absolute', top: VISIBLE_H / 2 - 60, left: 0 }}
                  pointerEvents="none"
                >
                  <Defs>
                    <SvgLinearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={BG_BOTTOM} stopOpacity="0" />
                      <Stop offset="1" stopColor={BG_BOTTOM} stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width={width} height={100} fill="url(#fadeB)" />
                </Svg>
              </Animated.View>
            )}

            {/* Dropped Goal Character (replaces video band after sky closes) */}
            {skyDismissed && (
               <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, goalObjectStyle]} pointerEvents="none">
                 <View style={{
                    position: 'absolute',
                    top: -(VISIBLE_H / 2) + 180, /* pushed another bit lower on the screen */
                    left: 0, right: 0,
                    height: VISIBLE_H + 180,
                    alignItems: 'center',
                    justifyContent: 'center',
                 }}>
                    <Image
                       source={require('@/assets/images/splish-goal.png')}
                       style={{ width: 580, height: 580 }} /* made significantly larger */
                       resizeMode="contain"
                    />
                 </View>
               </Animated.View>
            )}

          </Animated.View>

        </View>{/* end content area */}

      </Animated.View>

      {/* ── HYDRATION STATS — fixed to screen ── */}
      <View style={{
        position: 'absolute',
        bottom: insets.bottom + Spacing.md + 90 + Spacing.xs,
        left: Spacing.xl,
        right: Spacing.xl,
        zIndex: 50,
        alignItems: 'center',
      }}>
        <Text style={{ fontFamily: FontFamily.black, fontSize: 44, color: Colors.white, lineHeight: 48 }}>
          {CURRENT.toFixed(1)}
          <Text style={{ fontSize: 28, fontFamily: FontFamily.bold, color: 'rgba(255,255,255,0.55)' }}> / {TOTAL_GOAL.toFixed(1)} L</Text>
        </Text>
        <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' }}>
          {PROGRESS >= 1 ? '🎉 Goal reached!' : `${Math.round(PROGRESS * 100)}% · ${((TOTAL_GOAL - CURRENT) * 1000).toFixed(0)} ml to go`}
        </Text>
      </View>

      {/* ── BOTTOM NAV — fixed to screen ── */}
      <View style={{
        position: 'absolute',
        bottom: insets.bottom + Spacing.md,
        left: Spacing.xl,
        right: Spacing.xl,
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity onPress={() => router.push('/stats')} style={{ alignItems: 'center', gap: 0 }}>
          <Ionicons name="bar-chart-outline" size={36} color={Colors.navyDark} />
          <Text style={{ fontFamily: FontFamily.black, fontSize: 16, color: Colors.navyDark }}>stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          style={{
            flex: 1,
            marginHorizontal: Spacing.xl,
            backgroundColor: Colors.navy,
            borderRadius: Radius.pill,
            paddingVertical: 17,
            alignItems: 'center',
            boxShadow: `0 4px 0px ${Colors.navyDark}`,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: FontFamily.extrabold, fontSize: FontSize.lg, color: Colors.white }}>
            Drink
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/settings')} style={{ alignItems: 'center', gap: 2 }}>
          <Feather name="user" size={36} color={Colors.navyDark} />
          <Text style={{ fontFamily: FontFamily.black, fontSize: 16, color: Colors.navyDark }}>user</Text>
        </TouchableOpacity>
      </View>

      {/* ── TOP NAV — fixed to screen, drag here to reveal sky ── */}
      <GestureDetector gesture={pullGesture}>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + 8,
        paddingHorizontal: Spacing.xl,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
      }}>
        <Animated.View style={[{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: Colors.orangeLight,
          borderWidth: 1.5, borderColor: Colors.orange,
          borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 6,
        }, streakBadgeStyle]}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <Text style={{ fontFamily: FontFamily.black, fontSize: 18, color: '#000000' }}>{streak}</Text>
        </Animated.View>

        <TouchableOpacity onPress={() => router.push('/shop')} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="shopping-cart" size={28} color={Colors.navyDark} />
        </TouchableOpacity>
      </View>
      </GestureDetector>


      {/* ── DRINK SHEET ── */}
      <DrinkSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />

      {/* ── UNDO BUTTON (fixed to screen, outside pullable view) ── */}
      <TouchableOpacity
        onPress={() => useWaterStore.getState().removeLast()}
        style={{
          position: 'absolute',
          right: Spacing.xl,
          top: '55%',
          backgroundColor: Colors.navy,
          borderRadius: Radius.pill,
          width: 54,
          height: 54,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 0px ${Colors.navyDark}`,
          zIndex: 100,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ fontFamily: FontFamily.extrabold, fontSize: 24, color: Colors.white }}>−</Text>
      </TouchableOpacity>

      {/* ── CONGRATS OVERLAY (fades in then out during goal animation) ── */}
      {isCelebrating && (
        <Animated.View
          pointerEvents="none"
          style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center',
            zIndex: 150,
          }, congratsStyle]}
        >
          <Text style={{ fontSize: 72, marginBottom: 8 }}>🎉</Text>
          <Text style={{
            fontFamily: FontFamily.black, fontSize: 38, color: Colors.white,
            textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
          }}>
            You did it!
          </Text>
          <Text style={{
            fontFamily: FontFamily.semibold, fontSize: 18,
            color: 'rgba(255,255,255,0.85)', marginTop: 8,
          }}>
            Daily goal reached 💧
          </Text>
        </Animated.View>
      )}

      {/* ── FLYING 🔥 EMOJI (flies from center to streak badge) ── */}
      {isCelebrating && (
        <Animated.View
          pointerEvents="none"
          style={[{
            position: 'absolute', top: 0, left: 0,
            width: 80, height: 80,
            alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
          }, flyEmojiStyle]}
        >
          <Text style={{ fontSize: 60 }}>🔥</Text>
        </Animated.View>
      )}

    </View>
  );
}
