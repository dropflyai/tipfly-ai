import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/colors';
import { mediumHaptic, successHaptic, errorHaptic, lightHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

const alertConfig: Record<AlertType, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}> = {
  success: {
    icon: 'checkmark-circle',
    color: Colors.success,
    bgColor: Colors.success + '20',
  },
  error: {
    icon: 'close-circle',
    color: Colors.error,
    bgColor: Colors.error + '20',
  },
  warning: {
    icon: 'warning',
    color: Colors.warning,
    bgColor: Colors.warning + '20',
  },
  info: {
    icon: 'information-circle',
    color: Colors.primary,
    bgColor: Colors.primary + '20',
  },
  confirm: {
    icon: 'help-circle',
    color: Colors.primary,
    bgColor: Colors.primary + '20',
  },
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK' }],
  onClose,
  icon,
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic based on type
      if (type === 'success') successHaptic();
      else if (type === 'error') errorHaptic();
      else lightHaptic();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const config = alertConfig[type];
  const displayIcon = icon || config.icon;

  const handleButtonPress = (button: AlertButton) => {
    mediumHaptic();
    button.onPress?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={displayIcon} size={40} color={config.color} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel && index === buttons.length - 1;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isPrimary && styles.buttonPrimary,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    buttons.length === 1 && styles.buttonFullWidth,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isPrimary && styles.buttonTextPrimary,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Toast notification for quick feedback
export interface ToastProps {
  visible: boolean;
  type?: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  onHide: () => void;
}

export function Toast({
  visible,
  type = 'info',
  message,
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      lightHaptic();
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const toastConfig = {
    success: { icon: 'checkmark-circle' as const, color: Colors.success },
    error: { icon: 'close-circle' as const, color: Colors.error },
    info: { icon: 'information-circle' as const, color: Colors.primary },
  };

  const config = toastConfig[type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Ionicons name={config.icon} size={22} color={config.color} />
        <Text style={styles.toastMessage}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Alert styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.glowBlueSubtle,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonFullWidth: {
    flex: 0,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonDestructive: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error + '40',
  },
  buttonCancel: {
    backgroundColor: Colors.backgroundTertiary,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonTextPrimary: {
    color: Colors.white,
  },
  buttonTextDestructive: {
    color: Colors.error,
  },
  buttonTextCancel: {
    color: Colors.textSecondary,
  },

  // Toast styles
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.glowBlueSubtle,
  },
  toastMessage: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
});
