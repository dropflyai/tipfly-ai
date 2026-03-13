// App configuration constants

export const AppConfig = {
  APP_NAME: 'TipFly AI',
  APP_TAGLINE: 'Track Your Tips, Master Your Money',

  // Pricing (Launch pricing - can raise later)
  PREMIUM_MONTHLY_PRICE: 2.99,
  PREMIUM_ANNUAL_PRICE: 19.99,
  BUSINESS_MONTHLY_PRICE: 47.00,

  // Free tier limits
  FREE_HISTORY_DAYS: 30,

  // Tax rates
  DEFAULT_TAX_RATE: 0.153, // 15.3% self-employment tax

  // Job types
  JOB_TYPES: [
    { id: 'waiter', label: 'Waiter/Server', icon: '🍽️' },
    { id: 'bartender', label: 'Bartender', icon: '🍸' },
    { id: 'stylist', label: 'Hair Stylist/Barber', icon: '✂️' },
    { id: 'nail_tech', label: 'Nail Technician', icon: '💅' },
    { id: 'driver', label: 'Rideshare Driver', icon: '🚗' },
    { id: 'delivery', label: 'Delivery Driver', icon: '📦' },
    { id: 'other', label: 'Other', icon: '🤷' },
  ],

  // Shift types
  SHIFT_TYPES: [
    { id: 'day', label: 'Day Shift' },
    { id: 'night', label: 'Night Shift' },
    { id: 'double', label: 'Double Shift' },
    { id: 'other', label: 'Other' },
  ],

  // Deduction categories
  DEDUCTION_CATEGORIES: [
    { id: 'mileage', label: 'Mileage', icon: '🚗' },
    { id: 'uniform', label: 'Uniform/Attire', icon: '👔' },
    { id: 'supplies', label: 'Supplies', icon: '🧴' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'training', label: 'Training/Certs', icon: '📚' },
    { id: 'phone', label: 'Phone/Tech', icon: '📱' },
    { id: 'fees', label: 'Fees/Dues', icon: '💼' },
    { id: 'other', label: 'Other', icon: '📝' },
  ],

  // Currency
  DEFAULT_CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',

  // Support
  SUPPORT_EMAIL: 'support@tipflyai.app',

  // RevenueCat API Keys (get these from RevenueCat dashboard)
  // iOS: App Settings > API Keys > Public app-specific API key (iOS)
  // Android: App Settings > API Keys > Public app-specific API key (Android)
  REVENUECAT_API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  REVENUECAT_API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',

  // RevenueCat Product IDs (must match App Store Connect / Play Console)
  PRODUCT_MONTHLY: 'tipfly_premium_monthly',
  PRODUCT_ANNUAL: 'tipfly_premium_annual',
};

export const FeatureFlags = {
  ENABLE_RECEIPT_SCANNER: false, // Coming soon
  ENABLE_BILL_SPLIT: true,
  ENABLE_TAX_TRACKING: true,
  ENABLE_GOALS: true,
  ENABLE_VOICE_INPUT: false, // Coming soon
  ENABLE_SOCIAL_SHARING: true,
};
