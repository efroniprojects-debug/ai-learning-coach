import React from 'react';
import type { ConceptMastery } from '@/services/progress.api';

export function WeakAreas({ mastery }: { mastery: ConceptMastery[] }) {
  if (mastery.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-6">Areas to Focus On</h3>
      <div className="space-y-3">
        {mastery.map((m) => (
          <div
            key={m.conceptId}
            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div>
              <p className="font-semibold text-gray-900">{m.conceptId}</p>
              <p className="text-sm text-gray-600">ELO: {m.eloRating}</p>
            </div>
            <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold transition">
              Practice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
