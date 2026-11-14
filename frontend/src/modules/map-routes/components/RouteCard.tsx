import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';

export type RouteItem = {
  id: string;
  title: string;
  distance: string;
  duration: string;
  rating: string;
  imageUrl: string;
};

interface RouteCardProps {
  item: RouteItem;
}

export const RouteCard = React.memo(({ item }: RouteCardProps) => {
  const { colors, themeMode } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.routeItem,
        { backgroundColor: themeMode === 'dark' ? colors.card : COLORS.backgroundPergament },
      ]}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.routeImage} />
      <View style={styles.routeInfo}>
        <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <View style={styles.routeMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.distance}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.duration}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>★ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPergament,
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
    borderRadius: 12,
    padding: 8,
  },
  routeImage: {
    width: 60,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5DEC9',
  },
  routeInfo: {
    flex: 1,
    marginLeft: 10,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  routeMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '600',
  },
});