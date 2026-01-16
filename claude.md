# Vocab Phone

A React Native vocabulary learning app with iOS home screen and lock screen widget integration, featuring interactive widgets with mastery tracking.

## Overview

Vocab Phone helps users learn vocabulary through a daily learning flow. Each day, the app deterministically generates the same set of words using a seeded random selection algorithm. Users navigate through words, revealing definitions and examples one at a time. iOS widgets display the current daily word on both the home screen and lock screen, with interactive "Got it" / "Repeat" buttons for iOS 17+.

## Tech Stack

- **React Native**: 0.81.5 with New Arch enabled
- **Expo**: ~54.0.30
- **React**: 19.1.0
- **TypeScript**: 5.9.2 (strict mode)
- **Navigation**: React Navigation 7.x (native-stack)
- **Storage**: MMKV v4 for progress persistence, AsyncStorage for settings
- **iOS Widget**: Swift + WidgetKit (iOS 16.0+) with App Intents (iOS 17+)
- **Build**: EAS (Expo Application Services)

## Project Structure

```
src/
├── context/
│   ├── WordsContext.tsx       # Global state, seeded word selection
│   └── ProgressContext.tsx    # Mastery tracking context (v2.0)
├── navigation/AppNavigator.tsx # Stack navigation (Home → Learn → Settings)
├── screens/
│   ├── HomeScreen.tsx         # Landing page
│   ├── LearnScreen.tsx        # Word learning UI with card layout
│   └── SettingsScreen.tsx     # Daily goal selector (3/5/10 words)
├── services/
│   ├── MasteryService.ts      # Mastery calculation & answer recording (v2.0)
│   ├── QueueService.ts        # Daily word queue generation (v2.0)
│   └── storage/
│       └── mmkvStorage.ts     # MMKV persistence helpers (v2.0)
├── types/
│   ├── word.ts                # Word and vocabulary types
│   └── wordProgress.ts        # Progress and mastery types (v2.0)
├── theme/index.ts             # Centralized theme (colors, typography, spacing)
├── data/seedWords.ts          # Vocabulary database (100 words)
├── utils/storage.ts           # AsyncStorage helpers (settings)
└── native/appGroup.ts         # Native module bridge for App Groups

ios/
├── vocabphone/                # Main app target
│   └── Native/AppGroupStore.swift  # React Native ↔ Swift bridge
└── VocabWidget/               # WidgetKit extension
    ├── VocabWidget.swift      # Widget UI (home + lock screen + interactive)
    ├── VocabWidgetBundle.swift # Widget bundle configuration
    └── AppIntent.swift        # App Intents (GotIt, Repeat) for iOS 17+
```

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run web          # Run in web browser
npx tsc --noEmit     # Type check without emitting
```

### iOS Build with CocoaPods

Due to Xcode 16 using project format objectVersion 70 (which CocoaPods doesn't yet support), use this workaround:

```bash
cd ios

# Temporarily downgrade project format for pod install
perl -i -pe 's/objectVersion = 70/objectVersion = 56/' vocabphone.xcodeproj/project.pbxproj

# Install pods
pod install

# Restore project format
perl -i -pe 's/objectVersion = 56/objectVersion = 70/' vocabphone.xcodeproj/project.pbxproj

cd ..
npx expo run:ios
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

### Mastery System (v2.0)

Three-level mastery progression:
- **new**: Never reviewed or 0 consecutive correct
- **learning**: 1-2 consecutive correct answers
- **mastered**: 3+ consecutive correct answers

Progress tracking includes:
- Correct/incorrect counts
- Consecutive correct streak
- Last seen timestamp
- Daily streaks and stats

### iOS Widget

Supports both home screen and lock screen widgets:

**Home Screen** (systemSmall, systemMedium):
- Black background with bold white text
- Displays daily vocabulary word

**Lock Screen** (iOS 16+):
- `accessoryRectangular`: Interactive view with reveal + buttons (iOS 17+)
- `accessoryCircular`: First 4 letters of word
- `accessoryInline`: "Word: [term]" format

**Interactive Features** (iOS 17+):
- Tap to reveal definition
- "Got it" button: Marks correct, advances to next word
- "Repeat" button: Marks for review, continues

### Widget Communication

1. React Native calls `setWidgetState(word)` and `setWidgetQueue(words)` via native module
2. `AppGroupStore.swift` writes to App Groups UserDefaults
3. Triggers `WidgetCenter.shared.reloadAllTimelines()`
4. Widget reads from shared UserDefaults and updates display
5. Interactive buttons trigger App Intents which update progress

### App Groups

- Suite: `group.com.anonymous.vocab-phone`
- Shared keys:
  - `daily_word`: Current word term (legacy)
  - `widget_current_word`: Full word data (JSON)
  - `widget_word_queue`: Today's word queue (JSON array)
  - `word_progress`: Progress data (JSON)
- Enables main app ↔ widget data sharing

## Configuration

- **Bundle ID**: `com.anonymous.vocab-phone`
- **EAS Project ID**: `5243863b-0f29-42d2-9036-b7050e129397`
- **iOS Deployment Target**: 16.0
- **Widget Families**: systemSmall, systemMedium, accessoryRectangular, accessoryCircular, accessoryInline

## State Flow

1. App launch → Load `todayGoal` and `todayWords` from AsyncStorage
2. Date/goal change → Regenerate words using seeded selection
3. Words update → Sync word queue to widget via App Groups
4. Widget interaction → App Intents update progress in shared UserDefaults
5. Widget reloads every 30 minutes or on interaction

## v2.0 Implementation Details

### TypeScript Types (`src/types/wordProgress.ts`)

```typescript
export type MasteryLevel = 'new' | 'learning' | 'mastered';

export interface WordProgress {
  wordId: string;
  masteryLevel: MasteryLevel;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  lastSeenAt: string | null;
  nextReviewDate: string | null;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalWordsReviewed: number;
  totalWordsMastered: number;
  todayReviewedCount: number;
  todayGoalMet: boolean;
}
```

### MMKV Storage (`src/services/storage/mmkvStorage.ts`)

Uses MMKV v4 API (note: v4 uses `createMMKV()` function, not constructor):

```typescript
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'vocab-phone-storage',
});
```

### Mastery Thresholds

```typescript
export const MASTERY_THRESHOLDS = {
  LEARNING: 1,  // 1+ correct to become learning
  MASTERED: 3,  // 3+ consecutive correct to become mastered
};
```

### App Intents (Swift)

Interactive widget buttons use iOS 17 App Intents:

- `GotItIntent`: Marks word correct, increments streak, loads next word
- `RepeatIntent`: Marks for review, resets streak, loads next word

Both intents:
1. Update progress in shared UserDefaults
2. Increment daily review count
3. Load next word from queue
4. Trigger widget timeline reload

## Known Issues & Workarounds

### CocoaPods + Xcode 16

Xcode 16 uses project format objectVersion 70 which CocoaPods doesn't support. Use the perl workaround documented above.

### MMKV v4 API Change

MMKV v4 changed from constructor to factory function. If you see "Cannot read property 'prototype' of undefined", ensure you're using:
```typescript
import { createMMKV } from 'react-native-mmkv';  // Correct
// NOT: import { MMKV } from 'react-native-mmkv'; new MMKV()
```

### Widget Target Setup

The VocabWidget extension target must be manually added in Xcode:
1. File → New → Target → Widget Extension
2. Name: VocabWidget
3. Add existing files from `ios/VocabWidget/` to target
4. Configure App Groups capability
5. Set minimum deployment target to iOS 17.0

## v2.1 UI Redesign (Glassmorphism)

The app UI was redesigned to match the iOS widget's premium dark aesthetic:

### Theme Changes (`src/theme/index.ts`)
- Dark gradient background: `#262633` → `#14141F`
- Purple (`#9966FF`) and blue (`#6699FF`) accents
- White text hierarchy with opacity (100%, 70%, 50%)
- Glassmorphism tokens for cards (8% white overlay, 15% white borders)

### New Components (`src/components/`)
- `GradientBackground`: Dark gradient with purple radial glow
- `GlassCard`: Semi-transparent card with glass borders
- `GradientButton`: Purple-to-blue gradient or glass variant
- `CapsuleBadge`: Rounded pill for part-of-speech labels

### Dependencies Added
- `expo-linear-gradient`: For gradient backgrounds and buttons

## Next Version (v2.2) - Planned Changes

### 1. Lock Screen Widget Enhancement
- Use the largest Lock Screen widget family: `accessoryRectangular`
- Redesign layout for readability: large word text, optional short definition line, minimal padding
- Keep other lock screen families if already supported, but prioritize rectangular

### 2. Home Screen Widget Pronunciation
- Add pronunciationText (IPA or simple phonetic) to the widget UI
- Add a speaker button on the Home Screen widget that deep-links into the app to a Pronunciation screen for the current word and auto-plays audio there
- Don't attempt audio playback inside the widget (not allowed); playback must occur in-app after deep link

### 3. App Logo
- Add proper AppIcon asset set (`Assets.xcassets/AppIcon`) with required sizes
- Confirm the icon shows on device and in Settings

### Deliverables for v2.2
- Exact code diffs + file paths
- Deep link route implementation details
- Build/run verification steps on a real iPhone
