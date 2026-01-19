// Random Delight Component
// Shows surprise micro-celebrations at random moments

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { successHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DelightType = 'confetti' | 'sparkle' | 'emoji_burst';

interface RandomDelightProps {
  visible: boolean;
  onComplete: () => void;
  type?: DelightType;
}

// Random encouraging messages
const DELIGHT_MESSAGES = [
  "You're on fire! 🔥",
  "Keep crushing it! 💪",
  "That's the spirit! ✨",
  "Money moves! 💰",
  "You got this! 🙌",
  "Awesome hustle! 🚀",
  "Making bank! 💵",
  "Legend status! 👑",
];

// Get random delight type
export function shouldShowDelight(): boolean {
  // 8% chance of showing a random delight
  return Math.random() < 0.08;
}

export function getRandomDelightType(): DelightType {
  const types: DelightType[] = ['confetti', 'sparkle', 'emoji_burst'];
  return types[Math.floor(Math.random() * types.length)];
}

// Mini confetti particle
function MiniConfetti({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const colors = [Colors.gold, Colors.success, Colors.primary, '#FF6B6B', '#A855F7'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;

  useEffect(() => {
    const duration = 1500 + Math.random() * 500;
    const xDrift = (Math.random() - 0.5) * 80;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: xDrift,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 360 * (2 + Math.random() * 2),
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        delay: delay + duration * 0.6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
          ],
          opacity,
        },
      ]}
    />
  );
}

// Sparkle particle
function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      ✨
    </Animated.Text>
  );
}

// Emoji burst particle
function EmojiBurst({ delay, emoji, startX, startY }: { delay: number; emoji: string; startX: number; startY: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const angle = Math.random() * Math.PI * 2;
  const distance = 60 + Math.random() * 40;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: Math.sin(angle) * distance,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: Math.cos(angle) * distance,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        delay: delay + 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.emojiBurst,
        {
          left: startX,
          top: startY,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function RandomDelight({ visible, onComplete, type = 'confetti' }: RandomDelightProps) {
  const messageAnim = useRef(new Animated.Value(0)).current;
  const [message] = useState(DELIGHT_MESSAGES[Math.floor(Math.random() * DELIGHT_MESSAGES.length)]);

  useEffect(() => {
    if (visible) {
      successHaptic();

      // Animate message
      Animated.sequence([
        Animated.spring(messageAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-complete after animation
      setTimeout(onComplete, 2000);
    }
  }, [visible]);

  if (!visible) return null;

  const renderParticles = () => {
    switch (type) {
      case 'confetti':
        return Array.from({ length: 20 }).map((_, i) => (
          <MiniConfetti
            key={i}
            delay={i * 30}
            startX={SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4}
          />
        ));
      case 'sparkle':
        return Array.from({ length: 8 }).map((_, i) => (
          <Sparkle
            key={i}
            delay={i * 80}
            x={SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.6}
            y={SCREEN_HEIGHT * 0.3 + Math.random() * SCREEN_HEIGHT * 0.2}
          />
        ));
      case 'emoji_burst':
        const emojis = ['💰', '✨', '🎉', '💵', '⭐', '🔥'];
        return Array.from({ length: 8 }).map((_, i) => (
          <EmojiBurst
            key={i}
            delay={i * 50}
            emoji={emojis[Math.floor(Math.random() * emojis.length)]}
            startX={SCREEN_WIDTH / 2 - 15}
            startY={SCREEN_HEIGHT / 2 - 50}
          />
        ));
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderParticles()}

      <Animated.View
        style={[
          styles.messageContainer,
          {
            transform: [
              { scale: messageAnim },
              {
                translateY: messageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
            opacity: messageAnim,
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    borderRadius: 2,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  emojiBurst: {
    position: 'absolute',
    fontSize: 24,
  },
  messageContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  message: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.gold,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
