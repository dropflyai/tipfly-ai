// Animation utilities for smooth transitions
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

/**
 * Smooth spring animation for natural transitions
 * Use for: Card appearances, layout changes, list updates
 */
export const springAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
};

/**
 * Quick ease-in-out animation for fast transitions
 * Use for: Button presses, quick state changes
 */
export const easeAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

/**
 * Linear animation for consistent transitions
 * Use for: Smooth value updates, progress bars
 */
export const linearAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
};

/**
 * Custom animation with more control
 * Use for: Complex animations requiring specific timing
 */
export const customAnimation = (duration: number = 300) => {
  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
      springDamping: 0.7,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
};

/**
 * Fade animation for subtle transitions
 * Use for: Modal appearances, overlays
 */
export const fadeAnimation = () => {
  LayoutAnimation.configureNext({
    duration: 250,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
};
