import { Anthropic } from '@anthropic-ai/sdk';
import type { AIAdapter, AIGenerateOptions, AIGenerateResponse, AIStreamChunk } from '../types';

export class ClaudeAdapter implements AIAdapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateResponse(options: AIGenerateOptions): Promise<AIGenerateResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 2048,
      system: options.systemPrompt,
      messages: options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? 0.7,
    }, { signal: options.signal });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content,
      provider: 'claude',
      model: this.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      stopReason: response.stop_reason || undefined,
    };
  }

  async *generateStream(
    options: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens || 2048,
      system: options.systemPrompt,
      messages: options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? 0.7,
    }, { signal: options.signal });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield {
          delta: event.delta.text,
          provider: 'claude',
          model: this.model,
        };
      }
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Note: Claude API doesn't have native embeddings
    // Use OpenAI's embedding model instead (or similar service)
    throw new Error('Use separate embedding service (e.g., OpenAI embeddings)');
  }
}
