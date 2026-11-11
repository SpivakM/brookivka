import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

interface HeaderNavProps {
  onSettingsPress?: () => void;
  onProfilePress?: () => void;
  title?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onSettingsPress,
  onProfilePress,
  title = 'Brookivka',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          paddingBottom: 22,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.headerButton}
        activeOpacity={0.7}
        onPress={onSettingsPress}
      >
        <Text style={styles.headerButtonText}>⚙</Text>
      </TouchableOpacity>

      <View style={styles.titleBox}>
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <TouchableOpacity
        style={styles.profileButton}
        activeOpacity={0.7}
        onPress={onProfilePress}
      >
        <Text style={styles.profileIcon}>👤</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: COLORS.primaryGreen,
    //borderBottomLeftRadius: 18,
    //borderBottomRightRadius: 18,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    //shadowRadius: 6,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  headerButtonText: {
    color: '#E0D0B0',
    fontSize: 20,
  },
  titleBox: {
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 33, 24, 0.5)',
  },
  titleText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.buttonBrown,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  profileIcon: {
    fontSize: 18,
  },
});