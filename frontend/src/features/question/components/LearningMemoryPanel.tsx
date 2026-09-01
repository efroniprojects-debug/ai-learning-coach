import { useEffect, useState } from 'react';

import {
  getLearningMemory,
  saveLearningMemory,
  type LearningMemoryInput,
} from '@/services/learning-memory.api';

interface LearningMemoryPanelProps {
  subjectId: string;
  studyUnits?: number;
  disabled?: boolean;
  onMemoryChange?: (memory: LearningMemoryInput) => void;
}

const EMPTY_MEMORY: LearningMemoryInput = {
  isEnabled: false,
  learningPreferences: null,
  knownStrengths: null,
  recurringMistakes: null,
};

export function LearningMemoryPanel({ subjectId, studyUnits, disabled, onMemoryChange }: LearningMemoryPanelProps) {
  const [memory, setMemory] = useState<LearningMemoryInput>(EMPTY_MEMORY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getLearningMemory(subjectId, studyUnits).then((result) => {
      if (!active) return;
      setMemory(result);
      onMemoryChange?.(result);
    }).catch(() => undefined).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [onMemoryChange, studyUnits, subjectId]);

  const toggle = async () => {
    // Reload before toggling because automatic learning may have enriched the
    // stored profile since this compact control was first rendered.
    const latest = await getLearningMemory(subjectId, studyUnits);
    const result = await saveLearningMemory(subjectId, studyUnits, { ...latest, isEnabled: !memory.isEnabled });
    setMemory(result);
    onMemoryChange?.(result);
  };

  return (
    <button type="button" onClick={() => void toggle()} disabled={disabled || loading} aria-pressed={memory.isEnabled} title="כשהזיכרון פעיל, המורה לומד אוטומטית מההעדפות, החוזקות והטעויות שלך במכשיר הזה" className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${memory.isEnabled ? 'border-violet-600 bg-violet-600 text-white' : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
      🧠 {memory.isEnabled ? 'זיכרון פעיל' : 'הפעל זיכרון'}
    </button>
  );
}
