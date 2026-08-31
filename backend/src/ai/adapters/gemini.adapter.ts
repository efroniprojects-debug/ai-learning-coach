import type { AIAdapter, AIGenerateOptions, AIGenerateResponse, AIStreamChunk } from '../types';

interface GeminiPayload {
  error?: { message?: string };
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
}

export class GeminiAdapter implements AIAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private requestBody(options: AIGenerateOptions): string {
    const contents = options.messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
    return JSON.stringify({
      ...(options.systemPrompt ? { systemInstruction: { parts: [{ text: options.systemPrompt }] } } : {}),
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    });
  }

  async generateResponse(options: AIGenerateOptions): Promise<AIGenerateResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': this.apiKey },
      body: this.requestBody(options),
      signal: options.signal,
    });
    const data = await response.json() as GeminiPayload;
    if (!response.ok) throw new Error(data.error?.message ?? 'AI generation failed');
    const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? '';
    if (!content) throw new Error('AI provider returned empty content');
    return {
      content,
      provider: 'gemini',
      model: this.model,
      tokensUsed: data.usageMetadata?.totalTokenCount
        ?? (data.usageMetadata?.promptTokenCount ?? 0) + (data.usageMetadata?.candidatesTokenCount ?? 0),
    };
  }

  async *generateStream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, unknown> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': this.apiKey },
      body: this.requestBody(options),
      signal: options.signal,
    });
    if (!response.ok || !response.body) throw new Error('AI streaming request failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        const chunk = JSON.parse(raw) as GeminiPayload;
        if (chunk.error?.message) throw new Error(chunk.error.message);
        const delta = chunk.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
        if (delta) yield { delta, provider: 'gemini', model: this.model };
      }
    }
  }

  async generateEmbeddings(): Promise<number[][]> {
    throw new Error('Gemini embeddings are not configured for this adapter');
  }
}
