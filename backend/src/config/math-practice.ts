import type { MathStudyUnits } from './math-curriculum';

export interface MathPracticeProblem {
  id: string;
  units: MathStudyUnits;
  conceptId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  question: string;
  expectedAnswer: string;
  hints: string[];
  source: {
    type: 'original-aligned';
    curriculumVersion: string;
    sourceUrl: string;
  };
}

const CURRICULUM_SOURCE = 'https://pop.education.gov.il/tchumey_daat/matmatika/chativa-elyona/teaching-mathematics/new-curriculum/';
const source = { type: 'original-aligned' as const, curriculumVersion: 'תשפ״ז', sourceUrl: CURRICULUM_SOURCE };

// Original questions aligned to the official curriculum. They are not copied
// from protected matriculation exams and may safely be used for practice.
export const MATH_PRACTICE_PROBLEMS: MathPracticeProblem[] = [
  { id: 'math-3-percent-1', units: 3, conceptId: 'אחוזים ושינוי יחסי', difficulty: 1, question: 'מחיר תיק היה 240 ₪. המחיר עלה ב־15%. מה המחיר החדש? הצג את החישוב.', expectedAnswer: '276 ₪', hints: ['חשב 15% מתוך 240.', 'הוסף את התוספת למחיר המקורי.'], source },
  { id: 'math-3-growth-1', units: 3, conceptId: 'גדילה ודעיכה', difficulty: 3, question: 'במושבה יש 800 חיידקים, ומספרם גדל בכל שעה ב־20%. כמה חיידקים צפויים לאחר 3 שעות?', expectedAnswer: '1382.4, כלומר כ־1382 חיידקים', hints: ['מקדם הגדילה הוא 1.2.', 'השתמש במודל $800\\cdot1.2^3$.'], source },
  { id: 'math-3-normal-1', units: 3, conceptId: 'התפלגות נורמלית', difficulty: 3, question: 'ציונים מתפלגים נורמלית עם ממוצע 80 וסטיית תקן 5. מהו ציון התקן של תלמיד שקיבל 90?', expectedAnswer: '2', hints: ['השתמש בנוסחה $z=\\frac{x-\\mu}{\\sigma}$.'], source },
  { id: 'math-4-probability-1', units: 4, conceptId: 'הסתברות', difficulty: 2, question: 'בקופסה 5 כדורים כחולים ו־3 ירוקים. מוציאים כדור אחד באקראי. מה ההסתברות שיֵצא כחול?', expectedAnswer: '$\\frac{5}{8}$', hints: ['חלק את מספר התוצאות הרצויות במספר כל התוצאות.'], source },
  { id: 'math-4-sequence-1', units: 4, conceptId: 'סדרות חשבוניות והנדסיות', difficulty: 3, question: 'בסדרה חשבונית $a_1=7$ והפרש הסדרה הוא 4. מצא את $a_{12}$.', expectedAnswer: '51', hints: ['השתמש בנוסחה $a_n=a_1+(n-1)d$.'], source },
  { id: 'math-4-geometry-1', units: 4, conceptId: 'גאומטריה משולבת', difficulty: 3, question: 'במשולש ישר־זווית אורכי הניצבים הם 6 ו־8. חשב את אורך היתר ואת רדיוס המעגל החוסם.', expectedAnswer: 'היתר 10, רדיוס המעגל החוסם 5', hints: ['השתמש במשפט פיתגורס.', 'במשולש ישר־זווית מרכז המעגל החוסם הוא אמצע היתר.'], source },
  { id: 'math-4-derivative-1', units: 4, conceptId: 'נגזרות', difficulty: 3, question: 'נתונה הפונקציה $f(x)=x^3-6x^2+9x$. מצא את נקודות החשודות לקיצון.', expectedAnswer: '$x=1,3$', hints: ['גזור את הפונקציה.', 'פתור $f\\prime(x)=0$.'], source },
  { id: 'math-5-induction-1', units: 5, conceptId: 'אינדוקציה מתמטית', difficulty: 4, question: 'הוכח באינדוקציה שלכל $n\\ge1$ מתקיים $1+3+5+\\dots+(2n-1)=n^2$.', expectedAnswer: 'בסיס $n=1$; בהנחת האינדוקציה מוסיפים $2k+1$ ומקבלים $(k+1)^2$.', hints: ['בדוק תחילה את $n=1$.', 'בהנחה עבור $k$, הוסף את האיבר הבא $2k+1$.'], source },
  { id: 'math-5-trigonometry-1', units: 5, conceptId: 'טריגונומטריה במישור', difficulty: 4, question: 'במשולש $ABC$ נתון $a=7$, $b=10$ והזווית שביניהם $C=60^\\circ$. מצא את הצלע $c$ ואת שטח המשולש.', expectedAnswer: '$c=\\sqrt{79}$ והשטח $\\frac{35\\sqrt{3}}{2}$', hints: ['לצלע השלישית השתמש במשפט הקוסינוסים.', 'לשטח השתמש ב־$S=\\frac{1}{2}ab\\sin C$.'], source },
  { id: 'math-5-calculus-1', units: 5, conceptId: 'חקירת פונקציות', difficulty: 4, question: 'חקור את $f(x)=x+\\frac{4}{x}$ בתחום $x>0$: מצא נקודת קיצון וקבע את סוגה.', expectedAnswer: 'מינימום בנקודה $(2,4)$', hints: ['גזור וקבל $1-\\frac{4}{x^2}$.', 'בדוק שינוי סימן סביב $x=2$.'], source },
  { id: 'math-5-complex-1', units: 5, conceptId: 'הצגה אלגברית', difficulty: 4, question: 'פתור במישור המרוכב את המשוואה $z^2=-16$ והצג את הפתרונות בצורה אלגברית.', expectedAnswer: '$z=4i$ או $z=-4i$', hints: ['$i^2=-1$.'], source },
];

export function getMathProblems(units: MathStudyUnits, conceptId?: string): MathPracticeProblem[] {
  return MATH_PRACTICE_PROBLEMS.filter((problem) => problem.units === units && (!conceptId || problem.conceptId === conceptId));
}
