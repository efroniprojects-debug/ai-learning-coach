import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/physiq_test';
});

import { normalizeTutorText, parseTutorStructuredResponse } from './tutor.service';

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
});
