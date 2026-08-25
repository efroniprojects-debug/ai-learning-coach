import React from 'react';

export function ProgressTimeline({ history }: { history: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-bold mb-6">Last 30 Days</h3>
      <div className="space-y-2">
        {history.map((day, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-20">
                {new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {day.attemptCount} attempts
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  {day.problemsSolved} solved
                </span>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {Math.round(day.timeSpentSeconds / 60)}m
                </span>
              </div>
            </div>
            {day.weakAreas.length > 0 && (
              <span className="text-xs text-red-600 font-semibold">Focus: {day.weakAreas.join(', ')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
