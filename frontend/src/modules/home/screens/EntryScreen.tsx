import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const EntryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: '#1B3B2B' } : {})}
      />

      {/* 1. Верхня панель (Header) */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>S</Text>
        </View>

        <View style={styles.titleBox}>
          <Text style={styles.titleText}>BROOKIVKA</Text>
        </View>

        <View style={styles.profileCircle}>
          <Text style={styles.profileIcon}>👤</Text>
        </View>
      </View>

      {/* 2. Контентна частина */}
      <View style={styles.content}>

        {/* Головна картка AR SCANNER */}
        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ARScanner')}
        >
          <View style={styles.mainImageContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.mainCardTitle}>AR SCANNER</Text>
          <Text style={styles.mainCardSubtitle}>Scan for detailed information</Text>
        </TouchableOpacity>

        {/* Нижня сітка з двох карток */}
        <View style={styles.row}>

          {/* Картка MAP */}
          <TouchableOpacity
            style={styles.smallCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.smallImageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.smallImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.iconPlaceholder}>📍</Text>
            <Text style={styles.smallCardTitle}>MAP</Text>
          </TouchableOpacity>

          {/* Картка LANDMARKS */}
          <TouchableOpacity
            style={styles.smallCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Landmarks')}
          >
            <View style={styles.smallImageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.smallImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.iconPlaceholder}>📋</Text>
            <Text style={styles.smallCardTitle}>LANDMARKS</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B3B2B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1B3B2B',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '700',
  },
  titleBox: {
    borderWidth: 1.5,
    borderColor: '#8A9A86',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C59A58',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#F7F4EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: '#BFA382',
    alignItems: 'center',
    elevation: 4,
  },
  mainImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2E24',
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: '#BFA382',
    alignItems: 'center',
    elevation: 3,
  },
  smallImageContainer: {
    width: '100%',
    height: 95,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    fontSize: 18,
    marginBottom: 2,
  },
  smallCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2E24',
    letterSpacing: 1,
  },
});