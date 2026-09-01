import { describe, expect, it } from 'vitest';

import { extractStreamingExplanation, isDocumentQuestionSpecific, readableQuestionError } from './QuestionWorkspacePage';

describe('extractStreamingExplanation', () => {
  it('shows only readable explanation text from partial structured JSON', () => {
    const partial = '{"explanation":"כוח הוא דחיפה\\nאו משיכה","steps":[';

    expect(extractStreamingExplanation(partial)).toBe('כוח הוא דחיפה\nאו משיכה');
  });

  it('does not expose structured transport before the explanation begins', () => {
    expect(extractStreamingExplanation('{"metadata":{"subject":"physics"},')).toBe('');
  });
});

describe('readableQuestionError', () => {
  it('explains when the tutor rejects an incomplete solution', () => {
    expect(readableQuestionError(new Error('TUTOR_INCOMPLETE_RESPONSE'))).toContain('פתרון מלא ואיכותי');
  });
});

describe('document question targeting', () => {
  it('rejects vague workbook requests and accepts an exact exercise reference', () => {
    expect(isDocumentQuestionSpecific('פתור')).toBe(false);
    expect(isDocumentQuestionSpecific('פתור את זה')).toBe(false);
    expect(isDocumentQuestionSpecific('פתור תרגיל 4 בעמוד 7')).toBe(true);
    expect(isDocumentQuestionSpecific('פתור את התרגיל היחיד במסמך')).toBe(true);
  });
});
