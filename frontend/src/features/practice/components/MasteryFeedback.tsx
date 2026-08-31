import React from 'react';

interface MasteryFeedbackData {
  isCorrect: boolean;
  eloChange: number;
  newElo: number;
  confidenceLevel: string;
  mastered: boolean;
  submittedAnswer: string;
}

export function MasteryFeedback({
  feedback,
  onNextProblem,
}: {
  feedback: MasteryFeedbackData;
  onNextProblem: () => void;
}) {
  const isCorrect = feedback.isCorrect;
  const eloChange = feedback.eloChange;
  const levels: Record<string, string> = { novice: 'מתחיל', intermediate: 'ביניים', proficient: 'שולט', expert: 'מומחה' };

  return (
    <div className="text-center" dir="rtl">
      <div
        className={`mb-8 p-12 rounded-lg ${
          isCorrect
            ? 'bg-green-100 border-2 border-green-500'
            : 'bg-amber-100 border-2 border-amber-500'
        }`}
      >
        <div className="text-6xl mb-4">
          {isCorrect ? '✓' : '→'}
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {isCorrect ? 'מצוין!' : 'ניסיון טוב!'}
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          {isCorrect
            ? 'התשובה נכונה. ממשיכים לבנות שליטה בנושא!'
            : 'כדאי לעבור שוב על הדרך ולנסות בתרגיל הבא.'}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-600">שינוי ELO</p>
            <p
              className={`text-3xl font-bold ${
                eloChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {eloChange > 0 ? '+' : ''}{eloChange}
            </p>
          </div>
          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-600">דירוג חדש</p>
            <p className="text-3xl font-bold text-blue-600">{feedback.newElo}</p>
          </div>
          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-600">רמה</p>
            <p className="text-xl font-bold text-purple-600 capitalize">
              {levels[feedback.confidenceLevel] ?? feedback.confidenceLevel}
            </p>
          </div>
        </div>

        {feedback.mastered && (
          <div className="mb-8 p-4 bg-yellow-200 border-2 border-yellow-500 rounded-lg">
            <p className="text-lg font-bold text-yellow-900">
              🎉 השגת שליטה בנושא הזה!
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onNextProblem}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition"
      >
        לתרגיל הבא ←
      </button>
    </div>
  );
}
