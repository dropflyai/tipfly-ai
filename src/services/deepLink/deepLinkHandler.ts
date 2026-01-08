// Deep Link Handler for TipFly AI
// Handles referral codes and other deep links

import * as Linking from 'expo-linking';
import { useReferralStore } from '../../store/referralStore';
import { applyReferralCode, validateReferralCode } from '../api/referrals';
import { Analytics } from '../analytics/analytics';

// URL schemes we handle
// tipflyai://referral/ABC123
// https://tipflyai.app/r/ABC123 (future web support)

export interface DeepLinkResult {
  type: 'referral' | 'reset-password' | 'unknown';
  data?: Record<string, string>;
  handled: boolean;
}

// Parse a deep link URL
export const parseDeepLink = (url: string): DeepLinkResult => {
  try {
    const parsed = Linking.parse(url);
    console.log('[DeepLink] Parsed:', parsed);

    // Handle referral links
    // tipflyai://referral/ABC123
    if (parsed.path?.startsWith('referral/') || parsed.hostname === 'referral') {
      const code = parsed.path?.replace('referral/', '') || parsed.queryParams?.code as string;
      if (code) {
        return {
          type: 'referral',
          data: { code: code.toUpperCase() },
          handled: true,
        };
      }
    }

    // Handle web referral links
    // https://tipflyai.app/r/ABC123
    if (parsed.path?.startsWith('r/')) {
      const code = parsed.path.replace('r/', '');
      if (code) {
        return {
          type: 'referral',
          data: { code: code.toUpperCase() },
          handled: true,
        };
      }
    }

    // Handle password reset links
    // tipflyai://reset-password
    if (parsed.path === 'reset-password' || parsed.hostname === 'reset-password') {
      return {
        type: 'reset-password',
        handled: true,
      };
    }

    return { type: 'unknown', handled: false };
  } catch (error) {
    console.error('[DeepLink] Parse error:', error);
    return { type: 'unknown', handled: false };
  }
};

// Handle a referral code from deep link
export const handleReferralDeepLink = async (
  code: string,
  isAuthenticated: boolean
): Promise<{
  success: boolean;
  message: string;
  shouldShowSignup?: boolean;
}> => {
  const store = useReferralStore.getState();

  // Validate the code first
  const validation = await validateReferralCode(code);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || 'Invalid referral code',
    };
  }

  // If user is not logged in, store the code for after signup
  if (!isAuthenticated) {
    store.setPendingReferralCode(code);
    return {
      success: true,
      message: 'Referral code saved! Sign up to receive your reward.',
      shouldShowSignup: true,
    };
  }

  // If user is logged in, try to apply the code
  const result = await applyReferralCode(code);
  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Could not apply referral code',
    };
  }

  return {
    success: true,
    message: result.rewardEarned
      ? `Referral applied! Your friend earned ${result.rewardEarned.replace('_', ' ')}`
      : 'Referral applied! Welcome to TipFly AI.',
  };
};

// Process pending referral code after signup
export const processPendingReferralCode = async (): Promise<{
  success: boolean;
  message?: string;
}> => {
  const store = useReferralStore.getState();
  const pendingCode = store.pendingReferralCode;

  if (!pendingCode) {
    return { success: true };
  }

  console.log('[DeepLink] Processing pending referral code:', pendingCode);

  try {
    const result = await applyReferralCode(pendingCode);

    // Clear the pending code regardless of result
    store.setPendingReferralCode(null);

    if (result.success) {
      return {
        success: true,
        message: 'Referral code applied! You get a 7-day free trial + 20% off.',
      };
    }

    return {
      success: false,
      message: result.error,
    };
  } catch (error) {
    console.error('[DeepLink] Error processing pending code:', error);
    store.setPendingReferralCode(null);
    return { success: false };
  }
};

// Set up deep link listener
export const setupDeepLinkListener = (
  onLink: (result: DeepLinkResult) => void
): (() => void) => {
  // Handle links that opened the app
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('[DeepLink] Received:', url);
    const result = parseDeepLink(url);
    onLink(result);

    // Track analytics
    if (result.handled) {
      Analytics.track('app_opened', { source: 'deep_link' });
    }
  });

  return () => {
    subscription.remove();
  };
};

// Check for initial deep link (app opened via link)
export const getInitialDeepLink = async (): Promise<DeepLinkResult | null> => {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('[DeepLink] Initial URL:', initialUrl);
      return parseDeepLink(initialUrl);
    }
    return null;
  } catch (error) {
    console.error('[DeepLink] Error getting initial URL:', error);
    return null;
  }
};

// Create a referral deep link
export const createReferralDeepLink = (code: string): string => {
  return Linking.createURL(`referral/${code}`);
};
