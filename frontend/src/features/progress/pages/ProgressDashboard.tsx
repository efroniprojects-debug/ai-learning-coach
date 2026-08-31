import React, { useState, useEffect } from 'react';
import { MasteryChart } from '@/features/progress/components/MasteryChart';
import { ProgressTimeline } from '@/features/progress/components/ProgressTimeline';
import { WeakAreas } from '@/features/progress/components/WeakAreas';
import { StatsOverview } from '@/features/progress/components/StatsOverview';
import { progressApi } from '@/services/progress.api';
import type {
  ConceptMastery,
  ProgressOverview,
  ProgressSnapshot,
  ProgressStats,
} from '@/services/progress.api';
import { GapRadar } from '@/features/progress/components/GapRadar';
import { useSelectedSubject } from '@/features/subjects/useSelectedSubject';
import { LearningContextSummary } from '@/features/subjects/LearningContextSummary';

interface GapData {
  gaps: Array<{ topic: string; subtopic: string; elo: number; confidence: string }>;
  topics: Array<{ topic: string; elo: number; score: number }>;
  hasData: boolean;
}

export function ProgressDashboard() {
  const { subjectId, subject, mathStudyUnits } = useSelectedSubject();
  const activeStudyUnits = subjectId === 'math' ? mathStudyUnits : undefined;
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [history, setHistory] = useState<ProgressSnapshot[]>([]);
  const [mastery, setMastery] = useState<ConceptMastery[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gapData, setGapData] = useState<GapData>({ gaps: [], topics: [], hasData: false });

  useEffect(() => {
    void loadData();
  }, [mathStudyUnits, subjectId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setOverview(null);
    setHistory([]);
    setMastery([]);
    setStats(null);
    setGapData({ gaps: [], topics: [], hasData: false });

    try {
      const results = await Promise.allSettled([
        progressApi.getOverview(subjectId, activeStudyUnits),
        progressApi.getHistory(subjectId, activeStudyUnits),
        progressApi.getMasteryLevels(subjectId, activeStudyUnits),
        progressApi.getStats(subjectId, activeStudyUnits),
        progressApi.getGaps(subjectId, activeStudyUnits),
      ]);

      const [overviewResult, historyResult, masteryResult, statsResult, gapsResult] = results;
      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
      if (historyResult.status === 'fulfilled') setHistory(historyResult.value.snapshots);
      if (masteryResult.status === 'fulfilled') setMastery(masteryResult.value.concepts);
      if (statsResult.status === 'fulfilled') setStats(statsResult.value.stats);
      if (gapsResult.status === 'fulfilled') setGapData(gapsResult.value);

      const failedSections = results.filter((result) => result.status === 'rejected').length;
      if (failedSections === results.length) {
        setError('לא הצלחנו לטעון כרגע את נתוני ההתקדמות. אפשר לנסות שוב בעוד רגע.');
      } else if (failedSections > 0) {
        setError('חלק מנתוני ההתקדמות עדיין אינם זמינים, אך שאר המידע מוצג כרגיל.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען את נתוני ההתקדמות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">ההתקדמות שלי — {subject.nameHe}</h1>
        <LearningContextSummary />

        {error && (
          <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-amber-800" role="status">
            {error}
          </div>
        )}

        {!error && !overview && !stats && mastery.length === 0 && history.length === 0 && !gapData.hasData && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 text-center">
            <h2 className="mb-2 text-lg font-bold">עדיין אין נתוני למידה במקצוע הזה</h2>
            <p className="text-sm text-gray-600">לאחר פתרון התרגילים הראשונים יופיעו כאן השליטה, החוזקות והנושאים לחיזוק.</p>
          </div>
        )}

        <GapRadar topics={gapData.topics} gaps={gapData.gaps} hasData={gapData.hasData} />

        {/* Quick Stats */}
        {stats && <StatsOverview stats={stats} />}

        {/* Today's Activity */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-2">ניסיונות היום</p>
              <p className="text-4xl font-bold text-blue-600">{overview.today.attemptCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-2">תרגילים שנפתרו</p>
              <p className="text-4xl font-bold text-green-600">{overview.today.problemsSolved}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-2">זמן למידה</p>
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
              <h2 className="text-2xl font-bold">שליטה לפי נושא</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">נושא</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">דירוג ELO</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">רמה</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">דיוק</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">ניסיונות</th>
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
