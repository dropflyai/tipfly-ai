# TipFly AI - Claude Code Instructions

## Project Overview
TipFly AI is a React Native/Expo mobile app for hospitality workers to track tips, manage finances, and optimize earnings.

## Tech Stack
- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Navigation:** React Navigation
- **State:** Zustand or AsyncStorage
- **AI:** Anthropic Claude SDK
- **Database:** Supabase
- **Testing:** Maestro (E2E)
- **Build:** EAS Build

## Project Structure
```
tipfly-ai/
├── src/
│   ├── screens/        # Screen components
│   ├── components/     # Reusable components
│   ├── navigation/     # Navigation setup
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── stores/         # State management
│   └── types/          # TypeScript types
├── assets/             # Images, fonts
├── .maestro/           # E2E test flows
├── supabase/           # Database config
└── app.json            # Expo config
```

## Common Commands
```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npx expo start --clear # Clear cache and start
eas build              # Build with EAS
```

## Key Files
- `App.tsx` - Entry point
- `app.json` - Expo configuration
- `eas.json` - EAS Build config
- `.maestro/` - E2E test flows

## Maestro Testing
```bash
maestro test .maestro/flow.yaml  # Run E2E tests
```

## Development Notes
<!-- Add notes here as you work on the project -->

## Gotchas & Lessons Learned
- Always clear Expo cache when dependencies change
- iOS simulator needs Xcode command line tools
- Maestro tests need simulator running first

## When Working on This Project
1. Start with `npx expo start --clear` if having issues
2. Use iOS simulator for testing (faster than device)
3. Run Maestro tests before submitting to App Store
4. Check Supabase dashboard for user data
