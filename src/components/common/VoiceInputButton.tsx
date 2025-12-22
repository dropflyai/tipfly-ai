import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Colors, GradientColors } from '../../constants/colors';
import { lightHaptic, mediumHaptic, successHaptic, errorHaptic } from '../../utils/haptics';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function VoiceInputButton({
  onTranscript,
  onListeningChange,
  disabled = false,
  size = 'medium',
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const wave = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      wave.start();

      return () => {
        pulse.stop();
        wave.stop();
        pulseAnim.setValue(1);
        waveAnim.setValue(0);
      };
    }
  }, [isListening]);

  // Speech recognition event handlers
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    onListeningChange?.(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    onListeningChange?.(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript || '';
    setTranscript(text);

    // If final result, send to parent
    if (event.isFinal && text.trim()) {
      successHaptic();
      onTranscript(text.trim());
      stopListening();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('[VoiceInput] Error:', event.error, event.message);
    errorHaptic();
    setIsListening(false);
    onListeningChange?.(false);

    if (event.error === 'no-speech') {
      Alert.alert('No Speech Detected', 'Please try speaking again.');
    } else if (event.error === 'not-allowed') {
      Alert.alert(
        'Permission Required',
        'Please enable microphone and speech recognition in Settings.',
        [{ text: 'OK' }]
      );
    }
  });

  const checkPermissions = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      setHasPermission(result.granted);
    } catch (error) {
      console.error('[VoiceInput] Permission check error:', error);
      setHasPermission(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setHasPermission(result.granted);
      return result.granted;
    } catch (error) {
      console.error('[VoiceInput] Permission request error:', error);
      return false;
    }
  };

  const startListening = async () => {
    if (disabled) return;

    lightHaptic();

    // Check/request permissions
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'TipFly needs microphone and speech recognition access to use voice input. Please enable in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setTranscript('');
    setShowModal(true);
    mediumHaptic();

    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error) {
      console.error('[VoiceInput] Start error:', error);
      errorHaptic();
      setShowModal(false);
      Alert.alert('Voice Input Error', 'Could not start voice recognition. Please try again.');
    }
  };

  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('[VoiceInput] Stop error:', error);
    }
    setIsListening(false);
    setShowModal(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const cancelListening = async () => {
    lightHaptic();
    try {
      await ExpoSpeechRecognitionModule.abort();
    } catch (error) {
      console.error('[VoiceInput] Abort error:', error);
    }
    setTranscript('');
    setIsListening(false);
    setShowModal(false);
    onListeningChange?.(false);
  };

  const buttonSizes = {
    small: { size: 40, iconSize: 20 },
    medium: { size: 52, iconSize: 24 },
    large: { size: 64, iconSize: 28 },
  };

  const { size: buttonSize, iconSize } = buttonSizes[size];

  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <>
      <TouchableOpacity
        onPress={startListening}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          disabled && styles.buttonDisabled,
        ]}
      >
        <LinearGradient
          colors={disabled ? ['#3A3F4B', '#2A2F3B'] : GradientColors.primary}
          style={[styles.gradient, { borderRadius: buttonSize / 2 }]}
        >
          <Ionicons
            name="mic"
            size={iconSize}
            color={disabled ? Colors.textSecondary : '#FFFFFF'}
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Voice Input Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={cancelListening}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Animated waves */}
            <View style={styles.wavesContainer}>
              <Animated.View
                style={[
                  styles.wave,
                  {
                    transform: [{ scale: waveScale }],
                    opacity: waveOpacity,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.waveInner,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <View style={styles.micCircle}>
                <Ionicons name="mic" size={40} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.listeningText}>
              {isListening ? 'Listening...' : 'Starting...'}
            </Text>

            {transcript ? (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            ) : (
              <Text style={styles.hintText}>
                Try saying: "I made $85 in tips working 6 hours"
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={cancelListening}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {transcript && (
                <TouchableOpacity
                  onPress={() => {
                    if (transcript.trim()) {
                      successHaptic();
                      onTranscript(transcript.trim());
                      stopListening();
                    }
                  }}
                  style={styles.useButton}
                >
                  <LinearGradient
                    colors={GradientColors.primary}
                    style={styles.useButtonGradient}
                  >
                    <Text style={styles.useButtonText}>Use This</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    shadowOpacity: 0,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wavesContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  wave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
  },
  waveInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.6,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  listeningText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  transcriptContainer: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  transcriptText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  useButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  useButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
