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
  PanResponder,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Rect } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { FooterNav } from '../../../shared/components/FooterNav';
import { COLORS } from '../../../shared/constants/theme';
import { LandmarkDetailModal } from '../../landmarks/components/LandmarkDetailModal';
import { Landmark } from '../../landmarks/components/LandmarkCard';
import {
  matchLandmarkByPhoto,
  RecognizedLandmark,
} from '../services/recognitionApi';

interface ARScannerScreenProps {
  navigation?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LVIV_FALLBACK_COORDS = {
  latitude: 49.8412,
  longitude: 24.0308,
  accuracy: 600,
};

const ARC_RX = Math.round(SCREEN_WIDTH * 0.86);
const TOP_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 32;

const SWIPE_OPEN_DX = -42;
const SWIPE_DIAGONAL_DX = -26;
const SWIPE_DIAGONAL_DY = 26;

function isWithinLviv(lat: number, lng: number): boolean {
  const dLat = Math.abs(lat - LVIV_FALLBACK_COORDS.latitude);
  const dLng = Math.abs(lng - LVIV_FALLBACK_COORDS.longitude);
  return dLat < 0.25 && dLng < 0.35;
}

const SymmetricChurchIcon: React.FC = () => (
  <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.5V6.5M10.2 4.3H13.8"
      stroke="#FFFFFF"
      strokeWidth={1.9}
      strokeLinecap="round"
    />
    <Path
      d="M7.5 11.5C7.5 8.8 9.5 6.8 12 6.8C14.5 6.8 16.5 8.8 16.5 11.5H7.5Z"
      fill="#FFFFFF"
    />
    <Rect x={5.5} y={12.3} width={13} height={8.2} rx={1.2} fill="#FFFFFF" />
    <Path
      d="M10.1 20.5V16.7C10.1 15.65 10.95 14.8 12 14.8C13.05 14.8 13.9 15.65 13.9 16.7V20.5H10.1Z"
      fill={COLORS.primaryGreen}
    />
  </Svg>
);

const CornerArcShadow: React.FC<{ rx: number; ry: number }> = ({ rx, ry }) => (
  <Svg width={rx} height={ry} viewBox={`0 0 ${rx} ${ry}`}>
    <Defs>
      <RadialGradient
        id="cornerArcGrad"
        cx="100%"
        cy="0%"
        rx="100%"
        ry="100%"
        fx="100%"
        fy="0%"
      >
        <Stop offset="0%" stopColor="#070D0A" stopOpacity={0.70} />
        <Stop offset="48%" stopColor="#0A120E" stopOpacity={0.60} />
        <Stop offset="76%" stopColor="#0A120E" stopOpacity={0.35} />
        <Stop offset="100%" stopColor="#0A120E" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Path
      d={`M ${rx} 0 L 0 0 A ${rx} ${ry} 0 0 0 ${rx} ${ry} Z`}
      fill="url(#cornerArcGrad)"
    />
  </Svg>
);

export const ARScannerScreen: React.FC<ARScannerScreenProps> = ({ navigation }) => {
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [detailLandmark, setDetailLandmark] = useState<Landmark | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [liveFrameStatus, setLiveFrameStatus] = useState<string>('Ініціалізація камери...');
  const [confidenceBadge, setConfidenceBadge] = useState<string | null>(null);
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(true);
  const [appActive, setAppActive] = useState<boolean>(AppState.currentState === 'active');
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

  const cameraRef = useRef<Camera>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pinScaleAnim = useRef(new Animated.Value(0)).current;
  const coordsRef = useRef(LVIV_FALLBACK_COORDS);
  const isScanningRef = useRef(false);
  const isOpenRef = useRef(false);
  const missCountRef = useRef(0);
  const landmarkRef = useRef<Landmark | null>(null);
  landmarkRef.current = landmark;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const isCameraActive = Boolean(hasPermission && device && isScreenFocused && appActive);

  const BUTTON_X = SCREEN_WIDTH * 0.5;
  const BUTTON_Y = SCREEN_HEIGHT * 0.52;

  const dynamicRy =
    contentHeight > 0
      ? Math.max(Math.round(contentHeight * 1.52), Math.round(SCREEN_WIDTH * 0.65))
      : Math.round(SCREEN_WIDTH * 0.98);

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
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
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
            () => { },
            { enableHighAccuracy: false, timeout: 4000, maximumAge: 30000 }
          );
        }
      } catch { }
    };

    initLocation();
  }, [hasPermission, requestPermission]);

  const openOverlay = useCallback(() => {
    swipeOffset.setValue({ x: 0, y: 0 });
    setIsOpen(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, swipeOffset]);

  const closeOverlay = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      swipeOffset.setValue({ x: 0, y: 0 });
      setIsOpen(false);
    });
  }, [fadeAnim, swipeOffset]);

  const toggleOverlay = () => {
    if (!landmark) return;
    if (isOpen) {
      closeOverlay();
    } else {
      openOverlay();
    }
  };

  const openLandmarkDetails = useCallback(() => {
    const current = landmarkRef.current;
    if (!current) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(swipeOffset, {
        toValue: { x: -45, y: 20 },
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      swipeOffset.setValue({ x: 0, y: 0 });
      navigation?.navigate('AIGuide', {
        landmarkId: String(current.id),
        landmarkName: current.name,
        initialContext: current.fullDescription || current.description,
        imageUri: current.photoUrl || undefined,
      });
    });
  }, [fadeAnim, swipeOffset, navigation]);

  const openLandmarkDetailsRef = useRef(openLandmarkDetails);
  openLandmarkDetailsRef.current = openLandmarkDetails;

  const arcPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isLeftSwipe = gestureState.dx < -8;
        const isDiagonalLeftDown = gestureState.dx < -6 && gestureState.dy > 6;
        return isLeftSwipe || isDiagonalLeftDown;
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedX = Math.min(0, Math.max(-70, gestureState.dx * 0.45));
        const clampedY = Math.max(0, Math.min(45, gestureState.dy * 0.35));
        swipeOffset.setValue({ x: clampedX, y: clampedY });
      },
      onPanResponderRelease: (_, gestureState) => {
        const triggeredLeft =
          gestureState.dx <= SWIPE_OPEN_DX || gestureState.vx <= -0.45;
        const triggeredDiagonal =
          gestureState.dx <= SWIPE_DIAGONAL_DX && gestureState.dy >= SWIPE_DIAGONAL_DY;

        if (triggeredLeft || triggeredDiagonal) {
          openLandmarkDetailsRef.current();
        } else {
          Animated.spring(swipeOffset, {
            toValue: { x: 0, y: 0 },
            damping: 20,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const runRecognitionFrame = useCallback(
    async (manual = false) => {
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
          setLiveFrameStatus(`Знайдено: ${resolvedLandmark.name} (${pct}%)`);
          if (manual) {
            openOverlay();
          }
        } else {
          missCountRef.current += 1;
          setLiveFrameStatus('Наведіть камеру на пам’ятку');
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
        setLiveFrameStatus('Немає зв’язку з сервером');
      } finally {
        isScanningRef.current = false;
        if (manual) {
          setScanning(false);
        }
      }
    },
    [isCameraActive, isCameraReady, openOverlay]
  );

  useEffect(() => {
    if (!isCameraActive || !isCameraReady) return;

    setLiveFrameStatus('Наведіть камеру на пам’ятку');

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

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />

      {/* Живий потік камери з Vision Camera */}
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
            onError={(e) => setLiveFrameStatus(`Камера: ${e.message}`)}
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

      {/* Індикатор живого потоку кадрів */}
      <View style={styles.liveBadge} pointerEvents="none">
        <View
          style={[
            styles.liveDot,
            landmark ? styles.liveDotMatched : styles.liveDotScanning,
          ]}
        />
        <Text style={styles.liveBadgeText} numberOfLines={1}>
          {liveFrameStatus}
        </Text>
      </View>

      {/* Приціл по центру екрана, поки об'єкт не розпізнано */}
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

      {/* Дугоподібна плашка у правому верхньому куті з динамічною висотою та підтримкою свайпу */}
      {isOpen && landmark && (
        <Animated.View
          {...arcPanResponder.panHandlers}
          pointerEvents="box-none"
          style={[
            styles.arcOverlayContainer,
            {
              top: TOP_BAR_HEIGHT,
              width: ARC_RX,
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.shadowWrapper,
              {
                transform: [
                  { translateX: ARC_RX / 2 },
                  { translateY: -dynamicRy / 2 },
                  {
                    scale: swipeOffset.x.interpolate({
                      inputRange: [-70, 0],
                      outputRange: [1.14, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                  { translateX: -ARC_RX / 2 },
                  { translateY: dynamicRy / 2 },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <CornerArcShadow rx={ARC_RX} ry={dynamicRy} />
          </Animated.View>

          <Animated.View
            style={[
              styles.arcTextContent,
              {
                opacity: swipeOffset.x.interpolate({
                  inputRange: [-65, 0],
                  outputRange: [0.35, 1],
                  extrapolate: 'clamp',
                }),
                transform: [
                  { translateX: swipeOffset.x },
                  { translateY: swipeOffset.y },
                ],
              },
            ]}
            onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.cardTitle} numberOfLines={2}>
              {landmark.name}
            </Text>

            {(landmark.buildYear || landmark.architectureStyle || confidenceBadge) && (
              <Text style={styles.metaText} numberOfLines={2}>
                {confidenceBadge ? `${confidenceBadge}` : ''}
                {confidenceBadge && (landmark.buildYear || landmark.architectureStyle) ? ' • ' : ''}
                {landmark.buildYear ? `${landmark.buildYear} р.` : ''}
                {landmark.buildYear && landmark.architectureStyle ? ' • ' : ''}
                {landmark.architectureStyle || ''}
              </Text>
            )}

            <View style={styles.descriptionArcWrapper}>
              <Text style={styles.cardDescription}>
                {landmark.fullDescription || landmark.description}{' '}
                <Text style={styles.aiLinkText} onPress={openLandmarkDetails}>
                  Дізнатися більше...
                </Text>
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Кнопка-пін з'являється тільки коли AI знайшов пам'ятку */}
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
            onPress={toggleOverlay}
            activeOpacity={0.8}
            style={[
              styles.pinButton,
              isOpen && styles.pinButtonActive,
            ]}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <SymmetricChurchIcon />
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

      <LandmarkDetailModal
        landmark={detailLandmark}
        onClose={() => setDetailLandmark(null)}
      />
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
    height: TOP_BAR_HEIGHT,
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
  arcOverlayContainer: {
    position: 'absolute',
    right: 0,
    zIndex: 30,
    alignItems: 'flex-end',
  },
  shadowWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  arcTextContent: {
    width: '100%',
    paddingTop: 34,
    paddingRight: 22,
    paddingLeft: '14%',
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 21,
    letterSpacing: 0.2,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.92)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E6B673',
    textAlign: 'right',
    lineHeight: 15,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  descriptionArcWrapper: {
    width: '100%',
    paddingLeft: '6%',
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#F2EFE8',
    textAlign: 'right',
    lineHeight: 16.5,
    textShadowColor: 'rgba(0, 0, 0, 0.92)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  aiLinkText: {
    color: '#FFD599',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.92)',
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