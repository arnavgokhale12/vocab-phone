# LexiStack

A React Native vocabulary learning app with iOS home screen and lock screen widget integration, featuring a premium dark glassmorphism UI.

## Overview

LexiStack helps users learn vocabulary through a daily learning flow. Each day, the app deterministically generates the same set of words using a seeded random selection algorithm. Users navigate through words, revealing definitions and examples one at a time. iOS widgets display the current word on both the home screen (medium/large), syncing in real-time as users navigate through words in the app, with automatic refresh every 4 hours.

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
npm run typecheck    # Type check without emitting
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run validate     # Run all checks (typecheck + lint + test)
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
- Fields: id, term, partOfSpeech, definition, example, difficulty (1-5), tags, synonyms (optional)
- Parts of speech: noun, verb, adj, adv, phrase, other
- 25+ words include synonyms for widget display

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

Supports home screen widgets with real-time sync:

**Home Screen** (systemMedium, systemLarge):
- Dark gradient background matching app theme
- Displays: word, pronunciation, definition, part of speech, synonyms (max 2)
- Speaker button deep-links to app for audio playback

**Widget Sync**:
- **Real-time**: Updates immediately when user navigates to new word in app
- **Automatic**: Refreshes every 4 hours as backup
- Uses `WidgetCenter.shared.reloadAllTimelines()` for instant updates

**Interactive Features** (iOS 17+ via App Intents):
- Widget buttons trigger `GotItIntent` and `RepeatIntent`
- Intents update progress in shared UserDefaults and reload widget
- Progress bar updates reflect learning activity

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
  - `widget_stats`: Daily progress stats (JSON) - `{ learned, goal, streak }`
- Enables main app ↔ widget data sharing

## Configuration

- **App Name**: LexiStack
- **Bundle ID**: `com.anonymous.vocab-phone`
- **Version**: 2.2.0
- **EAS Project ID**: `5243863b-0f29-42d2-9036-b7050e129397`
- **iOS Deployment Target**: 16.0
- **Widget Families**: systemMedium, systemLarge

## State Flow

1. App launch → Load `todayGoal` and `todayWords` from AsyncStorage
2. Date/goal change → Regenerate words using seeded selection
3. Words update → Sync word queue to widget via App Groups
4. Widget interaction → App Intents update progress in shared UserDefaults
5. Widget reloads every 4 hours or on app interaction

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

The VocabWidget extension target was manually added in Xcode (not automated by the config plugin):
1. File → New → Target → Widget Extension
2. Name: VocabWidget
3. Add existing files from `ios/VocabWidget/` to target
4. Configure App Groups capability
5. Set minimum deployment target to iOS 17.0

**CRITICAL: Do NOT run `npx expo prebuild --clean`** - this will delete the VocabWidgetExtension target from the Xcode project. The config plugin only creates widget files but doesn't add the Xcode target. If you accidentally run it, restore from git: `git checkout HEAD -- ios/`

### Widget on Physical Devices

If widget shows blurred/placeholder content on physical device:
1. Simplified widget configuration is required (avoid complex `containerBackground` modifiers)
2. Ensure Face ID & Passcode settings allow widgets when locked
3. Restart device after fresh install to reset widget daemon
4. Force-unwrapped URLs in Link components can crash widget - always use optional binding

### Audio Playback on Physical Devices

`expo-speech` uses `AVSpeechSynthesizer` which respects the mute switch by default. To enable audio playback even when device is on silent:

**Configuration** (`ios/vocabphone/AppDelegate.swift`):
```swift
import AVFoundation

// In didFinishLaunchingWithOptions:
do {
  try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
  try AVAudioSession.sharedInstance().setActive(true)
} catch {
  print("Failed to configure audio session: \(error)")
}
```

This sets:
- Category `.playback`: Ignores mute switch
- Mode `.spokenAudio`: Optimized for speech synthesis
- Option `.duckOthers`: Lowers other audio during speech

## v2.1 UI Redesign & Features

The app was rebranded to **LexiStack** with a premium dark aesthetic:

### App Identity
- **Name**: LexiStack (formerly Vocab Phone)
- **Icon**: Custom dark gradient with purple-to-blue "V" logo
- **Theme**: Dark glassmorphism matching iOS widget style

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

### Widget Updates
- Home screen: systemMedium + systemLarge with word, pronunciation, definition, synonyms
- Real-time sync: Widget updates instantly when navigating to new word in app
- Automatic refresh: Every 4 hours as backup
- Speaker button deep-links to app for pronunciation
- Simplified widget configuration for physical device compatibility

### App Features
- Speaker button in LearnScreen for text-to-speech pronunciation (expo-speech)
- Synonyms field added to Word type and displayed in widgets
- Real-time widget sync when navigating through words

### Dependencies Added
- `expo-linear-gradient`: For gradient backgrounds and buttons
- `expo-speech`: For text-to-speech pronunciation

## v2.2 Spaced Repetition & Progress Tracking

### Light Spaced Repetition

Daily sessions now combine new words with review words:

**Selection Algorithm** (`src/context/WordsContext.tsx`):
1. Get today's deterministic new words (seeded by date)
2. Select up to 3 review words from previously seen, non-mastered words
3. Prioritize by: lower mastery level first, then older `lastSeenAt`
4. Session order: review words first, then new words

```typescript
function selectReviewWords(
  allProgress: Map<string, WordProgress>,
  excludeIds: Set<string>,
  today: string
): string[]
```

### Streak & Daily Progress

**User Stats** (persisted in MMKV):
- `currentStreak`: Increments when daily goal is first met
- `longestStreak`: All-time best streak
- `todayReviewedCount`: Words reviewed today
- `todayGoalMet`: Whether goal was reached today

**Streak Logic** (`src/services/MasteryService.ts`):
- Streak increments when `todayReviewedCount >= todayGoal` for the first time that day
- Streak resets to 1 if more than 1 day passes since `lastActiveDate`
- Streak continues if consecutive days

### UI Changes

**HomeScreen** (`src/screens/HomeScreen.tsx`):
- Progress bar showing "X / Y words today" with gradient fill
- Streak badge with fire emoji when streak > 0
- Button text changes to "Continue Learning" when progress exists

**LearnScreen** (`src/screens/LearnScreen.tsx`):
- Single "Reveal" button when definition is hidden
- "Review Again" / "Got It!" buttons when revealed
- Each answer records progress via `recordAnswer(wordId, correct)`

**ProgressBar Component** (`src/components/ProgressBar.tsx`):
- Gradient fill from purple to blue
- Shows "X / Y words today" label
- "Goal reached!" message when complete

### Widget Progress Display

**Both Medium and Large widgets now show**:
- Progress bar at bottom with gradient fill
- "X/Y words" count
- Streak badge with fire emoji and day count

**Widget Stats Sync** (`src/native/appGroup.ts`):
```typescript
setWidgetStats({ learned: number, goal: number, streak: number })
```

Stored in App Groups as `widget_stats` JSON key.

### New Files in v2.2

- `src/components/ProgressBar.tsx`: Progress bar component
- `eslint.config.js`: ESLint 9 flat config
- `jest.config.js`: Jest test configuration
- `src/__mocks__/`: Test mocks for native modules

## Future Plans

### Potential Enhancements
- Statistics dashboard showing learning progress
- More word categories and difficulty levels
- Android widget support
- Cloud sync for progress across devices
