import React, { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Linking,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext'; // 1. Імпорт контексту теми

type RecognitionFrequency = 'eco' | 'normal' | 'manual';
type SearchRadius = 100 | 300 | 500 | 1000;

export const SettingsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // 2. Отримуємо поточну тему, функцію її зміни та палітру кольорів
    const { themeMode, setThemeMode, colors } = useTheme();

    const [language, setLanguage] = useState<'UK' | 'EN'>('UK');
    const [recognitionFreq, setRecognitionFreq] = useState<RecognitionFrequency>('normal');
    const [searchRadius, setSearchRadius] = useState<SearchRadius>(300);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleOpenSystemPermissions = async () => {
        try {
            await Linking.openSettings();
        } catch {
            Alert.alert(
                'Помилка',
                'Не вдалося відкрити системні налаштування пристрою.'
            );
        }
    };

    const handleSupportPress = async () => {
        const email = 'support@brookivka.app';
        const subject = encodeURIComponent('Brookivka — Підтримка');
        const url = `mailto:${email}?subject=${subject}`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert(
                'Підтримка Brookivka',
                `Напишіть нам на пошту: ${email}`
            );
        }
    };

    const handleRateApp = () => {
        Alert.alert(
            'Оцінити Brookivka',
            'Подобається досліджувати місто з нами? Залиште відгук!',
            [
                { text: 'Пізніше', style: 'cancel' },
                {
                    text: 'Оцінити',
                    onPress: () => { },
                },
            ]
        );
    };

    return (
        // 3. Підставляємо colors.background для фону екрана
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Кастомна шапка у стилі HeaderNav */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.headerBg,
                        paddingTop: insets.top + 8,
                        paddingBottom: 20,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
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
                    <Text style={styles.titleText}>Налаштування</Text>
                </View>

                <View style={styles.placeholderButton} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 24 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Секція 1: Інтерфейс */}
                <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                    ІНТЕРФЕЙС
                </Text>
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                    ]}
                >
                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                                Мова застосунку
                            </Text>
                            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                                Мова інтерфейсу, описів та AI-гіда
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.segmentedControl,
                                { backgroundColor: colors.inputBg },
                            ]}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.segmentBtn,
                                    language === 'UK' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setLanguage('UK')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        language === 'UK' && styles.segmentTextActive,
                                    ]}
                                >
                                    UA
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segmentBtn,
                                    language === 'EN' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setLanguage('EN')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        language === 'EN' && styles.segmentTextActive,
                                    ]}
                                >
                                    EN
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                                Тема оформлення
                            </Text>
                            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                                Світла або темна палітра екранів
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.segmentedControl,
                                { backgroundColor: colors.inputBg },
                            ]}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.segmentBtn,
                                    themeMode === 'dark' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setThemeMode('dark')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        themeMode === 'dark' && styles.segmentTextActive,
                                    ]}
                                >
                                    Темна
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segmentBtn,
                                    themeMode === 'light' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setThemeMode('light')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        themeMode === 'light' && styles.segmentTextActive,
                                    ]}
                                >
                                    Світла
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Секція 2: AI-сканер та Радар */}
                <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                    AI-СКАНЕР ТА РАДАР
                </Text>
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                    ]}
                >
                    {/* Частота AI-розпізнавання */}
                    <View style={styles.columnRow}>
                        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                            Частота AI-розпізнавання
                        </Text>
                        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                            {recognitionFreq === 'eco' &&
                                'Економний — зберігає заряд під час довгих прогулянок'}
                            {recognitionFreq === 'normal' &&
                                'Звичайний — баланс швидкості та витрати батареї'}
                            {recognitionFreq === 'manual' &&
                                'Тільки по натисканню — мінімальне навантаження на батарею'}
                        </Text>

                        <View
                            style={[
                                styles.fullWidthSegmented,
                                { backgroundColor: colors.inputBg },
                            ]}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.equalSegmentBtn,
                                    recognitionFreq === 'eco' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setRecognitionFreq('eco')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        recognitionFreq === 'eco' && styles.segmentTextActive,
                                    ]}
                                >
                                    3 сек
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.equalSegmentBtn,
                                    recognitionFreq === 'normal' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setRecognitionFreq('normal')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        recognitionFreq === 'normal' && styles.segmentTextActive,
                                    ]}
                                >
                                    1.5 сек
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.equalSegmentBtn,
                                    recognitionFreq === 'manual' && styles.segmentBtnActive,
                                ]}
                                onPress={() => setRecognitionFreq('manual')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: colors.textSecondary },
                                        recognitionFreq === 'manual' && styles.segmentTextActive,
                                    ]}
                                >
                                    Вручну
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                    {/* Радіус пошуку пам'яток поруч */}
                    <View style={styles.columnRow}>
                        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                            Радіус пошуку пам'яток поруч
                        </Text>
                        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                            Визначає, які об'єкти підтягуються на радар та карту
                        </Text>

                        <View
                            style={[
                                styles.fullWidthSegmented,
                                { backgroundColor: colors.inputBg },
                            ]}
                        >
                            {([100, 300, 500, 1000] as SearchRadius[]).map((radius) => {
                                const isActive = searchRadius === radius;
                                const label = radius === 1000 ? '1 км' : `${radius} м`;

                                return (
                                    <TouchableOpacity
                                        key={radius}
                                        style={[
                                            styles.equalSegmentBtn,
                                            isActive && styles.segmentBtnActive,
                                        ]}
                                        onPress={() => setSearchRadius(radius)}
                                    >
                                        <Text
                                            style={[
                                                styles.segmentText,
                                                { color: colors.textSecondary },
                                                isActive && styles.segmentTextActive,
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Секція 3: Сповіщення та система */}
                <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                    СПОВІЩЕННЯ ТА СИСТЕМА
                </Text>
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                    ]}
                >
                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                                Сповіщення
                            </Text>
                            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                                Повідомлення про цікаві локації поруч
                            </Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{
                                false: themeMode === 'dark' ? '#3A4A40' : '#C8C1B4',
                                true: COLORS.buttonBrown,
                            }}
                            thumbColor={notificationsEnabled ? '#E0D0B0' : '#F4F1EA'}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                    <TouchableOpacity
                        style={styles.row}
                        activeOpacity={0.7}
                        onPress={handleOpenSystemPermissions}
                    >
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                                Системні дозволи
                            </Text>
                            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                                Доступ до камери та геолокації
                            </Text>
                        </View>
                        <Text style={[styles.arrowText, { color: colors.accentGold }]}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Секція 4: Зворотний зв'язок та інформація */}
                <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>
                    ПІДТРИМКА ТА ПРО ЗАСТОСУНОК
                </Text>
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.row}
                        activeOpacity={0.7}
                        onPress={handleSupportPress}
                    >
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                                Підтримка
                            </Text>
                            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                                Повідомити про помилку або запропонувати ідею
                            </Text>
                        </View>
                        <Text style={[styles.arrowText, { color: colors.accentGold }]}>›</Text>
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                    <TouchableOpacity
                        style={styles.row}
                        activeOpacity={0.7}
                        onPress={handleRateApp}
                    >
                        <View style={styles.rowInfo}>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                                Оцінити застосунок
                            </Text>
                            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                                Підтримати команду Brookivka відгуком
                            </Text>
                        </View>
                        <Text style={[styles.arrowText, { color: colors.accentGold }]}>›</Text>
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                            Версія Brookivka
                        </Text>
                        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
                            1.0.0
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
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
    titleText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    placeholderButton: {
        width: 42,
        height: 42,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 4,
        opacity: 0.9,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        marginBottom: 22,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    columnRow: {
        paddingVertical: 14,
    },
    rowInfo: {
        flex: 1,
        paddingRight: 12,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    rowDescription: {
        fontSize: 12,
        marginTop: 3,
        lineHeight: 16,
    },
    divider: {
        height: 1,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 3,
        borderWidth: 1,
        borderColor: COLORS.borderBronze,
    },
    fullWidthSegmented: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 3,
        borderWidth: 1,
        borderColor: COLORS.borderBronze,
        marginTop: 12,
    },
    segmentBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    equalSegmentBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 6,
    },
    segmentBtnActive: {
        backgroundColor: COLORS.buttonBrown,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: COLORS.white,
    },
    arrowText: {
        fontSize: 22,
        fontWeight: '600',
        paddingLeft: 8,
    },
    versionText: {
        fontSize: 14,
    },
});