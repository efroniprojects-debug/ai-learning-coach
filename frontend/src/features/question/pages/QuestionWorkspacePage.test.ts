import { describe, expect, it } from 'vitest';

import { extractStreamingExplanation } from './QuestionWorkspacePage';

describe('extractStreamingExplanation', () => {
  it('shows only readable explanation text from partial structured JSON', () => {
    const partial = '{"explanation":"כוח הוא דחיפה\\nאו משיכה","steps":[';

    expect(extractStreamingExplanation(partial)).toBe('כוח הוא דחיפה\nאו משיכה');
  });

  it('does not expose structured transport before the explanation begins', () => {
    expect(extractStreamingExplanation('{"metadata":{"subject":"physics"},')).toBe('');
  });
});
