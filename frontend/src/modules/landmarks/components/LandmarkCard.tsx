import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';

export type Landmark = {
  id: number;
  name: string;
  description: string;
  fullDescription?: string | null;
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

export const LandmarkCard = React.memo(({ item, onPress }: LandmarkCardProps) => {
  const { colors, themeMode } = useTheme();
  const [imageError, setImageError] = useState(false);

  const normalizedUri = useMemo(() => {
    const raw = item.photoUrl?.trim();
    if (!raw) return null;
    // Android Release блокує http:// без cleartext конфігу, тому форсимо https:// для зовнішніх URL
    if (raw.startsWith('http://') && !raw.includes('localhost') && !raw.includes('10.0.2.2')) {
      return raw.replace(/^http:\/\//i, 'https://');
    }
    return raw;
  }, [item.photoUrl]);

  const hasValidPhoto = Boolean(normalizedUri && !imageError);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: themeMode === 'dark' ? colors.card : COLORS.backgroundPergament },
      ]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {hasValidPhoto ? (
        <Image
          source={{
            uri: normalizedUri!,
            headers: {
              'User-Agent': 'BrookivkaApp/1.0 (Android)',
              Accept: 'image/*,*/*;q=0.8',
            },
          }}
          style={styles.cardImage}
          resizeMode="cover"
          onError={(e) => {
            console.warn(`[LandmarkCard] Image failed for "${item.name}":`, normalizedUri, e.nativeEvent?.error);
            setImageError(true);
          }}
        />
      ) : (
        <View style={[styles.cardImage, styles.placeholderContainer]}>
          <Text style={styles.placeholderText}>Немає фото</Text>
        </View>
      )}

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
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
    padding: 6,
  },
  placeholderText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
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