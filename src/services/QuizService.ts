import { Word } from '../types/word';
import { QuizQuestion } from '../types/quiz';

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select distractor definitions (wrong answers) for a quiz question
 */
function selectDistractors(
  correctWordId: string,
  correctDefinition: string,
  allWords: Word[],
  count: number = 3
): string[] {
  // Filter out the correct word and words with duplicate definitions
  const candidates = allWords.filter(
    (w) => w.id !== correctWordId && w.definition !== correctDefinition
  );

  // Shuffle and take the required number
  const shuffled = shuffleArray(candidates);
  return shuffled.slice(0, count).map((w) => w.definition);
}

/**
 * Generate quiz questions from today's seen words
 */
export function generateQuiz(
  seenWordIds: string[],
  allWords: Word[]
): QuizQuestion[] {
  // Get the word objects for seen words
  const wordMap = new Map(allWords.map((w) => [w.id, w]));
  const seenWords = seenWordIds
    .map((id) => wordMap.get(id))
    .filter((w): w is Word => w !== undefined);

  if (seenWords.length === 0) {
    return [];
  }

  // Generate a question for each seen word
  const questions: QuizQuestion[] = seenWords.map((word) => {
    const distractors = selectDistractors(
      word.id,
      word.definition,
      allWords,
      Math.min(3, allWords.length - 1) // Handle small word databases
    );

    // Combine correct answer with distractors
    const allOptions = [word.definition, ...distractors];

    // Shuffle options and find the new index of the correct answer
    const shuffledOptions = shuffleArray(allOptions);
    const correctIndex = shuffledOptions.indexOf(word.definition);

    return {
      wordId: word.id,
      term: word.term,
      correctDefinition: word.definition,
      options: shuffledOptions,
      correctIndex,
    };
  });

  // Shuffle the question order
  return shuffleArray(questions);
}

/**
 * Calculate score message based on percentage
 */
export function getScoreMessage(score: number, total: number): string {
  const percentage = total > 0 ? (score / total) * 100 : 0;

  if (percentage === 100) {
    return "Perfect! You've mastered today's words!";
  } else if (percentage >= 80) {
    return 'Great job! Almost perfect!';
  } else if (percentage >= 60) {
    return 'Good effort! Keep practicing!';
  } else {
    return 'Keep learning! Review these words tomorrow.';
  }
}
