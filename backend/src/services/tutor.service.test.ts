import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/physiq_test';
});

import {
  buildGroundingInstruction,
  buildSourceCitations,
  normalizeTutorText,
  parseTutorStructuredResponse,
  sanitizeCitationReferences,
} from './tutor.service';

const response = {
  explanation: 'פתיחה\n\nפסקה חדשה',
  steps: [{ number: 1, title: 'נתונים', content: 'נוסחה: $v=v_0+at$' }],
  hints: ['רמז ראשון'],
  misconceptions: [],
};

describe('parseTutorStructuredResponse', () => {
  it('parses fenced JSON without exposing the wrapper', () => {
    const result = parseTutorStructuredResponse(`\`\`\`json\n${JSON.stringify(response)}\n\`\`\``);
    expect(result.explanation).toBe('פתיחה\n\nפסקה חדשה');
    expect(result.steps[0].title).toBe('נתונים');
  });

  it('removes model-generated HTML from fields', () => {
    expect(normalizeTutorText('<span class="katex">45 + 40t</span>')).toBe('45 + 40t');
  });

  it('removes accidental Arabic text from Hebrew answers', () => {
    expect(normalizeTutorText('הפרש המהירויות נשאר ثابت ולכן הוא קבוע')).toBe(
      'הפרש המהירויות נשאר ולכן הוא קבוע'
    );
  });

  it('never returns raw JSON when parsing fails', () => {
    const result = parseTutorStructuredResponse('{"explanation":"הסבר נקי","steps": [broken');
    expect(result.explanation).toBe('הסבר נקי');
    expect(result.explanation).not.toContain('{');
  });

  it('preserves a plain-text solution when the provider ignores JSON mode', () => {
    const result = parseTutorStructuredResponse('```markdown\nפתרון מלא: נציב בנוסחה ונקבל $x=4$.\n```');

    expect(result.explanation).toContain('פתרון מלא');
    expect(result.explanation).not.toContain('לא הצלחתי לסדר');
    expect(result.steps[0].content).toBe(result.explanation);
  });
});

describe('source grounding', () => {
  it('builds numbered citations with verified metadata and safe links only', () => {
    const citations = buildSourceCitations([
      {
        id: 'chunk-1',
        text: '  טקסט מקור ארוך  ',
        source: 'משרד החינוך',
        sourceType: 'textbook',
        metadata: { page: 7, section: 'קינמטיקה', sourceUrl: 'https://example.edu/source' },
      },
      {
        id: 'chunk-2',
        text: 'מקור נוסף',
        source: 'מסמך לא מאומת',
        sourceType: 'custom',
        metadata: { sourceUrl: 'javascript:alert(1)' },
      },
    ]);

    expect(citations[0]).toMatchObject({ citationNumber: 1, page: 7, section: 'קינמטיקה', url: 'https://example.edu/source' });
    expect(citations[1].citationNumber).toBe(2);
    expect(citations[1].url).toBeUndefined();
  });

  it('forbids invented references when retrieval returns no source', () => {
    expect(buildGroundingInstruction(0)).toContain('אל תמציא');
    expect(buildGroundingInstruction(2)).toContain('[מקור 1] עד [מקור 2]');
  });

  it('removes citation numbers that were not present in retrieved chunks', () => {
    const sanitized = sanitizeCitationReferences({
      ...response,
      explanation: 'טענה נתמכת [מקור 1], וטענה עם הפניה מומצאת [מקור 4].',
      steps: [{ number: 1, title: 'בדיקה [מקור 3]', content: 'תוכן [מקור 2]' }],
    }, 2);

    expect(sanitized.explanation).toContain('[מקור 1]');
    expect(sanitized.explanation).not.toContain('[מקור 4]');
    expect(sanitized.steps[0].title).not.toContain('[מקור 3]');
    expect(sanitized.steps[0].content).toContain('[מקור 2]');
  });
});
