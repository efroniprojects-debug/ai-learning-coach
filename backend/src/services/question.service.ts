import { KnowledgeService } from './knowledge.service';
import { TutorService } from './tutor.service';
import type { TutorFullResponse } from './tutor.service';
import type { KnowledgeChunk } from '@/ai/types';

export interface QuestionAnalysis {
  concepts: string[];
  difficulty: number;
  topicHint: string;
}

export class QuestionService {
  /**
   * Analyze a question using simple heuristics.
   * TODO (S07): replace with AI-powered concept extraction.
   */
  static analyzeQuestion(questionText: string): QuestionAnalysis {
    const lower = questionText.toLowerCase();
    const concepts: string[] = [];

    if (lower.includes('כוח')) concepts.push('כוח');
    if (lower.includes('תאוצה')) concepts.push('תאוצה');
    if (lower.includes('מהירות')) concepts.push('מהירות');
    if (lower.includes('אנרגיה')) concepts.push('אנרגיה');

    const difficulty = questionText.length > 150 ? 3 : questionText.length > 80 ? 2 : 1;

    return {
      concepts,
      difficulty,
      topicHint: concepts[0] || 'מכניקה',
    };
  }

  /**
   * Full question processing: RAG search → structured tutor response.
   */
  static async processQuestion(
    userId: string,
    questionText: string,
    imageUrls?: string[],
    conversationId?: string
  ): Promise<{ analysis: QuestionAnalysis; ragContext: KnowledgeChunk[]; tutorResponse: TutorFullResponse }> {
    const analysis = this.analyzeQuestion(questionText);
    const ragContext = await KnowledgeService.searchChunks(questionText, 5);

    const tutorResponse = await TutorService.answerQuestion(
      { text: questionText, imageUrls, userId, subjectId: 'physics', conversationId },
      ragContext
    );

    return { analysis, ragContext, tutorResponse };
  }

  /**
   * Generate a progressive hint.
   */
  static async getHint(
    questionText: string,
    previousExplanation: string,
    userId: string = ''
  ): Promise<string> {
    const ragContext = await KnowledgeService.searchChunks(questionText, 3);
    return TutorService.generateHint(questionText, previousExplanation, ragContext, userId);
  }
}
