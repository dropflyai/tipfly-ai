# TipFly AI - AI Tip Calculator & Earnings Tracker

Track your tips, master your money. A mobile app for service workers to effortlessly track tips, understand earnings, and prepare for taxes.

## Features

### Free Tier
- ✅ Track up to 30 days of tips
- ✅ Basic daily/weekly/monthly summaries
- ✅ Manual tip entry
- ✅ Simple tax estimate (15.3% self-employment)

### Premium Tier ($4.99/month)
- ✅ Unlimited tip history (lifetime)
- ✅ Receipt scanning (OCR)
- ✅ Bill splitting calculator
- ✅ Advanced tax tracking
- ✅ Quarterly tax estimates with reminders
- ✅ Export reports (CSV, PDF)
- ✅ Goal setting
- ✅ Shift analytics

## Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Authentication**: Supabase Auth
- **Payments**: RevenueCat (planned)
- **OCR**: Google Cloud Vision API (planned)
- **AI**: Anthropic Claude API (planned)

## Getting Started

### Prerequisites

- Node.js (v20.18.0 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository
```bash
cd tipflyai-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase

Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create your Supabase project
- Run database migrations
- Set up Row Level Security (RLS)
- Configure authentication
- Set up storage for receipt images

5. Start the development server

```bash
npm run start
```

6. Run on your device

- **iOS**: Press `i` to open iOS simulator (requires macOS)
- **Android**: Press `a` to open Android emulator
- **Physical device**: Scan QR code with Expo Go app

## Project Structure

```
tipflyai-app/
├── src/
│   ├── navigation/          # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── screens/             # All app screens
│   │   ├── onboarding/      # Welcome, job selection, setup
│   │   ├── auth/            # Login, signup
│   │   ├── main/            # Dashboard, add tips, stats, settings
│   │   ├── premium/         # Receipt scan, bill split, tax, goals
│   │   └── subscription/    # Upgrade screen
│   ├── components/          # Reusable components
│   │   ├── cards/          # Earnings cards, stat cards
│   │   ├── charts/         # Charts and graphs
│   │   ├── forms/          # Form components
│   │   └── common/         # Buttons, inputs, etc.
│   ├── services/           # API and external services
│   │   ├── api/            # Supabase API calls
│   │   ├── ocr/            # Receipt scanning
│   │   └── analytics/      # Analytics and insights
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state management
│   ├── utils/              # Utility functions
│   │   ├── calculations.ts # Tax, tips calculations
│   │   ├── formatting.ts   # Currency, date formatting
│   │   └── validation.ts   # Input validation
│   ├── constants/          # App constants
│   │   ├── colors.ts       # Color palette
│   │   └── config.ts       # App configuration
│   └── types/              # TypeScript type definitions
├── assets/                 # Images, icons, fonts
├── App.tsx                 # Main app component
├── app.json                # Expo configuration
├── package.json
├── SUPABASE_SETUP.md      # Supabase setup guide
└── README.md
```

## Development Status

### ✅ Completed
- [x] Project setup with Expo + TypeScript
- [x] Supabase integration
- [x] Database schema
- [x] Navigation structure
- [x] Onboarding flow (Welcome, Job Selection, Quick Setup)
- [x] Authentication (Login, Signup)
- [x] Dashboard screen with earnings cards
- [x] State management with Zustand
- [x] Utility functions (calculations, formatting)

### 🚧 In Progress
- [ ] Add Tip Entry screen
- [ ] Stats screen with charts
- [ ] Settings screen
- [ ] Upgrade/paywall screen

### 📋 Planned
- [ ] Receipt scanner (OCR)
- [ ] Bill splitting calculator
- [ ] Tax dashboard
- [ ] Goal setting
- [ ] Push notifications
- [ ] RevenueCat integration
- [ ] App Store submission

## Database Schema

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for the complete database schema including:
- Users table
- Tip entries table
- Goals table
- Deductions table
- Insights cache table

## Available Scripts

- `npm run start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## Environment Variables

Required environment variables:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional (for premium features)
GOOGLE_CLOUD_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
REVENUECAT_API_KEY=...
```

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

All rights reserved.

## Support

For questions or issues, please contact: support@tipgenius.com

---

**Built with ❤️ for service workers everywhere**
