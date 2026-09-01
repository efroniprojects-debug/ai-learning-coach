import { apiClient } from '@/services/api.client';

export interface PracticeProblem {
  id: string;
  conceptId: string;
  difficulty: number;
  eloRating: number;
  question?: string;
  expectedAnswer?: string;
  hints?: string[];
  source?: {
    type: 'original-aligned';
    curriculumVersion: string;
    sourceUrl: string;
  };
}

export interface PracticeAttemptResult {
  eloChange: number;
  newElo: number;
  confidenceLevel: string;
  mastered: boolean;
}

export const practiceApi = {
  selectProblem: async (subjectId: string, studyUnits?: number, conceptId?: string) => {
    const { data } = await apiClient.get('/api/v1/practice/select-problem', { params: { subjectId, studyUnits, conceptId } });
    const problem = data as PracticeProblem;
    // A Preview may temporarily talk to the previous backend, which ignores
    // conceptId. Keep the student's explicit topic selection authoritative.
    return conceptId && problem.conceptId !== conceptId
      ? { ...problem, id: `${subjectId}-${conceptId}`, conceptId, question: undefined, expectedAnswer: undefined, hints: [], source: undefined }
      : problem;
  },

  submitAttempt: async (conceptId: string, isCorrect: boolean, timeSpentSeconds: number, subjectId: string, studyUnits?: number) => {
    const { data } = await apiClient.post('/api/v1/practice/submit-attempt', {
      conceptId,
      isCorrect,
      timeSpentSeconds,
      subjectId,
      studyUnits,
    });
    return data as PracticeAttemptResult;
  },

  getHistory: async () => {
    const { data } = await apiClient.get('/api/v1/practice/history');
    return data.attempts;
  },

  getMasteryOverview: async () => {
    const { data } = await apiClient.get('/api/v1/practice/mastery-overview');
    return data;
  },

  getRecommendation: async () => {
    const { data } = await apiClient.get('/api/v1/practice/next-recommendation');
    return data;
  },
};
