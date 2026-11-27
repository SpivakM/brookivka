import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    StyledAlertModal,
    StyledAlertState,
    AlertType,
} from '../components/StyledAlertModal';

interface AlertOptions {
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface AlertContextType {
    showAlert: (
        type: AlertType,
        title: string,
        message: string,
        options?: AlertOptions
    ) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<StyledAlertState>({
        visible: false,
        type: 'error',
        title: '',
        message: '',
    });

    const showAlert = useCallback(
        (type: AlertType, title: string, message: string, options?: AlertOptions) => {
            setAlertState({
                visible: true,
                type,
                title,
                message,
                confirmText: options?.confirmText,
                cancelText: options?.cancelText,
                onConfirm: options?.onConfirm,
            });
        },
        []
    );

    const hideAlert = useCallback(() => {
        setAlertState((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <StyledAlertModal alert={alertState} onClose={hideAlert} />
        </AlertContext.Provider>
    );
};

export const useAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert має використовуватися всередині AlertProvider');
    }
    return context;
};