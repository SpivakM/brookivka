import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';

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
  onPress?: () => void;
}

const HARDCODED_IMAGES: Record<number, string> = {
  1: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIbwwFqXCGRAgiQ9KjqYinRDFLwGsXBojPZ_i3rmeO_w&s=10',
  2: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKdftePnxCJdyyAGJUEz2LPhIFZDVnU_wGc8nd8lXssg&s=10',
  3: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2d3GErGVI_LB_59QsdUyhs6JFotdzCgT_p7xVKJrtaw&s=10',
};

const DEFAULT_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_yGuOXzdFdT0u1emI3lPiX0zK26AyKB6uvGPdY2Fgqg&s=10';

export const LandmarkCard = React.memo(({ item, onPress }: LandmarkCardProps) => {
  const { colors, themeMode } = useTheme();
  const imageUrl = item.photoUrl || HARDCODED_IMAGES[item.id] || DEFAULT_IMAGE;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: themeMode === 'dark' ? colors.card : COLORS.backgroundPergament },
      ]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <Image source={{ uri: imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.name}</Text>

        {(item.category || item.buildYear) && (
          <Text
            style={[
              styles.cardSubTitle,
              { color: themeMode === 'dark' ? colors.accentGold : COLORS.buttonBrown },
            ]}
          >
            {item.category ? item.category : ''}
            {item.category && item.buildYear ? ' • ' : ''}
            {item.buildYear ? `${item.buildYear} р.` : ''}
          </Text>
        )}

        {item.architectureStyle && (
          <Text
            style={[
              styles.cardTag,
              { color: themeMode === 'dark' ? colors.accentGold : COLORS.borderBronze },
            ]}
          >
            Стиль: {item.architectureStyle}
          </Text>
        )}

        <Text
          style={[styles.cardDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPergament,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: COLORS.borderBronze,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  cardSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.buttonBrown,
    marginBottom: 2,
  },
  cardTag: {
    fontSize: 11,
    color: COLORS.borderBronze,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
});