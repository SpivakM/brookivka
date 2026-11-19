import React, { useState, useEffect, useRef } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { COLORS } from '../../../shared/constants/theme';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useAuth } from '../../../shared/context/AuthContext';
import { useAlert } from '../../../shared/context/AlertContext';

const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const RegisterScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors, themeMode } = useTheme();
    const { user, register, updateProfile, deleteAccount, logout, isLoading } = useAuth();
    const { showAlert } = useAlert();

    const profileScrollRef = useRef<any>(null);
    const registerScrollRef = useRef<any>(null);

    // Поля для реєстрації
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Поля для редагування профілю
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [showEditPassword, setShowEditPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditEmail(user.email);
            setEditPassword('');
        }
    }, [user]);

    const handleRegister = async () => {
        if (!name.trim()) {
            showAlert('error', 'Не вказано імʼя', 'Введіть імʼя — це поле обовʼязкове.');
            return;
        }
        if (name.trim().length > 50) {
            showAlert('error', 'Задовге імʼя', 'Імʼя занадто довге (максимум 50 символів).');
            return;
        }
        if (!email.trim()) {
            showAlert('error', 'Не вказано пошту', 'Введіть електронну пошту — це поле обовʼязкове.');
            return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            showAlert(
                'error',
                'Некоректна пошта',
                'Некоректний формат пошти (приклад: name@example.com).'
            );
            return;
        }
        if (!password.trim()) {
            showAlert('error', 'Не введено пароль', 'Введіть пароль — це поле обовʼязкове.');
            return;
        }
        if (password.length < 6) {
            showAlert(
                'error',
                'Занадто короткий пароль',
                'Пароль занадто короткий (мінімум 6 символів).'
            );
            return;
        }
        if (password.length > 100) {
            showAlert('error', 'Задовгий пароль', 'Пароль занадто довгий (максимум 100 символів).');
            return;
        }

        try {
            await register(name, email, password);
            showAlert(
                'success',
                'Акаунт створено!',
                `Вітаємо в Brookivka, ${name.trim()}!`,
                {
                    confirmText: 'На головну',
                    onConfirm: () => navigation.navigate('Entry'),
                }
            );
        } catch (err: any) {
            showAlert('error', 'Помилка реєстрації', err.message || 'Не вдалося створити акаунт.');
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            showAlert('error', 'Порожнє імʼя', 'Імʼя не може бути порожнім.');
            return;
        }
        if (editName.trim().length > 50) {
            showAlert('error', 'Задовге імʼя', 'Нове імʼя занадто довге (максимум 50 символів).');
            return;
        }
        if (!editEmail.trim()) {
            showAlert('error', 'Порожня пошта', 'Електронна пошта не може бути порожньою.');
            return;
        }
        if (!EMAIL_REGEX.test(editEmail.trim())) {
            showAlert('error', 'Некоректна пошта', 'Некоректний формат нової електронної пошти.');
            return;
        }
        if (editPassword.length > 0) {
            if (!editPassword.trim()) {
                showAlert(
                    'error',
                    'Некоректний пароль',
                    'Новий пароль не може складатися лише з пробілів.'
                );
                return;
            }
            if (editPassword.length < 6) {
                showAlert(
                    'error',
                    'Занадто короткий пароль',
                    'Новий пароль занадто короткий (мінімум 6 символів).'
                );
                return;
            }
            if (editPassword.length > 100) {
                showAlert(
                    'error',
                    'Задовгий пароль',
                    'Новий пароль занадто довгий (максимум 100 символів).'
                );
                return;
            }
        }

        try {
            await updateProfile({
                name: editName.trim(),
                email: editEmail.trim(),
                newPassword: editPassword ? editPassword : undefined,
            });
            setIsEditing(false);
            setEditPassword('');
            showAlert('success', 'Профіль оновлено', 'Усі зміни успішно збережено.');
        } catch (err: any) {
            showAlert('error', 'Помилка збереження', err.message || 'Не вдалося оновити профіль.');
        }
    };

    const handleLogout = () => {
        showAlert(
            'confirm',
            'Вихід із акаунта',
            'Ви дійсно хочете вийти з поточного профілю?',
            {
                confirmText: 'Вийти',
                cancelText: 'Залишитись',
                onConfirm: async () => {
                    setIsEditing(false);
                    await logout();
                },
            }
        );
    };

    const handleDeleteAccount = () => {
        showAlert(
            'confirm',
            'Видалення акаунта',
            'Ви дійсно хочете назавжди видалити свій профіль? Цю дію неможливо скасувати.',
            {
                confirmText: 'Видалити',
                cancelText: 'Скасувати',
                onConfirm: async () => {
                    try {
                        await deleteAccount();
                        setIsEditing(false);
                        showAlert(
                            'success',
                            'Акаунт видалено',
                            'Ваш профіль було остаточно видалено.'
                        );
                    } catch (err: any) {
                        showAlert(
                            'error',
                            'Помилка видалення',
                            err.message || 'Не вдалося видалити акаунт.'
                        );
                    }
                },
            }
        );
    };

    // Якщо користувач уже авторизований — екран профілю з редагуванням та видаленням
    if (user) {
        const initials = user.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return (
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                        onPress={() => navigation.navigate('Entry')}
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
                    ref={profileScrollRef}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + 180 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.welcomeBlock}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials || '👤'}</Text>
                        </View>
                        <Text
                            style={[styles.brandTitle, { color: colors.accentGold, letterSpacing: 1 }]}
                        >
                            {user.name}
                        </Text>
                        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                            {user.email}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.borderSubtle,
                            },
                        ]}
                    >
                        {!isEditing ? (
                            <>
                                <Text style={[styles.profileStatusTitle, { color: colors.accentGold }]}>
                                    Статус профілю мандрівника
                                </Text>
                                <Text style={[styles.profileStatusDesc, { color: colors.textPrimary }]}>
                                    Ваш акаунт активний. Усі збережені маршрути та AR-відкриття синхронізуються з вашим профілем.
                                </Text>

                                <TouchableOpacity
                                    style={[styles.submitButton, { marginBottom: 12 }]}
                                    activeOpacity={0.85}
                                    onPress={() => setIsEditing(true)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.submitButtonText}>Редагувати профіль</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.secondaryActionBtn,
                                        { borderColor: colors.borderSubtle },
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={handleLogout}
                                    disabled={isLoading}
                                >
                                    <Text
                                        style={[
                                            styles.secondaryActionText,
                                            { color: colors.textPrimary },
                                        ]}
                                    >
                                        Вийти з акаунта
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    activeOpacity={0.85}
                                    onPress={handleDeleteAccount}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.logoutButtonText}>Видалити акаунт</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text
                                    style={[
                                        styles.profileStatusTitle,
                                        { color: colors.accentGold, marginBottom: 14 },
                                    ]}
                                >
                                    Редагування даних профілю
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.accentGold }]}>
                                        Ім'я
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
                                        placeholder="Ваше ім'я"
                                        placeholderTextColor={
                                            themeMode === 'dark' ? '#7D8F84' : '#8A8275'
                                        }
                                        value={editName}
                                        onChangeText={setEditName}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                    />
                                </View>

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
                                        placeholderTextColor={
                                            themeMode === 'dark' ? '#7D8F84' : '#8A8275'
                                        }
                                        value={editEmail}
                                        onChangeText={setEditEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                        onFocus={() => {
                                            setTimeout(() => {
                                                profileScrollRef.current?.scrollTo({
                                                    y: 120,
                                                    animated: true,
                                                });
                                            }, 150);
                                        }}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.accentGold }]}>
                                        Новий пароль (залиште порожнім, якщо не змінюєте)
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
                                            style={[
                                                styles.passwordInput,
                                                { color: colors.textPrimary },
                                            ]}
                                            placeholder="••••••••"
                                            placeholderTextColor={
                                                themeMode === 'dark' ? '#7D8F84' : '#8A8275'
                                            }
                                            value={editPassword}
                                            onChangeText={setEditPassword}
                                            secureTextEntry={!showEditPassword}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                            onFocus={() => {
                                                setTimeout(() => {
                                                    profileScrollRef.current?.scrollToEnd({
                                                        animated: true,
                                                    });
                                                }, 150);
                                            }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowEditPassword(!showEditPassword)}
                                            style={styles.eyeButton}
                                        >
                                            <Text
                                                style={[styles.eyeText, { color: colors.accentGold }]}
                                            >
                                                {showEditPassword ? 'Сховати' : 'Показати'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
                                    activeOpacity={0.85}
                                    onPress={handleSaveProfile}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Зберегти зміни</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.secondaryActionBtn,
                                        {
                                            borderColor: colors.borderSubtle,
                                            marginTop: 10,
                                            marginBottom: 0,
                                        },
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setEditName(user.name);
                                        setEditEmail(user.email);
                                        setEditPassword('');
                                    }}
                                    disabled={isLoading}
                                >
                                    <Text
                                        style={[
                                            styles.secondaryActionText,
                                            { color: colors.textPrimary },
                                        ]}
                                    >
                                        Скасувати
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Шапка */}
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
                    onPress={() => navigation.navigate('Entry')}
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
                ref={registerScrollRef}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 160 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Заголовок */}
                <View style={styles.welcomeBlock}>
                    <Text style={[styles.brandTitle, { color: colors.accentGold }]}>
                        BROOKIVKA
                    </Text>
                    <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                        Створіть профіль мандрівника, щоб зберігати улюблені маршрути та історію AR-сканувань
                    </Text>
                </View>

                {/* Картка форми реєстрації */}
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
                            Ім'я
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
                            placeholder="name"
                            placeholderTextColor={themeMode === 'dark' ? '#7D8F84' : '#8A8275'}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            editable={!isLoading}
                        />
                    </View>

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
                            editable={!isLoading}
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
                                editable={!isLoading}
                                onFocus={() => {
                                    setTimeout(() => {
                                        registerScrollRef.current?.scrollTo({
                                            y: 160,
                                            animated: true,
                                        });
                                    }, 150);
                                }}
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
                        style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
                        activeOpacity={0.85}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>Зареєструватися</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Розділювач */}
                <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
                    <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                        або
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
                </View>

                {/* Google реєстрація */}
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
                        showAlert(
                            'success',
                            'Google Auth',
                            'Тут підключається реєстрація через Google.'
                        )
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
                        Продовжити з Google
                    </Text>
                </TouchableOpacity>

                {/* Перехід на окрему сторінку входу */}
                <View style={styles.footerLinkContainer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Вже реєструвалися?{' '}
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.footerLink, { color: colors.accentGold }]}>
                            Увійти
                        </Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 22,
    },
    avatarCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: COLORS.primaryGreen,
        borderWidth: 2,
        borderColor: COLORS.borderBronze,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarText: {
        color: '#E0D0B0',
        fontSize: 26,
        fontWeight: '800',
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
        paddingHorizontal: 10,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 18,
    },
    profileStatusTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    profileStatusDesc: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 20,
    },
    secondaryActionBtn: {
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 12,
    },
    secondaryActionText: {
        fontSize: 15,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#8B322C',
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderBronze,
    },
    logoutButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
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
        marginVertical: 18,
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
    footerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});