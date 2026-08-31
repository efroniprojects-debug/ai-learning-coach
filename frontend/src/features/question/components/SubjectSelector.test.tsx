import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SubjectSelector } from './SubjectSelector';

describe('SubjectSelector', () => {
  it('shows Physics and Mathematics and reports a subject change', () => {
    const onChange = vi.fn();
    render(<SubjectSelector value="physics" onChange={onChange} />);

    expect(screen.getByRole('button', { name: /פיזיקה/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /מתמטיקה/ }));
    expect(onChange).toHaveBeenCalledWith('math');
  });
});
