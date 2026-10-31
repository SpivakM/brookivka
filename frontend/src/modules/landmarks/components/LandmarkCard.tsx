import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/theme';

export type Landmark = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

interface LandmarkCardProps {
  item: Landmark;
}

export const LandmarkCard = React.memo(({ item }: LandmarkCardProps) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.88}>
    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
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
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});