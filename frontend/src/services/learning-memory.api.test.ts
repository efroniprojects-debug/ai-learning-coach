import { beforeEach, describe, expect, it } from 'vitest';

import { deleteLearningMemory, getLearningMemory, saveLearningMemory, updateLearningMemoryAutomatically } from './learning-memory.api';

describe('device-local learning memory', () => {
  beforeEach(() => window.localStorage.clear());

  it('is disabled by default and isolated by subject and study units', async () => {
    await saveLearningMemory('math', 3, {
      isEnabled: true,
      learningPreferences: 'הסבר חזותי',
      knownStrengths: null,
      recurringMistakes: null,
    });

    expect((await getLearningMemory('math', 3)).isEnabled).toBe(true);
    expect((await getLearningMemory('math', 4)).isEnabled).toBe(false);
    expect((await getLearningMemory('physics')).learningPreferences).toBeNull();
  });

  it('removes the complete memory for only the selected context', async () => {
    await saveLearningMemory('physics', undefined, {
      isEnabled: true,
      learningPreferences: null,
      knownStrengths: 'מכניקה',
      recurringMistakes: null,
    });
    await deleteLearningMemory('physics');

    expect(await getLearningMemory('physics')).toMatchObject({
      isEnabled: false,
      knownStrengths: null,
    });
  });

  it('learns automatically only while enabled', async () => {
    const updated = await updateLearningMemoryAutomatically('physics', undefined, {
      isEnabled: true, learningPreferences: null, knownStrengths: null, recurringMistakes: null,
    }, {
      mode: 'step_by_step', teachingStyle: 'deep',
      misconceptions: [{ misconception: 'בלבול בין מסה למשקל', correction: 'מסה קבועה' }],
      masteryUpdate: { subtopic: 'כוחות', confidence: 'proficient' },
    });
    expect(updated.learningPreferences).toContain('מעמיק עם דוגמאות');
    expect(updated.recurringMistakes).toBe('בלבול בין מסה למשקל');
    expect(updated.knownStrengths).toBe('כוחות');
  });

  it('does not collect learning signals while disabled', async () => {
    const updated = await updateLearningMemoryAutomatically('physics', undefined, {
      isEnabled: false, learningPreferences: null, knownStrengths: null, recurringMistakes: null,
    }, {
      mode: 'diagnose', teachingStyle: 'balanced',
      misconceptions: [{ misconception: 'טעות שלא אושרה לאיסוף', correction: 'תיקון' }],
    });
    expect(updated.recurringMistakes).toBeNull();
    expect(window.localStorage.getItem('smarterai-learning-memory:physics:0')).toBeNull();
  });
});
