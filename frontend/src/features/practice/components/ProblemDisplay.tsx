import React from 'react';
import type { PracticeProblem } from '@/services/practice.api';

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
  const name = CONCEPT_NAMES[concept] ?? concept;
  if (concept === 'Force') {
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
  const conceptName = subjectId === 'math'
    ? MATH_CONCEPT_NAMES[problem.conceptId] ?? problem.conceptId
    : CONCEPT_NAMES[problem.conceptId] ?? problem.conceptId;
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
        <p className="text-gray-800 leading-relaxed">
          {subjectId === 'math'
            ? mathPracticeQuestion(problem.conceptId, problem.difficulty)
            : practiceQuestion(problem.conceptId, problem.difficulty)}
        </p>
      </div>

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
