// Zustand store for subscription state management with RevenueCat
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import {
  initializePurchases,
  loginUser,
  logoutUser,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkPremiumStatus,
  getExpirationDate,
  addCustomerInfoUpdateListener,
  PREMIUM_ENTITLEMENT,
} from '../services/purchases/revenuecat';

export type SubscriptionPlan = 'free' | 'monthly' | 'annual';

interface SubscriptionState {
  // State
  isPremium: boolean;
  subscriptionPlan: SubscriptionPlan;
  expirationDate: Date | null;
  isLoading: boolean;
  error: string | null;
  packages: PurchasesPackage[];

  // Actions
  initialize: (userId?: string) => Promise<void>;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPremium: false,
      subscriptionPlan: 'free',
      expirationDate: null,
      isLoading: false,
      error: null,
      packages: [],

      // Initialize RevenueCat and check subscription status
      initialize: async (userId?: string) => {
        try {
          set({ isLoading: true, error: null });

          await initializePurchases(userId);

          // Set up listener for subscription changes
          addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
            const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
            const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];

            let plan: SubscriptionPlan = 'free';
            if (isPremium && entitlement) {
              // Determine plan type from product identifier
              const productId = entitlement.productIdentifier?.toLowerCase() || '';
              if (productId.includes('annual') || productId.includes('yearly')) {
                plan = 'annual';
              } else if (productId.includes('monthly')) {
                plan = 'monthly';
              }
            }

            set({
              isPremium,
              subscriptionPlan: plan,
              expirationDate: entitlement?.expirationDate
                ? new Date(entitlement.expirationDate)
                : null,
            });
          });

          // Check initial status
          await get().refreshStatus();
          await get().loadOfferings();

          set({ isLoading: false });
        } catch (error: any) {
          console.error('[SubscriptionStore] Initialize error:', error);
          set({ isLoading: false, error: error.message });
        }
      },

      // Login user to RevenueCat
      login: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });
          await loginUser(userId);
          await get().refreshStatus();
          set({ isLoading: false });
        } catch (error: any) {
          console.error('[SubscriptionStore] Login error:', error);
          set({ isLoading: false, error: error.message });
        }
      },

      // Logout from RevenueCat
      logout: async () => {
        try {
          await logoutUser();
          set({
            isPremium: false,
            subscriptionPlan: 'free',
            expirationDate: null,
          });
        } catch (error: any) {
          console.error('[SubscriptionStore] Logout error:', error);
        }
      },

      // Load available packages
      loadOfferings: async () => {
        try {
          const offering = await getOfferings();
          if (offering) {
            set({ packages: offering.availablePackages });
            console.log('[SubscriptionStore] Loaded packages:', offering.availablePackages.length);
          }
        } catch (error: any) {
          console.error('[SubscriptionStore] Load offerings error:', error);
        }
      },

      // Purchase a subscription
      purchase: async (pkg: PurchasesPackage) => {
        try {
          set({ isLoading: true, error: null });

          const { success } = await purchasePackage(pkg);

          if (success) {
            await get().refreshStatus();
          }

          set({ isLoading: false });
          return success;
        } catch (error: any) {
          console.error('[SubscriptionStore] Purchase error:', error);
          set({ isLoading: false, error: error.message });
          return false;
        }
      },

      // Restore previous purchases
      restore: async () => {
        try {
          set({ isLoading: true, error: null });

          const customerInfo = await restorePurchases();
          const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

          await get().refreshStatus();

          set({ isLoading: false });
          return isPremium;
        } catch (error: any) {
          console.error('[SubscriptionStore] Restore error:', error);
          set({ isLoading: false, error: error.message });
          return false;
        }
      },

      // Refresh subscription status
      refreshStatus: async () => {
        try {
          const isPremium = await checkPremiumStatus();
          const expirationDate = await getExpirationDate();

          // Determine plan type
          let plan: SubscriptionPlan = 'free';
          if (isPremium) {
            // For now, we'll default to monthly if we can't determine
            // This will be updated by the listener with actual data
            plan = 'monthly';
          }

          set({
            isPremium,
            subscriptionPlan: isPremium ? plan : 'free',
            expirationDate,
          });
        } catch (error: any) {
          console.error('[SubscriptionStore] Refresh status error:', error);
        }
      },

      // Set error message
      setError: (error: string | null) => set({ error }),

      // Clear error message
      clearError: () => set({ error: null }),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these values
        isPremium: state.isPremium,
        subscriptionPlan: state.subscriptionPlan,
        expirationDate: state.expirationDate,
      }),
    }
  )
);
