import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Colors, Shadows } from '../constants/colors';
import { mediumHaptic } from '../utils/haptics';

const { width } = Dimensions.get('window');

type CelebrationType = 'tip' | 'goal';

interface CelebrationModalProps {
  visible: boolean;
  type: CelebrationType;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  autoClose?: boolean; // Auto close after animation
}

const celebrationConfig = {
  tip: {
    source: require('../../assets/animations/tip-celebration.mp4'),
    defaultTitle: 'Tip Added!',
    defaultSubtitle: 'Keep tracking your earnings',
  },
  goal: {
    source: require('../../assets/animations/goal-scored.mp4'),
    defaultTitle: 'Goal Reached!',
    defaultSubtitle: 'You crushed it!',
  },
};

export default function CelebrationModal({
  visible,
  type,
  title,
  subtitle,
  onClose,
  autoClose = true,
}: CelebrationModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const videoRef = useRef<Video>(null);

  const config = celebrationConfig[type];

  useEffect(() => {
    if (visible) {
      mediumHaptic();
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish && autoClose) {
      // Small delay after video ends before closing
      setTimeout(() => {
        handleClose();
      }, 500);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Video
            ref={videoRef}
            source={config.source}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={visible}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            isMuted={true}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title || config.defaultTitle}</Text>
            <Text style={styles.subtitle}>{subtitle || config.defaultSubtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderBlue,
    ...Shadows.glowBlue,
  },
  video: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    ...Shadows.buttonBlue,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
