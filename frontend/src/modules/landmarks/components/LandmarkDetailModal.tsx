import React from 'react';
import {
    Modal,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';
import { Landmark } from './LandmarkCard';

interface LandmarkDetailModalProps {
    landmark: Landmark | null;
    onClose: () => void;
}

const FALLBACK_IMAGES: Record<number, string> = {
    1: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIbwwFqXCGRAgiQ9KjqYinRDFLwGsXBojPZ_i3rmeO_w&s=10',
    2: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKdftePnxCJdyyAGJUEz2LPhIFZDVnU_wGc8nd8lXssg&s=10',
    3: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2d3GErGVI_LB_59QsdUyhs6JFotdzCgT_p7xVKJrtaw&s=10',
};

const DEFAULT_IMAGE =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_yGuOXzdFdT0u1emI3lPiX0zK26AyKB6uvGPdY2Fgqg&s=10';

export const LandmarkDetailModal: React.FC<LandmarkDetailModalProps> = ({
    landmark,
    onClose,
}) => {
    const { colors, themeMode } = useTheme();
    const insets = useSafeAreaInsets();

    if (!landmark) return null;

    const imageUrl =
        landmark.photoUrl || FALLBACK_IMAGES[landmark.id] || DEFAULT_IMAGE;
    const detailedText = landmark.fullDescription?.trim() || landmark.description;

    return (
        <Modal
            visible={Boolean(landmark)}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar
                    barStyle="light-content"
                    {...(Platform.OS === 'android' ? { backgroundColor: colors.headerBg } : {})}
                />

                {/* Шапка у фірмовому стилі Brookivka */}
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: colors.headerBg,
                            paddingTop: insets.top + 8,
                            paddingBottom: 16,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.75}
                        onPress={onClose}
                    >
                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                            <Path
                                d="M15 19L8 12L15 5"
                                stroke="#E0D0B0"
                                strokeWidth={2.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </TouchableOpacity>

                    <View style={styles.titleBox}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            Про пам&apos;ятку
                        </Text>
                    </View>

                    <View style={styles.placeholderButton} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Math.max(insets.bottom, 20) + 24 },
                    ]}
                >
                    {/* Фото пам'ятки */}
                    <View style={styles.imageWrapper}>
                        <Image source={{ uri: imageUrl }} style={styles.heroImage} />
                    </View>

                    {/* Основна картка з метаданими та повним описом */}
                    <View
                        style={[
                            styles.infoCard,
                            {
                                backgroundColor:
                                    themeMode === 'dark' ? colors.card : COLORS.backgroundPergament,
                                borderColor: COLORS.borderBronze,
                            },
                        ]}
                    >
                        <Text style={[styles.name, { color: colors.textPrimary }]}>
                            {landmark.name}
                        </Text>

                        {/* Категорія та рік побудови */}
                        {(landmark.category || landmark.buildYear) && (
                            <View style={styles.metaRow}>
                                {landmark.category && (
                                    <View
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor: colors.inputBg,
                                                borderColor: COLORS.borderBronze,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.badgeText,
                                                {
                                                    color:
                                                        themeMode === 'dark'
                                                            ? colors.accentGold
                                                            : COLORS.buttonBrown,
                                                },
                                            ]}
                                        >
                                            {landmark.category}
                                        </Text>
                                    </View>
                                )}

                                {landmark.buildYear && (
                                    <View
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor: colors.inputBg,
                                                borderColor: COLORS.borderBronze,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.badgeText,
                                                {
                                                    color:
                                                        themeMode === 'dark'
                                                            ? colors.accentGold
                                                            : COLORS.buttonBrown,
                                                },
                                            ]}
                                        >
                                            {landmark.buildYear} р.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Архітектурний стиль */}
                        {landmark.architectureStyle && (
                            <View
                                style={[
                                    styles.styleBlock,
                                    { borderColor: colors.borderSubtle },
                                ]}
                            >
                                <Text
                                    style={[styles.sectionLabel, { color: colors.accentGold }]}
                                >
                                    АРХІТЕКТУРНИЙ СТИЛЬ
                                </Text>
                                <Text
                                    style={[styles.styleValue, { color: colors.textPrimary }]}
                                >
                                    {landmark.architectureStyle}
                                </Text>
                            </View>
                        )}

                        {/* Повний опис (fullDescription) */}
                        <Text style={[styles.sectionLabel, { color: colors.accentGold }]}>
                            ІСТОРІЯ ТА ОПИС
                        </Text>
                        <Text style={[styles.fullDescription, { color: colors.textPrimary }]}>
                            {detailedText}
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        elevation: 6,
        shadowColor: '#000000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.35)',
    },
    titleBox: {
        borderWidth: 1.5,
        borderColor: COLORS.borderBronze,
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(15, 33, 24, 0.5)',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    placeholderButton: {
        width: 42,
        height: 42,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    imageWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: COLORS.borderBronze,
        marginBottom: 16,
        backgroundColor: '#E5DEC9',
        elevation: 4,
        shadowColor: COLORS.borderBronze,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    heroImage: {
        width: '100%',
        height: 240,
        resizeMode: 'cover',
    },
    infoCard: {
        borderRadius: 18,
        borderWidth: 1.5,
        padding: 18,
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    styleBlock: {
        paddingVertical: 10,
        marginBottom: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        marginBottom: 6,
    },
    styleValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    fullDescription: {
        fontSize: 15,
        lineHeight: 23,
    },
});