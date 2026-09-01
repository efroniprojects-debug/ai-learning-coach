import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { defaultTutorTabForMode, FormattedText, normalizeMathText, ResponseDisplay } from './ResponseDisplay';
import type { TutorResponse } from '../types';

describe('FormattedText', () => {
  it('renders formulas nested inside bold numbered labels without raw delimiters', () => {
    const html = renderToStaticMarkup(
      <FormattedText text={'1. **מצב $R_1$:** הזרם עובר דרך הנגד $R_1$.\n---'} />,
    );

    expect(html).toContain('<strong>');
    expect(html).toContain('class="katex"');
    expect(html).toContain('<hr');
    expect(html).not.toContain('$R_1$');
  });

  it('repairs a multiline formula and an invalid eq command', () => {
    const broken = 'המכנה אסור שיתאפס: $2 \\cos x\n\\eq 0 \\implies \\cos x \\neq 0$';
    const normalized = normalizeMathText(broken);
    const html = renderToStaticMarkup(<FormattedText text={broken} />);

    expect(normalized).toBe('המכנה אסור שיתאפס: $2 \\cos x = 0 \\implies \\cos x \\neq 0$');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('\\eq');
    expect(html).not.toContain('$2');
  });

  it('closes an unmatched formula delimiter instead of exposing it', () => {
    const html = renderToStaticMarkup(<FormattedText text={'הפתרון הוא $x=\\frac{\\pi}{2}'} />);

    expect(html).toContain('class="katex"');
    expect(html).not.toContain('$x=');
  });
});

const baseResponse: TutorResponse = {
  conversationId: 'conversation-1',
  messageId: 'message-1',
  explanation: 'הסבר',
  steps: [{ number: 1, title: 'צעד', content: 'תוכן' }],
  hints: ['רמז'],
  misconceptions: [],
  sources: [],
};

describe('source citations', () => {
  it('renders a verified source as an openable numbered citation', () => {
    const html = renderToStaticMarkup(
      <ResponseDisplay response={{
        ...baseResponse,
        sources: [{
          id: 'source-1',
          text: 'קטע רלוונטי',
          source: 'משרד החינוך',
          citationNumber: 1,
          page: 3,
          section: 'כוחות',
          url: 'https://example.edu/source',
        }],
      }} />,
    );

    expect(html).toContain('מקור 1');
    expect(html).toContain('עמוד 3');
    expect(html).toContain('href="https://example.edu/source"');
    expect(html).toContain('rel="noreferrer"');
  });

  it('states clearly when no retrieved source supported the answer', () => {
    const html = renderToStaticMarkup(<ResponseDisplay response={baseResponse} />);
    expect(html).toContain('לא נמצא מקור לימודי מתאים לשאלה הזאת');
  });
});

describe('tutor mode presentation', () => {
  it('opens guided and full solutions on the required steps', () => {
    expect(defaultTutorTabForMode('step_by_step')).toBe('steps');
    expect(defaultTutorTabForMode('full')).toBe('steps');
  });

  it('opens diagnosis and concept modes on their explanatory feedback', () => {
    expect(defaultTutorTabForMode('diagnose')).toBe('explanation');
    expect(defaultTutorTabForMode('concept')).toBe('explanation');
  });
});
