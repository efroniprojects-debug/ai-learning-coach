import React from 'react';
import type { PracticeProblem } from '@/services/practice.api';
import { FormattedText } from '@/features/question/components/ResponseDisplay';

const CONCEPT_NAMES: Record<string, string> = {
  Force: 'כוח', Acceleration: 'תאוצה', Velocity: 'מהירות', Energy: 'אנרגיה',
  Momentum: 'תנע', Gravity: 'כבידה', Waves: 'גלים', Electricity: 'חשמל',
};

const MATH_CONCEPT_NAMES: Record<string, string> = {
  'משוואות ואי־שוויונות': 'משוואות ואי־שוויונות',
  'פונקציה קווית': 'פונקציה קווית',
  'גאומטריה במישור': 'גאומטריה במישור',
  'נגזרות': 'נגזרות',
  'הסתברות': 'הסתברות',
};

function practiceQuestion(concept: string, difficulty: number): string {
  const normalizedConcept = Object.keys(CONCEPT_NAMES).find((key) => key.toLowerCase() === concept.toLowerCase());
  const name = normalizedConcept ? CONCEPT_NAMES[normalizedConcept] : concept;
  if (normalizedConcept === 'Force') {
    return difficulty <= 2
      ? 'על גוף שמסתו 4 ק״ג פועל כוח שקול של 12 ניוטון. מהי תאוצת הגוף? הצג את הנוסחה ואת דרך החישוב.'
      : 'על גוף שמסתו 8 ק״ג פועלים שני כוחות מנוגדים: 24 ניוטון ימינה ו־8 ניוטון שמאלה. חשב את הכוח השקול ואת תאוצת הגוף, והסבר את כיוון התנועה.';
  }
  return `פתור תרגיל ברמת קושי ${difficulty} בנושא ${name}. כתוב מה ידוע, באיזו נוסחה בחרת, את שלבי החישוב ואת התשובה עם יחידות.`;
}

function mathPracticeQuestion(concept: string, difficulty: number): string {
  const name = MATH_CONCEPT_NAMES[concept] ?? concept;
  return `פתור תרגיל ברמת קושי ${difficulty} בנושא ${name}. הצג את הנתונים, את דרך הפתרון, את החישוב ובדיקת תשובה.`;
}

export function ProblemDisplay({ problem, subjectId }: { problem: PracticeProblem; subjectId: string }) {
  const normalizedPhysicsConcept = Object.keys(CONCEPT_NAMES).find(
    (key) => key.toLowerCase() === problem.conceptId.toLowerCase()
  );
  const conceptName = subjectId === 'math'
    ? MATH_CONCEPT_NAMES[problem.conceptId] ?? problem.conceptId
    : normalizedPhysicsConcept ? CONCEPT_NAMES[normalizedPhysicsConcept] : problem.conceptId;
  return (
    <div className="bg-white rounded-lg shadow p-8 mb-6" dir="rtl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">נושא: {conceptName}</h2>
          <div className="flex items-center gap-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              רמת קושי: {problem.difficulty}/5
            </span>
            <span className="text-sm text-gray-600">
              דירוג ELO נוכחי: {problem.eloRating}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded border border-gray-200 mb-6">
        <h3 className="font-semibold text-lg mb-4">שאלה:</h3>
        <div className="text-gray-800 leading-relaxed">
          <FormattedText text={problem.question ?? (subjectId === 'math'
            ? mathPracticeQuestion(problem.conceptId, problem.difficulty)
            : practiceQuestion(problem.conceptId, problem.difficulty))} />
        </div>
        {problem.hints.length > 0 && (
          <details className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <summary className="cursor-pointer font-medium text-amber-900">רמזים מדורגים</summary>
            <ol className="mt-2 list-decimal space-y-1 pr-5 text-sm text-amber-900">
              {problem.hints.map((hint) => <li key={hint}><FormattedText text={hint} /></li>)}
            </ol>
          </details>
        )}
      </div>

      {problem.source && (
        <p className="mb-5 text-xs text-gray-500">
          תרגיל מקורי מותאם לתוכנית משרד החינוך · {problem.source.curriculumVersion} ·{' '}
          <a className="underline" href={problem.source.sourceUrl} target="_blank" rel="noreferrer">מקור התוכנית</a>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded">
          <p className="text-sm text-gray-600">אחוז הצלחה</p>
          <p className="text-2xl font-bold text-green-600">65%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded">
          <p className="text-sm text-gray-600">רצף הצלחות</p>
          <p className="text-2xl font-bold text-purple-600">3</p>
        </div>
      </div>
    </div>
  );
}
