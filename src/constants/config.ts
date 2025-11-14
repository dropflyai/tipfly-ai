// App configuration constants

export const AppConfig = {
  APP_NAME: 'TipFly AI',
  APP_TAGLINE: 'Track Your Tips, Master Your Money',

  // Pricing
  PREMIUM_MONTHLY_PRICE: 4.99,
  PREMIUM_ANNUAL_PRICE: 39.99,
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
    { id: 'mileage', label: 'Mileage' },
    { id: 'supplies', label: 'Supplies' },
    { id: 'phone', label: 'Phone Bill' },
    { id: 'other', label: 'Other' },
  ],

  // Currency
  DEFAULT_CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',

  // Support
  SUPPORT_EMAIL: 'support@tipgenius.com',
};

export const FeatureFlags = {
  ENABLE_RECEIPT_SCANNER: true,
  ENABLE_BILL_SPLIT: true,
  ENABLE_TAX_TRACKING: true,
  ENABLE_GOALS: true,
  ENABLE_VOICE_INPUT: false, // Coming soon
  ENABLE_SOCIAL_SHARING: true,
};
