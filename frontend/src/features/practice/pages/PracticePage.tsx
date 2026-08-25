import React, { useState, useEffect } from 'react';
import { ProblemDisplay } from '@/features/practice/components/ProblemDisplay';
import { MasteryFeedback } from '@/features/practice/components/MasteryFeedback';
import { AnswerForm } from '@/features/practice/components/AnswerForm';
import { practiceApi } from '@/services/practice.api';
import { useAuth } from '@/services/auth.store';

export function PracticePage() {
  const { user } = useAuth();
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    loadNextProblem();
  }, []);

  useEffect(() => {
    if (!feedback) {
      const timer = setInterval(() => setTimeSpent((t) => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [feedback]);

  const loadNextProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      setFeedback(null);
      setTimeSpent(0);

      const problem = await practiceApi.selectProblem();
      setCurrentProblem(problem);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answer: string, isCorrect: boolean) => {
    try {
      setSubmitting(true);
      const result = await practiceApi.submitAttempt(
        currentProblem.conceptId,
        isCorrect,
        timeSpent
      );

      setFeedback({
        eloChange: result.eloChange,
        newElo: result.newElo,
        confidenceLevel: result.confidenceLevel,
        mastered: result.mastered,
        submittedAnswer: answer,
        isCorrect,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!feedback && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-3xl font-bold">Practice</h1>
              <div className="text-sm text-gray-600">
                Time: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}
              </div>
            </div>

            {currentProblem && (
              <>
                <ProblemDisplay problem={currentProblem} />
                <AnswerForm
                  problem={currentProblem}
                  onSubmit={handleSubmit}
                  loading={submitting}
                />
              </>
            )}
          </>
        )}

        {feedback && (
          <MasteryFeedback feedback={feedback} onNextProblem={loadNextProblem} />
        )}
      </div>
    </div>
  );
}
