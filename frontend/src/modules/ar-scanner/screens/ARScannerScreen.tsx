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
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Rect } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { FooterNav } from '../../../shared/components/FooterNav';
import { COLORS } from '../../../shared/constants/theme';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';
import { useAlert } from '../../../shared/context/AlertContext';
import { LandmarkDetailModal } from '../../landmarks/components/LandmarkDetailModal';
import { Landmark } from '../../landmarks/components/LandmarkCard';

interface ARScannerScreenProps {
  navigation?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ARC_RX = Math.round(SCREEN_WIDTH * 0.68);
const TOP_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 32;

const SWIPE_OPEN_DX = -42;
const SWIPE_DIAGONAL_DX = -26;
const SWIPE_DIAGONAL_DY = 26;

const truncate = (text: string, max = 90) => {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s.,;:–-]+$/, '') + '…';
};

// Симетрична SVG-іконка храму для кружечка
const SymmetricChurchIcon: React.FC = () => (
  <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    {/* Хрест */}
    <Path
      d="M12 2.5V6.5M10.2 4.3H13.8"
      stroke="#FFFFFF"
      strokeWidth={1.9}
      strokeLinecap="round"
    />
    {/* Купол */}
    <Path
      d="M7.5 11.5C7.5 8.8 9.5 6.8 12 6.8C14.5 6.8 16.5 8.8 16.5 11.5H7.5Z"
      fill="#FFFFFF"
    />
    {/* Основа будівлі */}
    <Rect x={5.5} y={12.3} width={13} height={8.2} rx={1.2} fill="#FFFFFF" />
    {/* Симетричні арочні двері */}
    <Path
      d="M10.1 20.5V16.7C10.1 15.65 10.95 14.8 12 14.8C13.05 14.8 13.9 15.65 13.9 16.7V20.5H10.1Z"
      fill={COLORS.primaryGreen}
    />
  </Svg>
);

// Дугоподібне затемнення від правого верхнього кута, що підлаштовується під висоту тексту
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
    {/* Сектор овальної дуги від правого верхнього кута (rx, 0) */}
    <Path
      d={`M ${rx} 0 L 0 0 A ${rx} ${ry} 0 0 0 ${rx} ${ry} Z`}
      fill="url(#cornerArcGrad)"
    />
  </Svg>
);

export const ARScannerScreen: React.FC<ARScannerScreenProps> = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [detailLandmark, setDetailLandmark] = useState<Landmark | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [liveFrameStatus, setLiveFrameStatus] = useState<string>('AI Vision: ініціалізація...');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const frameCounterRef = useRef<number>(0);
  const landmarkRef = useRef<Landmark | null>(null);
  landmarkRef.current = landmark;

  // Vision Camera хуки (НЕ ЗМІНЮВАЛИСЬ)
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const BUTTON_X = SCREEN_WIDTH * 0.5;
  const BUTTON_Y = SCREEN_HEIGHT * 0.44;

  // Динамічний розрахунок висоти овалу на основі розміру тексту
  const dynamicRy =
    contentHeight > 0
      ? Math.max(Math.round(contentHeight * 1.52), Math.round(SCREEN_WIDTH * 0.65))
      : Math.round(SCREEN_WIDTH * 0.98);

  // Запит дозволу на камеру при відкритті екрана (НЕ ЗМІНЮВАЛОСЬ)
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const fetchLandmarkFromDb = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE_URL}/api/landmarks/nearby?lat=49.8418&lng=24.0316&radius=1000`;
        const res = await fetch(url);
        if (res.ok) {
          const list: Landmark[] = await res.json();
          const target =
            list.find((item) => item.name?.toLowerCase().includes('боїм')) || list[0];
          setLandmark(target || null);
        } else {
          showAlert(
            'error',
            'Помилка AR-сканера',
            `Не вдалося отримати дані памʼяток (код ${res.status}).`
          );
        }
      } catch (err) {
        console.error('ARScanner fetch landmark error:', err);
        showAlert(
          'error',
          'Помилка AR-сканера',
          'Не вдалося завантажити дані про памʼятки поруч. Перевірте зʼєднання з сервером.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLandmarkFromDb();
  }, [showAlert]);

  // JS-колбек, куди прилітають дані про живі кадри з нативного потоку камери (НЕ ЗМІНЮВАЛОСЬ)
  const handleLiveFrame = Worklets.createRunOnJS((width: number, height: number) => {
    frameCounterRef.current += 1;
    if (frameCounterRef.current % 30 === 0) {
      setLiveFrameStatus(`AI Live: ${width}×${height} | кадр #${frameCounterRef.current}`);
    }
  });

  // Живий обробник відеопотоку (Frame Processor) (НЕ ЗМІНЮВАЛОСЬ)
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    handleLiveFrame(frame.width, frame.height);
  }, [handleLiveFrame]);

  const toggleOverlay = () => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    } else {
      swipeOffset.setValue({ x: 0, y: 0 });
      setIsOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeOverlay = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      swipeOffset.setValue({ x: 0, y: 0 });
      setIsOpen(false);
    });
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
      setDetailLandmark(current);
    });
  }, [fadeAnim, swipeOffset]);

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

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />

      {/* Живий потік камери з Vision Camera (НЕ ЗМІНЮВАЛОСЬ) */}
      <View style={styles.videoContainer}>
        {hasPermission && device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
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

      {/* Індикатор живого потоку кадрів для перевірки */}
      <View style={styles.liveBadge} pointerEvents="none">
        <View style={styles.liveDot} />
        <Text style={styles.liveBadgeText}>{liveFrameStatus}</Text>
      </View>

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
          {/* Затемнення завжди приклеєне до правого верхнього кута і не відривається при свайпі */}
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

          {/* Зсувається за пальцем лише текстовий блок */}
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
            {/* 1. Назва пам'ятки */}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {landmark.name}
            </Text>

            {/* 2. Дата та стиль під назвою */}
            {(landmark.buildYear || landmark.architectureStyle) && (
              <Text style={styles.metaText} numberOfLines={2}>
                {landmark.buildYear ? `${landmark.buildYear} р.` : ''}
                {landmark.buildYear && landmark.architectureStyle ? ' • ' : ''}
                {landmark.architectureStyle || ''}
              </Text>
            )}

            {/* 3. Опис уздовж дуги */}
            <View style={styles.descriptionArcWrapper}>
              <Text style={styles.cardDescription}>
                {truncate(landmark.description)}{' '}
                <Text style={styles.aiLinkText} onPress={openLandmarkDetails}>
                  Дізнатися більше...
                </Text>
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      <View style={[styles.markerContainer, { left: BUTTON_X - 19, top: BUTTON_Y - 19 }]}>
        <TouchableOpacity
          onPress={toggleOverlay}
          activeOpacity={0.8}
          style={[
            styles.pinButton,
            isOpen && styles.pinButtonActive,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <SymmetricChurchIcon />
          )}
        </TouchableOpacity>
      </View>

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
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 35, 27, 0.72)',
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
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#EFE3C3',
    fontSize: 11,
    fontWeight: '600',
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
    paddingTop: 16,
    paddingRight: 16,
    paddingLeft: '22%',
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
    paddingLeft: '14%',
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