export interface SubjectDefinition {
  id: string;
  name: string;
  nameHe: string;
  icon: string;
  accent: 'blue' | 'green';
}

export type MathStudyUnits = 3 | 4 | 5;

export const SUBJECTS: Record<string, SubjectDefinition> = {
  physics: { id: 'physics', name: 'Physics', nameHe: 'פיזיקה', icon: '🔬', accent: 'blue' },
  math: { id: 'math', name: 'Mathematics', nameHe: 'מתמטיקה', icon: '📐', accent: 'green' },
};

// Step 4 centralizes the active subject. Step 5 can add a selector without
// changing the API contracts or mixing data between subjects.
export const DEFAULT_SUBJECT_ID = 'physics';
export const DEFAULT_SUBJECT = SUBJECTS[DEFAULT_SUBJECT_ID];
export const DEFAULT_MATH_STUDY_UNITS: MathStudyUnits = 5;
