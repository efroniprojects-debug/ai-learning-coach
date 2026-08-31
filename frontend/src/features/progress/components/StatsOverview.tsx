import React from 'react';
import type { ProgressStats } from '@/services/progress.api';

export function StatsOverview({ stats }: { stats: ProgressStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Total Attempts</p>
        <p className="text-3xl font-bold text-blue-600">{stats.totalAttempts}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Accuracy</p>
        <p className="text-3xl font-bold text-green-600">{Math.round(stats.accuracy)}%</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Avg Score</p>
        <p className="text-3xl font-bold text-purple-600">{stats.averageScore}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Hours Spent</p>
        <p className="text-3xl font-bold text-orange-600">{stats.totalHoursSpent}h</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Correct Answers</p>
        <p className="text-3xl font-bold text-pink-600">{stats.correctAttempts}</p>
      </div>
    </div>
  );
}
