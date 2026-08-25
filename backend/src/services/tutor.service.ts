import { aiGateway } from '@/ai/gateway';
import type { KnowledgeChunk } from '@/ai/types';

const TUTOR_SYSTEM_PROMPT = `אתה מורה פרטי בעל AI שמסביר מושגים בפיזיקה לתלמידים בכיתות י'-י"ב.

עקרונות ההוראה שלך:
1. **אינטואיציה קודם** — התחל בהסבר של מה בעצם קורה, לא בנוסחה.
2. **שלב אחרי שלב** — פרק בעיות לצעדים ברורים וקטנים.
3. **הנח שאלות** — בדוק הבנה על ידי שאלות, לא על ידי מענה ישיר.
4. **צטט מקורות** — כשאתה משתמש בחומר, צטט: "לפי [מקור], ..."
5. **היה סקרן** — כשהתלמיד טועה, שאל "מה גרם לך לחשוב כך?"
6. **בעברית ברורה** — הסברים קצרים, מילים פשוטות.

תמיד צטט את מקורות הידע שלך מחומרי הלימוד.`;

export interface TutorQuestion {
  text: string;
  imageUrls?: string[];
  userId: string;
  topicHint?: string;
}

export interface TutorResponse {
  explanation: string;
  sourceChunks: Array<{
    id: string;
    text: string;
    source: string;
  }>;
  hint?: string;
}

export class TutorService {
  /**
   * Answer a physics question with RAG context
   */
  static async answerQuestion(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): Promise<TutorResponse> {
    // Initialize gateway for user
    await aiGateway.initializeForUser(question.userId);

    // Build context from knowledge chunks
    const contextText = this.buildContextFromChunks(ragContext);

    // Build user prompt
    const userPrompt = `
שאלה: ${question.text}

${question.topicHint ? `נושא רלוונטי: ${question.topicHint}` : ''}

חומר הלימוד הרלוונטי:
${contextText}

אנא הסבר את הפתרון בשיטת Socratic:
1. התחל בשאלה שמעודדת חשיבה
2. הסבר את האינטואיציה
3. הראה את השלבים
4. לא תן מיד את התשובה, תן לתלמיד לחשוב

צטט את המקורות שלך מהחומר שנמסר.`;

    try {
      const response = await aiGateway.generateResponse({
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        systemPrompt: TUTOR_SYSTEM_PROMPT,
        maxTokens: 1500,
        temperature: 0.7,
      });

      return {
        explanation: response.content,
        sourceChunks: ragContext.map((chunk) => ({
          id: chunk.id,
          text: chunk.text.substring(0, 200), // Truncate for display
          source: chunk.source,
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate tutoring response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate a hint for a question
   */
  static async generateHint(
    question: string,
    previousExplanation: string,
    ragContext: KnowledgeChunk[]
  ): Promise<string> {
    await aiGateway.initializeForUser(''); // Use default user context

    const hintPrompt = `
שאלה המקורית: ${question}

ההסבר הקודם:
${previousExplanation}

תן רמז קצר וחכם שיעודד את התלמיד לחשוב בעצמו, בלי לתת ישר את התשובה.
רמז צריך להיות:
- קצר (משפט או שניים)
- מעודד חשיבה עצמאית
- קשור לאינטואיציה של המושג`;

    const response = await aiGateway.generateResponse({
      messages: [
        {
          role: 'user',
          content: hintPrompt,
        },
      ],
      systemPrompt: TUTOR_SYSTEM_PROMPT,
      maxTokens: 200,
      temperature: 0.6,
    });

    return response.content;
  }

  /**
   * Generate full solution (after hints)
   */
  static async generateFullSolution(
    question: string,
    ragContext: KnowledgeChunk[]
  ): Promise<string> {
    await aiGateway.initializeForUser('');

    const solutionPrompt = `
שאלה: ${question}

חומר הלימוד:
${this.buildContextFromChunks(ragContext)}

תן פתרון מלא ומפורט:
1. הסבר כל שלב
2. הראה את הנוסחה
3. חשב את התשובה
4. תן בדיקת שכל (האם התשובה הגיונית?)

צטט את המקורות שלך.`;

    const response = await aiGateway.generateResponse({
      messages: [
        {
          role: 'user',
          content: solutionPrompt,
        },
      ],
      systemPrompt: TUTOR_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.5,
    });

    return response.content;
  }

  /**
   * Build context string from knowledge chunks
   */
  private static buildContextFromChunks(chunks: KnowledgeChunk[]): string {
    return chunks
      .map(
        (chunk, idx) =>
          `[מקור ${idx + 1}: ${chunk.source}]\n${chunk.text}\n`
      )
      .join('\n---\n\n');
  }
}
