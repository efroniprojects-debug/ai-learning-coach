/**
 * Chunking Service
 *
 * Splits extracted text into semantic chunks for embedding & retrieval.
 * Semantic chunking: chunks based on meaning, not just size.
 */

export interface Chunk {
  text: string;
  metadata: {
    chunkIndex: number;
    pageNumber?: number;
    section?: string;
  };
}

export class ChunkingService {
  private static readonly CHUNK_SIZE = 500; // characters per chunk
  private static readonly OVERLAP = 50; // character overlap between chunks

  /**
   * Split text into semantic chunks
   *
   * Strategy:
   * 1. Split by paragraphs (double newline)
   * 2. If paragraph too long, split by sentences
   * 3. If sentence too long, split by character limit
   * 4. Add overlap for context
   */
  static chunkText(
    text: string,
    metadata?: {
      pageNumber?: number;
      section?: string;
    }
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkIndex = 0;

    // Strategy 1: Split by paragraphs (double newline)
    const paragraphs = text.split(/\n\n+/);

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      // If paragraph fits in one chunk
      if (paragraph.length <= this.CHUNK_SIZE) {
        chunks.push({
          text: paragraph.trim(),
          metadata: {
            chunkIndex: chunkIndex++,
            pageNumber: metadata?.pageNumber,
            section: metadata?.section,
          },
        });
      } else {
        // Strategy 2: Split paragraph by sentences
        const sentences = this.splitIntoSentences(paragraph);
        let currentChunk = '';

        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length <= this.CHUNK_SIZE) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push({
                text: currentChunk.trim(),
                metadata: {
                  chunkIndex: chunkIndex++,
                  pageNumber: metadata?.pageNumber,
                  section: metadata?.section,
                },
              });
            }
            currentChunk = sentence;
          }
        }

        if (currentChunk) {
          chunks.push({
            text: currentChunk.trim(),
            metadata: {
              chunkIndex: chunkIndex++,
              pageNumber: metadata?.pageNumber,
              section: metadata?.section,
            },
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Split paragraph into sentences
   * Handles Hebrew punctuation (., !, ?)
   */
  private static splitIntoSentences(text: string): string[] {
    // Hebrew sentence endings: . ! ? ;
    const sentences = text.split(/(?<=[.!?;])\s+/);
    return sentences.filter((s) => s.trim().length > 0);
  }

  /**
   * Estimate reading time for chunk
   */
  static estimateReadingTime(chunkText: string): number {
    const wordsPerMinute = 200;
    const wordCount = chunkText.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Detect concepts in text (Hebrew physics terms)
   * In production: Use entity linking or NLP model
   */
  static detectConcepts(chunkText: string): string[] {
    const concepts: string[] = [];

    // Simple keyword matching (mock)
    const keywords: { [key: string]: string } = {
      'כוח': 'force',
      'תאוצה': 'acceleration',
      'מהירות': 'velocity',
      'מסה': 'mass',
      'אנרגיה': 'energy',
      'מומנטום': 'momentum',
      'חוק ניוטון': "Newton's laws",
      'תנועה': 'motion',
      'גרביטציה': 'gravity',
      'סיבוב': 'rotation',
    };

    for (const [hebrewTerm, englishTerm] of Object.entries(keywords)) {
      if (chunkText.includes(hebrewTerm)) {
        concepts.push(englishTerm);
      }
    }

    return [...new Set(concepts)]; // Remove duplicates
  }
}
