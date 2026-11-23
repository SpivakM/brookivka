import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/theme';

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = 'system' | 'dark' | 'light';

export interface ThemePalette {
    mode: ThemeMode;
    background: string;        // Основний фон екрана
    card: string;              // Фон карток та блоків
    inputBg: string;           // Фон полів вводу та сегментних перемикачів
    textPrimary: string;       // Основний текст
    textSecondary: string;     // Підписи та описи
    accentGold: string;        // Золотисті/бронзові заголовки та акценти
    borderBronze: string;      // Рамки
    borderSubtle: string;      // Тонкі розділювачі
    buttonPrimary: string;     // Кнопки дій
    buttonText: string;        // Текст на кнопках
    headerBg: string;          // Фон верхньої панелі
    headerButtonBg: string;    // Фон круглих кнопок у шапці
}

export const DARK_THEME: ThemePalette = {
    mode: 'dark',
    background: '#0F2118',               // Глибокий темно-зелений (темніший за primaryGreen для контрасту карток)
    card: COLORS.primaryGreen,           // '#1A3D2F'
    inputBg: 'rgba(15, 33, 24, 0.65)',
    textPrimary: COLORS.white,           // '#FFFFFF'
    textSecondary: '#B8C4BC',
    accentGold: '#E0D0B0',               // Теплий світло-золотий для темного фону (або COLORS.goldActive)
    borderBronze: COLORS.borderBronze,   // '#7C5230'
    borderSubtle: 'rgba(212, 175, 55, 0.25)',
    buttonPrimary: COLORS.buttonBrown,   // '#8C5A2B'
    buttonText: COLORS.white,            // '#FFFFFF'
    headerBg: COLORS.primaryGreen,       // '#1A3D2F'
    headerButtonBg: 'rgba(255, 255, 255, 0.15)',
};

export const LIGHT_THEME: ThemePalette = {
    mode: 'light',
    background: COLORS.backgroundPergament, // '#F7F3E9' — ваш фірмовий пергаментний фон
    card: COLORS.footerBackground,          // '#F0EAD8' — ваш теплий бежевий для карток (або COLORS.white)
    inputBg: COLORS.white,                  // '#FFFFFF' — чисті інпути на бежевій картці
    textPrimary: COLORS.textDark,           // '#000000'
    textSecondary: COLORS.textSecondary,    // '#333333'
    accentGold: COLORS.iconBronze,          // '#9E6938' — контрастна бронза для заголовків секцій
    borderBronze: COLORS.borderBronze,      // '#7C5230'
    borderSubtle: 'rgba(124, 82, 48, 0.2)', // Напівпрозорий borderBronze для розділювачів
    buttonPrimary: COLORS.buttonBrown,      // '#8C5A2B'
    buttonText: COLORS.white,               // '#FFFFFF'
    headerBg: COLORS.primaryGreen,          // '#1A3D2F' — залишаємо фірмову зелену шапку для впізнаваності бренду
    headerButtonBg: 'rgba(255, 255, 255, 0.15)',
};

interface ThemeContextType {
    themeMode: ThemeMode;
    themePreference: ThemePreference;
    colors: ThemePalette;
    setThemeMode: (mode: ThemePreference) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themePreference, setThemePreference] = useState<ThemePreference>('system');

    const themeMode: ThemeMode =
        themePreference === 'system'
            ? systemColorScheme === 'light'
                ? 'light'
                : 'dark'
            : themePreference;

    const setThemeMode = (mode: ThemePreference) => {
        setThemePreference(mode);
    };

    const toggleTheme = () => {
        setThemePreference((prev) => {
            const currentEffective =
                prev === 'system' ? (systemColorScheme === 'light' ? 'light' : 'dark') : prev;
            return currentEffective === 'dark' ? 'light' : 'dark';
        });
    };

    const colors = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

    return (
        <ThemeContext.Provider
            value={{ themeMode, themePreference, colors, setThemeMode, toggleTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme має використовуватися всередині ThemeProvider');
    }
    return context;
};