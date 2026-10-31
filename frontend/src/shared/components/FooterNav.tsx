import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

interface FooterNavProps {
  navigation?: any;
  rightTabLabel?: 'MAP' | 'SITES';
  rightTabTarget?: string;
}

export const FooterNav: React.FC<FooterNavProps> = ({
  navigation,
  rightTabLabel = 'MAP',
  rightTabTarget = 'Map',
}) => {
  const ICON_COLOR = COLORS.iconBronze;

  return (
    <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
      <View style={styles.bottomBar}>
        {/* CAM */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation?.navigate('ARScanner')}
          activeOpacity={0.7}
        >
          <View style={[styles.camIconOuter, { backgroundColor: ICON_COLOR }]}>
            <View style={styles.camIconInner} />
          </View>
          <Text style={[styles.navText, { color: ICON_COLOR }]}>CAM</Text>
        </TouchableOpacity>

        {/* MENU */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation?.navigate('Entry')}
          activeOpacity={0.7}
        >
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
          <Text style={[styles.navText, { color: ICON_COLOR }]}>MENU</Text>
        </TouchableOpacity>

        {/* MAP / SITES */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation?.navigate(rightTabTarget)}
          activeOpacity={0.7}
        >
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
          <Text style={[styles.navText, { color: ICON_COLOR }]}>{rightTabLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  footerSafeArea: {
    backgroundColor: COLORS.footerBackground,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderBronze,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
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
    borderColor: COLORS.footerBackground,
  },
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
});