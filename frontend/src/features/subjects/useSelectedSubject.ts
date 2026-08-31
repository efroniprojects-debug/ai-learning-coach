import { useState } from 'react';

import { DEFAULT_SUBJECT_ID, SUBJECTS } from '@/config/subjects';

const STORAGE_KEY = 'smarterai-subject';

export function useSelectedSubject() {
  const [subjectId, setSubjectIdState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && SUBJECTS[saved] ? saved : DEFAULT_SUBJECT_ID;
  });

  const setSubjectId = (nextSubjectId: string) => {
    if (!SUBJECTS[nextSubjectId]) return;
    localStorage.setItem(STORAGE_KEY, nextSubjectId);
    setSubjectIdState(nextSubjectId);
  };

  return { subjectId, subject: SUBJECTS[subjectId], setSubjectId };
}
