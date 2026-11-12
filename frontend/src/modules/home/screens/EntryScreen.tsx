import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { HeaderNav } from '../../../shared/components/HeaderNav';
import { EntryCard } from '../components/EntryCard';
import { COLORS } from '../../../shared/constants/theme';

export const EntryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android'
          ? { translucent: true, backgroundColor: 'transparent' }
          : {})}
      />

      {/* Локальне фонове відео */}
      <Video
        source={require('../../../assets/videos/background_video_1.mp4')}
        style={styles.backgroundMedia}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={1.0}
        ignoreSilentSwitch="obey"
      />

      {/* Напівпрозоре тонування поверх відео */}
      <View style={styles.videoOverlay} />

      {/* 1. Шапка з shared */}
      <HeaderNav
        onSettingsPress={() => console.log('Open Settings')}
        onProfilePress={() => console.log('Open Profile')}
      />

      {/* 2. Контентна частина */}
      <View style={styles.content}>
        {/* Головна картка AR Scanner */}
        <EntryCard
          title="AR Scanner"
          imageSource={require('../../../assets/images/ar_preview.jpg')}
          imageHeight={230}
          onPress={() => navigation.navigate('ARScanner')}
        />

        {/* Нижня сітка з двох карток */}
        <View style={styles.row}>
          <EntryCard
            title="Map"
            imageSource={require('../../../assets/images/map_preview.jpg')}
            imageHeight={100}
            onPress={() => navigation.navigate('Map')}
            style={styles.flexCard}
          />

          <EntryCard
            title="Landmarks"
            imageSource={require('../../../assets/images/landmarks_preview.jpg')}
            imageHeight={100}
            onPress={() => navigation.navigate('Landmarks')}
            style={styles.flexCard}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryGreen,
  },
  backgroundMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(247, 244, 235, 0.45)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  flexCard: {
    flex: 1,
  },
});