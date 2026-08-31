import React, { useState, useEffect } from 'react';
import { MasteryChart } from '@/features/progress/components/MasteryChart';
import { ProgressTimeline } from '@/features/progress/components/ProgressTimeline';
import { WeakAreas } from '@/features/progress/components/WeakAreas';
import { StatsOverview } from '@/features/progress/components/StatsOverview';
import { progressApi } from '@/services/progress.api';
import { GapRadar } from '@/features/progress/components/GapRadar';

export function ProgressDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [mastery, setMastery] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gapData, setGapData] = useState<{ gaps: any[]; topics: any[]; hasData: boolean }>({ gaps: [], topics: [], hasData: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, historyData, masteryData, statsData, gapsData] = await Promise.all([
        progressApi.getOverview(),
        progressApi.getHistory(),
        progressApi.getMasteryLevels(),
        progressApi.getStats(),
        progressApi.getGaps(),
      ]);

      setOverview(overviewData);
      setHistory(historyData.snapshots);
      setMastery(masteryData.concepts);
      setStats(statsData.stats);
      setGapData(gapsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ההתקדמות שלי</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <GapRadar topics={gapData.topics} gaps={gapData.gaps} hasData={gapData.hasData} />

        {/* Quick Stats */}
        {stats && <StatsOverview stats={stats} />}

        {/* Today's Activity */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-2">Today's Attempts</p>
              <p className="text-4xl font-bold text-blue-600">{overview.today.attemptCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-2">Problems Solved</p>
              <p className="text-4xl font-bold text-green-600">{overview.today.problemsSolved}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-2">Time Spent</p>
              <p className="text-4xl font-bold text-purple-600">
                {Math.round(overview.today.timeSpentSeconds / 60)}m
              </p>
            </div>
          </div>
        )}

        {/* Mastery Distribution */}
        {overview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <MasteryChart distribution={overview.mastery.distribution} />
            <WeakAreas mastery={mastery.slice(0, 5).reverse()} />
          </div>
        )}

        {/* Timeline */}
        {history.length > 0 && <ProgressTimeline history={history} />}

        {/* Mastery Details */}
        {mastery.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold">Mastery by Concept</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Concept</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ELO Rating</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Accuracy</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {mastery.map((m) => (
                    <tr key={m.conceptId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{m.conceptId}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {m.eloRating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            m.confidenceLevel === 'expert'
                              ? 'bg-purple-100 text-purple-800'
                              : m.confidenceLevel === 'proficient'
                              ? 'bg-green-100 text-green-800'
                              : m.confidenceLevel === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.confidenceLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${m.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{Math.round(m.successRate)}%</span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{m.attemptsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
