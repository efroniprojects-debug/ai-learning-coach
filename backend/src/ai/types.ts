export type AIProvider = 'claude' | 'gemini' | 'openai';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
  signal?: AbortSignal;
  attachments?: Array<{ mimeType: string; data: string }>;
  /** Ask capable providers to constrain the response to a JSON document. */
  responseFormat?: 'json';
}

export interface AIGenerateResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
  stopReason?: string;
}

export interface AIStreamChunk {
  delta: string;
  provider: AIProvider;
  model: string;
}

export interface AIAdapter {
  generateResponse(options: AIGenerateOptions): Promise<AIGenerateResponse>;
  generateStream(
    options: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface KnowledgeChunk {
  id: string;
  text: string;
  embedding?: number[];
  source: string;
  sourceType: 'exam' | 'textbook' | 'notebook' | 'custom' | 'google_drive';
  metadata: {
    page?: number;
    section?: string;
    topic?: string;
    concept?: string;
    sourceName?: string;
    sourceUrl?: string;
    year?: number;
  };
}

export interface RAGContext {
  chunks: KnowledgeChunk[];
  relevanceScores: number[];
}
