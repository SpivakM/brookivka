import React, { useState } from 'react';
import { View, StyleSheet, FlatList, StatusBar, Platform } from 'react-native';
import { HeaderWithFilter } from '../../../shared/components/HeaderWithFilter';
import { FooterNav } from '../../../shared/components/FooterNav';
import { LandmarkCard, Landmark } from '../components/LandmarkCard';
import { COLORS } from '../../../shared/constants/theme';

const LVIV_LANDMARKS: Landmark[] = [
  {
    id: '1',
    title: 'Lviv Opera House',
    description: 'Architectural gem of Lviv and grand opera theater',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_yGuOXzdFdT0u1emI3lPiX0zK26AyKB6uvGPdY2Fgqg&s=10',
  },
  {
    id: '2',
    title: 'Rynok Square',
    description: 'Historic heart of the city with Renaissance architecture',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWGY1SdocOFMh02a6ZZZyGhfQ22pO6cVGCeFyFSKOnpA&s=10',
  },
  {
    id: '3',
    title: 'Dominican Cathedral',
    description: 'Magnificent Baroque cathedral with a majestic dome',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-Dy2tUIS2Do-kOJCsCVAuhpL795IHI_Rdp7ycsXB9Vw&s=10',
  },
  {
    id: '4',
    title: 'High Castle Park',
    description: 'Historic park on a hill offering panoramic views of Lviv',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPJbPu60Mx0ln7It5LOPlZXSrL3HcjcJec-IFvb6czjA&s=10',
  },
  {
    id: '5',
    title: 'St. George Cathedral',
    description: 'Masterpiece of Rococo architecture and Greek Catholic hub',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHJWHwmvbgi-i-ACccxNHForha-8Tf81WV-ChjwuTQ0A&s=10',
  },
  {
    id: '6',
    title: 'Boim Chapel',
    description: 'Unique Renaissance chapel with intricate stone carvings',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcf_IAOtqX8FC6jhhSe17Ip4xXvwHUdgagNLt7ZlljxA&s=10',
  },
  {
    id: '7',
    title: 'Lychakiv Cemetery',
    description: 'Historic necropolis museum with breathtaking sculpture art',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEanChlCpoVtRIy6cqRFaFB5slNI_OmeJwRpiD4Fjelg&s=10',
  },
];

interface LandmarksScreenProps {
  navigation?: any;
}

export const LandmarksScreen: React.FC<LandmarksScreenProps> = ({ navigation }) => {
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
        placeholder="Search Landmarks..."
      />

      <View style={styles.body}>
        <FlatList
          data={LVIV_LANDMARKS}
          renderItem={({ item }) => <LandmarkCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={true}
        />
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
  listPadding: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 16,
  },
});