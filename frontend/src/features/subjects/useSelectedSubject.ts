import { useEffect, useState } from 'react';

import {
  DEFAULT_MATH_STUDY_UNITS,
  DEFAULT_SUBJECT_ID,
  MathStudyUnits,
  SUBJECTS,
} from '@/config/subjects';

const STORAGE_KEY = 'smarterai-subject';
const MATH_UNITS_STORAGE_KEY = 'smarterai-math-study-units';
const LEARNING_CONTEXT_EVENT = 'smarterai-learning-context-change';

function readSubjectId(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && SUBJECTS[saved] ? saved : DEFAULT_SUBJECT_ID;
}

function readMathStudyUnits(): MathStudyUnits {
  const saved = Number(localStorage.getItem(MATH_UNITS_STORAGE_KEY));
  return saved === 3 || saved === 4 || saved === 5 ? saved : DEFAULT_MATH_STUDY_UNITS;
}

export function useSelectedSubject() {
  const [subjectId, setSubjectIdState] = useState(readSubjectId);
  const [mathStudyUnits, setMathStudyUnitsState] = useState<MathStudyUnits>(readMathStudyUnits);

  useEffect(() => {
    // A custom event keeps every mounted module in sync; the browser storage
    // event only fires in other tabs, not in the tab that made the change.
    const syncFromStorage = () => {
      setSubjectIdState(readSubjectId());
      setMathStudyUnitsState(readMathStudyUnits());
    };
    window.addEventListener(LEARNING_CONTEXT_EVENT, syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(LEARNING_CONTEXT_EVENT, syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const setSubjectId = (nextSubjectId: string) => {
    if (!SUBJECTS[nextSubjectId]) return;
    localStorage.setItem(STORAGE_KEY, nextSubjectId);
    setSubjectIdState(nextSubjectId);
    window.dispatchEvent(new Event(LEARNING_CONTEXT_EVENT));
  };

  const setMathStudyUnits = (nextUnits: MathStudyUnits) => {
    if (![3, 4, 5].includes(nextUnits)) return;
    localStorage.setItem(MATH_UNITS_STORAGE_KEY, String(nextUnits));
    setMathStudyUnitsState(nextUnits);
    window.dispatchEvent(new Event(LEARNING_CONTEXT_EVENT));
  };

  return {
    subjectId,
    subject: SUBJECTS[subjectId],
    mathStudyUnits,
    setSubjectId,
    setMathStudyUnits,
  };
}
