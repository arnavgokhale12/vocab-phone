import { Word } from "../types/word";

export const SEED_WORDS: Word[] = [
  {
    id: "ambivalent",
    term: "ambivalent",
    partOfSpeech: "adj",
    definition: "Having mixed or conflicting feelings about something.",
    example: "She felt ambivalent about moving abroad—excited, but also anxious.",
    difficulty: 3,
    tags: ["academic"],
  },
  {
    id: "pragmatic",
    term: "pragmatic",
    partOfSpeech: "adj",
    definition: "Focused on practical results rather than ideals.",
    example: "A pragmatic approach helped the team ship the first version quickly.",
    difficulty: 3,
    tags: ["business", "academic"],
  },
  {
    id: "mitigate",
    term: "mitigate",
    partOfSpeech: "verb",
    definition: "To make something less harmful, severe, or painful.",
    example: "They added safeguards to mitigate the risk of errors.",
    difficulty: 3,
    tags: ["academic", "business"],
  },
  {
    id: "opaque",
    term: "opaque",
    partOfSpeech: "adj",
    definition: "Hard to understand; not clear.",
    example: "The policy was so opaque that nobody knew what to do next.",
    difficulty: 3,
    tags: ["academic"],
  },
  {
    id: "contemplate",
    term: "contemplate",
    partOfSpeech: "verb",
    definition: "To think carefully about something for a long time.",
    example: "He contemplated changing careers after graduation.",
    difficulty: 2,
    tags: ["common"],
  },
];
