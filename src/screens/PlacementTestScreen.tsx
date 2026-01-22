import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SEED_WORDS } from '../data/seedWords';
import { Word } from '../types/word';
import { completePlacementTest } from '../services/storage/mmkvStorage';
import {
  GradientBackground,
  GlassCard,
  GradientButton,
} from '../components';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PlacementTest'>;

interface PlacementQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
}

/**
 * Generate 10 placement test questions spanning difficulty 1-5.
 * Selects 2 words per difficulty level for balanced assessment.
 */
function generatePlacementQuestions(): PlacementQuestion[] {
  const questions: PlacementQuestion[] = [];

  // Group words by difficulty
  const byDifficulty: Map<number, Word[]> = new Map();
  for (let d = 1; d <= 5; d++) {
    byDifficulty.set(d, SEED_WORDS.filter(w => w.difficulty === d));
  }

  // Select 2 words per difficulty level (10 total)
  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    const words = byDifficulty.get(difficulty) ?? [];
    // Use deterministic selection based on index
    const selected = words.slice(0, 2);

    for (const word of selected) {
      // Generate 3 distractor definitions
      const otherWords = SEED_WORDS.filter(w => w.id !== word.id);
      const distractors: string[] = [];

      // Pick distractors from different difficulty levels for variety
      for (let i = 0; i < 3 && distractors.length < 3; i++) {
        const idx = (difficulty * 7 + i * 13) % otherWords.length;
        const distractor = otherWords[idx].definition;
        if (!distractors.includes(distractor) && distractor !== word.definition) {
          distractors.push(distractor);
        }
      }

      // Fill remaining if needed
      while (distractors.length < 3) {
        const idx = distractors.length * 11 % otherWords.length;
        const def = otherWords[idx].definition;
        if (!distractors.includes(def) && def !== word.definition) {
          distractors.push(def);
        }
      }

      // Shuffle options deterministically
      const options = [word.definition, ...distractors];
      const correctDef = word.definition;

      // Simple deterministic shuffle based on word id
      const seed = word.id.charCodeAt(0) + word.id.length;
      for (let i = options.length - 1; i > 0; i--) {
        const j = (seed + i * 7) % (i + 1);
        [options[i], options[j]] = [options[j], options[i]];
      }

      questions.push({
        word,
        options,
        correctIndex: options.indexOf(correctDef),
      });
    }
  }

  // Shuffle questions so they're not ordered by difficulty
  // Use deterministic shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = (i * 13 + 7) % (i + 1);
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions;
}

export default function PlacementTestScreen({ navigation }: Props) {
  const questions = useMemo(() => generatePlacementQuestions(), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Animation values
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const optionScale = useRef(new Animated.Value(1)).current;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleOptionSelect = (index: number) => {
    if (isRevealed) return;

    setSelectedIndex(index);
    setIsRevealed(true);

    const isCorrect = index === currentQuestion.correctIndex;

    // Haptic feedback
    if (isCorrect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCorrectCount(prev => prev + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Subtle scale animation
    Animated.sequence([
      Animated.timing(optionScale, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(optionScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateToNextQuestion = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateX, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      cardTranslateX.setValue(30);
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate final score (include current answer)
      const finalScore = correctCount + (selectedIndex === currentQuestion.correctIndex ? 1 : 0);

      // Complete placement test and save result
      completePlacementTest(finalScore);

      // Trigger success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home
      navigation.replace('Home');
    } else {
      animateToNextQuestion(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedIndex(null);
        setIsRevealed(false);
      });
    }
  };

  const getOptionStyle = (index: number) => {
    if (!isRevealed) {
      return selectedIndex === index ? styles.optionSelected : styles.option;
    }
    if (index === currentQuestion.correctIndex) {
      return styles.optionCorrect;
    }
    if (index === selectedIndex && index !== currentQuestion.correctIndex) {
      return styles.optionIncorrect;
    }
    return styles.option;
  };

  const getOptionTextStyle = (index: number) => {
    if (!isRevealed) {
      return styles.optionText;
    }
    if (index === currentQuestion.correctIndex) {
      return styles.optionTextCorrect;
    }
    if (index === selectedIndex && index !== currentQuestion.correctIndex) {
      return styles.optionTextIncorrect;
    }
    return styles.optionText;
  };

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Placement Quiz</Text>
          <Text style={styles.subtitle}>
            Let's find your vocabulary level
          </Text>
        </View>

        <Text style={styles.progress}>
          {currentIndex + 1} of {questions.length}
        </Text>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateX: cardTranslateX }],
          }}
        >
          <GlassCard elevated style={styles.questionCard}>
            <Text style={styles.questionLabel}>What does this word mean?</Text>
            <Text style={styles.term}>{currentQuestion.word.term}</Text>
            <Text style={styles.difficulty}>
              Difficulty: {'★'.repeat(currentQuestion.word.difficulty)}{'☆'.repeat(5 - currentQuestion.word.difficulty)}
            </Text>
          </GlassCard>

          <Animated.View
            style={[
              styles.optionsContainer,
              { transform: [{ scale: optionScale }] },
            ]}
          >
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleOptionSelect(index)}
                activeOpacity={isRevealed ? 1 : 0.7}
                disabled={isRevealed}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={getOptionTextStyle(index)} numberOfLines={3}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Animated.View>

        {isRevealed && (
          <View style={styles.actions}>
            <GradientButton
              title={isLastQuestion ? 'See My Level' : 'Next'}
              onPress={handleNext}
              variant="primary"
            />
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.displayMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  progress: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  questionCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  questionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  difficulty: {
    ...typography.label,
    color: colors.accentPurple,
    letterSpacing: 2,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.accentPurple,
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentPurple + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  optionLetterText: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: '700',
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  optionTextCorrect: {
    ...typography.body,
    color: '#4CAF50',
    flex: 1,
    fontWeight: '600',
  },
  optionTextIncorrect: {
    ...typography.body,
    color: '#F44336',
    flex: 1,
  },
  actions: {
    marginTop: spacing.md,
  },
});
