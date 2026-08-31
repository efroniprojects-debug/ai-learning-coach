import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FormattedText } from './ResponseDisplay';

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
});
