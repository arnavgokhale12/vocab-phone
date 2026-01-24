import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useWords } from '../context/WordsContext';
import { useProgress } from '../context/ProgressContext';
import {
  getSeenWordIds,
  setQuizSession,
  markQuizComplete,
  markYesterdayQuizTaken,
} from '../services/storage/mmkvStorage';
import { Word } from '../types/word';
import { generateQuiz } from '../services/QuizService';
import { QuizQuestion, QuizQuestionResult, QuizSession } from '../types/quiz';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ navigation, route }: Props) {
  const { words: allWords, todayWords } = useWords();
  const { wordIds: providedWordIds, isYesterdayQuiz } = route.params ?? {};
  const { recordAnswer } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [results, setResults] = useState<QuizQuestionResult[]>([]);

  // Animation values
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const optionScale = useRef(new Animated.Value(1)).current;

  // Generate quiz questions - use provided wordIds or today's seen words
  const questions = useMemo(() => {
    if (providedWordIds && providedWordIds.length > 0) {
      // Use provided word IDs (e.g., for yesterday's quiz)
      return generateQuiz(providedWordIds, allWords);
    }
    // Default: use today's seen words validated against today's word list
    const seenWordIds = getSeenWordIds();
    const todayWordIds = new Set(todayWords.map((w: Word) => w.id));
    const validSeenIds = seenWordIds.filter((id: string) => todayWordIds.has(id));
    return generateQuiz(validSeenIds, allWords);
  }, [allWords, todayWords, providedWordIds]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Handle no questions (shouldn't happen, but safety check)
  useEffect(() => {
    if (questions.length === 0) {
      navigation.goBack();
    }
  }, [questions, navigation]);

  const handleOptionSelect = (index: number) => {
    if (isRevealed) return; // Prevent re-selection after reveal

    setSelectedIndex(index);
    setIsRevealed(true);

    const isCorrect = index === currentQuestion.correctIndex;

    // Haptic feedback - light for correct, heavy for incorrect
    if (isCorrect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Subtle scale animation on selection
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

    // Record the result
    const result: QuizQuestionResult = {
      wordId: currentQuestion.wordId,
      term: currentQuestion.term,
      selectedIndex: index,
      correctIndex: currentQuestion.correctIndex,
      isCorrect,
    };

    setResults((prev) => [...prev, result]);

    // Update mastery tracking
    recordAnswer(currentQuestion.wordId, isCorrect);
  };

  const animateToNextQuestion = (callback: () => void) => {
    // Slide out to left and fade
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
      // Reset position to right side
      cardTranslateX.setValue(30);
      // Slide in from right and fade in
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
      // Calculate final score
      const score = results.length > 0
        ? results.filter((r) => r.isCorrect).length
        : (selectedIndex === currentQuestion.correctIndex ? 1 : 0);

      const finalResults = [...results];
      if (results.length < questions.length) {
        // Include current question result
        finalResults.push({
          wordId: currentQuestion.wordId,
          term: currentQuestion.term,
          selectedIndex: selectedIndex ?? -1,
          correctIndex: currentQuestion.correctIndex,
          isCorrect: selectedIndex === currentQuestion.correctIndex,
        });
      }

      const finalScore = finalResults.filter((r) => r.isCorrect).length;

      // Save quiz session
      const session: QuizSession = {
        date: new Date().toISOString().split('T')[0],
        questions,
        results: finalResults,
        completedAt: new Date().toISOString(),
        score: finalScore,
        totalQuestions: questions.length,
      };
      setQuizSession(session);

      // Mark appropriate quiz as complete
      if (isYesterdayQuiz) {
        markYesterdayQuizTaken(finalScore);
      } else {
        markQuizComplete(finalScore);
      }

      // Navigate to summary
      try {
        navigation.replace('QuizSummary', {
          score: finalScore,
          total: questions.length,
          results: finalResults,
        });
      } catch (error) {
        console.error('Failed to navigate to QuizSummary:', error);
        // Fallback: go home if navigation fails
        navigation.navigate('Home');
      }
    } else {
      // Animate transition to next question
      animateToNextQuestion(() => {
        setCurrentIndex((prev) => prev + 1);
        setSelectedIndex(null);
        setIsRevealed(false);
      });
    }
  };

  if (!currentQuestion) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Text style={styles.emptyText}>No questions available</Text>
        </View>
      </GradientBackground>
    );
  }

  const getOptionStyle = (index: number) => {
    if (!isRevealed) {
      return selectedIndex === index ? styles.optionSelected : styles.option;
    }

    // After reveal
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
            <Text style={styles.term}>{currentQuestion.term}</Text>
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
              title={isLastQuestion ? 'See Results' : 'Next'}
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
    paddingTop: spacing.xxl + spacing.xl,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
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
