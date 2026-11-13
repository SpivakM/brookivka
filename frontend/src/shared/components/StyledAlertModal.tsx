import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export type AlertType = 'error' | 'success' | 'confirm' | 'info';

export interface StyledAlertState {
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface Props {
    alert: StyledAlertState;
    onClose: () => void;
}

export const StyledAlertModal: React.FC<Props> = ({ alert, onClose }) => {
    const { colors } = useTheme();

    if (!alert.visible) return null;

    const isError = alert.type === 'error' || alert.type === 'confirm';
    const isInfo = alert.type === 'info';

    const borderColor = isInfo
        ? COLORS.borderBronze
        : isError
            ? '#D9534F'
            : colors.accentGold;

    const titleColor = isError ? '#E57373' : colors.accentGold;
    const badgeBg = isError ? 'rgba(217, 83, 79, 0.16)' : 'rgba(212, 175, 55, 0.16)';
    const iconSymbol = alert.type === 'success' ? '✓' : '!';

    const hasCancelButton =
        alert.type === 'confirm' || Boolean(alert.cancelText);

    return (
        <Modal
            visible={alert.visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.dialog,
                        {
                            backgroundColor: colors.card,
                            borderColor,
                        },
                    ]}
                >
                    {!isInfo && (
                        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor }]}>
                            <Text style={[styles.badgeText, { color: borderColor }]}>{iconSymbol}</Text>
                        </View>
                    )}

                    <Text style={[styles.title, { color: titleColor }]}>
                        {alert.title}
                    </Text>

                    <Text style={[styles.message, { color: colors.textPrimary }]}>
                        {alert.message}
                    </Text>

                    <View style={styles.actionsRow}>
                        {hasCancelButton && (
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                                activeOpacity={0.8}
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
                                    {alert.cancelText || 'Скасувати'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                {
                                    backgroundColor: isError ? '#8B322C' : COLORS.buttonBrown,
                                    borderColor: isError ? '#D9534F' : COLORS.borderBronze,
                                    flex: hasCancelButton ? 1 : undefined,
                                    minWidth: hasCancelButton ? undefined : 140,
                                },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => {
                                onClose();
                                alert.onConfirm?.();
                            }}
                        >
                            <Text style={styles.confirmBtnText}>
                                {alert.confirmText || 'Зрозуміло'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    dialog: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 22,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
    },
    badge: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeText: {
        fontSize: 22,
        fontWeight: '800',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmBtn: {
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});