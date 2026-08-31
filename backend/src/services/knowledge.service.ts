import { db, knowledgeChunks } from '@/db';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { DEFAULT_SUBJECT_ID, getSubjectConfig, normalizeStudyUnits } from '@/config/subjects';
import type { KnowledgeChunk } from '@/ai/types';

// Mock knowledge chunks (in production, these would be in vector DB)
const MOCK_CHUNKS: KnowledgeChunk[] = [
  {
    id: '1',
    text: 'כוח הוא דחיפה או משיכה. החוק השני של ניוטון אומר שהכוח שווה מסה כפול תאוצה: F = ma',
    embedding: new Array(1536).fill(0.5), // Mock embedding
    source: 'בגרות פיזיקה 2024',
    sourceType: 'exam',
    metadata: {
      page: 1,
      section: 'כוחות',
      topic: 'מכניקה',
      concept: 'החוק השני של ניוטון',
    },
  },
  {
    id: '2',
    text: 'תאוצה היא שינוי במהירות חלקי שינוי בזמן: a = Δv/Δt. יחידת התאוצה היא מטר לשנייה בריבוע (m/s²)',
    embedding: new Array(1536).fill(0.4),
    source: 'ספר הלימוד - פיזיקה י',
    sourceType: 'textbook',
    metadata: {
      section: 'קינמטיקה',
      topic: 'תנועה',
      concept: 'תאוצה',
    },
  },
  {
    id: '3',
    text: 'חוק הפעולה והתגובה: אם גוף A מפעיל כוח על גוף B, אז גוף B מפעיל כוח שווה בגודלו והפוך בכיוונו על גוף A',
    embedding: new Array(1536).fill(0.45),
    source: 'בגרות פיזיקה 2024',
    sourceType: 'exam',
    metadata: {
      page: 2,
      section: 'כוחות',
      topic: 'מכניקה',
      concept: 'החוק השלישי של ניוטון',
    },
  },
  {
    id: '4',
    text: 'המהירות היא שינוי במרחק חלקי שינוי בזמן: v = Δs/Δt. יחידת המהירות היא מטר לשנייה (m/s)',
    embedding: new Array(1536).fill(0.35),
    source: 'ספר הלימוד - פיזיקה י',
    sourceType: 'textbook',
    metadata: {
      section: 'קינמטיקה',
      topic: 'תנועה',
      concept: 'מהירות',
    },
  },
];

export class KnowledgeService {
  /**
   * Search for relevant knowledge chunks (semantic search)
   * In production, this would query pgvector DB
   */
  static async searchChunks(
    query: string,
    topK: number = 5,
    subjectId: string = DEFAULT_SUBJECT_ID,
    studyUnits?: number,
  ): Promise<KnowledgeChunk[]> {
    getSubjectConfig(subjectId);
    const normalizedUnits = normalizeStudyUnits(subjectId, studyUnits);
    const limit = Math.min(Math.max(topK, 1), 3);
    const keywords = query.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
    const physicsKeywords = keywords.filter((word) =>
      /כוח|מסה|משקל|תאוצ|מהירות|תנועה|אנרג|תנע|חשמל|מתח|זרם|גל|אור|חום|כבידה/.test(word)
    );
    const searchTerms = [...new Set([...physicsKeywords, ...keywords])].slice(0, 8);

    if (searchTerms.length > 0) {
      try {
        const conditions = searchTerms.flatMap((term) => {
          const pattern = `%${term}%`;
          return [
            ilike(knowledgeChunks.chunkText, pattern),
            sql<boolean>`coalesce(${knowledgeChunks.metadata}->>'sourceName', '') ilike ${pattern}`,
          ];
        });
        const rows = await db
          .select()
          .from(knowledgeChunks)
          .where(and(eq(knowledgeChunks.subjectId, subjectId), eq(knowledgeChunks.studyUnits, normalizedUnits), or(...conditions)))
          .orderBy(desc(knowledgeChunks.createdAt))
          .limit(limit);

        if (rows.length > 0) {
          return rows.map((row) => {
            const metadata = (row.metadata ?? {}) as KnowledgeChunk['metadata'];
            return {
              id: row.id,
              text: row.chunkText,
              source: metadata.sourceName ?? row.sourceType,
              sourceType: row.sourceType as KnowledgeChunk['sourceType'],
              metadata,
            };
          });
        }
      } catch {
        // DB/RAG is optional; the built-in physics references remain available.
      }
    }

    // Built-in fallback references currently exist only for Physics.
    if (subjectId !== 'physics') return [];

    const scored = MOCK_CHUNKS.map((chunk) => {
      let score = 0;
      keywords.forEach((keyword) => {
        if (chunk.text.includes(keyword)) score++;
        if (chunk.metadata.concept && chunk.metadata.concept.includes(keyword)) score += 2;
        if (chunk.metadata.topic && chunk.metadata.topic.includes(keyword)) score += 1.5;
      });
      return { chunk, score };
    });

    // Return top-K by score
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.chunk);
  }

  /**
   * Get chunk by ID
   */
  static async getChunkById(chunkId: string): Promise<KnowledgeChunk | null> {
    return MOCK_CHUNKS.find((chunk) => chunk.id === chunkId) || null;
  }

  /**
   * List all chunks (paginated)
   */
  static async listChunks(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    chunks: KnowledgeChunk[];
    total: number;
  }> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      chunks: MOCK_CHUNKS.slice(start, end),
      total: MOCK_CHUNKS.length,
    };
  }

  /**
   * Browse by topic
   */
  static async getTopics(): Promise<string[]> {
    const topics = new Set(
      MOCK_CHUNKS.map((chunk) => chunk.metadata.topic).filter((t): t is string => Boolean(t))
    );
    return Array.from(topics);
  }

  /**
   * Get chunks by topic
   */
  static async getChunksByTopic(topic: string): Promise<KnowledgeChunk[]> {
    return MOCK_CHUNKS.filter((chunk) => chunk.metadata.topic === topic);
  }

  /**
   * Get chunks by concept
   */
  static async getChunksByConcept(concept: string): Promise<KnowledgeChunk[]> {
    return MOCK_CHUNKS.filter((chunk) => chunk.metadata.concept === concept);
  }

  /**
   * Index new chunks (after upload + OCR + chunking)
   * In production: generate embeddings, store in pgvector, index
   */
  static async indexChunks(chunks: Omit<KnowledgeChunk, 'embedding'>[]): Promise<void> {
    // TODO: Implement:
    // 1. Generate embeddings for each chunk
    // 2. Store in pgvector table
    // 3. Update full-text search index

    console.log(`Would index ${chunks.length} chunks to vector DB`);
  }
}
