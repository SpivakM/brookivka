import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface FooterNavProps {
  navigation?: any;
  leftTabLabel?: 'CAM' | 'SITES';
  leftTabTarget?: string;
  rightTabLabel?: 'MAP' | 'SITES';
  rightTabTarget?: string;
}

export const FooterNav: React.FC<FooterNavProps> = ({
  leftTabLabel = 'CAM',
  leftTabTarget = 'ARScanner',
  rightTabLabel = 'MAP',
  rightTabTarget = 'Map',
}) => {
  const navigation = useNavigation<any>();
  const { colors, themeMode } = useTheme();
  const ICON_COLOR = themeMode === 'dark' ? colors.accentGold : COLORS.footerBackground;
  const FOOTER_BG = themeMode === 'dark' ? colors.card : COLORS.primaryGreen;

  // Иконка списка с точками (для MENU)
  const renderListIcon = () => (
    <View style={styles.menuIconContainer}>
      <View style={styles.menuDotRow}>
        <View style={[styles.menuDot, { backgroundColor: ICON_COLOR }]} />
        <View style={[styles.menuLine, { backgroundColor: ICON_COLOR }]} />
      </View>
      <View style={styles.menuDotRow}>
        <View style={[styles.menuDot, { backgroundColor: ICON_COLOR }]} />
        <View style={[styles.menuLine, { backgroundColor: ICON_COLOR }]} />
      </View>
      <View style={styles.menuDotRow}>
        <View style={[styles.menuDot, { backgroundColor: ICON_COLOR }]} />
        <View style={[styles.menuLine, { backgroundColor: ICON_COLOR }]} />
      </View>
    </View>
  );

  // Кастомная иконка церкви (для SITES)
  const renderChurchIcon = () => (
    <View style={styles.churchIconContainer}>
      {/* Крестик */}
      <View style={[styles.churchCrossVertical, { backgroundColor: ICON_COLOR }]} />
      <View style={[styles.churchCrossHorizontal, { backgroundColor: ICON_COLOR }]} />
      {/* Купол */}
      <View style={[styles.churchDome, { backgroundColor: ICON_COLOR }]} />
      {/* Основное здание */}
      <View style={[styles.churchBody, { backgroundColor: ICON_COLOR }]}>
        {/* Дверь / Арка */}
        <View style={[styles.churchDoor, { backgroundColor: FOOTER_BG }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.footerSafeArea, { backgroundColor: FOOTER_BG }]}
    >
      <View style={styles.bottomBar}>
        {/* ЛЕВАЯ КНОПКА (CAM или SITES) */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate(leftTabTarget)}
          activeOpacity={0.7}
        >
          {leftTabLabel === 'CAM' ? (
            <View style={[styles.camIconOuter, { backgroundColor: ICON_COLOR }]}>
              <View style={[styles.camIconInner, { borderColor: FOOTER_BG }]} />
            </View>
          ) : (
            renderChurchIcon()
          )}
          <Text style={[styles.navText, { color: ICON_COLOR }]}>{leftTabLabel}</Text>
        </TouchableOpacity>

        {/* ЦЕНТРАЛЬНАЯ КНОПКА (MENU) */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Entry')}
          activeOpacity={0.7}
        >
          {renderListIcon()}
          <Text style={[styles.navText, { color: ICON_COLOR }]}>MENU</Text>
        </TouchableOpacity>

        {/* ПРАВАЯ КНОПКА (MAP или SITES) */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate(rightTabTarget)}
          activeOpacity={0.7}
        >
          {rightTabLabel === 'MAP' ? (
            <View style={styles.mapIconContainer}>
              <View
                style={[
                  styles.mapSegment,
                  { backgroundColor: ICON_COLOR, transform: [{ skewY: '-12deg' }] },
                ]}
              />
              <View
                style={[
                  styles.mapSegment,
                  { backgroundColor: ICON_COLOR, transform: [{ skewY: '12deg' }] },
                ]}
              />
              <View
                style={[
                  styles.mapSegment,
                  { backgroundColor: ICON_COLOR, transform: [{ skewY: '-12deg' }] },
                ]}
              />
            </View>
          ) : (
            renderChurchIcon()
          )}
          <Text style={[styles.navText, { color: ICON_COLOR }]}>{rightTabLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  footerSafeArea: {
    backgroundColor: COLORS.primaryGreen,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderBronze,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    paddingVertical: 4,
  },
  navText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // CAM
  camIconOuter: {
    width: 32,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camIconInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: COLORS.primaryGreen,
  },
  // MENU
  menuIconContainer: {
    width: 28,
    height: 24,
    justifyContent: 'space-between',
  },
  menuDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  menuDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  menuLine: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  // MAP
  mapIconContainer: {
    width: 30,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapSegment: {
    width: 8,
    height: 22,
    borderRadius: 1.5,
  },
  // CHURCH (SITES)
  churchIconContainer: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  churchCrossVertical: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 6,
    borderRadius: 1,
  },
  churchCrossHorizontal: {
    position: 'absolute',
    top: 1.5,
    width: 5,
    height: 2,
    borderRadius: 1,
  },
  churchDome: {
    width: 12,
    height: 7,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 0,
  },
  churchBody: {
    width: 22,
    height: 11,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  churchDoor: {
    width: 6,
    height: 7,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});