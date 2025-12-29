// Badge Celebration Modal
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useGamificationStore, BadgeDefinition } from '../store/gamificationStore';
import { successHaptic } from '../utils/haptics';

const { width, height } = Dimensions.get('window');

export const BadgeCelebrationModal: React.FC = () => {
  const { newlyEarnedBadge, setNewlyEarnedBadge } = useGamificationStore();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (newlyEarnedBadge) {
      successHaptic();

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(confettiAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(confettiAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [newlyEarnedBadge]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNewlyEarnedBadge(null);
    });
  };

  if (!newlyEarnedBadge) return null;

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 20 }).map((_, i) => {
    const x = Math.random() * width;
    const delay = Math.random() * 500;
    const duration = 2000 + Math.random() * 1000;

    return (
      <Animated.View
        key={i}
        style={[
          styles.confetti,
          {
            left: x,
            backgroundColor: [
              Colors.primary,
              Colors.gold,
              Colors.success,
              '#FF6B6B',
              '#4ECDC4',
            ][i % 5],
            transform: [
              {
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50],
                }),
              },
              {
                rotate: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
                }),
              },
            ],
            opacity: confettiAnim.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          },
        ]}
      />
    );
  });

  return (
    <Modal
      visible={!!newlyEarnedBadge}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Confetti */}
        <View style={styles.confettiContainer}>{confettiParticles}</View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Badge icon */}
          <View style={styles.badgeContainer}>
            <View style={styles.badgeGlow} />
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeEmoji}>{newlyEarnedBadge.icon}</Text>
            </View>
          </View>

          {/* Text */}
          <Text style={styles.title}>Badge Earned!</Text>
          <Text style={styles.badgeName}>{newlyEarnedBadge.name}</Text>
          <Text style={styles.badgeDescription}>
            {newlyEarnedBadge.description}
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width - 48,
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  badgeGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gold,
    opacity: 0.2,
    top: -10,
    left: -10,
  },
  badgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 14,
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default BadgeCelebrationModal;
