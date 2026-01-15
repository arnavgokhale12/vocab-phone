# Vocab Phone

A React Native vocabulary learning app with iOS home screen and lock screen widget integration.

## Overview

Vocab Phone helps users learn vocabulary through a daily learning flow. Each day, the app deterministically generates the same set of words using a seeded random selection algorithm. Users navigate through words, revealing definitions and examples one at a time. iOS widgets display the current daily word on both the home screen and lock screen.

## Tech Stack

- **React Native**: 0.81.5 with New Arch enabled
- **Expo**: ~54.0.30
- **React**: 19.1.0
- **TypeScript**: 5.9.2 (strict mode)
- **Navigation**: React Navigation 7.x (native-stack)
- **Storage**: AsyncStorage for persistence
- **iOS Widget**: Swift + WidgetKit (iOS 16.0+, with lock screen support)
- **Build**: EAS (Expo Application Services)

## Project Structure

```
src/
├── context/WordsContext.tsx   # Global state, seeded word selection
├── navigation/AppNavigator.tsx # Stack navigation (Home → Learn → Settings)
├── screens/
│   ├── HomeScreen.tsx         # Landing page
│   ├── LearnScreen.tsx        # Word learning UI with card layout
│   └── SettingsScreen.tsx     # Daily goal selector (3/5/10 words)
├── theme/index.ts             # Centralized theme (colors, typography, spacing)
├── types/word.ts              # TypeScript types
├── data/seedWords.ts          # Vocabulary database (100 words)
├── utils/storage.ts           # AsyncStorage helpers
└── native/appGroup.ts         # Native module bridge for App Groups

ios/
├── vocabphone/                # Main app target
│   └── Native/AppGroupStore.swift  # React Native ↔ Swift bridge
└── VocabWidget/               # WidgetKit extension
    └── VocabWidget.swift      # Widget UI (home + lock screen)
```

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run web          # Run in web browser
```

### Production Build

```bash
eas build --platform ios --profile production
```

## Key Architecture

### Theme System

Centralized design tokens in `src/theme/index.ts`:
- **Colors**: Background, text, accent, cards, borders
- **Typography**: Display, heading, body, label sizes with weights
- **Spacing**: xs (4), sm (8), md (16), lg (24), xl (32), xxl (48)
- **Border Radius**: sm (8), md (12), lg (16), xl (24)
- **Shadows**: sm, md, lg elevation presets

### Vocabulary Database

100 curated words in `src/data/seedWords.ts`:
- Mix of practical everyday and interesting words
- Fields: id, term, partOfSpeech, definition, example, difficulty (1-5), tags
- Parts of speech: noun, verb, adj, adv, phrase, other

### Seeded Word Selection

Daily words are deterministic using FNV-1a hash with the date as seed:
- Seed format: `YYYY-MM-DD`
- Same date produces same word set across all devices
- Configurable daily goal: 3, 5, or 10 words

### iOS Widget

Supports both home screen and lock screen widgets:

**Home Screen** (systemSmall, systemMedium):
- Black background with bold white text
- Displays daily vocabulary word

**Lock Screen** (iOS 16+):
- `accessoryRectangular`: "TODAY'S WORD" label + word
- `accessoryCircular`: First 4 letters of word
- `accessoryInline`: "Word: [term]" format

### Widget Communication

1. React Native calls `setSharedString("daily_word", word)` via native module
2. `AppGroupStore.swift` writes to App Groups UserDefaults
3. Triggers `WidgetCenter.shared.reloadAllTimelines()`
4. Widget reads from shared UserDefaults and updates display

### App Groups

- Suite: `group.com.anonymous.vocab-phone`
- Shared key: `daily_word`
- Enables main app ↔ widget data sharing

## Configuration

- **Bundle ID**: `com.anonymous.vocab-phone`
- **EAS Project ID**: `5243863b-0f29-42d2-9036-b7050e129397`
- **iOS Deployment Target**: 16.0
- **Widget Families**: systemSmall, systemMedium, accessoryRectangular, accessoryCircular, accessoryInline

## State Flow

1. App launch → Load `todayGoal` and `todayWords` from AsyncStorage
2. Date/goal change → Regenerate words using seeded selection
3. Words update → Sync first word to widget via App Groups
4. Widget reloads every 30 minutes or on app update
