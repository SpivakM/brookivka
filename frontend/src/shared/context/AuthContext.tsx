import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';

export interface UserProfile {
    id?: string | number;
    name: string;
    email: string;
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    isLoading: boolean;
    isInitializing: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
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
        const loadStoredAuth = async () => {
            try {
                const [storedToken, storedUser] = await Promise.all([
                    AsyncStorage.getItem(TOKEN_KEY),
                    AsyncStorage.getItem(USER_KEY),
                ]);

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Помилка читання сесії з AsyncStorage:', e);
            } finally {
                setIsInitializing(false);
            }
        };

        loadStoredAuth();
    }, []);

    const saveSession = async (newToken: string, newUser: UserProfile) => {
        setToken(newToken);
        setUser(newUser);
        await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, newToken),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
        ]);
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Невірна електронна пошта або пароль');
            }

            const authToken = data.token || data.accessToken || 'authenticated';
            const userProfile: UserProfile = data.user || {
                name: data.name || email.split('@')[0],
                email: email.trim(),
            };

            await saveSession(authToken, userProfile);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Не вдалося створити акаунт');
            }

            const authToken = data.token || data.accessToken || 'authenticated';
            const userProfile: UserProfile = data.user || {
                name: name.trim(),
                email: email.trim(),
            };

            await saveSession(authToken, userProfile);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
        ]);
    };

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, isInitializing, login, register, logout }}
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