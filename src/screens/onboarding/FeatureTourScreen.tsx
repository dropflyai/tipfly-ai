import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GradientColors } from '../../constants/colors';
import { mediumHaptic, lightHaptic } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

interface FeatureTourScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TourSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  features: string[];
}

const TOUR_SLIDES: TourSlide[] = [
  {
    id: '1',
    icon: 'sparkles',
    iconColor: '#FFD700',
    title: 'AI Predicts Your Earnings',
    subtitle: 'Before you even clock in',
    features: [
      'Based on YOUR tip history',
      'Know which shifts to pick up',
      'Updates as you log more',
    ],
  },
  {
    id: '2',
    icon: 'calculator-outline',
    iconColor: '#10B981',
    title: 'See Your Real Hourly',
    subtitle: 'Not just what\'s on your check',
    features: [
      'Tips + wage combined',
      'Compare days & shifts',
      'Know your true worth',
    ],
  },
  {
    id: '3',
    icon: 'document-text-outline',
    iconColor: '#3B82F6',
    title: 'Tax Season? Already Done',
    subtitle: 'Your records are always ready',
    features: [
      'Year-to-date totals instantly',
      'Export for tax filing',
      'No more April scrambling',
    ],
  },
];

export default function FeatureTourScreen({ onComplete, onSkip }: FeatureTourScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    lightHaptic();
    if (currentIndex < TOUR_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      mediumHaptic();
      onComplete();
    }
  };

  const handleSkip = () => {
    lightHaptic();
    onSkip();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const renderSlide = ({ item, index }: { item: TourSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
          <Ionicons name={item.icon} size={80} color={item.iconColor} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {item.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={[styles.checkCircle, { backgroundColor: item.iconColor }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {TOUR_SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: TOUR_SLIDES[currentIndex].iconColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === TOUR_SLIDES.length - 1;

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={TOUR_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
      />

      {/* Dots */}
      {renderDots()}

      {/* Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isLastSlide ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? "Let's Add Your First Tip" : 'Next'}
            </Text>
            <Ionicons
              name={isLastSlide ? 'arrow-forward' : 'chevron-forward'}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
