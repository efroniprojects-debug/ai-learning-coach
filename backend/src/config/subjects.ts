export interface SubjectConfig {
  id: string;
  name: string;
  nameHe: string;
  systemPrompt: string;
  topics: string[];
}

const PHYSICS_SYSTEM_PROMPT = `אתה מורה פרטי מומחה בפיזיקה לתלמידי י'-י"ב בישראל.

**עקרונות ליבה:**
1. **אינטואיציה קודם** — הסבר מה קורה פיזיקלית לפני הנוסחה
2. **שיטת סוקרטס** — שאל שאלות שמובילות את התלמיד לתשובה, לא תתן אותה ישר
3. **שלב אחרי שלב** — פרק כל בעיה לצעדים קטנים וברורים
4. **ציטוט מקורות** — כשמשתמש בחומר לימוד, ציין: «[מקור X, עמ׳ Y]»
5. **עברית ברורה** — הסברים פשוטים, ללא ז'רגון מיותר

**פורמט תגובה — JSON בלבד, ללא מלל מחוץ לאובייקט:**
{
  "explanation": "הסבר אינטואיטיבי קצר (2-4 משפטים) — מה קורה פיזיקלית?",
  "steps": [
    { "number": 1, "title": "שם הצעד", "content": "תוכן מפורט בעברית" }
  ],
  "hints": ["רמז מוביל ראשון", "רמז שני יותר ספציפי", "רמז שלישי כמעט-תשובה"],
  "misconceptions": [
    { "misconception": "טעות נפוצה של תלמידים", "correction": "ההבהרה הנכונה" }
  ],
  "socraticQuestion": "שאלה אחת שמעודדת חשיבה עמוקה — לא שאלה שניתן לענות עליה בהן/לאו"
}`;

export const SUBJECTS: Record<string, SubjectConfig> = {
  physics: {
    id: 'physics',
    name: 'Physics',
    nameHe: 'פיזיקה',
    systemPrompt: process.env.TUTOR_PROMPT_PHYSICS || PHYSICS_SYSTEM_PROMPT,
    topics: ['מכניקה', 'חשמל ומגנטיות', 'גלים', 'אופטיקה', 'תרמודינמיקה', 'אטומיסטיקה'],
  },
};

export function getSubjectConfig(subjectId: string): SubjectConfig {
  const config = SUBJECTS[subjectId];
  if (!config) throw new Error(`Unknown subject: ${subjectId}. Supported: ${Object.keys(SUBJECTS).join(', ')}`);
  return config;
}

// ── Physics Topic Taxonomy ────────────────────────────────────────────────────

export interface TopicConfig {
  icon: string;
  subtopics: string[];
}

export const PHYSICS_TOPIC_TAXONOMY: Record<string, TopicConfig> = {
  'מכניקה': {
    icon: '⚙️',
    subtopics: ['קינמטיקה', 'דינמיקה — חוקי ניוטון', 'אנרגיה ועבודה', 'תנע וקליטה', 'תנועה מעגלית', 'כבידה וגלים כבידתיים'],
  },
  'גלים ואופטיקה': {
    icon: '🌊',
    subtopics: ['גלים מכניים — מחרוזת', 'גלי קול', 'אור — גלים אלקטרומגנטיים', 'עקרון הכפה', 'עדשות ומראות', 'פיזור ועקיפה'],
  },
  'חשמל ומגנטיות': {
    icon: '⚡',
    subtopics: ['חשמל סטטי — קולון', 'שדה חשמלי ופוטנציאל', 'מעגלים חשמליים DC', 'קבלים', 'מגנטיות — שדה מגנטי', 'השראה אלקטרומגנטית'],
  },
  'תרמודינמיקה': {
    icon: '🌡️',
    subtopics: ['טמפרטורה וחום — העברת חום', 'חוק ראשון', 'גז אידאלי', 'חוק שני ואנטרופיה', 'מנועי חום ומחזורים'],
  },
  'פיזיקה מודרנית': {
    icon: '⚛️',
    subtopics: ['תורת היחסות הפרטית', 'גלים ויחס דה-ברויי', 'אפקט פוטואלקטרי', 'מבנה האטום', 'גרעין וקרינה', 'פיסיקת חלקיקים — מבוא'],
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
    { title: 'אדם הולך', url: 'https://phet.colorado.edu/sims/html/the-ramp/latest/the-ramp_all.html', description: 'מישור משופע ותנועה' },
  ],
  'דינמיקה — חוקי ניוטון': [
    { title: 'כוחות ותנועה', url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html', description: 'חוקי ניוטון בפעולה' },
    { title: 'מאזן כוחות', url: 'https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_all.html', description: 'מומנטים ושיווי משקל' },
  ],
  'אנרגיה ועבודה': [
    { title: 'מגלשת אנרגיה', url: 'https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html', description: 'שימור אנרגיה' },
    { title: 'אנרגיה וגלים', url: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_all.html', description: 'המרות אנרגיה' },
  ],
  'גלים מכניים — מחרוזת': [
    { title: 'גל על מיתר', url: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html', description: 'אמפליטודה, תדר, אורך גל' },
  ],
  'גלי קול': [
    { title: 'גלים: מבוא', url: 'https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_all.html', description: 'גלי קול ואור' },
  ],
  'חשמל סטטי — קולון': [
    { title: 'בלונים וחשמל', url: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_all.html', description: 'מטענים וכוחות' },
  ],
  'מעגלים חשמליים DC': [
    { title: 'ערכת מעגל DC', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html', description: 'בניית מעגלים' },
    { title: 'אוהם וחוק קירכהוף', url: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html', description: 'חוק אוהם' },
  ],
  'גז אידאלי': [
    { title: 'תכונות גז', url: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html', description: 'לחץ, נפח, טמפרטורה' },
  ],
  'אפקט פוטואלקטרי': [
    { title: 'אפקט פוטואלקטרי', url: 'https://phet.colorado.edu/sims/html/photoelectric-effect/latest/photoelectric-effect_all.html', description: 'פוטונים ואלקטרונים' },
  ],
  'גרעין וקרינה': [
    { title: 'קרינה ופחמן 14', url: 'https://phet.colorado.edu/sims/html/radioactive-dating-game/latest/radioactive-dating-game_all.html', description: 'דעיכה רדיואקטיבית' },
  ],
};
