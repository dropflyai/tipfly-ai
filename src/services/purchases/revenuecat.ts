// RevenueCat service for in-app purchases
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { AppConfig } from '../../constants/config';

// RevenueCat API Keys - you'll need to add these to your config
const REVENUECAT_API_KEY_IOS = AppConfig.REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = AppConfig.REVENUECAT_API_KEY_ANDROID || '';

// Entitlement identifier - this is the name you set in RevenueCat dashboard
export const PREMIUM_ENTITLEMENT = 'TipFly AI Pro';

// Product identifiers - these match what you create in App Store Connect / Play Console
export const PRODUCT_IDS = {
  MONTHLY: 'tipfly_premium_monthly',
  ANNUAL: 'tipfly_premium_annual',
};

// Track initialization status
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Helper to ensure SDK is initialized before making calls
 * Returns true if SDK is ready, false otherwise
 */
function isSDKReady(): boolean {
  return isInitialized;
}

/**
 * Wait for initialization if in progress, or return current state
 */
async function waitForInitialization(): Promise<boolean> {
  if (isInitialized) return true;
  if (initializationPromise) {
    try {
      await initializationPromise;
      return isInitialized;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Initialize RevenueCat SDK
 * Should be called once at app startup
 */
export async function initializePurchases(userId?: string): Promise<void> {
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    console.log('[RevenueCat] Initialization already in progress, waiting...');
    return initializationPromise;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn('[RevenueCat] No API key configured for', Platform.OS);
    return;
  }

  // Create and store the initialization promise
  initializationPromise = (async () => {
    try {
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure with API key
      Purchases.configure({ apiKey });

      // If we have a user ID, log them in
      if (userId) {
        await Purchases.logIn(userId);
      }

      isInitialized = true;
      console.log('[RevenueCat] Initialized successfully');
    } catch (error) {
      console.error('[RevenueCat] Initialization error:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Log in a user to RevenueCat
 * Links purchases to this user ID
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  const ready = await waitForInitialization();
  if (!ready) {
    console.warn('[RevenueCat] SDK not initialized, cannot log in user');
    return null;
  }

  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in:', userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export async function logoutUser(): Promise<void> {
  if (!isSDKReady()) {
    console.warn('[RevenueCat] SDK not initialized, skipping logout');
    return;
  }

  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
    throw error;
  }
}

/**
 * Get available subscription offerings
 * Returns the packages available for purchase
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  // Wait for initialization if in progress
  const ready = await waitForInitialization();
  if (!ready) {
    console.warn('[RevenueCat] SDK not initialized, cannot get offerings');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current) {
      console.log('[RevenueCat] Got offerings:', offerings.current.identifier);
      return offerings.current;
    }

    console.log('[RevenueCat] No current offering available');
    return null;
  } catch (error) {
    console.error('[RevenueCat] Get offerings error:', error);
    throw error;
  }
}

/**
 * Get a specific package from offerings
 */
export async function getPackage(packageId: string): Promise<PurchasesPackage | null> {
  try {
    const offering = await getOfferings();
    if (!offering) return null;

    const pkg = offering.availablePackages.find(
      (p) => p.identifier === packageId || p.product.identifier === packageId
    );

    return pkg || null;
  } catch (error) {
    console.error('[RevenueCat] Get package error:', error);
    return null;
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo | null; success: boolean }> {
  const ready = await waitForInitialization();
  if (!ready) {
    console.warn('[RevenueCat] SDK not initialized, cannot purchase');
    return { customerInfo: null, success: false };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    // Check if the purchase granted premium entitlement
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    console.log('[RevenueCat] Purchase completed, isPremium:', isPremium);
    return { customerInfo, success: isPremium };
  } catch (error: any) {
    // Handle user cancellation
    if (error.userCancelled) {
      console.log('[RevenueCat] Purchase cancelled by user');
      const customerInfo = await getCustomerInfo();
      return { customerInfo, success: false };
    }

    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
}

/**
 * Purchase by product identifier
 */
export async function purchaseProduct(
  productId: string
): Promise<{ customerInfo: CustomerInfo | null; success: boolean }> {
  try {
    const pkg = await getPackage(productId);
    if (!pkg) {
      throw new Error(`Product not found: ${productId}`);
    }
    return purchasePackage(pkg);
  } catch (error) {
    console.error('[RevenueCat] Purchase product error:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 * Use when user reinstalls app or logs in on new device
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  const ready = await waitForInitialization();
  if (!ready) {
    console.warn('[RevenueCat] SDK not initialized, cannot restore purchases');
    return null;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
}

/**
 * Get current customer info
 * Contains subscription status and entitlements
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const ready = await waitForInitialization();
  if (!ready) {
    console.warn('[RevenueCat] SDK not initialized, cannot get customer info');
    return null;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Get customer info error:', error);
    throw error;
  }
}

/**
 * Check if user has premium entitlement
 */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      console.log('[RevenueCat] No customer info, assuming not premium');
      return false;
    }
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
    console.log('[RevenueCat] Premium status:', isPremium);
    return isPremium;
  } catch (error) {
    console.error('[RevenueCat] Check premium status error:', error);
    return false;
  }
}

/**
 * Get subscription expiration date
 */
export async function getExpirationDate(): Promise<Date | null> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;

    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];

    if (entitlement?.expirationDate) {
      return new Date(entitlement.expirationDate);
    }

    return null;
  } catch (error) {
    console.error('[RevenueCat] Get expiration date error:', error);
    return null;
  }
}

/**
 * Set up a listener for customer info updates
 * Returns an unsubscribe function
 */
export function addCustomerInfoUpdateListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  if (!isSDKReady()) {
    console.warn('[RevenueCat] SDK not initialized, listener will not be added');
    return () => {}; // Return no-op unsubscribe
  }

  // In newer RevenueCat SDK versions, this returns void
  // The listener is managed internally by the SDK
  Purchases.addCustomerInfoUpdateListener(callback);

  // Return a no-op since the SDK manages listener lifecycle
  return () => {
    // Listener is managed by SDK - no manual removal needed
  };
}

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get monthly equivalent price for annual subscription
 */
export function getMonthlyEquivalent(pkg: PurchasesPackage): string {
  if (pkg.packageType === 'ANNUAL') {
    const yearlyPrice = pkg.product.price;
    const monthlyPrice = yearlyPrice / 12;
    const currencySymbol = pkg.product.priceString.replace(/[\d.,]/g, '').trim();
    return `${currencySymbol}${monthlyPrice.toFixed(2)}`;
  }
  return pkg.product.priceString;
}

/**
 * Calculate savings percentage for annual vs monthly
 */
export function calculateSavings(monthlyPkg: PurchasesPackage, annualPkg: PurchasesPackage): number {
  const monthlyTotal = monthlyPkg.product.price * 12;
  const annualPrice = annualPkg.product.price;
  const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
  return Math.round(savings);
}
