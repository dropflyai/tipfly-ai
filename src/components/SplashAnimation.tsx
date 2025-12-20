import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface SplashAnimationProps {
  onAnimationComplete: () => void;
}

// ============================================
// ANIMATION MODE:
// 'video' - Uses AI-generated video (plays and fades out)
// 'animated' - Uses React Native animations (fallback)
// ============================================
const ANIMATION_MODE: 'video' | 'animated' = 'video';

// For animated mode, choose style:
// 'flyingBee' | 'coinDrop' | 'minimal'
const ANIMATION_STYLE: 'flyingBee' | 'coinDrop' | 'minimal' = 'minimal';

// Coin particle for coin drop animation
interface Coin {
  x: number;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  scale: number;
  delay: number;
}

export default function SplashAnimation({ onAnimationComplete }: SplashAnimationProps) {
  const videoRef = useRef<Video>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  // Shared animations
  const fadeOut = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(15)).current;
  const glowPulse = useRef(new Animated.Value(0.2)).current;

  // Video overlay animations
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Flying Bee animations
  const beeX = useRef(new Animated.Value(-100)).current;
  const beeY = useRef(new Animated.Value(height * 0.3)).current;
  const beeScale = useRef(new Animated.Value(0.8)).current;
  const wingFlutter = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;

  // Trail particles for flying bee
  const trailParticles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      x: new Animated.Value(0),
    }));
  }, []);

  // Coin Drop animations
  const coins = useMemo<Coin[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      x: width * 0.15 + Math.random() * width * 0.7,
      y: new Animated.Value(-50 - Math.random() * 100),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: 0.5 + Math.random() * 0.5,
      delay: i * 80,
    }));
  }, []);

  const coinBurst = useRef(new Animated.Value(0)).current;

  // Minimal animations
  const subtleFloat = useRef(new Animated.Value(0)).current;

  // Sparkle particles (used in multiple styles)
  const sparkles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      x: width * 0.2 + Math.random() * width * 0.6,
      y: height * 0.3 + Math.random() * height * 0.4,
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      delay: Math.random() * 500 + 300,
    }));
  }, []);

  useEffect(() => {
    if (ANIMATION_MODE === 'video') {
      // Video mode - wait for video to end, then show logo overlay
      // The onPlaybackStatusUpdate will handle the timing
    } else {
      // Animated mode - run the selected animation
      if (ANIMATION_STYLE === 'flyingBee') {
        runFlyingBeeAnimation();
      } else if (ANIMATION_STYLE === 'coinDrop') {
        runCoinDropAnimation();
      } else {
        runMinimalAnimation();
      }
    }
  }, []);

  // Handle video playback status
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      setVideoEnded(true);
      // Video finished - just fade out and go to app
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }
  };

  // ==========================================
  // FLYING BEE ANIMATION
  // ==========================================
  const runFlyingBeeAnimation = () => {
    // Start wing flutter immediately
    Animated.loop(
      Animated.sequence([
        Animated.timing(wingFlutter, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(wingFlutter, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Phase 1: Bee flies in with a curved path
    Animated.parallel([
      Animated.timing(beeX, {
        toValue: width / 2 - 40,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(beeY, {
          toValue: height * 0.25,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(beeY, {
          toValue: height * 0.42,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(trailOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Trail particles follow bee
    trailParticles.forEach((particle, i) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(particle.scale, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100 + i * 100);
    });

    // Phase 2: Bee settles
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(beeScale, {
          toValue: 1.2,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(trailOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1200);

    // Phase 3: Logo reveal with glow
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1400);

    // Phase 4: Sparkles burst
    sparkles.forEach((sparkle) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.parallel([
            Animated.spring(sparkle.scale, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(sparkle.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500 + sparkle.delay);
    });

    // Phase 5: Text reveals
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1700);

    // Phase 6: Tagline
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(taglineSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    // Phase 7: Fade out
    setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 3000);
  };

  // ==========================================
  // COIN DROP ANIMATION
  // ==========================================
  const runCoinDropAnimation = () => {
    coins.forEach((coin, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(coin.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(coin.y, {
            toValue: height * 0.55,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(coin.rotation, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, coin.delay);
    });

    setTimeout(() => {
      coins.forEach((coin) => {
        Animated.timing(coin.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });

      Animated.spring(coinBurst, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }, 1200);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1400);

    sparkles.forEach((sparkle) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.parallel([
            Animated.spring(sparkle.scale, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(sparkle.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500 + sparkle.delay);
    });

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1700);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(taglineSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 3000);
  };

  // ==========================================
  // MINIMAL & CLEAN ANIMATION
  // ==========================================
  const runMinimalAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(subtleFloat, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(subtleFloat, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 30,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.15,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 400);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 2500);
  };

  // Interpolations
  const wingRotation = wingFlutter.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const floatY = subtleFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* ========== VIDEO MODE ========== */}
      {ANIMATION_MODE === 'video' && (
        <Video
          ref={videoRef}
          source={require('../../assets/splash-video.mp4')} // Add your AI-generated video here
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      )}

      {/* ========== ANIMATED MODE ========== */}
      {ANIMATION_MODE === 'animated' && (
        <LinearGradient
          colors={['#0A0F1A', '#1A2332', '#0A0F1A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Flying Bee Elements */}
          {ANIMATION_STYLE === 'flyingBee' && (
            <>
              {trailParticles.map((particle, index) => (
                <Animated.View
                  key={`trail-${index}`}
                  style={[
                    styles.trailParticle,
                    {
                      left: width * 0.1 + index * (width * 0.08),
                      top: height * 0.35 - Math.sin(index * 0.5) * 30,
                      opacity: Animated.multiply(particle.opacity, trailOpacity),
                      transform: [{ scale: particle.scale }],
                    },
                  ]}
                />
              ))}

              <Animated.View
                style={[
                  styles.beeContainer,
                  {
                    transform: [
                      { translateX: beeX },
                      { translateY: beeY },
                      { scale: beeScale },
                    ],
                  },
                ]}
              >
                <View style={styles.beeBody}>
                  <Text style={styles.beeEmoji}>🐝</Text>
                </View>
                <Animated.View
                  style={[
                    styles.beeWing,
                    styles.beeWingLeft,
                    { transform: [{ rotate: wingRotation }] },
                  ]}
                />
              </Animated.View>
            </>
          )}

          {/* Coin Drop Elements */}
          {ANIMATION_STYLE === 'coinDrop' && (
            <>
              {coins.map((coin, index) => (
                <Animated.View
                  key={`coin-${index}`}
                  style={[
                    styles.coin,
                    {
                      left: coin.x,
                      opacity: coin.opacity,
                      transform: [
                        { translateY: coin.y },
                        { scale: coin.scale },
                        {
                          rotate: coin.rotation.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.coinEmoji}>🪙</Text>
                </Animated.View>
              ))}

              <Animated.View
                style={[
                  styles.burstCircle,
                  {
                    opacity: coinBurst.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.6, 0],
                    }),
                    transform: [
                      {
                        scale: coinBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 2.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          )}

          {/* Sparkles (shared) */}
          {sparkles.map((sparkle, index) => (
            <Animated.View
              key={`sparkle-${index}`}
              style={[
                styles.sparkle,
                {
                  left: sparkle.x,
                  top: sparkle.y,
                  opacity: sparkle.opacity,
                  transform: [{ scale: sparkle.scale }],
                },
              ]}
            >
              <Text style={styles.sparkleText}>✦</Text>
            </Animated.View>
          ))}

          {/* Center Content */}
          <View style={styles.centerContent}>
            {/* Glow effect behind logo */}
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: glowPulse,
                  transform: [{ scale: logoScale }],
                },
              ]}
            />

            {/* Logo - Using actual TipFly logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [
                    { scale: logoScale },
                    ...(ANIMATION_STYLE === 'minimal' ? [{ translateY: floatY }] : []),
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/tipfly-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* App name */}
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textSlide }],
                },
              ]}
            >
              <Text style={styles.appName}>
                <Text style={styles.appNameTip}>Tip</Text>
                <Text style={styles.appNameFly}>Fly</Text>
              </Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View
              style={[
                styles.taglineContainer,
                {
                  opacity: taglineOpacity,
                  transform: [{ translateY: taglineSlide }],
                },
              ]}
            >
              <Text style={styles.tagline}>AI-Powered Earnings</Text>
            </Animated.View>
          </View>
        </LinearGradient>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  // Video styles
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Animated styles
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bee styles
  beeContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beeBody: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beeEmoji: {
    fontSize: 50,
  },
  beeWing: {
    position: 'absolute',
    width: 20,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 10,
    top: 10,
  },
  beeWingLeft: {
    left: 5,
  },
  trailParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  // Coin styles
  coin: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinEmoji: {
    fontSize: 32,
  },
  burstCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.gold,
    top: height * 0.5 - 50,
    left: width / 2 - 50,
  },
  // Sparkle styles
  sparkle: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleText: {
    fontSize: 20,
    color: Colors.gold,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Logo styles
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  // Text styles
  textContainer: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  appNameTip: {
    color: Colors.white,
  },
  appNameFly: {
    color: Colors.primary,
  },
  taglineContainer: {
    opacity: 0.9,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
