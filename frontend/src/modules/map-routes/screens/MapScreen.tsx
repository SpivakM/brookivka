import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, StatusBar, Platform } from 'react-native';
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
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    title: 'Austrian Lviv & Architecture',
    distance: '3.10 km',
    duration: '50 min',
    rating: '4.8',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    title: 'High Castle Hill Climb',
    distance: '1.80 km',
    duration: '40 min',
    rating: '4.7',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '4',
    title: 'Secret Courtyards & Passages',
    distance: '1.50 km',
    duration: '30 min',
    rating: '4.9',
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '5',
    title: 'Lychakiv Necropolis Trail',
    distance: '2.70 km',
    duration: '1 h 10 min',
    rating: '4.8',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
  },
];

interface MapScreenProps {
  navigation?: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

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
              uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80',
            }}
            style={styles.mapImage}
          />
        </View>

        <View style={styles.routesCard}>
          <Text style={styles.routesTitle}>PICKED ROUTES</Text>
          <FlatList
            data={LVIV_ROUTES}
            renderItem={({ item }) => <RouteCard item={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.routesList}
            showsVerticalScrollIndicator={false}
          />
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
    gap: 14,
  },
  mapContainer: {
    flex: 1.1,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  routesCard: {
    flex: 0.9,
    backgroundColor: COLORS.backgroundPergament,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 16,
    padding: 12,
  },
  routesTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: 1,
    marginBottom: 8,
  },
  routesList: {
    gap: 10,
  },
});