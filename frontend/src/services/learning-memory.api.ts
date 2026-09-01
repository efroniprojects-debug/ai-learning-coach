export interface LearningMemory {
  subjectId: string;
  studyUnits: number;
  isEnabled: boolean;
  learningPreferences: string | null;
  knownStrengths: string | null;
  recurringMistakes: string | null;
  updatedAt: string | null;
}

const STORAGE_PREFIX = 'smarterai-learning-memory';

function storageKey(subjectId: string, studyUnits?: number): string {
  return `${STORAGE_PREFIX}:${subjectId}:${studyUnits ?? 0}`;
}

function emptyMemory(subjectId: string, studyUnits?: number): LearningMemory {
  return {
    subjectId,
    studyUnits: studyUnits ?? 0,
    isEnabled: false,
    learningPreferences: null,
    knownStrengths: null,
    recurringMistakes: null,
    updatedAt: null,
  };
}

export interface LearningMemoryInput {
  isEnabled: boolean;
  learningPreferences: string | null;
  knownStrengths: string | null;
  recurringMistakes: string | null;
}

export async function getLearningMemory(subjectId: string, studyUnits?: number): Promise<LearningMemory> {
  const fallback = emptyMemory(subjectId, studyUnits);
  try {
    const stored = window.localStorage.getItem(storageKey(subjectId, studyUnits));
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<LearningMemoryInput>;
    return {
      ...fallback,
      isEnabled: parsed.isEnabled === true,
      learningPreferences: typeof parsed.learningPreferences === 'string' ? parsed.learningPreferences : null,
      knownStrengths: typeof parsed.knownStrengths === 'string' ? parsed.knownStrengths : null,
      recurringMistakes: typeof parsed.recurringMistakes === 'string' ? parsed.recurringMistakes : null,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

export async function saveLearningMemory(
  subjectId: string,
  studyUnits: number | undefined,
  input: LearningMemoryInput
): Promise<LearningMemory> {
  const memory: LearningMemory = {
    subjectId,
    studyUnits: studyUnits ?? 0,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey(subjectId, studyUnits), JSON.stringify(input));
  return memory;
}

export async function deleteLearningMemory(subjectId: string, studyUnits?: number): Promise<void> {
  window.localStorage.removeItem(storageKey(subjectId, studyUnits));
}
