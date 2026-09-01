import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryApi = vi.hoisted(() => ({
  getLearningMemory: vi.fn(),
  saveLearningMemory: vi.fn(),
  deleteLearningMemory: vi.fn(),
}));

vi.mock('@/services/learning-memory.api', () => memoryApi);

import { LearningMemoryPanel } from './LearningMemoryPanel';

describe('LearningMemoryPanel', () => {
  beforeEach(() => {
    memoryApi.getLearningMemory.mockReset().mockResolvedValue({
      subjectId: 'math',
      studyUnits: 4,
      isEnabled: false,
      learningPreferences: null,
      knownStrengths: null,
      recurringMistakes: null,
      updatedAt: null,
    });
    memoryApi.saveLearningMemory.mockReset().mockImplementation(async (_subject, _units, input) => ({
      subjectId: 'math', studyUnits: 4, updatedAt: new Date().toISOString(), ...input,
    }));
    memoryApi.deleteLearningMemory.mockReset().mockResolvedValue(undefined);
  });

  it('requires explicit opt-in and saves only the current learning context', async () => {
    render(<LearningMemoryPanel subjectId="math" studyUnits={4} />);
    fireEvent.click(screen.getByRole('button', { name: 'צפייה ושליטה' }));
    const consent = await screen.findByRole('checkbox', { name: /אפשר למורה להשתמש/ });
    expect((consent as HTMLInputElement).checked).toBe(false);

    fireEvent.click(consent);
    fireEvent.change(screen.getByLabelText('איך נוח לי ללמוד'), { target: { value: 'דוגמאות קצרות' } });
    fireEvent.click(screen.getByRole('button', { name: 'שמור' }));

    await waitFor(() => expect(memoryApi.saveLearningMemory).toHaveBeenCalledWith(
      'math',
      4,
      expect.objectContaining({ isEnabled: true, learningPreferences: 'דוגמאות קצרות' })
    ));
  });

  it('deletes the whole memory only after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<LearningMemoryPanel subjectId="physics" />);
    fireEvent.click(screen.getByRole('button', { name: 'צפייה ושליטה' }));
    await screen.findByRole('checkbox');
    fireEvent.click(screen.getByRole('button', { name: 'מחק את כל הזיכרון' }));

    await waitFor(() => expect(memoryApi.deleteLearningMemory).toHaveBeenCalledWith('physics', undefined));
  });
});
