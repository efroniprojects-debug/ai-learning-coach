export type MathStudyUnits = 3 | 4 | 5;

export interface CurriculumSkill {
  id: string;
  nameHe: string;
  prerequisites: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface CurriculumTopic {
  icon: string;
  grades: Array<10 | 11 | 12>;
  subtopics: string[];
  skills: CurriculumSkill[];
}

export interface MathCurriculumTrack {
  units: MathStudyUnits;
  academicYear: string;
  curriculumVersion: string;
  officialSourceUrl: string;
  topics: Record<string, CurriculumTopic>;
  questionnaires: string[];
}

const OFFICIAL_CURRICULUM_URL = 'https://pop.education.gov.il/tchumey_daat/matmatika/chativa-elyona/teaching-mathematics/new-curriculum/';

export const MATH_CURRICULUM: Record<MathStudyUnits, MathCurriculumTrack> = {
  3: {
    units: 3,
    academicYear: 'תשפ״ז',
    curriculumVersion: 'התוכנית החדשה — מהדורת תשפ״ז',
    officialSourceUrl: OFFICIAL_CURRICULUM_URL,
    questionnaires: ['35172', '35173', '35371', '35372'],
    topics: {
      'חברה ומדע': {
        icon: '📊', grades: [10, 11],
        subtopics: ['סטטיסטיקה תיאורית', 'דיאגרמות פיזור ורגרסיה', 'הסתברות', 'התפלגות נורמלית'],
        skills: [
          { id: 'statistics-reading-3', nameHe: 'קריאה והשוואה של נתונים', prerequisites: [], difficulty: 1 },
          { id: 'normal-distribution-3', nameHe: 'חישוב והסקה בהתפלגות נורמלית', prerequisites: ['statistics-reading-3'], difficulty: 3 },
        ],
      },
      'התמצאות במישור ובמרחב': {
        icon: '📐', grades: [10, 11, 12],
        subtopics: ['גאומטריה במישור', 'גאומטריה אנליטית', 'טריגונומטריה יישומית', 'גאומטריה במרחב'],
        skills: [
          { id: 'plane-measurement-3', nameHe: 'חישובי אורך, שטח וקנה מידה', prerequisites: [], difficulty: 2 },
          { id: 'analytic-geometry-3', nameHe: 'ישר ומרחק במערכת צירים', prerequisites: ['plane-measurement-3'], difficulty: 3 },
        ],
      },
      'כלכלה ופיננסים': {
        icon: '💰', grades: [10, 11],
        subtopics: ['אחוזים ושינוי יחסי', 'גדילה ודעיכה', 'ריבית והצמדה', 'תכנון ליניארי', 'מודל ריבועי'],
        skills: [
          { id: 'percent-change-3', nameHe: 'שינוי באחוזים', prerequisites: [], difficulty: 1 },
          { id: 'growth-decay-3', nameHe: 'בניית מודל גדילה ודעיכה', prerequisites: ['percent-change-3'], difficulty: 3 },
        ],
      },
    },
  },
  4: {
    units: 4,
    academicYear: 'תשפ״ז',
    curriculumVersion: 'התוכנית החדשה — מהדורת תשפ״ז',
    officialSourceUrl: OFFICIAL_CURRICULUM_URL,
    questionnaires: ['35471', '35472'],
    topics: {
      'סטטיסטיקה והסתברות': {
        icon: '🎲', grades: [10, 11, 12],
        subtopics: ['סטטיסטיקה', 'הסתברות', 'התפלגות נורמלית', 'בדיקת השערות'],
        skills: [
          { id: 'probability-models-4', nameHe: 'בניית מודל הסתברות', prerequisites: [], difficulty: 2 },
          { id: 'hypothesis-testing-4', nameHe: 'בדיקת השערות', prerequisites: ['probability-models-4'], difficulty: 4 },
        ],
      },
      'גאומטריה ווקטורים': {
        icon: '📐', grades: [10, 11, 12],
        subtopics: ['גאומטריה משולבת', 'טריגונומטריה', 'גאומטריה אנליטית', 'וקטורים', 'גאומטריה במרחב'],
        skills: [
          { id: 'geometry-proof-4', nameHe: 'הוכחה גאומטרית משולבת', prerequisites: [], difficulty: 3 },
          { id: 'vectors-space-4', nameHe: 'וקטורים וגאומטריה במרחב', prerequisites: ['geometry-proof-4'], difficulty: 4 },
        ],
      },
      'פונקציות וחדו״א': {
        icon: '∫', grades: [10, 11, 12],
        subtopics: ['פונקציות פולינום ורציונליות', 'נגזרות', 'יישומי נגזרת', 'אינטגרלים', 'פונקציות מעריכיות ולוגריתמיות'],
        skills: [
          { id: 'derivatives-4', nameHe: 'גזירה וחקירת פונקציה', prerequisites: [], difficulty: 3 },
          { id: 'integrals-4', nameHe: 'אינטגרל ושטחים', prerequisites: ['derivatives-4'], difficulty: 4 },
        ],
      },
      'סדרות ומודלים': {
        icon: '🔢', grades: [11, 12],
        subtopics: ['סדרות חשבוניות והנדסיות', 'גדילה ודעיכה'],
        skills: [{ id: 'sequences-4', nameHe: 'זיהוי וחישוב בסדרות', prerequisites: [], difficulty: 3 }],
      },
    },
  },
  5: {
    units: 5,
    academicYear: 'תשפ״ז',
    curriculumVersion: 'התוכנית החדשה — מהדורת תשפ״ז',
    officialSourceUrl: OFFICIAL_CURRICULUM_URL,
    questionnaires: ['35571', '35572'],
    topics: {
      'אלגברה והסתברות': {
        icon: '➗', grades: [10, 11],
        subtopics: ['הסתברות', 'סדרות', 'אינדוקציה מתמטית'],
        skills: [
          { id: 'probability-5', nameHe: 'הסתברות מותנית ומודלים מורכבים', prerequisites: [], difficulty: 4 },
          { id: 'induction-5', nameHe: 'הוכחה באינדוקציה', prerequisites: ['sequences-5'], difficulty: 4 },
        ],
      },
      'גאומטריה וטריגונומטריה': {
        icon: '📐', grades: [10, 11],
        subtopics: ['גאומטריה אוקלידית', 'טריגונומטריה במישור', 'גאומטריה אנליטית', 'וקטורים וטריגונומטריה במרחב'],
        skills: [
          { id: 'euclidean-proof-5', nameHe: 'הוכחה גאומטרית', prerequisites: [], difficulty: 4 },
          { id: 'vectors-5', nameHe: 'וקטורים במרחב', prerequisites: ['euclidean-proof-5'], difficulty: 5 },
        ],
      },
      'חדו״א': {
        icon: '∫', grades: [10, 11, 12],
        subtopics: ['חקירת פונקציות', 'נגזרות', 'אינטגרלים', 'פונקציות מעריכיות ולוגריתמיות'],
        skills: [
          { id: 'calculus-analysis-5', nameHe: 'חקירה מלאה וקצב שינוי', prerequisites: [], difficulty: 4 },
          { id: 'advanced-integrals-5', nameHe: 'אינטגרלים ושטחים מורכבים', prerequisites: ['calculus-analysis-5'], difficulty: 5 },
        ],
      },
      'מספרים מרוכבים': {
        icon: 'ℂ', grades: [12],
        subtopics: ['הצגה אלגברית', 'הצגה קוטבית', 'מקומות גאומטריים במישור המרוכב'],
        skills: [{ id: 'complex-numbers-5', nameHe: 'פעולות וייצוגים במספרים מרוכבים', prerequisites: ['trigonometry-5'], difficulty: 5 }],
      },
    },
  },
};

export function getMathCurriculum(units: MathStudyUnits): MathCurriculumTrack {
  return MATH_CURRICULUM[units];
}
