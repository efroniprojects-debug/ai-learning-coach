import { aiGateway } from '@/ai/gateway';

/**
 * Embedding Service
 *
 * Generates vector embeddings for text chunks.
 * Used for semantic search (vector similarity).
 *
 * In production:
 * - Use OpenAI embeddings API (text-embedding-3-small)
 * - Cache embeddings to reduce API calls
 * - Batch process for efficiency
 */

export class EmbeddingService {
  private static readonly EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-3-small

  /**
   * Generate embedding for single text
   *
   * In production:
   * 1. Use OpenAI API or equivalent
   * 2. Cache results (avoid recomputing)
   * 3. Handle rate limiting
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    // TODO: Implement real embedding generation
    // For now: return mock embedding (all 0.5s)
    console.log(`[Embedding] Would generate embedding for: "${text.substring(0, 50)}..."`);

    return new Array(this.EMBEDDING_DIMENSION).fill(0.5);
  }

  /**
   * Generate embeddings for multiple texts (batch)
   *
   * Efficiency: Process in batches (max 100 per request)
   */
  static async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 100;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      console.log(`[Embedding] Batch ${Math.floor(i / BATCH_SIZE) + 1}: Processing ${batch.length} texts`);

      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.generateEmbedding(text))
      );

      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Used for search relevance scoring
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Mock: Generate fake embeddings for development
   * Replace with real embeddings in production
   */
  static async generateMockEmbedding(text: string): Promise<number[]> {
    // Create deterministic but different mock embeddings based on text hash
    const hash = this.simpleHash(text);
    const embedding: number[] = [];

    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      embedding.push(Math.sin((hash + i) / 1000) * 0.5 + 0.5);
    }

    return embedding;
  }

  private static simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
