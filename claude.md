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
├── constants/
│   └── levels.ts              # Lexi Levels thresholds and definitions (v2.8)
├── context/
│   ├── WordsContext.tsx       # Global state, seeded word selection
│   └── ProgressContext.tsx    # Mastery tracking context (v2.0)
├── navigation/AppNavigator.tsx # Stack navigation (Home → Learn → Settings)
├── screens/
│   ├── HomeScreen.tsx         # Landing page with quiz CTA
│   ├── LearnScreen.tsx        # Word learning UI with card layout
│   ├── BookmarksScreen.tsx    # Bookmarked words list (v2.4)
│   ├── PlacementTestScreen.tsx # Onboarding placement quiz (v2.7)
│   ├── QuizScreen.tsx         # End-of-day quiz with multiple choice (v2.3)
│   ├── QuizSummaryScreen.tsx  # Quiz results screen (v2.3)
│   ├── LibraryScreen.tsx      # All words with progress filters (v2.11)
│   ├── WordDetailScreen.tsx   # Individual word stats (v2.11)
│   ├── CustomListsScreen.tsx  # Custom list management (v2.12)
│   ├── CustomListDetailScreen.tsx # Create/edit custom list (v2.12)
│   ├── SessionSummaryScreen.tsx # Post-session stats summary (v2.13)
│   ├── WeakWordsQuizScreen.tsx # Mini-quiz for weak words review (v2.13)
│   └── SettingsScreen.tsx     # Daily goal selector (3/5/10 words)
├── services/
│   ├── MasteryService.ts      # Mastery calculation & answer recording (v2.0)
│   ├── QueueService.ts        # Daily word queue generation (v2.0)
│   ├── QuizService.ts         # Quiz generation with Fisher-Yates shuffle (v2.3)
│   ├── LevelService.ts        # Lexi Levels progression computation (v2.8)
│   └── storage/
│       └── mmkvStorage.ts     # MMKV persistence + quiz/session/bookmark/placement storage (v2.7)
├── types/
│   ├── word.ts                # Word and vocabulary types
│   ├── wordProgress.ts        # Progress and mastery types (v2.0)
│   ├── quiz.ts                # Quiz types (v2.3)
│   ├── customList.ts          # Custom list types (v2.12)
│   └── sessionSummary.ts      # Session summary types (v2.13)
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
perl -i -pe 's/objectVersion = 70/objectVersion = 56/' VocabPhone.xcodeproj/project.pbxproj

# Install pods
pod install

# Restore project format
perl -i -pe 's/objectVersion = 56/objectVersion = 70/' VocabPhone.xcodeproj/project.pbxproj

cd ..

# Build to /tmp to avoid xattr code signing issues (see note below)
xcodebuild -workspace ios/VocabPhone.xcworkspace -scheme vocabphone -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath /tmp/vocab-build

# Install and launch on simulator
xcrun simctl install "iPhone 17 Pro" /tmp/vocab-build/Build/Products/Debug-iphonesimulator/vocabphone.app
xcrun simctl launch "iPhone 17 Pro" com.anonymous.vocab-phone
```

### macOS xattr Code Signing Issue

If builds fail with "resource fork, Finder information, or similar detritus not allowed" during CodeSign:

**Cause**: The project directory has `com.apple.provenance` or `com.apple.macl` extended attributes that get inherited by build outputs, causing code signing to fail.

**Workaround**: Build to a location outside the project directory (e.g., `/tmp`):
```bash
xcodebuild -workspace ios/VocabPhone.xcworkspace -scheme vocabphone \
  -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath /tmp/vocab-build
```

**Alternative**: Clear xattrs from project directory (may require repeated clearing):
```bash
xattr -d com.apple.provenance /path/to/project 2>/dev/null
xattr -d com.apple.macl /path/to/project 2>/dev/null
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
- **Version**: 2.13.0
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

### Workspace Duplicate Project Fix

If Xcode shows two project entries (e.g., "vocabphone" and "VocabPhone"), the workspace file has duplicate references. Fix by editing `ios/VocabPhone.xcworkspace/contents.xcworkspacedata` to only include the actual project:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Workspace version = "1.0">
   <FileRef location = "group:VocabPhone.xcodeproj"/>
   <FileRef location = "group:Pods/Pods.xcodeproj"/>
</Workspace>
```

**IMPORTANT**: Always use capitalized names for build commands:
- Workspace: `VocabPhone.xcworkspace`
- Scheme: `vocabphone`
- Project folder: `VocabPhone.xcodeproj`

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
- `LevelBadge`: Level progress display with gradient bar (v2.8)
- `WeeklyCalendar`: Mon-Sun calendar row with completion status (v2.9)

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
- `expo-haptics`: For tactile feedback on quiz answers and session completion

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

## Verification

### Quick Validation

Run all checks with a single command:

```bash
npm run validate
```

**Expected output:**
```
> vocab-phone@1.0.0 validate
> npm run typecheck && npm run lint && npm run test

> vocab-phone@1.0.0 typecheck
> tsc --noEmit

> vocab-phone@1.0.0 lint
> eslint src --ext .ts,.tsx

> vocab-phone@1.0.0 test
> jest

PASS src/services/__tests__/MasteryService.test.ts
PASS src/services/__tests__/mmkvStorage.test.ts

Test Suites: 2 passed, 2 total
Tests:       37 passed, 37 total
```

Note: `console.error` output during tests is expected - these are from tests verifying corrupted data handling.

### Individual Checks

```bash
npm run typecheck    # TypeScript compilation (should complete with no errors)
npm run lint         # ESLint (should complete with no errors)
npm run test         # Jest tests (37 tests should pass)
```

### iOS Simulator Build

```bash
cd ios
perl -i -pe 's/objectVersion = 70/objectVersion = 56/' vocabphone.xcodeproj/project.pbxproj
pod install
perl -i -pe 's/objectVersion = 56/objectVersion = 70/' vocabphone.xcodeproj/project.pbxproj
cd ..
npx expo run:ios
```

**Success indicators:**
- Build completes without errors
- App launches in simulator
- HomeScreen shows "Today" with word count
- LearnScreen shows word card with speaker button
- Widget appears in simulator widget gallery

### Manual Testing Checklist

1. **Fresh install**: Uninstall app, reinstall, verify default state (0 streak, 0 progress)
2. **Learn flow**: Tap "Start Learning", reveal word, tap "Got It!" - verify progress increments
3. **Review flow**: Tap "Review Again" - verify word returns to queue
4. **Streak**: Complete daily goal, verify streak badge appears on HomeScreen
5. **Widget sync**: Navigate through words, verify widget updates in real-time
6. **Silent mode**: Enable silent mode, tap speaker button, verify audio plays
7. **Day rollover**: Change device date, reopen app, verify new words are selected

## v2.3 End-of-Day Quiz

An interactive quiz feature that tests users on words they've seen during the day.

### Quiz Flow

1. **Track Seen Words**: When user reveals a word in LearnScreen, it's added to `seenWordIds` for today
2. **Quiz Availability**: "Take Today's Quiz" button appears on HomeScreen when words have been seen
3. **Quiz Generation**: Creates multiple-choice questions from seen words
4. **Answer Feedback**: Green/red highlighting for correct/incorrect answers
5. **Results**: Summary screen showing score and per-question breakdown

### Quiz Types (`src/types/quiz.ts`)

```typescript
export interface QuizQuestion {
  wordId: string;
  term: string;
  correctDefinition: string;
  options: string[];  // 4 shuffled options
  correctIndex: number;
}

export interface DailyQuizStatus {
  date: string;
  seenWordIds: string[];
  quizTaken: boolean;
  quizScore: number | null;
}
```

### Quiz Generation (`src/services/QuizService.ts`)

**Algorithm**:
1. For each seen word, create a question with the term and correct definition
2. Select 3 random distractor definitions from other words (avoiding duplicates)
3. Shuffle all 4 options using Fisher-Yates algorithm
4. Track the correct answer's new index
5. Shuffle question order for variety

```typescript
function generateQuiz(seenWordIds: string[], allWords: Word[]): QuizQuestion[]
function shuffleArray<T>(array: T[]): T[]  // Fisher-Yates shuffle
function selectDistractors(correctWordId: string, correctDefinition: string, allWords: Word[]): string[]
```

### Storage Functions (`src/services/storage/mmkvStorage.ts`)

New functions for quiz persistence:
- `getDailyQuizStatus()`: Get today's quiz status (resets on new day)
- `setDailyQuizStatus(status)`: Save quiz status
- `addSeenWord(wordId)`: Track word as seen for today's quiz
- `getSeenWordIds()`: Get list of seen word IDs for today
- `getQuizSession()`: Get current quiz session
- `setQuizSession(session)`: Save quiz session
- `markQuizComplete(score)`: Mark quiz as taken with score

### UI Components

**QuizScreen** (`src/screens/QuizScreen.tsx`):
- Progress indicator ("3 of 5")
- Term displayed prominently in glass card
- 4 option buttons with letter labels (A, B, C, D)
- Color feedback on selection: green (correct), red (incorrect)
- "Next" button after answer, "See Results" on last question

**QuizSummaryScreen** (`src/screens/QuizSummaryScreen.tsx`):
- Large score display with percentage
- Contextual message based on score (100% = "Perfect!", <60% = "Keep learning!")
- Per-question breakdown with checkmark/X icons
- "Done" button returns to HomeScreen

**HomeScreen Changes**:
- "Take Today's Quiz" button (visible when seenWords > 0 && !quizTaken)
- "Quiz Complete: X/Y" badge after quiz is taken

### Navigation Routes

```typescript
// Added to RootStackParamList
Quiz: undefined;
QuizSummary: {
  score: number;
  total: number;
  results: QuizQuestionResult[];
};
```

### Mastery Integration

Quiz answers update mastery tracking:
- Correct answer: `recordAnswer(wordId, true)` - increments consecutiveCorrect
- Incorrect answer: `recordAnswer(wordId, false)` - resets consecutiveCorrect

### Edge Cases Handled

- **No words seen**: Quiz button hidden on HomeScreen
- **Quiz already taken**: Shows "Quiz Complete: X/Y" badge instead of button
- **Day rollover**: Quiz status resets, fresh quiz available
- **<4 words in database**: Uses available words for distractors
- **Duplicate definitions**: Filtered when selecting distractors

## v2.4 Resume Learning & Bookmarks

### Resume Learning

Session state is persisted so users can resume from where they left off:

**Storage** (`src/services/storage/mmkvStorage.ts`):
```typescript
interface LearnSessionState {
  dateKey: string;      // Local date YYYY-MM-DD
  lastIndex: number;    // 0-based index into todayWords
  lastWordId: string | null;
  completed: boolean;
}

// Functions
getLearnSession(): LearnSessionState | null
updateLearnSessionIndex(index: number, wordId: string | null): void
markLearnSessionComplete(): void
clearLearnSession(): void
```

**LearnScreen Behavior**:
- On mount: loads session, resumes from `lastIndex` if same day and not completed
- On index change: persists via `updateLearnSessionIndex()`
- When all words done: calls `markLearnSessionComplete()`

**Edge Cases**:
- List length changes: index clamped to valid range
- Session completed: starts fresh from index 0
- New day: session resets automatically

### Bookmarks

Users can favorite words for later review:

**Storage** (`src/services/storage/mmkvStorage.ts`):
```typescript
interface BookmarkEntry {
  wordId: string;
  term: string;
  definition: string;
  bookmarkedAt: number;
}

// Functions
getBookmarks(): Map<string, BookmarkEntry>
setBookmark(wordId: string, term: string, definition: string): void
removeBookmark(wordId: string): void
isBookmarked(wordId: string): boolean
toggleBookmark(wordId: string, term: string, definition: string): boolean
```

**UI Changes**:
- **LearnScreen**: Heart icon next to speaker button toggles bookmark
- **HomeScreen**: Heart icon in header navigates to BookmarksScreen
- **BookmarksScreen**: Lists all bookmarked words (newest first) with remove button

**Navigation**: Added `Bookmarks: undefined` route to `RootStackParamList`

## v2.5 Haptics & Animations

Subtle polish for quiz and session completion flows using native haptic feedback and React Native's Animated API.

### Haptic Feedback

Uses `expo-haptics` for tactile feedback:

**Quiz Answers** (`src/screens/QuizScreen.tsx`):
- `ImpactFeedbackStyle.Light`: Correct answer selection
- `ImpactFeedbackStyle.Heavy`: Incorrect answer selection

**Session Completion**:
- `NotificationFeedbackType.Success`: Daily session complete (LearnScreen "All Done!")
- `NotificationFeedbackType.Success`: Quiz complete (QuizSummaryScreen)

### Card Transition Animations

Uses React Native's `Animated` API (no Reanimated dependency):

**QuizScreen**:
- Question card slides left and fades out on "Next"
- New question slides in from right with fade-in
- Subtle scale micro-animation on option selection (0.98 → 1.0)

**Implementation**:
```typescript
// Animation values
const cardOpacity = useRef(new Animated.Value(1)).current;
const cardTranslateX = useRef(new Animated.Value(0)).current;
const optionScale = useRef(new Animated.Value(1)).current;

// Card transition: slide out left, slide in from right
Animated.parallel([
  Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
  Animated.timing(cardTranslateX, { toValue: -30, duration: 150, useNativeDriver: true }),
]).start(() => {
  // Update state, then animate in
  cardTranslateX.setValue(30);
  Animated.parallel([...]).start();
});
```

All animations use `useNativeDriver: true` for 60fps performance.

## v2.6 Numeric Mastery Level

Added integer-based mastery tracking (0-3) alongside the existing string-based system.

### Data Model

New field added to `WordProgress` (`src/types/wordProgress.ts`):

```typescript
interface WordProgress {
  // ... existing fields
  /**
   * Numeric mastery level (0-3) for simpler tracking.
   * Rule: correct +1, incorrect -1, clamped to [0, 3].
   * 0 = new, 1 = learning, 2 = familiar, 3 = mastered
   */
  numericMasteryLevel: number;
}
```

### Mastery Update Rule

Simple deterministic rule (`src/services/MasteryService.ts`):

```typescript
/**
 * Update numeric mastery level (0-3) based on answer correctness.
 *
 * Rule:
 * - Correct answer: numericMasteryLevel = min(current + 1, 3)
 * - Incorrect answer: numericMasteryLevel = max(current - 1, 0)
 *
 * Levels:
 *   0 = new (never answered correctly)
 *   1 = learning (some correct answers)
 *   2 = familiar (progressing well)
 *   3 = mastered (highest level)
 */
export function updateNumericMastery(currentLevel: number, isCorrect: boolean): number
```

### Storage Validation & Migration

Storage validation in `mmkvStorage.ts`:
- Clamps numericMasteryLevel to [0, 3]
- Defaults to 0 for existing users (migration)
- Validates counts are non-negative
- Handles corrupted storage gracefully

### Integration

The `recordAnswer()` function in MasteryService now:
1. Updates `correctCount` / `incorrectCount`
2. Updates `consecutiveCorrect` (for string-based masteryLevel)
3. Updates `masteryLevel` (string: 'new' | 'learning' | 'mastered')
4. Updates `numericMasteryLevel` (integer: 0-3)
5. Updates `lastSeenAt` (ISO timestamp)

Quiz and Learn screens already call `recordAnswer()`, so stats are automatically tracked.

## v2.7 Placement Test & Difficulty Bias

Onboarding placement quiz shown on first launch to estimate user vocabulary level.

### Placement Test Flow

1. **First Launch Detection**: AppNavigator checks `hasCompletedPlacementTest()`
2. **Initial Route**: PlacementTest if not completed, Home otherwise
3. **10 Questions**: 2 questions per difficulty level (1-5) for balanced assessment
4. **Level Estimation**: Score 0-10 mapped to estimated level 1-5

### Storage (`src/services/storage/mmkvStorage.ts`)

```typescript
interface PlacementTestResult {
  hasCompleted: boolean;
  score: number;        // 0-10
  estimatedLevel: number; // 1-5
  completedAt: string | null;
}

// Functions
hasCompletedPlacementTest(): boolean
getEstimatedLevel(): number
completePlacementTest(score: number): PlacementTestResult
calculateEstimatedLevel(score: number): number
```

**Score to Level Mapping**:
- Score 0-2: Level 1 (beginner)
- Score 3-4: Level 2
- Score 5-6: Level 3
- Score 7-8: Level 4
- Score 9-10: Level 5 (advanced)

### Difficulty-Biased Word Selection

Daily word selection biased by estimated level (`src/context/WordsContext.tsx`):

```typescript
seededPickWithDifficultyBias(words, seed, count, estimatedLevel)
```

**Distribution for level k**:
- 70% from difficulty k-1 to k+1 (comfort zone)
- 20% from difficulty k+2 (stretch words)
- 10% from other difficulties

**Properties**:
- Deterministic: Same seed always produces same selection
- Maintains daily seed behavior for consistency across devices
- Gracefully handles edge cases (levels 1 and 5)

### PlacementTestScreen

- 10 multiple-choice questions
- Difficulty indicator (stars) for each question
- Haptic feedback on answers
- Card transition animations
- Navigates to Home on completion

### Navigation Changes

Added `PlacementTest` route to `RootStackParamList`:
- Initial route when placement test not completed
- Replaced to Home after completion (no back navigation)

### Migration

Existing users default to:
- `hasCompleted: false` (will see placement test)
- `estimatedLevel: 3` (middle level as default)

To skip placement test for existing users, manually set:
```typescript
setPlacementTestResult({ hasCompleted: true, score: 5, estimatedLevel: 3, completedAt: null });
```

## v2.8 Lexi Levels Progression

Gamification system based on total mastered words (numericMasteryLevel == 3).

### Level Definitions (`src/constants/levels.ts`)

```typescript
type LevelId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface LevelDefinition {
  id: LevelId;
  name: string;
  minMastered: number;
  color: string;
  icon: string;
}
```

**Thresholds (based on 100 total words):**
| Level | Min Mastered | Icon |
|-------|--------------|------|
| Bronze | 0 | 🥉 |
| Silver | 10 | 🥈 |
| Gold | 25 | 🥇 |
| Platinum | 50 | 💎 |
| Diamond | 75 | 👑 |

### LevelService (`src/services/LevelService.ts`)

```typescript
interface LevelProgress {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  masteredCount: number;
  progressToNext: number;      // 0-1
  wordsToNextLevel: number;
  totalWords: number;
  overallMasteryPercent: number;
}

// Functions
getMasteredWordCount(): number
getCurrentLevel(masteredCount): LevelDefinition
getNextLevel(masteredCount): LevelDefinition | null
getProgressToNextLevel(masteredCount): number
getLevelProgress(): LevelProgress
```

### LevelBadge Component (`src/components/LevelBadge.tsx`)

Displays:
- Level icon and name
- Mastered word count
- Progress bar toward next level (gradient from current to next level color)
- "Maximum Level Achieved!" badge when at Diamond

### HomeScreen Integration

Level badge shown in a GlassCard between daily progress and actions:
- Updates immediately when screen gains focus (after quizzes/sessions)
- Uses `useFocusEffect` to refresh `getLevelProgress()`

### Immediate Updates

Level progress updates immediately after:
- Quiz completion (recordAnswer updates numericMasteryLevel)
- Learn session answers (recordAnswer updates numericMasteryLevel)
- HomeScreen refresh on focus

## v2.9 Weekly Goals

Track weekly learning consistency alongside daily goals.

### Storage (`src/services/storage/mmkvStorage.ts`)

```typescript
interface WeeklyGoalState {
  weeklyTargetDays: number;  // 1-7, default 5
  dailyCompletions: Record<string, boolean>;  // dateKey (YYYY-MM-DD) -> completed
}

// Functions
getWeeklyTargetDays(): number
setWeeklyTargetDays(days: number): void
getDailyCompletions(): Record<string, boolean>
markDayCompleted(dateKey: string): void
isDayCompleted(dateKey: string): boolean
getCurrentWeekCompletions(): WeekDayData[]
pruneOldCompletions(): void  // Keeps last 4 weeks
```

### WeeklyCalendar Component (`src/components/WeeklyCalendar.tsx`)

Displays Mon-Sun row with completion status:
- Completed days: filled purple circle with checkmark
- Today (not completed): purple outlined circle
- Future days: muted/grayed out
- Past incomplete days: muted circle
- Progress text: "3/5 days completed"

### Completion Trigger

Day is marked complete when daily goal is reached (`src/context/ProgressContext.tsx`):
```typescript
useEffect(() => {
  if (todayProgress.learned >= todayProgress.goal && todayProgress.goal > 0) {
    markDayCompleted(dateKey);
  }
}, [todayProgress.learned, todayProgress.goal]);
```

### Settings Integration

Weekly target selector in SettingsScreen:
- Options: 3, 4, 5, 6, 7 days per week
- Horizontal button row with glassmorphism styling
- Persisted immediately to MMKV storage

### HomeScreen Changes

WeeklyCalendar displayed below LevelBadge:
- Refreshes on screen focus via `useFocusEffect`
- Shows current week's progress (Mon-Sun)
- Highlights today with distinct styling

### Week Handling

- Week starts Monday (ISO standard)
- Uses local time for date calculations
- Old completion data pruned (keeps last 4 weeks)
- No external dependencies (pure date math)

## v2.10 Streak Notifications

Local push notifications to help users maintain their learning streak.

### Dependencies

```bash
npx expo install expo-notifications expo-device @react-native-community/datetimepicker
```

### Storage (`src/services/storage/mmkvStorage.ts`)

```typescript
interface NotificationSettings {
  enabled: boolean;           // Default false until permission granted
  reminderHour: number;       // 0-23, default 19 (7 PM)
  reminderMinute: number;     // 0-59, default 0
  permissionAsked: boolean;   // Track if we've asked for permission
}

// Functions
getNotificationSettings(): NotificationSettings
setNotificationSettings(settings: NotificationSettings): void
setNotificationsEnabled(enabled: boolean): void
setReminderTime(hour: number, minute: number): void
hasAskedNotificationPermission(): boolean
markNotificationPermissionAsked(): void
```

### NotificationService (`src/services/NotificationService.ts`)

```typescript
// Core functions
requestPermission(): Promise<boolean>
hasPermission(): Promise<boolean>
scheduleDailyReminder(): Promise<void>
cancelAllNotifications(): Promise<void>
getNotificationContent(streak: number, completedToday: boolean): NotificationContent | null
```

**Notification Content Logic**:
- Streak > 0 and not completed: "Don't break your streak! 🔥" with streak count
- Streak = 0: "Ready for today's words? 📚"
- Already completed today: No notification scheduled

### Permission Flow

Permission is requested after first session completion (`LearnScreen.tsx`):
1. User completes their first daily session
2. App calls `requestPermission()` via expo-notifications
3. If granted, notifications are enabled and daily reminder scheduled
4. Permission is only asked once (tracked via `permissionAsked` flag)

### Settings UI (`src/screens/SettingsScreen.tsx`)

New "Notifications" section with:
- Toggle switch to enable/disable daily reminders
- Time picker (visible when enabled) to set reminder time
- Default reminder time: 7:00 PM local

### App State Reschedule

Notifications are rescheduled when app comes to foreground (`ProgressContext.tsx`):
- Uses `AppState.addEventListener('change', ...)`
- Updates notification content based on current streak state
- Ensures notification reflects whether user has completed today

### App Configuration

`app.json` plugins:
```json
["expo-notifications", { "sounds": [] }]
```

## v2.11 Library

View all vocabulary words with progress tracking and detailed statistics.

### LibraryScreen (`src/screens/LibraryScreen.tsx`)

Displays all 100 vocabulary words with filtering:

**Filters:**
- All: Shows all words
- Bookmarked: Words user has bookmarked
- Needs Work: numericMasteryLevel 0-1 OR accuracy < 50%
- Mastered: numericMasteryLevel = 3

**Word Card Display:**
- Term
- MasteryBadge (color-coded by level)
- Last seen date (relative: "Today", "2 days ago", etc.)
- Accuracy percentage (if has attempts)

### WordDetailScreen (`src/screens/WordDetailScreen.tsx`)

Detailed view for individual words:

**Word Info:**
- Term, pronunciation, part of speech
- Definition and example sentence
- Synonyms (if available)
- Speaker and bookmark buttons

**Statistics Card:**
- Accuracy: % (correctCount / totalAttempts)
- Times Correct (green)
- Times Incorrect (red)
- Times Seen (total attempts)
- Last Seen (formatted date)
- Next Review (if SRS date exists)

**Difficulty Display:**
- Star rating (1-5)

### MasteryBadge Component (`src/components/MasteryBadge.tsx`)

Color-coded badge showing mastery level:
- Level 0 (New): gray
- Level 1 (Learning): orange/warning
- Level 2 (Familiar): blue
- Level 3 (Mastered): green/success

### Navigation

Library accessible from HomeScreen header:
- Library icon (blue) next to Bookmarks icon (purple)
- Routes: `Library`, `WordDetail`

### Data Flow

```typescript
interface EnrichedWord extends Word {
  numericMasteryLevel: number;
  masteryLevel: MasteryLevel;
  correctCount: number;
  incorrectCount: number;
  lastSeenAt: string | null;
  nextReviewDate: string | null;
  totalAttempts: number;
  accuracy: number; // 0-1
  hasProgress: boolean;
  isBookmarked: boolean;
}
```

## v2.12 Custom Lists

User-created vocabulary lists that can be mixed into daily learning.

### Types (`src/types/customList.ts`)

```typescript
interface CustomWord {
  id: string;           // UUID
  term: string;
  definition: string;
  addedAt: number;      // timestamp
}

interface CustomList {
  id: string;           // UUID
  name: string;
  words: CustomWord[];  // Max 20
  includeInDaily: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CustomListSettings {
  mixCount: number;     // 0-5, default 2
}

const MAX_WORDS_PER_LIST = 20;
const DEFAULT_MIX_COUNT = 2;
const MAX_MIX_COUNT = 5;
```

### Storage (`src/services/storage/mmkvStorage.ts`)

```typescript
// List CRUD
getCustomLists(): Map<string, CustomList>
getCustomList(listId: string): CustomList | null
saveCustomList(list: CustomList): void
deleteCustomList(listId: string): void
createNewCustomList(name: string): CustomList

// Word operations
addWordToCustomList(listId: string, term: string, definition: string): boolean
removeWordFromCustomList(listId: string, wordId: string): void

// Toggle settings
toggleCustomListInDaily(listId: string): boolean
setCustomListIncludeInDaily(listId: string, include: boolean): void
getEnabledCustomWords(): CustomWord[]

// Mix count settings
getCustomListSettings(): CustomListSettings
setCustomListMixCount(count: number): void
getCustomListMixCount(): number
```

### Daily Selection Integration

Custom words are mixed into daily learning (`src/context/WordsContext.tsx`):

**Algorithm:**
1. Get mix count from settings (default 2)
2. Get all enabled custom words (`includeInDaily = true`)
3. Calculate seed word slots: `todayGoal - mixCount`
4. Select seed words using `seededPickWithDifficultyBias()`
5. Select custom words using seeded shuffle for determinism
6. Combine into daily word list

**Custom Word → Word Conversion:**
```typescript
function customWordToWord(cw: CustomWord): Word {
  return {
    id: cw.id,
    term: cw.term,
    definition: cw.definition,
    partOfSpeech: 'other',
    pronunciation: '',
    example: '',
    difficulty: 3,
    tags: ['custom'],
  };
}
```

### Screens

**CustomListsScreen** (`src/screens/CustomListsScreen.tsx`):
- Header "+" button to create new list
- FlatList of all custom lists
- Each card shows: name, word count (X/20), toggle for "Include in Daily"
- Delete button with confirmation
- Tap card → navigate to edit

**CustomListDetailScreen** (`src/screens/CustomListDetailScreen.tsx`):
- Name input field
- "Include in Daily" toggle
- Words list with remove button per word
- Add word form (term + definition)
- Create mode: "Create List" button
- Edit mode: saves automatically

### Settings Integration

New "Custom Lists" section in SettingsScreen:
- "Manage Lists" row → navigates to CustomListsScreen
- "Words per Day" stepper (0-5) for mix count

### Navigation Routes

```typescript
// Added to RootStackParamList
CustomLists: undefined;
CustomListDetail: { listId?: string };
```

### Edge Cases

- **No custom lists enabled**: Normal daily selection works
- **Fewer custom words than mix count**: Fills remaining slots with seed words
- **Mix count set to 0**: No custom words mixed in
- **Empty list**: Can be created but won't contribute words
- **Max 20 words per list**: Enforced in UI and storage

## v2.13 Session Summary

Summary screen shown after learning sessions and quiz completion with performance metrics and weak words review.

### Types (`src/types/sessionSummary.ts`)

```typescript
interface WordSessionResult {
  wordId: string;
  term: string;
  definition: string;
  isCorrect: boolean;
  isFirstSeenToday: boolean;  // New word vs review
}

interface SessionSummary {
  sessionType: 'learn' | 'quiz';
  date: string;
  timestamp: number;
  totalWords: number;
  newWords: number;        // First seen today
  reviewWords: number;     // Previously seen
  correctCount: number;
  incorrectCount: number;
  accuracy: number;        // 0-100
  results: WordSessionResult[];
  weakWords: WeakWord[];   // Up to 2 words for review
}

interface WeakWord {
  wordId: string;
  term: string;
  definition: string;
  reason: 'incorrect' | 'low_accuracy';
}
```

### Storage (`src/services/storage/mmkvStorage.ts`)

```typescript
// Session summary persistence (survives app reload)
getLastSessionSummary(): SessionSummary | null
setLastSessionSummary(summary: SessionSummary): void
clearLastSessionSummary(): void
```

### SessionSummaryScreen

Displays after learning session completion:

**Main Stats Card:**
- Session type label ("Learning Session Complete!" / "Quiz Complete!")
- Accuracy percentage (large display)
- Contextual message based on accuracy

**Stats Breakdown:**
- Total words reviewed
- Correct count (green)
- Incorrect count (red)
- New words (sparkle icon)
- Review words (refresh icon)

**Weak Words Section:**
- Shows up to 2 words that need practice
- Words identified by incorrect answers
- Alert icon with reason ("Answered incorrectly")

**Actions:**
- "Review Weak Words" → launches WeakWordsQuizScreen
- "Done" → clears summary and returns Home

### WeakWordsQuizScreen

Mini-quiz for reviewing 1-2 weak words:

- Multiple choice format (4 options)
- Card transition animations
- Haptic feedback on answers
- Records answers for mastery tracking
- Returns to Home on completion

### Session Stats Tracking

**LearnScreen Integration:**
- Tracks results in `sessionResults` ref during session
- Captures word progress at session start for new/review classification
- Builds summary and navigates on session completion

**QuizSummaryScreen Integration:**
- Builds weak words list from incorrect quiz answers
- "Review Weak Words" button navigates to WeakWordsQuizScreen

### Daily Counter Reset Fix

Fixed bug where `todayReviewedCount` wasn't resetting on new day:

**Before:** Counter only reset when `recordAnswer()` was called on new day
**After:** `getStats()` now checks date and returns reset values if it's a new day

```typescript
// In getStats()
const today = getLocalTodayString();
if (validated.lastActiveDate && validated.lastActiveDate !== today) {
  return {
    ...validated,
    todayReviewedCount: 0,
    todayGoalMet: false,
  };
}
```

### Navigation Routes

```typescript
// Added to RootStackParamList
SessionSummary: { summary?: SessionSummary };
WeakWordsQuiz: { weakWords: WeakWord[] };
```

### Accuracy Message Logic

```typescript
function getAccuracyMessage(accuracy: number): string {
  if (accuracy >= 100) return 'Perfect session!';
  if (accuracy >= 80) return 'Great work!';
  if (accuracy >= 60) return 'Good progress!';
  if (accuracy >= 40) return 'Keep practicing!';
  return 'Room to improve!';
}
```

## Future Plans

### Potential Enhancements
- More word categories and difficulty levels
- Android widget support
- Cloud sync for progress across devices
