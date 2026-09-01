import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryApi = vi.hoisted(() => ({ getLearningMemory: vi.fn(), saveLearningMemory: vi.fn() }));
vi.mock('@/services/learning-memory.api', () => memoryApi);

import { LearningMemoryPanel } from './LearningMemoryPanel';

describe('LearningMemoryPanel', () => {
  beforeEach(() => {
    memoryApi.getLearningMemory.mockReset().mockResolvedValue({ isEnabled: false, learningPreferences: null, knownStrengths: null, recurringMistakes: null });
    memoryApi.saveLearningMemory.mockReset().mockImplementation(async (_subject, _units, input) => input);
  });

  it('is a compact opt-in button that saves immediately', async () => {
    render(<LearningMemoryPanel subjectId="math" studyUnits={4} />);
    const button = await screen.findByRole('button', { name: '🧠 הפעל זיכרון' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    await waitFor(() => expect(memoryApi.saveLearningMemory).toHaveBeenCalledWith('math', 4, expect.objectContaining({ isEnabled: true })));
    expect((await screen.findByRole('button', { name: '🧠 זיכרון פעיל' })).getAttribute('aria-pressed')).toBe('true');
  });
});
