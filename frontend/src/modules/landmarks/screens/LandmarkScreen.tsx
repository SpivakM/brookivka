import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { HeaderWithFilter } from '../../../shared/components/HeaderWithFilter';
import { FooterNav } from '../../../shared/components/FooterNav';
import { LandmarkCard, Landmark } from '../components/LandmarkCard';
import { COLORS } from '../../../shared/constants/theme';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

interface LandmarksScreenProps {
  navigation?: any;
}

export const LandmarksScreen: React.FC<LandmarksScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLandmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/landmarks/nearby?lat=49.8418&lng=24.0316&radius=1000`
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

  useEffect(() => {
    fetchLandmarks();
  }, []);

  // Пошукова фільтрація
  const filteredLandmarks = landmarks.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.architectureStyle && item.architectureStyle.toLowerCase().includes(query))
    );
  });

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
            <ActivityIndicator size="large" color={COLORS.buttonBrown} />
            <Text style={styles.loadingText}>Завантаження пам’яток...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLandmarks}>
              <Text style={styles.retryText}>Спробувати знову</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredLandmarks}
            renderItem={({ item }) => <LandmarkCard item={item} />}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Пам’яток не знайдено</Text>
              </View>
            }
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
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    color: 'crimson',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.buttonBrown,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
});