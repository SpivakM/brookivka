import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';
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
  Keyboard,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import polyline from '@mapbox/polyline';

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

const BACKEND_URL = API_BASE_URL;

// Допоміжний розрахунок приблизної пішохідної відстані між точками (км)
const estimateWalkStats = (points: BackendLandmark[]) => {
  if (points.length < 2) return { distance: '0.5 км', duration: '10 хв' };

  let totalKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dLat = (points[i + 1].latitude - points[i].latitude) * 111;
    const dLng =
      (points[i + 1].longitude - points[i].longitude) *
      111 *
      Math.cos((points[i].latitude * Math.PI) / 180);
    totalKm += Math.sqrt(dLat * dLat + dLng * dLng) * 1.25;
  }

  const minutes = Math.max(5, Math.round((totalKm / 4.5) * 60));
  return {
    distance: `${totalKm.toFixed(1)} км`,
    duration: `${minutes} хв`,
  };
};

// Генерація 3 готових кураторських маршрутів із реальних пам'яток бекенду
const buildPresetRoutes = (allLandmarks: BackendLandmark[]): RouteItem[] => {
  if (allLandmarks.length < 2) return [];

  const presets: RouteItem[] = [];

  const classicWaypoints = allLandmarks.slice(0, Math.min(4, allLandmarks.length));
  if (classicWaypoints.length >= 2) {
    const stats = estimateWalkStats(classicWaypoints);
    presets.push({
      id: 'preset-classic',
      title: 'Класична прогулянка Львовом',
      distance: stats.distance,
      duration: stats.duration,
      rating: '4.9',
      waypoints: classicWaypoints,
      isPreset: true,
    });
  }

  const historicPool = allLandmarks.filter((l) => l.buildYear || l.architectureStyle);
  const historicWaypoints = (historicPool.length >= 2 ? historicPool : allLandmarks.slice(1)).slice(
    0,
    Math.min(3, allLandmarks.length)
  );
  if (historicWaypoints.length >= 2) {
    const stats = estimateWalkStats(historicWaypoints);
    presets.push({
      id: 'preset-architecture',
      title: 'Архітектурна спадщина',
      distance: stats.distance,
      duration: stats.duration,
      rating: '4.8',
      waypoints: historicWaypoints,
      isPreset: true,
    });
  }

  const shortWaypoints =
    allLandmarks.length >= 4
      ? [allLandmarks[allLandmarks.length - 1], allLandmarks[0], allLandmarks[1]]
      : allLandmarks.slice(-2);
  if (shortWaypoints.length >= 2) {
    const stats = estimateWalkStats(shortWaypoints);
    presets.push({
      id: 'preset-express',
      title: 'Швидке знайомство з містом',
      distance: stats.distance,
      duration: stats.duration,
      rating: '4.8',
      waypoints: shortWaypoints,
      isPreset: true,
    });
  }

  return presets;
};

interface MapScreenProps {
  navigation?: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const { colors, themeMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Дані з бекенду та геолокація
  const [landmarks, setLandmarks] = useState<BackendLandmark[]>([]);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  // Власний маршрут користувача та збережені маршрути
  const [customWaypoints, setCustomWaypoints] = useState<BackendLandmark[]>([]);
  const [routeStats, setRouteStats] = useState<{ distance: number; duration: number } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [pickedRoutes, setPickedRoutes] = useState<RouteItem[]>([]);
  const [isOptimalMode, setIsOptimalMode] = useState(false);

  // Модалка редагування назви маршруту
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  // Модалка міні-схеми маршруту (порядок кроків з фото та назвами)
  const [inspectingRoute, setInspectingRoute] = useState<RouteItem | null>(null);

  // Стан фільтрації пам'яток та маршрутів
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onlySelectedOnMap, setOnlySelectedOnMap] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Витягуємо чисті окремі теги без слешів (наприклад, "Ренесанс / Бароко" -> ["Ренесанс", "Бароко"])
  const extractLandmarkTags = (item: BackendLandmark): string[] => {
    const rawValues = [item.category, item.architectureStyle].filter(Boolean) as string[];
    const tags: string[] = [];

    rawValues.forEach((raw) => {
      raw
        .split(/[/,;]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((cleanTag) => {
          if (!tags.includes(cleanTag)) {
            tags.push(cleanTag);
          }
        });
    });

    return tags;
  };

  // Динамічний список чистих категорій із реальних пам'яток бекенду
  const availableCategories = React.useMemo(() => {
    const set = new Set<string>();
    landmarks.forEach((item) => {
      extractLandmarkTags(item).forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [landmarks]);

  const activeFilterCount = selectedCategories.length + (onlySelectedOnMap ? 1 : 0);

  const toggleCategoryFilter = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setOnlySelectedOnMap(false);
  };

  // 3 готові маршрути по реальних пам'ятках для випадаючого пошуку (з урахуванням фільтра)
  const suggestedRoutes = React.useMemo(() => {
    const presets = buildPresetRoutes(landmarks);

    return presets.filter((route) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        route.title.toLowerCase().includes(q) ||
        route.waypoints?.some((wp) => wp.name.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategories.length === 0 ||
        route.waypoints?.some((wp) => {
          const wpTags = extractLandmarkTags(wp);
          return selectedCategories.some((cat) => wpTags.includes(cat));
        });

      return matchesSearch && matchesCategory;
    });
  }, [landmarks, searchQuery, selectedCategories]);

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

  // Запит дозволу на геолокацію та завантаження пам'яток
  useEffect(() => {
    const initLocationAndData = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
      fetchNearbyLandmarks(LVIV_INITIAL_REGION.latitude, LVIV_INITIAL_REGION.longitude, 3000);
    };

    initLocationAndData();
  }, []);

  useEffect(() => {
    const fetchWalkingRoute = async () => {
      if (customWaypoints.length === 0) {
        setRouteCoordinates([]);
        setRouteStats(null);
        return;
      }

      const origin = userLocation || {
        latitude: customWaypoints[0].latitude,
        longitude: customWaypoints[0].longitude,
      };

      const destinationPoint = customWaypoints[customWaypoints.length - 1];
      const destination = {
        latitude: destinationPoint.latitude,
        longitude: destinationPoint.longitude,
      };

      const intermediatesList = userLocation
        ? customWaypoints.slice(0, -1)
        : customWaypoints.slice(1, -1);

      if (
        origin.latitude === destination.latitude &&
        origin.longitude === destination.longitude &&
        intermediatesList.length === 0
      ) {
        setRouteCoordinates([]);
        setRouteStats(null);
        return;
      }

      try {
        const requestBody: any = {
          origin: {
            location: {
              latLng: { latitude: origin.latitude, longitude: origin.longitude },
            },
          },
          destination: {
            location: {
              latLng: { latitude: destination.latitude, longitude: destination.longitude },
            },
          },
          travelMode: 'WALK',
          computeAlternativeRoutes: false,
        };

        if (intermediatesList.length > 0) {
          requestBody.intermediates = intermediatesList.map((wp) => ({
            location: {
              latLng: { latitude: wp.latitude, longitude: wp.longitude },
            },
          }));
          requestBody.optimizeWaypointOrder = isOptimalMode;
        }

        const response = await fetch(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': API_CONFIG.googleMapsApiKey,
              'X-Goog-FieldMask':
                'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex',
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.routes || data.routes.length === 0) {
          const errMsg = data.error?.message || 'Не вдалося побудувати пішохідний маршрут';
          throw new Error(errMsg);
        }

        const route = data.routes[0];
        const encodedPolyline = route.polyline.encodedPolyline;

        const decodedPoints = polyline.decode(encodedPolyline).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));

        setRouteCoordinates(decodedPoints);

        const distanceKm = (route.distanceMeters || 0) / 1000;
        const durationSeconds = parseInt((route.duration || '0s').replace('s', ''), 10);
        const durationMinutes = Math.round(durationSeconds / 60);

        setRouteStats({
          distance: distanceKm,
          duration: durationMinutes,
        });

        if (decodedPoints.length > 0) {
          mapRef.current?.fitToCoordinates(decodedPoints, {
            edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
            animated: true,
          });
        }
      } catch (error: any) {
        console.error('Routes API error:', error);
        Alert.alert('Помилка маршруту', error.message || 'Не вдалося прокласти маршрут');
      }
    };

    fetchWalkingRoute();
  }, [customWaypoints, userLocation, isOptimalMode]);

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
    setRouteCoordinates([]);
  };

  // Перевіряємо, чи поточний набір точок уже збережено у PICKED ROUTES
  const isCurrentRouteSaved =
    customWaypoints.length > 0 &&
    pickedRoutes.some((route) => {
      if (!route.waypoints || route.waypoints.length !== customWaypoints.length) {
        return false;
      }
      return route.waypoints.every((wp, index) => wp.id === customWaypoints[index].id);
    });

  // Відштовхуємося від максимального номера серед поточних незмінених назв "Маршрут №..."
  const getNextRouteNumber = (routes: RouteItem[]) => {
    let maxNumber = 0;

    routes.forEach((r) => {
      const match = r.title.trim().match(/^Маршрут №(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    return maxNumber + 1;
  };

  // Збереження поточного кастомного маршруту як "Маршрут №_" у PICKED ROUTES
  const handleSaveCustomRoute = () => {
    if (customWaypoints.length === 0 || isCurrentRouteSaved) return;

    const distanceStr = routeStats ? `${routeStats.distance.toFixed(1)} км` : '—';
    const durationStr = routeStats ? `${Math.round(routeStats.duration)} хв` : '—';

    setPickedRoutes((prev) => {
      const nextNum = getNextRouteNumber(prev);
      const newRoute: RouteItem = {
        id: `custom-${Date.now()}`,
        title: `Маршрут №${nextNum}`,
        distance: distanceStr,
        duration: durationStr,
        waypoints: [...customWaypoints],
        isPreset: false,
      };
      return [newRoute, ...prev];
    });
    setIsRoutesOpen(true);
  };

  // Вибір маршруту з рекомендованого пошуку -> переміщення в PICKED ROUTES зі своєю назвою
  const handlePickSuggestedRoute = (route: RouteItem) => {
    if (!route.waypoints || route.waypoints.length === 0) return;

    setCustomWaypoints(route.waypoints);
    setPickedRoutes((prev) => {
      const alreadyExists = prev.some((r) => r.id === route.id);
      if (alreadyExists) return prev;
      return [{ ...route }, ...prev];
    });
    setIsSearchOpen(false);
    setIsRoutesOpen(true);
    Keyboard.dismiss();
  };

  // Відкриття збереженого маршруту зі списку PICKED ROUTES на карті
  const handleSelectSavedRoute = (route: RouteItem) => {
    if (route.waypoints && route.waypoints.length > 0) {
      setCustomWaypoints(route.waypoints);
      setIsRoutesOpen(false);
    }
  };

  // Відкрити діалог редагування назви маршруту
  const handleOpenEditRoute = (route: RouteItem) => {
    setEditingRoute(route);
    setEditingTitle(route.title);
  };

  // Зберегти нову назву маршруту
  const handleConfirmEditTitle = () => {
    if (!editingRoute) return;
    const trimmed = editingTitle.trim();
    if (!trimmed) return;

    setPickedRoutes((prev) =>
      prev.map((item) => (item.id === editingRoute.id ? { ...item, title: trimmed } : item))
    );
    setEditingRoute(null);
    setEditingTitle('');
  };

  // Видалення маршруту зі списку PICKED ROUTES
  const handleDeleteSavedRoute = (id: string) => {
    setPickedRoutes((prev) => prev.filter((item) => item.id !== id));
  };

  // Пошук + фільтрація маркерів на карті
  const filteredLandmarks = landmarks.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemTags = extractLandmarkTags(item);
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => itemTags.includes(cat));

    const matchesSelectedOnly =
      !onlySelectedOnMap || customWaypoints.some((wp) => wp.id === item.id);

    return matchesSearch && matchesCategory && matchesSelectedOnly;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />
      <HeaderWithFilter
        searchQuery={searchQuery}
        onSearchChange={(text) => {
          setSearchQuery(text);
          if (!isSearchOpen) setIsSearchOpen(true);
        }}
        placeholder="Search sites, routes, or areas..."
        onFocus={() => {
          setIsSearchOpen(true);
          setIsRoutesOpen(false);
        }}
        onFilterPress={() => {
          setIsFilterOpen(true);
          setIsSearchOpen(false);
          setIsRoutesOpen(false);
        }}
        activeFilterCount={activeFilterCount}
      />

      <View style={styles.body}>
        {/* Випадаючі 3 готові маршрути при натисканні на пошук */}
        {isSearchOpen && (
          <View
            style={[
              styles.searchDropdown,
              {
                backgroundColor:
                  themeMode === 'dark'
                    ? 'rgba(15, 33, 24, 0.98)'
                    : 'rgba(245, 240, 225, 0.98)',
              },
            ]}
          >
            <View style={styles.searchDropdownHeader}>
              <Text style={styles.searchDropdownTitle}>Рекомендовані маршрути</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSearchOpen(false);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.closeSearchText}>✕ Закрити</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={suggestedRoutes}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <RouteCard
                  item={item}
                  onPress={handlePickSuggestedRoute}
                  onInspect={(route) => {
                    setIsSearchOpen(false);
                    Keyboard.dismiss();
                    setInspectingRoute(route);
                  }}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.routesList}
            />
          </View>
        )}

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.mapImage}
            initialRegion={LVIV_INITIAL_REGION}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={false}
            onUserLocationChange={(event) => {
              const coord = event.nativeEvent.coordinate;
              if (coord) {
                setUserLocation({
                  latitude: coord.latitude,
                  longitude: coord.longitude,
                });
              }
            }}
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

            {/* Яскрава лінія маршруту поверх темної карти */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor="#FF9800"
                zIndex={5}
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
            onPress={() => {
              setIsRoutesOpen((prev) => !prev);
              setIsSearchOpen(false);
            }}
          >
            <Text style={styles.routesTitle}>PICKED ROUTES</Text>
            <Text style={styles.arrowIcon}>{isRoutesOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Випадаючий список обраних користувачем маршрутів */}
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
                data={pickedRoutes}
                renderItem={({ item }) => (
                  <RouteCard
                    item={item}
                    onPress={handleSelectSavedRoute}
                    onInspect={(route) => {
                      setIsRoutesOpen(false);
                      setInspectingRoute(route);
                    }}
                    onEdit={handleOpenEditRoute}
                    onDelete={handleDeleteSavedRoute}
                  />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.routesList}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <Text
                    style={{
                      textAlign: 'center',
                      color: colors.textSecondary,
                      paddingVertical: 14,
                      fontSize: 13,
                    }}
                  >
                    Маршрутів ще не обрано!
                  </Text>
                }
              />
            </View>
          )}

          {/* Нижня панель керування власним маршрутом */}
          {customWaypoints.length > 0 && (
            <View style={styles.customRouteBar}>
              <View style={styles.routeInfo}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    setInspectingRoute({
                      id: 'current-preview',
                      title: `Поточний маршрут (${customWaypoints.length} точок)`,
                      distance: routeStats ? `${routeStats.distance.toFixed(1)} км` : '—',
                      duration: routeStats ? `${Math.round(routeStats.duration)} хв` : '—',
                      waypoints: customWaypoints,
                    })
                  }
                >
                  <Text style={styles.customRouteTitle}>
                    Мій маршрут ({customWaypoints.length} точок) ℹ️
                  </Text>
                </TouchableOpacity>

                {routeStats && (
                  <Text style={styles.customRouteSub}>
                    ~{routeStats.distance.toFixed(1)} км • ~{Math.round(routeStats.duration)} хв пішки
                  </Text>
                )}

                {customWaypoints.length >= 2 && (
                  <TouchableOpacity
                    style={styles.optimalToggle}
                    activeOpacity={0.8}
                    onPress={() => setIsOptimalMode((prev) => !prev)}
                  >
                    <Text style={styles.optimalToggleText}>
                      {isOptimalMode ? '☑️ Оптимальний (від GPS)' : '⬜ Оптимальний маршрут'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.routeActions}>
                <TouchableOpacity
                  style={[
                    styles.selectBtn,
                    (!routeStats || isCurrentRouteSaved) && styles.selectBtnDisabled,
                  ]}
                  onPress={handleSaveCustomRoute}
                  disabled={!routeStats || isCurrentRouteSaved}
                >
                  <Text style={styles.clearBtnText}>
                    {isCurrentRouteSaved ? '✓ Збережено' : 'Обрати маршрут'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.trashBtn}
                  onPress={clearCustomRoute}
                  accessibilityLabel="Очистити маршрут"
                >
                  <Text style={styles.trashBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Модальне вікно для редагування назви маршруту */}
      <Modal
        visible={Boolean(editingRoute)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingRoute(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  themeMode === 'dark' ? colors.card : COLORS.backgroundPergament,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Назва маршруту
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.textPrimary,
                  borderColor: COLORS.borderBronze,
                },
              ]}
              value={editingTitle}
              onChangeText={setEditingTitle}
              placeholder="Введіть назву маршруту..."
              placeholderTextColor={COLORS.borderBronze}
              autoFocus={true}
              selectTextOnFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingRoute(null)}
              >
                <Text style={styles.modalCancelText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleConfirmEditTitle}
              >
                <Text style={styles.modalSaveText}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно міні-схеми маршруту (кроки з фото та назвами) */}
      <Modal
        visible={Boolean(inspectingRoute)}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInspectingRoute(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.schemeModalCard,
              {
                backgroundColor:
                  themeMode === 'dark' ? colors.card : COLORS.backgroundPergament,
              },
            ]}
          >
            <View style={styles.schemeHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.schemeTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {inspectingRoute?.title}
                </Text>
                <Text style={styles.schemeSubtitle}>
                  {inspectingRoute?.distance} • {inspectingRoute?.duration} •{' '}
                  {inspectingRoute?.waypoints?.length || 0} локацій
                </Text>
              </View>
              <TouchableOpacity
                style={styles.schemeCloseBtn}
                onPress={() => setInspectingRoute(null)}
              >
                <Text style={styles.schemeCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.schemeScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.schemeListContent}
            >
              {inspectingRoute?.waypoints?.map((wp, index, arr) => {
                const isLast = index === arr.length - 1;
                return (
                  <View key={`${wp.id}-${index}`} style={styles.stepRow}>
                    {/* Ліва колонка: номер кроку та вертикальна з'єднувальна лінія */}
                    <View style={styles.stepTimelineCol}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepCircleText}>{index + 1}</Text>
                      </View>
                      {!isLast && <View style={styles.stepConnectorLine} />}
                    </View>

                    {/* Картка пам'ятки з фото і назвою */}
                    <View
                      style={[
                        styles.stepCard,
                        {
                          backgroundColor:
                            themeMode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(139, 90, 43, 0.08)',
                        },
                      ]}
                    >
                      {wp.photoUrl ? (
                        <Image source={{ uri: wp.photoUrl }} style={styles.stepThumb} />
                      ) : (
                        <View style={[styles.stepThumb, styles.stepThumbFallback]}>
                          <Text style={{ fontSize: 22 }}>🏛️</Text>
                        </View>
                      )}

                      <View style={styles.stepInfo}>
                        <Text style={[styles.stepName, { color: colors.textPrimary }]}>
                          {wp.name}
                        </Text>
                        {(wp.buildYear || wp.architectureStyle) && (
                          <Text style={[styles.stepMeta, { color: colors.textSecondary }]}>
                            {[wp.architectureStyle, wp.buildYear ? `${wp.buildYear} р.` : null]
                              .filter(Boolean)
                              .join(' • ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.schemeApplyBtn}
              onPress={() => {
                if (inspectingRoute && inspectingRoute.id !== 'current-preview') {
                  if (inspectingRoute.isPreset) {
                    handlePickSuggestedRoute(inspectingRoute);
                  } else {
                    handleSelectSavedRoute(inspectingRoute);
                  }
                }
                setInspectingRoute(null);
              }}
            >
              <Text style={styles.schemeApplyText}>Показати на карті</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно фільтрації пам'яток та маршрутів */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  themeMode === 'dark' ? colors.card : COLORS.backgroundPergament,
              },
            ]}
          >
            <View style={styles.filterHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                Фільтр локацій
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.resetFilterText}>Скинути все</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Перемикач показу лише точок поточного маршруту */}
            <TouchableOpacity
              style={[
                styles.filterToggleRow,
                onlySelectedOnMap && styles.filterToggleRowActive,
              ]}
              onPress={() => setOnlySelectedOnMap((prev) => !prev)}
            >
              <Text style={[styles.filterToggleText, { color: colors.textPrimary }]}>
                {onlySelectedOnMap ? '☑️' : '⬜'} Показувати на карті лише точки мого маршруту
              </Text>
            </TouchableOpacity>

            {/* Категорії / стилі з бекенду */}
            {availableCategories.length > 0 && (
              <>
                <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>
                  Категорії та стилі:
                </Text>
                <View style={styles.chipsWrap}>
                  {availableCategories.map((cat) => {
                    const isActive = selectedCategories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                        onPress={() => toggleCategoryFilter(cat)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={[styles.modalButtons, { marginTop: 16 }]}>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => setIsFilterOpen(false)}
              >
                <Text style={styles.modalSaveText}>Застосувати</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  searchDropdown: {
    position: 'absolute',
    top: 6,
    left: 16,
    right: 16,
    maxHeight: 280,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 14,
    padding: 10,
    zIndex: 25,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  searchDropdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.buttonBrown,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  closeSearchText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.buttonBrown,
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
  routeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectBtn: {
    backgroundColor: COLORS.buttonBrown,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectBtnDisabled: {
    opacity: 0.55,
  },
  clearBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  trashBtn: {
    backgroundColor: '#A94442',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashBtnText: {
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
  },
  modalCancelText: {
    color: COLORS.buttonBrown,
    fontWeight: '700',
    fontSize: 13,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.buttonBrown,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  optimalToggle: {
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  optimalToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.buttonBrown,
  },
  schemeModalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    padding: 16,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 90, 43, 0.25)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  schemeTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  schemeSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.buttonBrown,
    marginTop: 3,
  },
  schemeCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(139, 90, 43, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.buttonBrown,
  },
  schemeScroll: {
    maxHeight: 380,
  },
  schemeListContent: {
    paddingVertical: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stepTimelineCol: {
    width: 32,
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.buttonBrown,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  stepConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#FF9800',
    marginVertical: 2,
  },
  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 43, 0.35)',
    borderRadius: 12,
    padding: 8,
    marginLeft: 8,
    marginBottom: 10,
  },
  stepThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#E5DEC9',
  },
  stepThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    marginLeft: 10,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  schemeApplyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.buttonBrown,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  schemeApplyText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A94442',
  },
  filterToggleRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
    marginBottom: 14,
  },
  filterToggleRowActive: {
    backgroundColor: 'rgba(139, 90, 43, 0.14)',
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
  },
  filterChipActive: {
    backgroundColor: COLORS.buttonBrown,
    borderColor: COLORS.buttonBrown,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.buttonBrown,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
});