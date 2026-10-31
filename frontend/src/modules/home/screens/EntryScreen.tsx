import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export const EntryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { translucent: true, backgroundColor: 'transparent' } : {})}
      />

      {/* Локальне фонове відео */}
      <Video
        source={require('../../../assets/videos/background_video.mp4')}
        style={styles.backgroundMedia}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={1.0}
        ignoreSilentSwitch="obey"
      />

      {/* Напівпрозоре тонування поверх відео */}
      <View style={styles.videoOverlay} />

      {/* 1. Верхня панель (Header) */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 22,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
          onPress={() => console.log('Open Settings')}
        >
          <Text style={styles.headerButtonText}>⚙</Text>
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.titleText}>Brookivka</Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          activeOpacity={0.7}
          onPress={() => console.log('Open Profile')}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Контентна частина: картки по центру */}
      <View style={styles.content}>

        {/* Головна картка AR Scanner */}
        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ARScanner')}
        >
          <View style={styles.mainImageContainer}>
            <Image
              source={require('../../../assets/images/ar_preview.jpg')}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.mainCardTitle}>AR Scanner</Text>
          <Text style={styles.mainCardSubtitle}>Scan for detailed information</Text>
        </TouchableOpacity>

        {/* Нижня сітка з двох карток */}
        <View style={styles.row}>

          {/* Картка Map */}
          <TouchableOpacity
            style={styles.smallCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.smallImageContainer}>
              <Image
                source={require('../../../assets/images/map_preview.jpg')}
                style={styles.smallImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.smallCardTitle}>Map</Text>
          </TouchableOpacity>

          {/* Картка Landmarks */}
          <TouchableOpacity
            style={styles.smallCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Landmarks')}
          >
            <View style={styles.smallImageContainer}>
              <Image
                source={require('../../../assets/images/landmarks_preview.jpg')}
                style={styles.smallImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.smallCardTitle}>Landmarks</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F241A',
  },
  backgroundMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(247, 244, 235, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(20, 46, 33, 0.95)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  headerButtonText: {
    color: '#E0D0B0',
    fontSize: 20,
  },
  titleBox: {
    borderWidth: 1.5,
    borderColor: '#98A895',
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 33, 24, 0.5)',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C59A58',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  profileIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: '#BFA382',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  mainImageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainCardTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1B2E24',
    marginBottom: 3,
  },
  mainCardSubtitle: {
    fontSize: 13,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: '#BFA382',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  smallImageContainer: {
    width: '100%',
    height: 105,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  smallCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2E24',
  },
});