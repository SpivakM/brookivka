import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Camera, CameraType } from 'react-native-camera-kit';
import { FooterNav } from '../../../shared/components/FooterNav';
import { COLORS } from '../../../shared/constants/theme';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

interface ARScannerScreenProps {
  navigation?: any;
}

interface LandmarkDbItem {
  id: number;
  name: string;
  description: string;
  architectureStyle: string;
  buildYear: number;
  photoUrl: string | null;
  category: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// На скільки пікселів затемнення виходить за межі тексту
const GLOW_SPREAD_X = 120; // по боках
const GLOW_SPREAD_Y = 70; // зверху і знизу
const GLOW_INNER_INSET = 18; // наскільки градієнт заходить під сам текст (менше "суцільного" центру)
const GLOW_OPACITY = 0.5; // максимальна темність під текстом

// Гауссоподібний спад: довгий плавний "хвіст", без різкого переходу.
// x = 1 — біля тексту (найтемніше), x = 0 — зовнішній край (0 прозорості).
const GAUSS_K = 3.2;
const smooth = (x: number) => {
  const d = 1 - x;
  const edge = Math.exp(-GAUSS_K);
  return (Math.exp(-GAUSS_K * d * d) - edge) / (1 - edge);
};
const STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

// Скорочує опис, щоб "Дізнатися більше..." стояло в кінці тексту як продовження речення
const truncate = (text: string, max = 90) => {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s.,;:–-]+$/, '') + '…';
};

// Відступ тексту від іконки (радіус 19 * scale 1.08 ≈ 21 + запас)
const TEXT_BOTTOM_OFFSET = 34;

// Стопи для градієнта: від темного (inner) до прозорого (outer)
const renderStops = (fromInner: boolean) =>
  STEPS.map((t) => (
    <Stop
      key={t}
      offset={String(t)}
      stopColor="#000"
      stopOpacity={GLOW_OPACITY * smooth(fromInner ? 1 - t : t)}
    />
  ));

/**
 * Прямокутне м'яке затемнення: суцільний центр + 4 краї (лінійні градієнти)
 * + 4 кути (радіальні градієнти). Усе плавно сходить до нуля.
 */
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
        {/* Краї: від прозорого (зовні) до темного (всередині) */}
        <LinearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">{renderStops(false)}</LinearGradient>
        <LinearGradient id="gBottom" x1="0" y1="1" x2="0" y2="0">{renderStops(false)}</LinearGradient>
        <LinearGradient id="gLeft" x1="0" y1="0" x2="1" y2="0">{renderStops(false)}</LinearGradient>
        <LinearGradient id="gRight" x1="1" y1="0" x2="0" y2="0">{renderStops(false)}</LinearGradient>

        {/* Кути: центр градієнта в кутку, що дотикається до внутрішнього прямокутника */}
        <RadialGradient id="gTL" cx="100%" cy="100%" rx="100%" ry="100%" fx="100%" fy="100%">{renderStops(true)}</RadialGradient>
        <RadialGradient id="gTR" cx="0%" cy="100%" rx="100%" ry="100%" fx="0%" fy="100%">{renderStops(true)}</RadialGradient>
        <RadialGradient id="gBL" cx="100%" cy="0%" rx="100%" ry="100%" fx="100%" fy="0%">{renderStops(true)}</RadialGradient>
        <RadialGradient id="gBR" cx="0%" cy="0%" rx="100%" ry="100%" fx="0%" fy="0%">{renderStops(true)}</RadialGradient>
      </Defs>

      {/* Центр */}
      <Rect x={sx} y={sy} width={innerW} height={innerH} fill="#000" fillOpacity={GLOW_OPACITY} />

      {/* Краї */}
      <Rect x={sx} y={0} width={innerW} height={sy} fill="url(#gTop)" />
      <Rect x={sx} y={H - sy} width={innerW} height={sy} fill="url(#gBottom)" />
      <Rect x={0} y={sy} width={sx} height={innerH} fill="url(#gLeft)" />
      <Rect x={W - sx} y={sy} width={sx} height={innerH} fill="url(#gRight)" />

      {/* Кути */}
      <Rect x={0} y={0} width={sx} height={sy} fill="url(#gTL)" />
      <Rect x={W - sx} y={0} width={sx} height={sy} fill="url(#gTR)" />
      <Rect x={0} y={H - sy} width={sx} height={sy} fill="url(#gBL)" />
      <Rect x={W - sx} y={H - sy} width={sx} height={sy} fill="url(#gBR)" />
    </Svg>
  );
};

export const ARScannerScreen: React.FC<ARScannerScreenProps> = ({ navigation }) => {
  const [landmark, setLandmark] = useState<LandmarkDbItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [glowSize, setGlowSize] = useState<{ w: number; h: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Координати розташування іконки
  const BUTTON_X = SCREEN_WIDTH * 0.5;
  const BUTTON_Y = SCREEN_HEIGHT * 0.44;

  useEffect(() => {
    const fetchLandmarkFromDb = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE_URL}/api/landmarks/nearby?lat=49.8418&lng=24.0316&radius=1000`;
        const res = await fetch(url);
        if (res.ok) {
          const list: LandmarkDbItem[] = await res.json();
          const target = list.find((item) => item.id === 3) || list[0];
          setLandmark(target || null);
        }
      } catch (err) {
        console.error('ARScanner fetch landmark error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandmarkFromDb();
  }, []);

  const toggleOverlay = () => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    } else {
      setIsOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeOverlay = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const handleOpenAiGuide = () => {
    if (!landmark) return;
    navigation?.navigate('AIGuide', {
      landmarkId: landmark.id,
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

      {/* Потік камери */}
      <View style={styles.videoContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType={CameraType.Back}
          flashMode="auto"
          focusMode="off"
        />
      </View>

      <View style={styles.topHeaderBar} />

      {/* Прозора зона для закриття при кліку повз текст */}
      {isOpen && (
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={closeOverlay}
        />
      )}

      {/* Текст з м'яким радіальним затемненням без контурів */}
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
          {/* Затемнення: радіальний градієнт, що плавно сходить нанівець.
              Виходить за межі тексту (відʼємні відступи) і не перехоплює дотики. */}
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

          {/* Текстовий блок */}
          <View style={styles.textContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {landmark.name}
              </Text>
              {landmark.buildYear ? (
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
              </Text>
            ) : null}
          </View>
        </Animated.View>
      )}

      {/* Маленька кругла кнопка 38x38 з церквою */}
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
      </View>

      {/* Футер закріплений знизу */}
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
  topHeaderBar: {
    height: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: COLORS.primaryGreen,
    width: '100%',
    zIndex: 10,
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

  /* Векторна міні-іконка церкви */
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

  /* Контейнер тексту над кнопкою. Без фону і без overflow: hidden,
     щоб затемнення могло виходити за його межі. */
  textContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: '68%',
    maxWidth: 225,
    zIndex: 30,
  },

  /* Шар затемнення: більший за текст на GLOW_SPREAD_X / GLOW_SPREAD_Y */
  glowLayer: {
    position: 'absolute',
    top: -GLOW_SPREAD_Y,
    bottom: -GLOW_SPREAD_Y,
    left: -GLOW_SPREAD_X,
    right: -GLOW_SPREAD_X,
  },

  /* Вміст тексту */
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
  /* Посилання всередині тексту опису, без рамки і фону */
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
