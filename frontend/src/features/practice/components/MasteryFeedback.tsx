import React from 'react';

export function MasteryFeedback({
  feedback,
  onNextProblem,
}: {
  feedback: any;
  onNextProblem: () => void;
}) {
  const isCorrect = feedback.isCorrect;
  const eloChange = feedback.eloChange;

  return (
    <div className="text-center">
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
          {isCorrect ? 'Excellent!' : 'Good Try!'}
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          {isCorrect
            ? 'Your answer was correct. Keep up the great work!'
            : 'Your approach was good. Review and try again!'}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-600">ELO Change</p>
            <p
              className={`text-3xl font-bold ${
                eloChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {eloChange > 0 ? '+' : ''}{eloChange}
            </p>
          </div>
          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-600">New Rating</p>
            <p className="text-3xl font-bold text-blue-600">{feedback.newElo}</p>
          </div>
          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-purple-600 capitalize">
              {feedback.confidenceLevel}
            </p>
          </div>
        </div>

        {feedback.mastered && (
          <div className="mb-8 p-4 bg-yellow-200 border-2 border-yellow-500 rounded-lg">
            <p className="text-lg font-bold text-yellow-900">
              🎉 You've mastered this concept!
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onNextProblem}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition"
      >
        Next Problem →
      </button>
    </div>
  );
}
