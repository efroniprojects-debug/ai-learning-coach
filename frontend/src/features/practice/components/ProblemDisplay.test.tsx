import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProblemDisplay } from './ProblemDisplay';

describe('ProblemDisplay', () => {
  it('keeps the page usable with the previous backend response shape', () => {
    render(<ProblemDisplay problem={{ id: 'legacy', conceptId: 'Force', difficulty: 1, eloRating: 1000 }} subjectId="physics" />);
    expect(screen.getByRole('heading', { name: 'נושא: כוח' })).toBeTruthy();
  });

  it('shows the legacy Force concept in clear Hebrew', () => {
    render(<ProblemDisplay problem={{ id: 'physics-force', conceptId: 'Force', difficulty: 3, eloRating: 1200, hints: [] }} subjectId="physics" />);
    expect(screen.getByRole('heading', { name: 'נושא: כוח' })).toBeTruthy();
    expect(screen.queryByText(/בנושא Force/)).toBeNull();
  });

  it('renders an original math question with curriculum attribution', () => {
    const { container } = render(<ProblemDisplay problem={{
      id: 'math-4-derivative-1', conceptId: 'נגזרות', difficulty: 3, eloRating: 1000,
      question: 'מצא נקודות חשודות לקיצון עבור $x^2$.', hints: ['גזור את הפונקציה.'],
      source: { type: 'original-aligned', curriculumVersion: 'תשפ״ז', sourceUrl: 'https://pop.education.gov.il/' },
    }} subjectId="math" />);
    expect(screen.getByText(/מצא נקודות חשודות לקיצון/)).toBeTruthy();
    expect(container.querySelector('.katex')).toBeTruthy();
    expect(screen.queryByText('$x^2$')).toBeNull();
    expect(screen.getByText(/תרגיל מקורי מותאם/)).toBeTruthy();
  });
});
