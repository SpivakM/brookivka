import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { HeaderWithFilter } from '../../../shared/components/HeaderWithFilter';
import { FooterNav } from '../../../shared/components/FooterNav';
import { RouteCard, RouteItem } from '../components/RouteCard';
import { COLORS } from '../../../shared/constants/theme';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);

  return (
    <View style={styles.root}>
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
          <Image
            source={{
              uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzLz0kMw4mPQPAhVhK7m6egO6gxBqyf1s8tLBcAcG5Xg&s=10',
            }}
            style={styles.mapImage}
          />

          {/* Інтерактивна кнопка PICKED ROUTES із вираженою підсвіткою/тінню */}
          <TouchableOpacity
            style={styles.routesHeader}
            activeOpacity={0.85}
            onPress={() => setIsRoutesOpen((prev) => !prev)}
          >
            <Text style={styles.routesTitle}>PICKED ROUTES</Text>
            <Text style={styles.arrowIcon}>{isRoutesOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Випадаючий список із заокругленими нижніми кутами та підсвіткою */}
          {isRoutesOpen && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={LVIV_ROUTES}
                renderItem={({ item }) => <RouteCard item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.routesList}
                showsVerticalScrollIndicator={true}
              />
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
    // Окремо залишаємо радіуси карти
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
    borderBottomColor: 'rgba(218, 165, 32, 0.6)', // Тонка золотиста лінія підсвітки кнопки
    zIndex: 10,
    // Нативна підсвітка / тінь в колір кнопки
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
    // Заокруглені нижні кутики
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 10,
    zIndex: 9,
    // Підсвітка та тінь для випадаючого вікна
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  routesList: {
    gap: 10,
  },
});