import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../../shared/constants/theme';

interface EntryCardProps {
  title: string;
  subtitle?: string;
  imageSource: ImageSourcePropType;
  onPress: () => void;
  imageHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  title,
  subtitle,
  imageSource,
  onPress,
  imageHeight = 105,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.borderBronze,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryGreen,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
});