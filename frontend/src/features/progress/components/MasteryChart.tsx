import React from 'react';
import type { MasteryDistribution } from '@/services/progress.api';

export function MasteryChart({ distribution }: { distribution: MasteryDistribution }) {
  const total =
    distribution.novice +
    distribution.intermediate +
    distribution.proficient +
    distribution.expert;

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Mastery Distribution</h3>
        <p className="text-gray-600">No mastery data yet. Start practicing!</p>
      </div>
    );
  }

  const toPercent = (n: number) => ((n / total) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-6">Mastery Distribution</h3>

      <div className="space-y-4">
        {[
          { label: 'Expert', value: distribution.expert, color: 'bg-purple-500' },
          { label: 'Proficient', value: distribution.proficient, color: 'bg-green-500' },
          { label: 'Intermediate', value: distribution.intermediate, color: 'bg-yellow-500' },
          { label: 'Novice', value: distribution.novice, color: 'bg-red-500' },
        ].map((level) => (
          <div key={level.label}>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{level.label}</span>
              <span className="text-sm text-gray-600">
                {level.value} ({toPercent(level.value)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`${level.color} h-3 rounded-full`}
                style={{ width: `${toPercent(level.value)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
