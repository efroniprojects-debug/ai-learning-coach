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
