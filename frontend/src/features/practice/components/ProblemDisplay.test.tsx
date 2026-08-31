import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProblemDisplay } from './ProblemDisplay';

describe('ProblemDisplay', () => {
  it('shows the legacy Force concept in clear Hebrew', () => {
    render(<ProblemDisplay problem={{ conceptId: 'Force', difficulty: 3, eloRating: 1200 }} subjectId="physics" />);
    expect(screen.getByRole('heading', { name: 'נושא: כוח' })).toBeTruthy();
    expect(screen.queryByText(/בנושא Force/)).toBeNull();
  });
});
