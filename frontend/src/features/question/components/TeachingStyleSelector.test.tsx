import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TeachingStyleSelector } from './TeachingStyleSelector';

describe('TeachingStyleSelector', () => {
  it('shows three accessible styles and reports a change', () => {
    const onChange = vi.fn();
    render(<TeachingStyleSelector value="balanced" onChange={onChange} />);

    expect(screen.getByRole('button', { name: /מאוזן ומסביר/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /מעמיק עם דוגמאות/ }));
    expect(onChange).toHaveBeenCalledWith('deep');
  });

  it('disables every style while the tutor is answering', () => {
    render(<TeachingStyleSelector value="concise" onChange={vi.fn()} disabled />);
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true);
  });
});
