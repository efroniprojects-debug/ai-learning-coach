import React, { useState, useEffect } from 'react';
import { ProblemDisplay } from '@/features/practice/components/ProblemDisplay';
import { MasteryFeedback } from '@/features/practice/components/MasteryFeedback';
import { AnswerForm } from '@/features/practice/components/AnswerForm';
import { practiceApi } from '@/services/practice.api';
import { useSelectedSubject } from '@/features/subjects/useSelectedSubject';
import { LearningContextSummary } from '@/features/subjects/LearningContextSummary';
import type { PracticeProblem } from '@/services/practice.api';
import { TopicSelector } from '@/features/question/components/TopicSelector';

interface PracticeFeedback {
  eloChange: number;
  newElo: number;
  confidenceLevel: string;
  mastered: boolean;
  submittedAnswer: string;
  isCorrect: boolean;
}

export function PracticePage() {
  const { subjectId, subject, mathStudyUnits } = useSelectedSubject();
  const activeStudyUnits = subjectId === 'math' ? mathStudyUnits : undefined;
  const [currentProblem, setCurrentProblem] = useState<PracticeProblem | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProblem(null);
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setLoading(false);
  }, [mathStudyUnits, subjectId]);

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

      if (!selectedSubtopic) return;
      const problem = await practiceApi.selectProblem(subjectId, activeStudyUnits, selectedSubtopic);
      setCurrentProblem(problem);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת התרגיל נכשלה');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answer: string, isCorrect: boolean) => {
    if (!currentProblem) {
      setError('לא נמצא תרגיל פעיל');
      return;
    }

    try {
      setSubmitting(true);
      const result = await practiceApi.submitAttempt(
        currentProblem.conceptId,
        isCorrect,
        timeSpent,
        subjectId,
        activeStudyUnits,
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
      setError(err instanceof Error ? err.message : 'שליחת התשובה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען תרגיל...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <LearningContextSummary />
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="mb-3 text-2xl font-bold">בחר נושא לתרגול ב{subject.nameHe}</h1>
          <TopicSelector
            subjectId={subjectId}
            studyUnits={activeStudyUnits}
            selectedSubtopic={selectedSubtopic}
            onSelect={(topic, subtopic) => { setSelectedTopic(topic); setSelectedSubtopic(subtopic); setCurrentProblem(null); setFeedback(null); setError(null); }}
          />
          {selectedSubtopic && <button type="button" onClick={() => void loadNextProblem()} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">התחל תרגול: {selectedSubtopic}</button>}
        </section>
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!feedback && currentProblem && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold">תרגול מותאם אישית — {selectedTopic}</h2>
              <div className="text-sm text-gray-600">
                זמן: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}
              </div>
            </div>

            <ProblemDisplay problem={currentProblem} subjectId={subjectId} />
            <AnswerForm onSubmit={handleSubmit} loading={submitting} />
          </>
        )}

        {feedback && (
          <MasteryFeedback feedback={feedback} onNextProblem={loadNextProblem} />
        )}
      </div>
    </div>
  );
}
