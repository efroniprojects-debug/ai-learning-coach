export interface SubjectConfig {
  id: string;
  name: string;
  nameHe: string;
  systemPrompt: string;
  topics: string[];
}

export type TutorMode = 'step_by_step' | 'full' | 'diagnose' | 'concept';

// ── Mode prompt injections ────────────────────────────────────────────────────

export const MODE_PROMPTS: Record<TutorMode, string> = {
  step_by_step: `
מצב פעולה: שלב-אחר-שלב (STEP_BY_STEP).
- פרק את הפתרון ל-4-6 שלבים ממוספרים ב-steps[].
- כל שלב: כותרת ברורה ב-title, תוכן מפורט עם נוסחאות ב-content.
- ב-explanation: הסבר קצר מה הגישה הכללית.
- ב-socraticQuestion: שאל האם התלמיד הבין את הצעד האחרון.
- אל תגלה את התשובה הסופית לפני הצעד האחרון.`,

  full: `
מצב פעולה: פתרון מלא מיידי (FULL_SOLUTION).
- פתרון מלא: נתונים → נוסחה → הצבה → חישוב → תשובה עם יחידות.
- ב-explanation: "נקודת תובנה" — למה הגישה הזו עובדת ומה ניתן להכליל.
- ב-steps[]: כל פרטי הפתרון בצורה שלמה.
- ב-hints[]: 2-3 טיפים לפתרון שאלות דומות.`,

  diagnose: `
מצב פעולה: אבחון טעות (DIAGNOSE).
- התלמיד שיתף ניסיון שגוי. אל תפתור מחדש.
- ב-explanation: ציין בדיוק היכן הטעות ("הטעות נמצאת בשלב X כי...").
- ב-misconceptions[]: פרט מה שגוי ומה ההבהרה הנכונה.
- ב-socraticQuestion: שאלה מובילה שתעזור לתלמיד לתקן בעצמו.
- ב-hints[]: 3 רמזים מדורגים לתיקון.`,

  concept: `
מצב פעולה: הסבר מושג (CONCEPT).
- אנלוגיה מהחיים קודם, אחר כך הגדרה פורמלית, אחר כך נוסחה.
- ב-explanation: האנלוגיה וההסבר האינטואיטיבי (2-3 משפטים).
- ב-steps[]: הגדרה פורמלית → נוסחה → דוגמה מספרית → דוגמה מבגרות.
- ב-hints[]: 2-3 דרכים לזכור את המושג.`,
};

// ── Physics Topic Taxonomy ────────────────────────────────────────────────────

export interface TopicData {
  icon: string;
  subtopics: string[];
}

export const PHYSICS_TOPIC_TAXONOMY: Record<string, TopicData> = {
  'מכניקה': {
    icon: '⚙️',
    subtopics: [
      'קינמטיקה',
      'דינמיקה — חוקי ניוטון',
      'אנרגיה ועבודה',
      'תנע וקליטה',
      'תנועה מעגלית',
      'כבידה',
    ],
  },
  'גלים ואופטיקה': {
    icon: '🌊',
    subtopics: [
      'גלים מכניים — מחרוזת',
      'גלי קול',
      'אור — גלים אלקטרומגנטיים',
      'עקרון הכפה',
      'עדשות ומראות',
      'פיזור ועקיפה',
    ],
  },
  'חשמל ומגנטיות': {
    icon: '⚡',
    subtopics: [
      'חשמל סטטי — קולון',
      'שדה חשמלי ופוטנציאל',
      'מעגלים חשמליים DC',
      'קבלים',
      'מגנטיות — שדה מגנטי',
      'השראה אלקטרומגנטית',
    ],
  },
  'תרמודינמיקה': {
    icon: '🌡️',
    subtopics: [
      'טמפרטורה וחום — העברת חום',
      'חוק ראשון',
      'גז אידאלי',
      'חוק שני ואנטרופיה',
      'מנועי חום ומחזורים',
    ],
  },
  'פיזיקה מודרנית': {
    icon: '⚛️',
    subtopics: [
      'תורת היחסות הפרטית',
      'גלים ויחס דה-ברויי',
      'אפקט פוטואלקטרי',
      'מבנה האטום',
      'גרעין וקרינה',
      'פיזיקת חלקיקים — מבוא',
    ],
  },
};

// ── PhET Simulations ──────────────────────────────────────────────────────────

export interface PhetSim {
  title: string;
  url: string;
  description: string;
}

export const PHET_SIMULATIONS: Record<string, PhetSim[]> = {
  'קינמטיקה': [
    { title: 'תנועה: בסיסים', url: 'https://phet.colorado.edu/sims/html/motion-basics/latest/motion-basics_all.html', description: 'מיקום, מהירות, תאוצה' },
    { title: 'מישור משופע', url: 'https://phet.colorado.edu/sims/html/the-ramp/latest/the-ramp_all.html', description: 'תנועה על מישור משופע' },
  ],
  'דינמיקה — חוקי ניוטון': [
    { title: 'כוחות ותנועה', url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html', description: 'חוקי ניוטון בפעולה' },
    { title: 'מאזן כוחות', url: 'https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_all.html', description: 'מומנטים ושיווי משקל' },
  ],
  'אנרגיה ועבודה': [
    { title: 'מגלשת אנרגיה', url: 'https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html', description: 'שימור אנרגיה' },
    { title: 'המרות אנרגיה', url: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_all.html', description: 'סוגי אנרגיה' },
  ],
  'תנע וקליטה': [
    { title: 'התנגשות כדורים', url: 'https://phet.colorado.edu/sims/html/collision-lab/latest/collision-lab_all.html', description: 'שימור תנע, התנגשויות' },
  ],
  'תנועה מעגלית': [
    { title: 'מערכת השמש', url: 'https://phet.colorado.edu/sims/html/my-solar-system/latest/my-solar-system_all.html', description: 'כבידה ותנועה מעגלית' },
  ],
  'כבידה': [
    { title: 'חוק כבידה', url: 'https://phet.colorado.edu/sims/html/gravity-force-lab-basics/latest/gravity-force-lab-basics_all.html', description: 'חוק הכבידה של ניוטון' },
  ],
  'גלים מכניים — מחרוזת': [
    { title: 'גל על מיתר', url: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html', description: 'אמפליטודה, תדר, אורך גל' },
  ],
  'גלי קול': [
    { title: 'גלים: מבוא', url: 'https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_all.html', description: 'גלי קול ואור' },
  ],
  'אור — גלים אלקטרומגנטיים': [
    { title: 'שבירת אור', url: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html', description: 'שבירת אור, חוק סנל' },
  ],
  'עדשות ומראות': [
    { title: 'אופטיקה גיאומטרית', url: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_all.html', description: 'עדשות, מראות, קרני אור' },
  ],
  'חשמל סטטי — קולון': [
    { title: 'בלונים וחשמל', url: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_all.html', description: 'מטענים וכוחות' },
    { title: 'חוק קולון', url: 'https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_all.html', description: 'כוח בין מטענים' },
  ],
  'שדה חשמלי ופוטנציאל': [
    { title: 'שדה חשמלי', url: 'https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_all.html', description: 'קווי שדה ופוטנציאל' },
  ],
  'מעגלים חשמליים DC': [
    { title: 'ערכת מעגל DC', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html', description: 'בניית מעגלים' },
    { title: 'חוק אוהם', url: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html', description: 'מתח, זרם, התנגדות' },
  ],
  'גז אידאלי': [
    { title: 'תכונות גז', url: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html', description: 'לחץ, נפח, טמפרטורה' },
  ],
  'אפקט פוטואלקטרי': [
    { title: 'אפקט פוטואלקטרי', url: 'https://phet.colorado.edu/sims/html/photoelectric-effect/latest/photoelectric-effect_all.html', description: 'פוטונים ואלקטרונים' },
  ],
  'גרעין וקרינה': [
    { title: 'דעיכה רדיואקטיבית', url: 'https://phet.colorado.edu/sims/html/radioactive-dating-game/latest/radioactive-dating-game_all.html', description: 'פחמן-14, דעיכה' },
  ],
};

// ── System Prompt Builder ─────────────────────────────────────────────────────

const BASE_PHYSICS_PROMPT = `אתה פיזיקיו — מורה פרטי לפיזיקה לתלמידי י'-י"ב בישראל.
אתה מזהה קשיים, מבין דרך חשיבה, ומוביל להבנה אמיתית — לא רק לתשובה.

**כשתלמיד שולח תמונה של תרגיל:**
1. קרא את כל הנתונים בתמונה בעיון
2. ציין בפתיחה: "זיהיתי מהתמונה: ..." (פרט ערכים, יחידות, ציורים)
3. הסבר מה רלוונטי לפתרון ומה לא
4. רק אחר כך — הסבר שלב אחרי שלב

**עקרונות הוראה:**
1. **אינטואיציה קודם** — מה קורה פיזיקלית? דמיין את המצב לפני הנוסחה
2. **אנלוגיה מהחיים** — קשר לחוויה יומיומית (כדור, מכונית, ליפת)
3. **שיטת סוקרטס** — הובל בשאלות, אל תתן תשובה ישירה
4. **מניעת טעויות נפוצות** — ציין מה תלמידים רגילים לבלבל
5. **כשיש טעות בניסיון התלמיד** — "בואו נבדוק ביחד..." לא "זה שגוי"
6. **עברית תמיד** — פשוטה, ברורה, סבלנית, לא שופטת. אין להשתמש במילים או בתווים בערבית, גם לא לצורך הדגשה או תרגום.

**פורמט תגובה — JSON בלבד, ללא מלל מחוץ לאובייקט:**
- אין להשתמש ב-HTML או בתגיות כגון span, div, katex או style.
- נוסחאות ייכתבו כ-LaTeX פשוט בין סימני $ בלבד, לדוגמה: $v=v_0+at$.
- אין לעטוף את ה-JSON בבלוק Markdown ואין להוסיף סימני גדר קוד.
- בכל content יש להפריד בין פסקאות באמצעות שורה ריקה (\\n\\n).
{
  "explanation": "הסבר אינטואיטיבי (2-4 משפטים) — מה קורה פיזיקלית? כולל אנלוגיה אם רלוונטי",
  "steps": [
    { "number": 1, "title": "שם הצעד", "content": "תוכן מפורט בעברית עם נוסחאות" }
  ],
  "hints": ["רמז מוביל ראשון", "רמז שני יותר ספציפי", "רמז שלישי כמעט-תשובה"],
  "misconceptions": [
    { "misconception": "טעות נפוצה של תלמידים", "correction": "ההבהרה הנכונה" }
  ],
  "socraticQuestion": "שאלה אחת שמעודדת חשיבה עמוקה ומובילה לתובנה"
}`;

export function buildSystemPrompt(mode?: TutorMode): string {
  const base = process.env.TUTOR_PROMPT_PHYSICS || BASE_PHYSICS_PROMPT;
  const modeKey: TutorMode = mode ?? 'step_by_step';
  return MODE_PROMPTS[modeKey] + '\n\n' + base;
}

// ── Subject Registry ──────────────────────────────────────────────────────────

export const SUBJECTS: Record<string, SubjectConfig> = {
  physics: {
    id: 'physics',
    name: 'Physics',
    nameHe: 'פיזיקה',
    systemPrompt: buildSystemPrompt(),
    topics: Object.keys(PHYSICS_TOPIC_TAXONOMY),
  },
};

export function getSubjectConfig(subjectId: string): SubjectConfig {
  const config = SUBJECTS[subjectId];
  if (!config) throw new Error(`Unknown subject: ${subjectId}. Supported: ${Object.keys(SUBJECTS).join(', ')}`);
  return config;
}
