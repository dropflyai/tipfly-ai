// Haptic feedback utilities for tactile interactions
import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback for subtle interactions
 * Use for: List item taps, toggle switches, selection changes
 */
export const lightHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium haptic feedback for standard interactions
 * Use for: Button presses, form submissions, tab switches
 */
export const mediumHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Heavy haptic feedback for important actions
 * Use for: Delete confirmations, goal completion, major actions
 */
export const heavyHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Success haptic pattern
 * Use for: Successful form submission, goal achieved, data saved
 */
export const successHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning haptic pattern
 * Use for: Warning messages, approaching limits
 */
export const warningHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error haptic pattern
 * Use for: Form validation errors, action failures
 */
export const errorHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Selection haptic feedback
 * Use for: Picker selections, segmented control changes
 */
export const selectionHaptic = () => {
  Haptics.selectionAsync();
};
