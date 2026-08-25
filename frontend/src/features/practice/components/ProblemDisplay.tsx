import React from 'react';

export function ProblemDisplay({ problem }: { problem: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-8 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Concept: {problem.conceptId}</h2>
          <div className="flex items-center gap-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Difficulty: {problem.difficulty}/5
            </span>
            <span className="text-sm text-gray-600">
              Current ELO: {problem.eloRating}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded border border-gray-200 mb-6">
        <h3 className="font-semibold text-lg mb-4">Question:</h3>
        <p className="text-gray-800 leading-relaxed">
          A {problem.difficulty === 1 ? 'simple' : problem.difficulty === 5 ? 'challenging' : 'moderate'} problem about {problem.conceptId}.
          Show your understanding by explaining your approach.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded">
          <p className="text-sm text-gray-600">Correct Rate</p>
          <p className="text-2xl font-bold text-green-600">65%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded">
          <p className="text-sm text-gray-600">Success Streak</p>
          <p className="text-2xl font-bold text-purple-600">3</p>
        </div>
      </div>
    </div>
  );
}
