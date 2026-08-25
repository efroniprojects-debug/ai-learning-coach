import { KnowledgeService } from './knowledge.service';
import { TutorService } from './tutor.service';
import type { KnowledgeChunk } from '@/ai/types';

export interface Question {
  id: string;
  userId: string;
  text: string;
  imageUrls?: string[];
  topicHint?: string;
  concepts?: string[];
  difficulty?: number;
  createdAt: Date;
}

export interface QuestionAnalysis {
  concepts: string[];
  difficulty: number;
  topicHint: string;
}

export class QuestionService {
  /**
   * Analyze a question to extract concepts and difficulty
   */
  static async analyzeQuestion(questionText: string): Promise<QuestionAnalysis> {
    // TODO: In production, use AI to extract concepts
    // For now, use simple heuristics

    const keywords = questionText.toLowerCase().split(' ');
    const concepts: string[] = [];
    let difficulty = 1;

    // Simple keyword matching (mock)
    if (keywords.some((k) => k.includes('כוח'))) {
      concepts.push('כוח');
    }
    if (keywords.some((k) => k.includes('תאוצה'))) {
      concepts.push('תאוצה');
    }
    if (keywords.some((k) => k.includes('מהירות'))) {
      concepts.push('מהירות');
    }

    // Difficulty heuristic
    if (questionText.length > 100) difficulty = 2;
    if (keywords.length > 15) difficulty = 3;

    return {
      concepts,
      difficulty,
      topicHint: concepts[0] || 'מכניקה',
    };
  }

  /**
   * Process question: analyze → search → answer
   */
  static async processQuestion(
    userId: string,
    questionText: string,
    imageUrls?: string[]
  ): Promise<{
    analysis: QuestionAnalysis;
    ragContext: KnowledgeChunk[];
    tutorResponse: Awaited<ReturnType<typeof TutorService.answerQuestion>>;
  }> {
    // Step 1: Analyze question
    const analysis = await this.analyzeQuestion(questionText);

    // Step 2: Search for relevant knowledge chunks
    const ragContext = await KnowledgeService.searchChunks(questionText, 5);

    // Step 3: Get tutoring response
    const tutorResponse = await TutorService.answerQuestion(
      {
        text: questionText,
        imageUrls,
        userId,
        topicHint: analysis.topicHint,
      },
      ragContext
    );

    return {
      analysis,
      ragContext,
      tutorResponse,
    };
  }

  /**
   * Get hint for a question
   */
  static async getHint(
    questionText: string,
    previousExplanation: string
  ): Promise<string> {
    const ragContext = await KnowledgeService.searchChunks(questionText, 3);
    return TutorService.generateHint(questionText, previousExplanation, ragContext);
  }

  /**
   * Get full solution for a question
   */
  static async getSolution(questionText: string): Promise<string> {
    const ragContext = await KnowledgeService.searchChunks(questionText, 5);
    return TutorService.generateFullSolution(questionText, ragContext);
  }
}
