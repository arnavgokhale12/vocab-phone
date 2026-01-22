import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WeakWord } from '../types/sessionSummary';
import { useProgress } from '../context/ProgressContext';
import { SEED_WORDS } from '../data/seedWords';
import { getEnabledCustomWords } from '../services/storage/mmkvStorage';
import { Word } from '../types/word';
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

type Props = NativeStackScreenProps<RootStackParamList, 'WeakWordsQuiz'>;

interface QuizQuestion {
  wordId: string;
  term: string;
  correctDefinition: string;
  options: string[];
  correctIndex: number;
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateQuestions(weakWords: WeakWord[]): QuizQuestion[] {
  // Get all available definitions for distractors
  const customWords = getEnabledCustomWords();
  const allDefinitions = [
    ...SEED_WORDS.map(w => w.definition),
    ...customWords.map(w => w.definition),
  ];

  return weakWords.map(word => {
    // Get 3 random distractor definitions (excluding correct one)
    const distractors = shuffleArray(
      allDefinitions.filter(d => d !== word.definition)
    ).slice(0, 3);

    // Combine and shuffle options
    const options = shuffleArray([word.definition, ...distractors]);
    const correctIndex = options.indexOf(word.definition);

    return {
      wordId: word.wordId,
      term: word.term,
      correctDefinition: word.definition,
      options,
      correctIndex,
    };
  });
}

export default function WeakWordsQuizScreen({ route, navigation }: Props) {
  const { weakWords } = route.params;
  const { recordAnswer } = useProgress();

  const [questions] = useState(() => generateQuestions(weakWords));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;

    // Record answer for mastery tracking
    recordAnswer(currentQuestion.wordId, isCorrect);

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Done with mini-quiz
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.popToTop();
      return;
    }

    // Animate card out
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
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);

      cardTranslateX.setValue(30);
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateX, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) {
      return selectedOption === index ? styles.optionSelected : styles.option;
    }

    if (index === currentQuestion.correctIndex) {
      return [styles.option, styles.optionCorrect];
    }

    if (index === selectedOption && index !== currentQuestion.correctIndex) {
      return [styles.option, styles.optionIncorrect];
    }

    return styles.option;
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.progress}>
          Review {currentIndex + 1} of {questions.length}
        </Text>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardOpacity,
              transform: [{ translateX: cardTranslateX }],
            },
          ]}
        >
          <GlassCard elevated style={styles.questionCard}>
            <Text style={styles.term}>{currentQuestion.term}</Text>
            <Text style={styles.instruction}>What does this word mean?</Text>
          </GlassCard>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleSelectOption(index)}
                activeOpacity={0.7}
                disabled={isAnswered}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={styles.optionText} numberOfLines={3}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {isAnswered && (
          <View style={styles.actions}>
            <GradientButton
              title={isLastQuestion ? 'Done' : 'Next'}
              onPress={handleNext}
              variant="primary"
            />
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  progress: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardContainer: {
    flex: 1,
  },
  questionCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instruction: {
    ...typography.body,
    color: colors.textMuted,
  },
  optionsContainer: {
    gap: spacing.sm,
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
    backgroundColor: colors.accentPurple + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentPurple,
  },
  optionCorrect: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  optionIncorrect: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  optionLetterText: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
