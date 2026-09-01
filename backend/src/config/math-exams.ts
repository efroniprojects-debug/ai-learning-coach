import type { MathStudyUnits } from './math-curriculum';

export interface MathExamCatalogEntry {
  id: string;
  units: MathStudyUnits;
  questionnaire: string;
  curriculum: 'new';
  sourceName: string;
  sourceUrl: string;
  copyrightNotice: string;
}

const OFFICIAL_EXAMS_URL = 'https://pop.education.gov.il/tchumey_daat/matmatika/chativa-elyona/teaching-mathematics/new-curriculum/';

export const MATH_EXAM_CATALOG: MathExamCatalogEntry[] = [
  ['3-35172', 3, '35172'], ['3-35173', 3, '35173'], ['3-35371', 3, '35371'], ['3-35372', 3, '35372'],
  ['4-35471', 4, '35471'], ['4-35472', 4, '35472'],
  ['5-35571', 5, '35571'], ['5-35572', 5, '35572'],
].map(([id, units, questionnaire]) => ({
  id: String(id), units: units as MathStudyUnits, questionnaire: String(questionnaire), curriculum: 'new' as const,
  sourceName: 'משרד החינוך — מתמטיקה חטיבה עליונה', sourceUrl: OFFICIAL_EXAMS_URL,
  copyrightNotice: 'יש להציג או לקשר למסמך המקורי בלבד. תרגול חדש יהיה דומה במיומנות אך לא העתק של שאלה מוגנת.',
}));

export function getMathExamCatalog(units: MathStudyUnits): MathExamCatalogEntry[] {
  return MATH_EXAM_CATALOG.filter((entry) => entry.units === units);
}
