import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, StatusBar, Platform, ActivityIndicator, Text } from 'react-native';
import { HeaderWithFilter } from '../../../shared/components/HeaderWithFilter';
import { FooterNav } from '../../../shared/components/FooterNav';
import { LandmarkCard, Landmark } from '../components/LandmarkCard';
import { COLORS } from '../../../shared/constants/theme';

// URL бекенду для Android-емулятора (порт 8082)
const API_URL = 'http://192.168.1.179:8082/api/landmarks/nearby';

interface LandmarksScreenProps {
  navigation?: any;
}

export const LandmarksScreen: React.FC<LandmarksScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Координати центру Львова для запиту
    const fetchLandmarks = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}?lat=49.8418&lng=24.0316&radius=1000`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data: Landmark[] = await response.json();
        setLandmarks(data);
      } catch (err: any) {
        console.error('Failed to fetch landmarks:', err);
        setError('Не вдалося завантажити дані з сервера');
      } finally {
        setLoading(false);
      }
    };

    fetchLandmarks();
  }, []);

  // Локальна фільтрація списку за назвою або описом
  const filteredLandmarks = landmarks.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />

      <HeaderWithFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search Landmarks..."
      />

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.borderBronze} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLandmarks}
            renderItem={({ item }) => <LandmarkCard item={item} />}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>

      <FooterNav
        navigation={navigation}
        rightTabLabel="MAP"
        rightTabTarget="Map"
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  listPadding: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 16,
  },
});