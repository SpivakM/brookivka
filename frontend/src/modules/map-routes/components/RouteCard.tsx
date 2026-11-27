import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';
import { BackendLandmark } from '../screens/MapScreen';

export type RouteItem = {
  id: string;
  title: string;
  distance: string;
  duration: string;
  rating?: string;
  waypoints?: BackendLandmark[];
  isPreset?: boolean;
};

interface RouteCardProps {
  item: RouteItem;
  onPress?: (item: RouteItem) => void;
  onInspect?: (item: RouteItem) => void;
  onEdit?: (item: RouteItem) => void;
  onDelete?: (id: string) => void;
}

export const RouteCard = React.memo(
  ({ item, onPress, onInspect, onEdit, onDelete }: RouteCardProps) => {
    const { colors, themeMode } = useTheme();

    return (
      <TouchableOpacity
        style={[
          styles.routeItem,
          { backgroundColor: themeMode === 'dark' ? colors.card : COLORS.backgroundPergament },
        ]}
        activeOpacity={0.85}
        onPress={() => onPress?.(item)}
      >
        {/* Єдина іконка маршруту замість фотографій */}
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>🧭</Text>
        </View>

        <View style={styles.routeInfo}>
          <Text style={[styles.routeTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.routeMeta}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.distance}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.duration}</Text>
            {item.waypoints && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                • {item.waypoints.length} точок
              </Text>
            )}
            {item.rating && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>★ {item.rating}</Text>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onInspect && item.waypoints && item.waypoints.length > 0 && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onInspect(item)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityLabel="Схема маршруту"
            >
              <Text style={styles.actionIcon}>📋</Text>
            </TouchableOpacity>
          )}

          {onEdit && !item.isPreset && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onDelete(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
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
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 90, 43, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.borderBronze,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionIcon: {
    fontSize: 15,
  },
});