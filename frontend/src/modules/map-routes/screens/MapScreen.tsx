import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Platform,
  TouchableOpacity,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

import { HeaderWithFilter } from '../../../shared/components/HeaderWithFilter';
import { FooterNav } from '../../../shared/components/FooterNav';
import { RouteCard, RouteItem } from '../components/RouteCard';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';
import { API_CONFIG } from '../../../config/api.config';

export interface BackendLandmark {
  id: number;
  name: string;
  description: string;
  fullDescription?: string;
  architectureStyle?: string;
  buildYear?: number;
  photoUrl?: string;
  category?: string;
  latitude: number;
  longitude: number;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

const LVIV_INITIAL_REGION = {
  latitude: 49.842957,
  longitude: 24.031111,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

// Базова URL адреса бекенду (Android емулятор бачить localhost ПК як 10.0.2.2)
const BACKEND_URL =
  (API_CONFIG as any).baseUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

const LVIV_ROUTES: RouteItem[] = [
  {
    id: '1',
    title: 'Historic Downtown Walk',
    distance: '2.33 km',
    duration: '35 min',
    rating: '4.9',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_yGuOXzdFdT0u1emI3lPiX0zK26AyKB6uvGPdY2Fgqg&s=10',
  },
  {
    id: '2',
    title: 'Austrian Lviv & Architecture',
    distance: '3.10 km',
    duration: '50 min',
    rating: '4.8',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVKVP_YLSt9TUHMAnhFRvvs9b8LwStkJ32BQg9iMsLhA&s=10',
  },
  {
    id: '3',
    title: 'High Castle Hill Climb',
    distance: '1.80 km',
    duration: '40 min',
    rating: '4.7',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFrLZVZGZTinrbwhDEcxf_WaON13v_020Vfq_7cfUe3g&s=10',
  },
  {
    id: '4',
    title: 'Secret Courtyards & Passages',
    distance: '1.50 km',
    duration: '30 min',
    rating: '4.9',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKF12qSB9qloio621ayPXGdRFM3NddY-HNKKzB7b4h9Q&s=10',
  },
  {
    id: '5',
    title: 'Lychakiv Necropolis Trail',
    distance: '2.70 km',
    duration: '1 h 10 min',
    rating: '4.8',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt5dbcrpMPU_zxvcU_LhP7bqK6tmkduUl4vsdt_MvslA&s=10',
  },
];

interface MapScreenProps {
  navigation?: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const { colors, themeMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);

  // Дані з бекенду та геолокація
  const [landmarks, setLandmarks] = useState<BackendLandmark[]>([]);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  // Власний маршрут користувача
  const [customWaypoints, setCustomWaypoints] = useState<BackendLandmark[]>([]);
  const [routeStats, setRouteStats] = useState<{ distance: number; duration: number } | null>(null);

  const mapRef = useRef<MapView>(null);

  // Завантаження пам'яток із Spring Boot бекенду (/api/landmarks/nearby)
  const fetchNearbyLandmarks = async (lat: number, lng: number, radius = 3000) => {
    try {
      setIsLoadingLandmarks(true);
      const response = await fetch(
        `${BACKEND_URL}/api/landmarks/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BackendLandmark[] = await response.json();
      setLandmarks(data);
    } catch (error) {
      console.error('Не вдалося завантажити пам’ятки:', error);
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  // Визначення геолокації та початкове завантаження пам'яток
  useEffect(() => {
    const initLocationAndData = async () => {
      let hasPermission = false;

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else if (Platform.OS === 'ios') {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        hasPermission = auth === 'granted';
      }

      if (hasPermission) {
        Geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(coords);
            fetchNearbyLandmarks(coords.latitude, coords.longitude, 5000);
          },
          (error) => {
            console.warn('Помилка GPS, завантажуємо центр Львова:', error.message);
            fetchNearbyLandmarks(LVIV_INITIAL_REGION.latitude, LVIV_INITIAL_REGION.longitude, 3000);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        // Якщо користувач не дав дозвіл на GPS — все одно показуємо пам'ятки центру Львова
        fetchNearbyLandmarks(LVIV_INITIAL_REGION.latitude, LVIV_INITIAL_REGION.longitude, 3000);
      }
    };

    initLocationAndData();
  }, []);

  // Додавання/видалення пам'ятки з власного маршруту при натисканні на маркер
  const toggleWaypoint = (landmark: BackendLandmark) => {
    setCustomWaypoints((prev) => {
      const exists = prev.some((item) => item.id === landmark.id);
      if (exists) {
        const updated = prev.filter((item) => item.id !== landmark.id);
        if (updated.length === 0) setRouteStats(null);
        return updated;
      }
      return [...prev, landmark];
    });
  };

  const clearCustomRoute = () => {
    setCustomWaypoints([]);
    setRouteStats(null);
  };

  // Пошук за назвою або категорією пам'ятки з бекенду
  const filteredLandmarks = landmarks.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Координати для побудови маршруту
  const routeOrigin =
    userLocation ||
    (customWaypoints.length > 0
      ? { latitude: customWaypoints[0].latitude, longitude: customWaypoints[0].longitude }
      : null);

  const routeDestination =
    customWaypoints.length > 0
      ? {
          latitude: customWaypoints[customWaypoints.length - 1].latitude,
          longitude: customWaypoints[customWaypoints.length - 1].longitude,
        }
      : null;

  const intermediateWaypoints = (
    userLocation ? customWaypoints.slice(0, -1) : customWaypoints.slice(1, -1)
  ).map((w) => ({
    latitude: w.latitude,
    longitude: w.longitude,
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />
      <HeaderWithFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search sites, routes, or areas..."
      />
      <View style={styles.body}>
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.mapImage}
            initialRegion={LVIV_INITIAL_REGION}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={false}
          >
            {/* Маркери пам'яток, отриманих із бази даних */}
            {filteredLandmarks.map((landmark) => {
              const selectedIndex = customWaypoints.findIndex((w) => w.id === landmark.id);
              const isSelected = selectedIndex !== -1;

              return (
                <Marker
                  key={landmark.id.toString()}
                  coordinate={{
                    latitude: landmark.latitude,
                    longitude: landmark.longitude,
                  }}
                  title={
                    isSelected
                      ? `✅ #${selectedIndex + 1}: ${landmark.name}`
                      : `${landmark.name}${landmark.buildYear ? ` (${landmark.buildYear})` : ''}`
                  }
                  description={landmark.description}
                  pinColor={isSelected ? '#2E7D32' : '#B8860B'}
                  onPress={() => toggleWaypoint(landmark)}
                />
              );
            })}

            {/* Прокладання маршруту через Google Directions API */}
            {routeOrigin && routeDestination && customWaypoints.length > 0 && (
              <MapViewDirections
                origin={routeOrigin}
                destination={routeDestination}
                waypoints={intermediateWaypoints}
                apikey={API_CONFIG.googleMapsApiKey}
                mode="WALKING"
                strokeWidth={4}
                strokeColor={COLORS.buttonBrown || '#8B4513'}
                optimizeWaypoints={true}
                onReady={(result) => {
                  setRouteStats({
                    distance: result.distance,
                    duration: result.duration,
                  });
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
                    animated: true,
                  });
                }}
                onError={(errorMessage) => {
                  Alert.alert('Помилка маршруту', errorMessage);
                }}
              />
            )}
          </MapView>

          {/* Індикатор завантаження даних з бекенду */}
          {isLoadingLandmarks && (
            <View style={styles.loaderBadge}>
              <ActivityIndicator size="small" color={COLORS.buttonBrown} />
              <Text style={styles.loaderText}>Завантаження пам'яток...</Text>
            </View>
          )}

          {/* Кнопка PICKED ROUTES */}
          <TouchableOpacity
            style={styles.routesHeader}
            activeOpacity={0.85}
            onPress={() => setIsRoutesOpen((prev) => !prev)}
          >
            <Text style={styles.routesTitle}>PICKED ROUTES</Text>
            <Text style={styles.arrowIcon}>{isRoutesOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Випадаючий список маршрутів */}
          {isRoutesOpen && (
            <View
              style={[
                styles.dropdownContainer,
                {
                  backgroundColor:
                    themeMode === 'dark'
                      ? 'rgba(15, 33, 24, 0.96)'
                      : 'rgba(245, 240, 225, 0.96)',
                },
              ]}
            >
              <FlatList
                data={LVIV_ROUTES}
                renderItem={({ item }) => <RouteCard item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.routesList}
                showsVerticalScrollIndicator={true}
              />
            </View>
          )}

          {/* Нижня панель керування власним маршрутом */}
          {customWaypoints.length > 0 && (
            <View style={styles.customRouteBar}>
              <View style={styles.routeInfo}>
                <Text style={styles.customRouteTitle}>
                  Мій маршрут ({customWaypoints.length} точок)
                </Text>
                {routeStats && (
                  <Text style={styles.customRouteSub}>
                    ~{routeStats.distance.toFixed(1)} км • ~{Math.round(routeStats.duration)} хв пішки
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.clearBtn} onPress={clearCustomRoute}>
                <Text style={styles.clearBtnText}>Очистити</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <FooterNav
        navigation={navigation}
        rightTabLabel="SITES"
        rightTabTarget="Landmarks"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.backgroundPergament,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  mapContainer: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  routesHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.buttonBrown,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(218, 165, 32, 0.6)',
    zIndex: 10,
    shadowColor: COLORS.buttonBrown,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 7,
    elevation: 10,
  },
  routesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  arrowIcon: {
    position: 'absolute',
    right: 16,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    maxHeight: 290,
    backgroundColor: 'rgba(245, 240, 225, 0.96)',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: COLORS.borderBronze,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 10,
    zIndex: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  routesList: {
    gap: 10,
  },
  loaderBadge: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 240, 225, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
    gap: 8,
    elevation: 5,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.buttonBrown,
  },
  customRouteBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(245, 240, 225, 0.96)',
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  routeInfo: {
    flex: 1,
  },
  customRouteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.buttonBrown,
  },
  customRouteSub: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: COLORS.buttonBrown,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});