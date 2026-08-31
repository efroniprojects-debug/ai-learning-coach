import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { BagruyotSidebar } from './BagruyotSidebar';
import { StudentGuide } from './StudentGuide';

describe('header overlays', () => {
  it('renders the student guide outside the constrained header container', () => {
    const { container } = render(<div><StudentGuide /></div>);

    fireEvent.click(screen.getByRole('button', { name: 'פתיחת מדריך השימוש' }));

    expect(screen.getByRole('dialog', { name: 'מדריך SmarterAI' })).toBeTruthy();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the exams panel outside the header and exposes practice for every subject', () => {
    const { container } = render(
      <MemoryRouter>
        <div><BagruyotSidebar /></div>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'פתח סרגל בגרויות' }));
    expect(screen.getByRole('dialog', { name: '📚 בגרויות בעבר' })).toBeTruthy();
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /מתמטיקה/ }));
    fireEvent.click(screen.getByRole('button', { name: /2025/ }));
    expect(screen.getByRole('button', { name: 'צור שאלת תרגול · כללי' })).toBeTruthy();
  });
});
