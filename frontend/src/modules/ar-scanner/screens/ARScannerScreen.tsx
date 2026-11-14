import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { FooterNav } from '../../../shared/components/FooterNav';
import { COLORS } from '../../../shared/constants/theme';
import {
  matchLandmarkByPhoto,
  RecognizedLandmark,
} from '../services/recognitionApi';

interface ARScannerScreenProps {
  navigation?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LVIV_FALLBACK_COORDS = {
  latitude: 49.8418,
  longitude: 24.0316,
  accuracy: 600,
};

const GLOW_SPREAD_X = 120;
const GLOW_SPREAD_Y = 70;
const GLOW_INNER_INSET = 18;
const GLOW_OPACITY = 0.5;

const GAUSS_K = 3.2;
const smooth = (x: number) => {
  const d = 1 - x;
  const edge = Math.exp(-GAUSS_K);
  return (Math.exp(-GAUSS_K * d * d) - edge) / (1 - edge);
};
const STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

const truncate = (text: string, max = 90) => {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s.,;:–-]+$/, '') + '…';
};

const TEXT_BOTTOM_OFFSET = 34;

const renderStops = (fromInner: boolean) =>
  STEPS.map((t) => (
    <Stop
      key={t}
      offset={String(t)}
      stopColor="#000"
      stopOpacity={GLOW_OPACITY * smooth(fromInner ? 1 - t : t)}
    />
  ));

const GlowRect: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const W = Math.round(width);
  const H = Math.round(height);
  const sx = GLOW_SPREAD_X + GLOW_INNER_INSET;
  const sy = GLOW_SPREAD_Y + GLOW_INNER_INSET;
  const innerW = W - sx * 2;
  const innerH = H - sy * 2;
  if (innerW <= 0 || innerH <= 0) return null;

  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">{renderStops(false)}</LinearGradient>
        <LinearGradient id="gBottom" x1="0" y1="1" x2="0" y2="0">{renderStops(false)}</LinearGradient>
        <LinearGradient id="gLeft" x1="0" y1="0" x2="1" y2="0">{renderStops(false)}</LinearGradient>
        <LinearGradient id="gRight" x1="1" y1="0" x2="0" y2="0">{renderStops(false)}</LinearGradient>

        <RadialGradient id="gTL" cx="100%" cy="100%" rx="100%" ry="100%" fx="100%" fy="100%">{renderStops(true)}</RadialGradient>
        <RadialGradient id="gTR" cx="0%" cy="100%" rx="100%" ry="100%" fx="0%" fy="100%">{renderStops(true)}</RadialGradient>
        <RadialGradient id="gBL" cx="100%" cy="0%" rx="100%" ry="100%" fx="100%" fy="0%">{renderStops(true)}</RadialGradient>
        <RadialGradient id="gBR" cx="0%" cy="0%" rx="100%" ry="100%" fx="0%" fy="0%">{renderStops(true)}</RadialGradient>
      </Defs>

      <Rect x={sx} y={sy} width={innerW} height={innerH} fill="#000" fillOpacity={GLOW_OPACITY} />
      <Rect x={sx} y={0} width={innerW} height={sy} fill="url(#gTop)" />
      <Rect x={sx} y={H - sy} width={innerW} height={sy} fill="url(#gBottom)" />
      <Rect x={0} y={sy} width={sx} height={innerH} fill="url(#gLeft)" />
      <Rect x={W - sx} y={sy} width={sx} height={innerH} fill="url(#gRight)" />
      <Rect x={0} y={0} width={sx} height={sy} fill="url(#gTL)" />
      <Rect x={W - sx} y={0} width={sx} height={sy} fill="url(#gTR)" />
      <Rect x={0} y={H - sy} width={sx} height={sy} fill="url(#gBL)" />
      <Rect x={W - sx} y={H - sy} width={sx} height={sy} fill="url(#gBR)" />
    </Svg>
  );
};

function isWithinLviv(lat: number, lng: number): boolean {
  const dLat = Math.abs(lat - LVIV_FALLBACK_COORDS.latitude);
  const dLng = Math.abs(lng - LVIV_FALLBACK_COORDS.longitude);
  return dLat < 0.25 && dLng < 0.35;
}

export const ARScannerScreen: React.FC<ARScannerScreenProps> = ({ navigation }) => {
  const [landmark, setLandmark] = useState<RecognizedLandmark | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [glowSize, setGlowSize] = useState<{ w: number; h: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ініціалізація камери...');
  const [confidenceBadge, setConfidenceBadge] = useState<string | null>(null);
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(true);
  const [appActive, setAppActive] = useState<boolean>(AppState.currentState === 'active');
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

  const cameraRef = useRef<Camera>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pinScaleAnim = useRef(new Animated.Value(0)).current;
  const coordsRef = useRef(LVIV_FALLBACK_COORDS);
  const isScanningRef = useRef(false);
  const isOpenRef = useRef(false);
  const missCountRef = useRef(0);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const isCameraActive = Boolean(hasPermission && device && isScreenFocused && appActive);

  const BUTTON_X = SCREEN_WIDTH * 0.5;
  const BUTTON_Y = SCREEN_HEIGHT * 0.44;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!navigation?.addListener) return;
    const unsubFocus = navigation.addListener('focus', () => setIsScreenFocused(true));
    const unsubBlur = navigation.addListener('blur', () => setIsScreenFocused(false));
    return () => {
      if (typeof unsubFocus === 'function') unsubFocus();
      if (typeof unsubBlur === 'function') unsubBlur();
    };
  }, [navigation]);

  useEffect(() => {
    if (!device) {
      setIsCameraReady(false);
    }
  }, [device]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    Animated.spring(pinScaleAnim, {
      toValue: landmark ? 1 : 0,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [landmark, pinScaleAnim]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }

    const initLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        }

        const geo = (globalThis as any).navigator?.geolocation;
        if (geo?.getCurrentPosition) {
          geo.getCurrentPosition(
            (pos: any) => {
              const { latitude, longitude, accuracy } = pos.coords;
              if (isWithinLviv(latitude, longitude)) {
                coordsRef.current = {
                  latitude,
                  longitude,
                  accuracy: accuracy || 20,
                };
              }
            },
            () => {},
            { enableHighAccuracy: false, timeout: 4000, maximumAge: 30000 },
          );
        }
      } catch {}
    };

    initLocation();
  }, [hasPermission, requestPermission]);

  const openOverlay = () => {
    setIsOpen(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeOverlay = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const runRecognitionFrame = useCallback(async (manual = false) => {
    if (
      isScanningRef.current ||
      !cameraRef.current ||
      !isCameraActive ||
      !isCameraReady
    ) {
      return;
    }
    if (!manual && isOpenRef.current) return;

    try {
      isScanningRef.current = true;
      if (manual) {
        setScanning(true);
      }

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      if (!isCameraActive) return;

      const rawResult: any = await matchLandmarkByPhoto({
        photoUri: photo.path,
        latitude: coordsRef.current.latitude,
        longitude: coordsRef.current.longitude,
        gpsAccuracyMeters: coordsRef.current.accuracy,
      });

      const resolvedLandmark: RecognizedLandmark | null =
        rawResult?.matchedLandmark ?? rawResult?.landmark ?? null;
      const rawScore: number =
        rawResult?.bestMatch?.score ?? rawResult?.confidence ?? 0;
      const pct = Math.round(rawScore * 100);

      if (
        (rawResult?.status === 'MATCHED' || rawResult?.status === 'UNCERTAIN') &&
        resolvedLandmark
      ) {
        missCountRef.current = 0;
        setLandmark(resolvedLandmark);
        setConfidenceBadge(rawResult.status === 'MATCHED' ? `${pct}%` : `~${pct}%`);
        setStatusMessage(`Знайдено: ${resolvedLandmark.name}`);
        if (manual) {
          openOverlay();
        }
      } else {
        missCountRef.current += 1;
        setStatusMessage('Наведіть камеру на пам’ятку');
        if (manual || missCountRef.current >= 2) {
          setLandmark(null);
          setConfidenceBadge(null);
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('Camera is closed') || msg.includes('capture request')) {
        return;
      }
      console.warn('[AR Debug] Error:', msg);
      setStatusMessage('Немає зв’язку з сервером');
    } finally {
      isScanningRef.current = false;
      if (manual) {
        setScanning(false);
      }
    }
  }, [isCameraActive, isCameraReady]);

  useEffect(() => {
    if (!isCameraActive || !isCameraReady) return;

    setStatusMessage('Наведіть камеру на пам’ятку');

    const initialDelay = setTimeout(() => {
      runRecognitionFrame(false);
    }, 600);

    const timer = setInterval(() => {
      runRecognitionFrame(false);
    }, 2500);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(timer);
    };
  }, [isCameraActive, isCameraReady, runRecognitionFrame]);

  const handlePinPress = () => {
    if (!landmark) return;
    if (isOpen) {
      closeOverlay();
    } else {
      openOverlay();
    }
  };

  const handleOpenAiGuide = () => {
    if (!landmark) return;
    navigation?.navigate('AIGuide', {
      landmarkId: String(landmark.id),
      landmarkName: landmark.name,
      initialContext: landmark.description,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />

      <View style={styles.videoContainer}>
        {hasPermission && device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isCameraActive}
            photo={true}
            onInitialized={() => setIsCameraReady(true)}
            onStarted={() => setIsCameraReady(true)}
            onError={(e) => setStatusMessage(`Камера: ${e.message}`)}
          />
        ) : (
          <View style={styles.cameraFallback}>
            <Text style={styles.cameraFallbackText}>
              {!hasPermission ? 'Очікування дозволу на камеру...' : 'Камера недоступна'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.topHeaderBar} />

      <View style={styles.liveBadge} pointerEvents="none">
        <View
          style={[
            styles.liveDot,
            landmark ? styles.liveDotMatched : styles.liveDotScanning,
          ]}
        />
        <Text style={styles.liveBadgeText} numberOfLines={1}>
          {statusMessage}
        </Text>
      </View>

      {!landmark && (
        <View
          pointerEvents="none"
          style={[
            styles.reticleRing,
            { left: BUTTON_X - 24, top: BUTTON_Y - 24 },
          ]}
        />
      )}

      {isOpen && (
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={closeOverlay}
        />
      )}

      {isOpen && landmark && (
        <Animated.View
          style={[
            styles.textContainer,
            {
              bottom: SCREEN_HEIGHT - BUTTON_Y + TEXT_BOTTOM_OFFSET,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={styles.glowLayer}
            pointerEvents="none"
            onLayout={(e) =>
              setGlowSize({
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              })
            }
          >
            {glowSize ? <GlowRect width={glowSize.w} height={glowSize.h} /> : null}
          </View>

          <View style={styles.textContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {landmark.name}
              </Text>
              {confidenceBadge ? (
                <Text style={styles.confidenceText}>{confidenceBadge}</Text>
              ) : landmark.buildYear ? (
                <Text style={styles.yearText}>{landmark.buildYear} р.</Text>
              ) : null}
            </View>

            <Text style={styles.cardDescription}>
              {truncate(landmark.description)}{' '}
              <Text style={styles.aiLinkText} onPress={handleOpenAiGuide}>
                Дізнатися більше...
              </Text>
            </Text>

            {landmark.architectureStyle ? (
              <Text style={styles.styleText} numberOfLines={1}>
                {landmark.architectureStyle}
                {landmark.buildYear ? ` • ${landmark.buildYear} р.` : ''}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      )}

      {landmark && (
        <Animated.View
          style={[
            styles.markerContainer,
            {
              left: BUTTON_X - 19,
              top: BUTTON_Y - 19,
              transform: [{ scale: pinScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handlePinPress}
            activeOpacity={0.8}
            style={[
              styles.pinButton,
              isOpen && styles.pinButtonActive,
            ]}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.churchIconWrapper}>
                <View style={styles.churchCrossV} />
                <View style={styles.churchCrossH} />
                <View style={styles.churchDome} />
                <View style={styles.churchBase}>
                  <View style={styles.churchDoor} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.footerWrapper}>
        <FooterNav
          navigation={navigation}
          leftTabLabel="SITES"
          leftTabTarget="Landmarks"
          rightTabLabel="MAP"
          rightTabTarget="Map"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  cameraFallbackText: {
    color: '#EFE3C3',
    fontSize: 14,
  },
  topHeaderBar: {
    height: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: COLORS.primaryGreen,
    width: '100%',
    zIndex: 10,
  },
  liveBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    left: 14,
    right: 14,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20, 35, 27, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 227, 195, 0.35)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  liveDotMatched: {
    backgroundColor: '#4ADE80',
  },
  liveDotScanning: {
    backgroundColor: '#FBBF24',
  },
  liveBadgeText: {
    color: '#EFE3C3',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  reticleRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 227, 195, 0.45)',
    borderStyle: 'dashed',
    zIndex: 20,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  markerContainer: {
    position: 'absolute',
    zIndex: 35,
  },
  pinButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryGreen,
    borderWidth: 1.8,
    borderColor: '#EFE3C3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  pinButtonActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1E3328',
    transform: [{ scale: 1.08 }],
  },
  churchIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  churchCrossV: {
    width: 1.6,
    height: 4,
    backgroundColor: '#FFFFFF',
  },
  churchCrossH: {
    position: 'absolute',
    top: 1.2,
    width: 4.5,
    height: 1.4,
    backgroundColor: '#FFFFFF',
  },
  churchDome: {
    width: 9,
    height: 6,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#FFFFFF',
    marginTop: 0.5,
  },
  churchBase: {
    width: 13,
    height: 7.5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  churchDoor: {
    width: 4,
    height: 4.5,
    backgroundColor: COLORS.primaryGreen,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  textContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: '68%',
    maxWidth: 225,
    zIndex: 30,
  },
  glowLayer: {
    position: 'absolute',
    top: -GLOW_SPREAD_Y,
    bottom: -GLOW_SPREAD_Y,
    left: -GLOW_SPREAD_X,
    right: -GLOW_SPREAD_X,
  },
  textContent: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
    marginRight: 6,
  },
  yearText: {
    fontSize: 10,
    color: '#E0A96D',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  confidenceText: {
    fontSize: 10,
    color: '#4ADE80',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontSize: 11,
    color: '#F0F0F0',
    lineHeight: 14,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  styleText: {
    fontSize: 9.5,
    color: '#C5D0C9',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  aiLinkText: {
    color: '#FFD39B',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  },
});