import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';
import {
    ERA_OPTIONS,
    EraOption,
    INITIAL_FILTER_STATE,
    LandmarkFilterState,
    SORT_OPTIONS,
} from '../utils/landmarkFilters';

interface LandmarkFilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: LandmarkFilterState;
    onChangeFilters: (next: LandmarkFilterState) => void;
    availableCategories: string[];
    availableStyles: string[];
    resultsCount: number;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const LandmarkFilterModal: React.FC<LandmarkFilterModalProps> = ({
    visible,
    onClose,
    filters,
    onChangeFilters,
    availableCategories,
    availableStyles,
    resultsCount,
}) => {
    const { colors, themeMode } = useTheme();
    const insets = useSafeAreaInsets();

    const sheetHeightRef = useRef(SCREEN_HEIGHT * 0.75);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const isClosingRef = useRef(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (visible) {
            isClosingRef.current = false;
            translateY.setValue(sheetHeightRef.current);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 240,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [visible, translateY]);

    const dismissWithAnimation = () => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;

        Animated.timing(translateY, {
            toValue: sheetHeightRef.current + 40,
            duration: 190,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            isClosingRef.current = false;
            onCloseRef.current();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dy) > 3 &&
                Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 55 || gestureState.vy > 0.35) {
                    dismissWithAnimation();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        damping: 22,
                        stiffness: 220,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible) return null;

    const backdropOpacity = translateY.interpolate({
        inputRange: [0, SCREEN_HEIGHT * 0.55],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const toggleCategory = (cat: string) => {
        const exists = filters.categories.includes(cat);
        onChangeFilters({
            ...filters,
            categories: exists
                ? filters.categories.filter((c) => c !== cat)
                : [...filters.categories, cat],
        });
    };

    const toggleStyle = (styleName: string) => {
        const exists = filters.styles.includes(styleName);
        onChangeFilters({
            ...filters,
            styles: exists
                ? filters.styles.filter((s) => s !== styleName)
                : [...filters.styles, styleName],
        });
    };

    const toggleEra = (era: EraOption) => {
        if (era === 'all') {
            onChangeFilters({
                ...filters,
                eras: [],
            });
            return;
        }

        const exists = filters.eras.includes(era);
        onChangeFilters({
            ...filters,
            eras: exists
                ? filters.eras.filter((e) => e !== era)
                : [...filters.eras, era],
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            animationType="none"
            onRequestClose={dismissWithAnimation}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdropBg, { opacity: backdropOpacity }]}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={dismissWithAnimation}
                    />
                </Animated.View>

                <Animated.View
                    onLayout={(e) => {
                        sheetHeightRef.current = e.nativeEvent.layout.height;
                    }}
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: colors.card,
                            borderColor: COLORS.borderBronze,
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.dragZone}>
                        <View style={styles.handle} />

                        <View style={styles.headerRow}>
                            <Text style={[styles.title, { color: colors.accentGold }]}>
                                Фільтри та сортування
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* 1. Сортування */}
                        <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                            СОРТУВАННЯ
                        </Text>
                        <View style={styles.chipsWrap}>
                            {SORT_OPTIONS.map((option) => {
                                const active = filters.sortBy === option.key;
                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: active ? COLORS.buttonBrown : colors.inputBg,
                                                borderColor: active ? colors.accentGold : colors.borderSubtle,
                                            },
                                        ]}
                                        onPress={() => onChangeFilters({ ...filters, sortBy: option.key })}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                { color: active ? COLORS.white : colors.textPrimary },
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* 2. Категорії */}
                        {availableCategories.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                                    КАТЕГОРІЇ
                                </Text>
                                <View style={styles.chipsWrap}>
                                    {availableCategories.map((cat) => {
                                        const active = filters.categories.includes(cat);
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.chip,
                                                    {
                                                        backgroundColor: active ? COLORS.buttonBrown : colors.inputBg,
                                                        borderColor: active ? colors.accentGold : colors.borderSubtle,
                                                    },
                                                ]}
                                                onPress={() => toggleCategory(cat)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        { color: active ? COLORS.white : colors.textPrimary },
                                                    ]}
                                                >
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {/* 3. Історичні епохи */}
                        <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                            ЕПОХА ПОБУДОВИ
                        </Text>
                        <View style={styles.chipsWrap}>
                            {ERA_OPTIONS.map((eraItem) => {
                                const active =
                                    eraItem.key === 'all'
                                        ? filters.eras.length === 0
                                        : filters.eras.includes(eraItem.key);
                                return (
                                    <TouchableOpacity
                                        key={eraItem.key}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: active ? COLORS.buttonBrown : colors.inputBg,
                                                borderColor: active ? colors.accentGold : colors.borderSubtle,
                                            },
                                        ]}
                                        onPress={() => toggleEra(eraItem.key)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                { color: active ? COLORS.white : colors.textPrimary },
                                            ]}
                                        >
                                            {eraItem.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* 4. Архітектурні стилі */}
                        {availableStyles.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                                    АРХІТЕКТУРНИЙ СТИЛЬ
                                </Text>
                                <View style={styles.chipsWrap}>
                                    {availableStyles.map((styleName) => {
                                        const active = filters.styles.includes(styleName);
                                        return (
                                            <TouchableOpacity
                                                key={styleName}
                                                style={[
                                                    styles.chip,
                                                    {
                                                        backgroundColor: active ? COLORS.buttonBrown : colors.inputBg,
                                                        borderColor: active ? colors.accentGold : colors.borderSubtle,
                                                    },
                                                ]}
                                                onPress={() => toggleStyle(styleName)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        { color: active ? COLORS.white : colors.textPrimary },
                                                    ]}
                                                >
                                                    {styleName}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View
                        style={[
                            styles.footerRow,
                            {
                                paddingBottom: Math.max(insets.bottom, 24) + 28,
                                borderTopColor:
                                    themeMode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(124, 82, 48, 0.2)',
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={[styles.resetBtn, { borderColor: colors.borderSubtle }]}
                            onPress={() => onChangeFilters(INITIAL_FILTER_STATE)}
                        >
                            <Text style={[styles.resetText, { color: colors.textPrimary }]}>Скинути</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.applyBtn} onPress={dismissWithAnimation}>
                            <Text style={styles.applyText}>Показати ({resultsCount})</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdropBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    backdrop: {
        flex: 1,
    },
    sheet: {
        maxHeight: '84%',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderTopWidth: 1.5,
        paddingHorizontal: 20,
        paddingTop: 4,
    },
    dragZone: {
        paddingTop: 8,
        paddingBottom: 4,
    },
    handle: {
        alignSelf: 'center',
        width: 68,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(158, 105, 56, 0.71)',
        marginBottom: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
    },
    scrollContent: {
        paddingBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        marginTop: 10,
        marginBottom: 8,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    footerRow: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 14,
        borderTopWidth: 1,
    },
    resetBtn: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    resetText: {
        fontSize: 14,
        fontWeight: '600',
    },
    applyBtn: {
        flex: 2,
        backgroundColor: COLORS.buttonBrown,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.borderBronze,
        paddingVertical: 12,
        alignItems: 'center',
    },
    applyText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});