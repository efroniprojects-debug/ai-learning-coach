import { beforeEach, describe, expect, it } from 'vitest';

import { deleteLearningMemory, getLearningMemory, saveLearningMemory } from './learning-memory.api';

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
});
