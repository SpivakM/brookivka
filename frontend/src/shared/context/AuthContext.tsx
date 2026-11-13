import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';

export interface UserProfile {
    id?: string | number;
    name: string;
    email: string;
}

interface UpdateProfilePayload {
    name?: string;
    email?: string;
    newPassword?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    isLoading: boolean;
    isInitializing: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
    deleteAccount: () => Promise<void>;
    logout: () => Promise<void>;
}

const TOKEN_KEY = '@brookivka_auth_token';
const USER_KEY = '@brookivka_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const [savedToken, savedUser] = await Promise.all([
                    AsyncStorage.getItem(TOKEN_KEY),
                    AsyncStorage.getItem(USER_KEY),
                ]);

                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch (e) {
                console.warn('Не вдалося відновити сесію:', e);
            } finally {
                setIsInitializing(false);
            }
        };

        restoreSession();
    }, []);

    const persistSession = async (newToken: string, newUser: UserProfile) => {
        setToken(newToken);
        setUser(newUser);
        await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, newToken),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
        ]);
    };

    const clearSession = async () => {
        setUser(null);
        setToken(null);
        await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
        ]);
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Невірна пошта або пароль');
            }

            const authToken = data.token || data.accessToken;
            const userProfile: UserProfile = data.user || {
                id: data.id,
                name: data.name || email.split('@')[0],
                email: email.trim(),
            };

            await persistSession(authToken, userProfile);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Помилка під час реєстрації');
            }

            const authToken = data.token || data.accessToken;
            const userProfile: UserProfile = data.user || {
                id: data.id,
                name: name.trim(),
                email: email.trim(),
            };

            await persistSession(authToken, userProfile);
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (payload: UpdateProfilePayload) => {
        if (!token) {
            throw new Error('Сесія не знайдена. Увійдіть знову.');
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Не вдалося оновити профіль');
            }

            if (data.user) {
                setUser(data.user);
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const deleteAccount = async () => {
        if (!token) {
            await clearSession();
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok && response.status !== 401) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Не вдалося видалити акаунт');
            }

            await clearSession();
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await clearSession();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isInitializing,
                login,
                register,
                updateProfile,
                deleteAccount,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth має використовуватися всередині AuthProvider');
    }
    return context;
};