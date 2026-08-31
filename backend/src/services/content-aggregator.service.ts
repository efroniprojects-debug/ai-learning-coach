import { ChunkingService } from '@/services/chunking.service';

export interface ReliableContent {
  sourceName: string;
  url: string;
  topic: string;
  text: string;
  fetchedAt: string;
}

const APPROVED_SOURCES = [
  { name: 'מאגר משרד החינוך', origin: 'https://meyda.education.gov.il', pathPrefix: '/', url: 'https://meyda.education.gov.il' },
  { name: 'ראמ״ה', origin: 'https://rama.education.gov.il', pathPrefix: '/', url: 'https://rama.education.gov.il' },
  { name: 'האוניברסיטה הפתוחה — פיזיקה', origin: 'https://www.openu.ac.il', pathPrefix: '/courses/physics', url: 'https://www.openu.ac.il/courses/physics' },
  { name: 'Khan Academy בעברית — פיזיקה', origin: 'https://he.khanacademy.org', pathPrefix: '/science/physics', url: 'https://he.khanacademy.org/science/physics' },
] as const;

export class ContentAggregatorService {
  static isAllowedSource(rawUrl: string): boolean {
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
      return APPROVED_SOURCES.some((source) => {
        if (url.origin !== source.origin) return false;
        return source.pathPrefix === '/'
          || url.pathname === source.pathPrefix
          || url.pathname.startsWith(`${source.pathPrefix}/`);
      });
    } catch { return false; }
  }

  static assertAllowedSource(url: string): void {
    if (!this.isAllowedSource(url)) throw new Error('UNVERIFIED_CONTENT_SOURCE');
  }

  static extractTextFromHtml(html: string): string {
    return html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  static async fetchReliableContent(topic: string): Promise<{ content: ReliableContent[]; failures: string[] }> {
    const normalizedTopic = topic.trim().slice(0, 120);
    if (!normalizedTopic) throw new Error('TOPIC_REQUIRED');
    const content: ReliableContent[] = [];
    const failures: string[] = [];

    for (const source of APPROVED_SOURCES) {
      try {
        this.assertAllowedSource(source.url);
        const response = await fetch(source.url, {
          headers: { 'User-Agent': 'SmarterAI-Education-Indexer/1.0', Accept: 'text/html,text/plain' },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        this.assertAllowedSource(response.url);
        const contentType = response.headers.get('content-type') ?? '';
        if (!/text\/(html|plain)/i.test(contentType)) throw new Error('UNSUPPORTED_CONTENT_TYPE');
        const raw = (await response.text()).slice(0, 1_000_000);
        const text = contentType.includes('html') ? this.extractTextFromHtml(raw) : raw.trim();
        if (text.length < 200) throw new Error('CONTENT_TOO_SHORT');
        content.push({ sourceName: source.name, url: response.url, topic: normalizedTopic, text, fetchedAt: new Date().toISOString() });
      } catch (error) {
        failures.push(`${source.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return { content, failures };
  }

  static async indexContent(items: ReliableContent[]): Promise<number> {
    const [{ db, knowledgeChunks }, { eq }] = await Promise.all([
      import('@/db'), import('drizzle-orm'),
    ]);
    let chunksCreated = 0;
    for (const item of items) {
      this.assertAllowedSource(item.url);
      const chunks = ChunkingService.chunkText(item.text, { section: item.topic }).slice(0, 80);
      await db.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId, item.url));
      if (chunks.length > 0) {
        await db.insert(knowledgeChunks).values(chunks.map((chunk) => ({
          sourceType: 'verified_web',
          sourceId: item.url,
          chunkText: chunk.text,
          metadata: {
            sourceName: item.sourceName,
            sourceUrl: item.url,
            sourceVerified: true,
            topic: item.topic,
            fetchedAt: item.fetchedAt,
            chunkIndex: chunk.metadata.chunkIndex,
          },
        })));
      }
      chunksCreated += chunks.length;
    }
    return chunksCreated;
  }

  static async aggregate(topic: string) {
    const fetched = await this.fetchReliableContent(topic);
    const chunksCreated = await this.indexContent(fetched.content);
    return { topic: topic.trim(), sourcesIndexed: fetched.content.length, chunksCreated, failures: fetched.failures };
  }
}
