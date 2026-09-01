import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/physiq_test';
});

import {
  buildGroundingInstruction,
  buildSourceCitations,
  normalizeTutorText,
  isTutorResponseComplete,
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

  it('marks an unparseable provider response as incomplete instead of accepting the fallback', () => {
    const result = parseTutorStructuredResponse('{"steps": [broken');

    expect(result.explanation).toContain('לא הצלחתי לסדר');
    expect(isTutorResponseComplete(result, 'full')).toBe(false);
  });

  it('preserves a plain-text solution when the provider ignores JSON mode', () => {
    const result = parseTutorStructuredResponse('```markdown\nפתרון מלא: נציב בנוסחה ונקבל $x=4$.\n```');

    expect(result.explanation).toContain('פתרון מלא');
    expect(result.explanation).not.toContain('לא הצלחתי לסדר');
    expect(result.steps[0].content).toBe(result.explanation);
  });

  it('extracts a double-encoded explanation without exposing JSON transport', () => {
    const result = parseTutorStructuredResponse('{\\"explanation\\":\\"הסבר פיזיקלי קריא\\",\\"steps\\":[');

    expect(result.explanation).toBe('הסבר פיזיקלי קריא');
    expect(result.steps[0].content).not.toContain('explanation');
    expect(result.steps[0].content).not.toContain('{');
  });
});

describe('tutor response quality gate', () => {
  it('rejects placeholder JSON even when it matches the schema', () => {
    expect(isTutorResponseComplete({
      explanation: '...',
      steps: [{ number: 1, title: '...', content: '...' }],
      hints: ['...', '...'],
      misconceptions: [],
    }, 'full')).toBe(false);
  });

  it('accepts a complete multi-step full solution', () => {
    const detailed = 'מזהים את הנתונים, מסבירים את העיקרון הפיזיקלי, מציבים בנוסחה עם יחידות ומבצעים את החישוב באופן מלא וברור.';
    expect(isTutorResponseComplete({
      explanation: 'נפתור באמצעות עקרון שימור האנרגיה ונבדוק בסוף שהיחידות והתוצאה מתאימות למצב הפיזיקלי המתואר.',
      steps: [1, 2, 3, 4].map((number) => ({ number, title: `שלב ${number}`, content: detailed })),
      hints: ['רשום תחילה את כל הנתונים והיחידות', 'בדוק שהתוצאה הסופית הגיונית מבחינה פיזיקלית'],
      misconceptions: [],
    }, 'full')).toBe(true);
  });

  it('accepts a concise valid solution instead of grading it by character count', () => {
    expect(isTutorResponseComplete({
      explanation: 'הכדור נע בהשפעת כוח הכובד בלבד ולכן תאוצתו קבועה כלפי מטה.',
      steps: [
        { number: 1, title: 'עיקרון', content: 'בוחרים מעלה כחיובי ולכן התאוצה היא $a=-g$.' },
        { number: 2, title: 'מסקנה', content: 'גם בעלייה וגם בירידה התאוצה נשארת כלפי מטה.' },
      ],
      hints: ['הפרד בין כיוון המהירות לכיוון התאוצה.'],
      misconceptions: [],
    }, 'full')).toBe(true);
  });

  it('still rejects a one-step response in a worked-solution mode', () => {
    expect(isTutorResponseComplete({
      explanation: 'נדרש כאן פתרון מדורג ולא תשובה שמדלגת ישירות אל התוצאה הסופית.',
      steps: [{ number: 1, title: 'תוצאה', content: 'התשובה נכתבה ללא דרך פתרון מספקת.' }],
      hints: ['בדוק את דרך הפתרון.'],
      misconceptions: [],
    }, 'full')).toBe(false);
  });

  it('rejects a one-step full response even when the step content is very long', () => {
    const longContent = 'זיהיתי מהתמונה: גרף מהירות-זמן עבור תנועת מעלית. ציר x הוא הזמן בשניות, ציר y הוא המהירות במטרים לשנייה. הגרף מורכב משני קטעים ישרים המייצגים תנועות בשני הכיוונים. נקודת תובנה: שטח הכלוא בין גרף המהירות לציר הזמן מייצג את ההעתק. שטחים מעל הציר הם תנועה כלפי מעלה ושטחים מתחתיו הם תנועה כלפי מטה. חיסום או חיבור השטחים מאפשר למצוא את ההעתק הכולל בקלות.';
    expect(isTutorResponseComplete({
      explanation: 'פתרון שלם באמצעות גרף מהירות-זמן.',
      steps: [{ number: 1, title: 'הסבר', content: longContent }],
      hints: ['בדוק את שטח הגרף'],
      misconceptions: [],
    }, 'full')).toBe(false);
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

  it('treats an attached document as the source instead of claiming none was attached', () => {
    const instruction = buildGroundingInstruction(0, { kind: 'document', name: 'workbook.pdf' });

    expect(instruction).toContain('המסמך המצורף');
    expect(instruction).toContain('workbook.pdf');
    expect(instruction).not.toContain('לא נמצא חומר');
    expect(instruction).not.toContain('אין מקור מצורף');
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
