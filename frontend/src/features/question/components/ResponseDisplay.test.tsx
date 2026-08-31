import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FormattedText, normalizeMathText } from './ResponseDisplay';

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
