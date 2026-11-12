import React, { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';

export const LoginScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors, themeMode } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Заповніть поля', 'Будь ласка, введіть пошту та пароль.');
            return;
        }

        // Тут далі підключиш запит до вашого бекенду / Firebase / Supabase
        Alert.alert(
            'Вітаємо в Brookivka!',
            `Ви успішно увійшли як ${email}`,
            [
                {
                    text: 'Чудово',
                    onPress: () => navigation.navigate('Entry'),
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Верхня панель у стилі HeaderNav */}
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

                <View style={styles.placeholderButton} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 24 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Привітальний блок */}
                <View style={styles.welcomeBlock}>
                    <Text style={[styles.brandTitle, { color: colors.accentGold }]}>
                        BROOKIVKA
                    </Text>
                    <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                        Увійдіть, щоб зберігати улюблені маршрути та історію AR-сканувань
                    </Text>
                </View>

                {/* Форма входу */}
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.borderSubtle,
                        },
                    ]}
                >
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.accentGold }]}>
                            Електронна пошта
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBg,
                                    color: colors.textPrimary,
                                    borderColor: colors.borderSubtle,
                                },
                            ]}
                            placeholder="name@example.com"
                            placeholderTextColor={themeMode === 'dark' ? '#7D8F84' : '#8A8275'}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.accentGold }]}>
                            Пароль
                        </Text>
                        <View
                            style={[
                                styles.passwordWrapper,
                                {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.borderSubtle,
                                },
                            ]}
                        >
                            <TextInput
                                style={[styles.passwordInput, { color: colors.textPrimary }]}
                                placeholder="••••••••"
                                placeholderTextColor={themeMode === 'dark' ? '#7D8F84' : '#8A8275'}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Text style={[styles.eyeText, { color: colors.accentGold }]}>
                                    {showPassword ? 'Сховати' : 'Показати'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.forgotBtn}
                        onPress={() =>
                            Alert.alert(
                                'Відновлення пароля',
                                'Введіть вашу пошту, і ми надішлемо інструкцію для скидання пароля.'
                            )
                        }
                    >
                        <Text style={[styles.forgotText, { color: colors.accentGold }]}>
                            Забули пароль?
                        </Text>
                    </TouchableOpacity>

                    {/* Головна кнопка входу */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        activeOpacity={0.85}
                        onPress={handleLogin}
                    >
                        <Text style={styles.submitButtonText}>Увійти в акаунт</Text>
                    </TouchableOpacity>
                </View>

                {/* Розділювач */}
                <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
                    <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                        або продовжити з
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
                </View>

                {/* Кнопка швидкого входу через Google */}
                <TouchableOpacity
                    style={[
                        styles.socialButton,
                        {
                            backgroundColor:
                                themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : colors.card,
                            borderColor: colors.borderSubtle,
                        },
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                        Alert.alert('Google Auth', 'Тут підключається вхід через Google.')
                    }
                >
                    <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.googleIcon}>
                        <Path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                        />
                        <Path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                        />
                        <Path
                            fill="#FBBC05"
                            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                        />
                        <Path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                        />
                    </Svg>
                    <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>
                        Увійти через Google
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
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
    placeholderButton: {
        width: 42,
        height: 42,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    welcomeBlock: {
        alignItems: 'center',
        marginBottom: 24,
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 3,
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 12,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 18,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    eyeButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    eyeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 18,
    },
    forgotText: {
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    submitButton: {
        backgroundColor: COLORS.buttonBrown,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderBronze,
        marginTop: 4,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        marginHorizontal: 12,
    },
    socialButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 13,
    },
    googleIcon: {
        marginRight: 10,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});