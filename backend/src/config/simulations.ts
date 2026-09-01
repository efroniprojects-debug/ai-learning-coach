import type { MathStudyUnits } from './math-curriculum';

export type SimulationProvider = 'phet' | 'geogebra' | 'desmos';

export interface LearningSimulation {
  id: string;
  provider: SimulationProvider;
  subjectId: 'physics' | 'math';
  studyUnits: MathStudyUnits[] | null;
  topics: string[];
  title: string;
  url: string;
  description: string;
  locale: 'he' | 'multi';
  gradeRange: [number, number];
  learningGoal: string;
  investigation: string;
  guidingQuestions: string[];
  summaryPrompt: string;
}

export const ALLOWED_SIMULATION_HOSTS = ['phet.colorado.edu'] as const;

export const MATH_SIMULATIONS: LearningSimulation[] = [
  {
    id: 'phet-graphing-slope-intercept', provider: 'phet', subjectId: 'math', studyUnits: [3, 4, 5],
    topics: ['פונקציה קווית', 'גאומטריה אנליטית'], title: 'גרף שיפוע וחיתוך',
    url: 'https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept_all.html',
    description: 'חוקרים כיצד שיפוע ונקודת חיתוך משנים ישר.', locale: 'multi', gradeRange: [9, 12],
    learningGoal: 'לקשר בין $y=mx+b$ לבין צורת הגרף.', investigation: 'שנה בנפרד את $m$ ואת $b$ ותעד מה משתנה בגרף.',
    guidingQuestions: ['מה קורה כאשר $m$ שלילי?', 'איזה פרמטר מזיז את הישר בלי לשנות את שיפועו?'], summaryPrompt: 'נסח במילים את תפקידם של $m$ ושל $b$.',
  },
  {
    id: 'phet-curve-fitting', provider: 'phet', subjectId: 'math', studyUnits: [3, 4, 5],
    topics: ['דיאגרמות פיזור ורגרסיה', 'סטטיסטיקה', 'בדיקת השערות'], title: 'התאמת עקומה לנתונים',
    url: 'https://phet.colorado.edu/sims/html/curve-fitting/latest/curve-fitting_all.html',
    description: 'מתאימים מודל לנתונים ובוחנים את איכות ההתאמה.', locale: 'multi', gradeRange: [10, 12],
    learningGoal: 'להבין קשר בין נתונים, מודל ושאריות.', investigation: 'נסה להתאים ישר ולאחר מכן עקומה לאותן נקודות.',
    guidingQuestions: ['איזה מודל משאיר שאריות קטנות יותר?', 'האם מודל מורכב יותר תמיד עדיף?'], summaryPrompt: 'הסבר כיצד החלטת איזה מודל מתאים יותר.',
  },
  {
    id: 'phet-calculus-grapher', provider: 'phet', subjectId: 'math', studyUnits: [4, 5],
    topics: ['נגזרות', 'יישומי נגזרת', 'חקירת פונקציות', 'אינטגרלים'], title: 'חוקר חשבון דיפרנציאלי ואינטגרלי',
    url: 'https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_all.html',
    description: 'משווים בין פונקציה, נגזרת ופונקציית הצטברות.', locale: 'multi', gradeRange: [11, 12],
    learningGoal: 'לקשר גרפית בין פונקציה, שיפוע והצטברות.', investigation: 'צור פונקציה עם מקסימום ומינימום והשווה לגרף הנגזרת.',
    guidingQuestions: ['מה ערך הנגזרת בנקודת קיצון?', 'מתי פונקציית ההצטברות יורדת?'], summaryPrompt: 'כתוב שני קשרים שגילית בין שלושת הגרפים.',
  },
  {
    id: 'phet-quadrilateral', provider: 'phet', subjectId: 'math', studyUnits: [3, 4, 5],
    topics: ['גאומטריה במישור', 'גאומטריה משולבת', 'גאומטריה אוקלידית'], title: 'מרובעים',
    url: 'https://phet.colorado.edu/sims/html/quadrilateral/latest/quadrilateral_all.html',
    description: 'חוקרים תכונות קבועות ומשתנות של משפחות מרובעים.', locale: 'multi', gradeRange: [8, 12],
    learningGoal: 'לזהות תנאים מספיקים והכרחיים לסוגי מרובעים.', investigation: 'גרור קודקודים ושמור בכל פעם על תכונה אחרת.',
    guidingQuestions: ['אילו תכונות נשמרות במקבילית?', 'מתי מעוין הוא גם ריבוע?'], summaryPrompt: 'בנה תרשים הכלה בין משפחות המרובעים.',
  },
];

export function isAllowedSimulationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_SIMULATION_HOSTS.includes(parsed.hostname as typeof ALLOWED_SIMULATION_HOSTS[number]);
  } catch {
    return false;
  }
}

export function getMathSimulations(units: MathStudyUnits, topic?: string): LearningSimulation[] {
  return MATH_SIMULATIONS.filter((simulation) =>
    simulation.studyUnits?.includes(units)
    && (!topic || simulation.topics.includes(topic))
    && isAllowedSimulationUrl(simulation.url));
}
