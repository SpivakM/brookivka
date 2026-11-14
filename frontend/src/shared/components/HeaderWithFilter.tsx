import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

interface HeaderWithFilterProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  activeFilterCount?: number;
}

export const HeaderWithFilter: React.FC<HeaderWithFilterProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  onFilterPress,
  activeFilterCount = 0,
}) => {
  return (
    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={COLORS.borderBronze}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.85}
          onPress={onFilterPress}
        >
          <View style={styles.filterLines}>
            <View style={[styles.fLine, { width: 14 }]} />
            <View style={[styles.fLine, { width: 10 }]} />
            <View style={[styles.fLine, { width: 6 }]} />
          </View>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerSafeArea: {
    backgroundColor: COLORS.primaryGreen,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.footerBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.buttonBrown,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.buttonBrown,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterLines: {
    gap: 3,
    alignItems: 'center',
  },
  fLine: {
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E0D0B0',
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: COLORS.primaryGreen,
    fontSize: 10,
    fontWeight: '800',
  },
});