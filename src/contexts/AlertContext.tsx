import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CustomAlert, { Toast, AlertType, AlertButton } from '../components/common/CustomAlert';

interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  icon?: string;
}

interface ToastOptions {
  type?: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showToast: (options: ToastOptions) => void;
  // Convenience methods
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    destructive?: boolean
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
  });

  const [toastState, setToastState] = useState<ToastOptions & { visible: boolean }>({
    visible: false,
    message: '',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      ...options,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    setToastState({
      ...options,
      visible: true,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string) => {
    showAlert({
      type: 'success',
      title,
      message,
      buttons: [{ text: 'OK' }],
    });
  }, [showAlert]);

  const error = useCallback((title: string, message?: string) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: [{ text: 'OK' }],
    });
  }, [showAlert]);

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirm',
    destructive = false
  ) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm
        },
      ],
    });
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, showToast, success, error, confirm }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
      <Toast
        visible={toastState.visible}
        type={toastState.type}
        message={toastState.message}
        duration={toastState.duration}
        onHide={hideToast}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
