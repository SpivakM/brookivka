import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/theme';

// DTO тип, який точно відповідає JSON з вашого бекенду
export type Landmark = {
  id: number;
  name: string;
  description: string;
  architectureStyle?: string | null;
  buildYear?: number | null;
  photoUrl?: string | null;
  category?: string | null;
  latitude: number;
  longitude: number;
};

interface LandmarkCardProps {
  item: Landmark;
}

// Заглушка, якщо з бекенду photoUrl приходить null
const FALLBACK_IMAGE = 'https://via.placeholder.com/150';

export const LandmarkCard = React.memo(({ item }: LandmarkCardProps) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.88}>
    <Image 
      source={{ uri: item.photoUrl || FALLBACK_IMAGE }} 
      style={styles.cardImage} 
    />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      {item.category && (
        <Text style={styles.cardSubTitle}>
          {item.category} {item.buildYear ? `• ${item.buildYear} р.` : ''}
        </Text>
      )}
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </View>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPergament,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  cardImage: {
    width: 95,
    height: 95,
    borderRadius: 14,
    backgroundColor: '#E5DEC9',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  cardSubTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.borderBronze,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});