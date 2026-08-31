export interface SubjectDefinition {
  id: string;
  name: string;
  nameHe: string;
  icon: string;
}

export const SUBJECTS: Record<string, SubjectDefinition> = {
  physics: { id: 'physics', name: 'Physics', nameHe: 'פיזיקה', icon: '🔬' },
};

// Step 4 centralizes the active subject. Step 5 can add a selector without
// changing the API contracts or mixing data between subjects.
export const DEFAULT_SUBJECT_ID = 'physics';
export const DEFAULT_SUBJECT = SUBJECTS[DEFAULT_SUBJECT_ID];
