import { ClaudeAdapter } from './adapters/claude.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';
import type { AIAdapter, AIProvider, AIGenerateOptions, AIGenerateResponse, AIStreamChunk } from './types';
import { AISettingsService } from '@/services/ai-settings.service';
import { EncryptionService } from '@/services/encryption.service';

export class AIGateway {
  private adapters: Map<AIProvider, AIAdapter> = new Map();
  private currentProvider: AIProvider = 'claude';
  private currentUserId: string = '';

  /**
   * Initialize gateway for a user
   */
  async initializeForUser(userId: string): Promise<void> {
    this.currentUserId = userId;

    try {
      const activeConfig = await AISettingsService.getActiveConfig(userId);

      // Instantiate adapter based on provider
      switch (activeConfig.provider) {
        case 'claude':
          this.adapters.set('claude', new ClaudeAdapter(activeConfig.apiKey, activeConfig.model));
          this.currentProvider = 'claude';
          break;

        case 'gemini':
          this.adapters.set('gemini', new GeminiAdapter(activeConfig.apiKey, activeConfig.model));
          this.currentProvider = 'gemini';
          break;

        case 'openai':
          // TODO: Implement OpenAI adapter
          throw new Error('OpenAI adapter not yet implemented');

        default:
          throw new Error(`Unknown provider: ${activeConfig.provider}`);
      }
    } catch (error) {
      throw new Error(`Failed to initialize AI gateway: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  initializeWithProvider(provider: AIProvider, apiKey: string, model: string): void {
    if (provider === 'claude') this.adapters.set(provider, new ClaudeAdapter(apiKey, model));
    else if (provider === 'gemini') this.adapters.set(provider, new GeminiAdapter(apiKey, model));
    else throw new Error(`Provider adapter is not implemented: ${provider}`);
    this.currentProvider = provider;
  }

  /**
   * Generate response (non-streaming)
   */
  async generateResponse(options: AIGenerateOptions): Promise<AIGenerateResponse> {
    const adapter = this.adapters.get(this.currentProvider);
    if (!adapter) {
      throw new Error('No AI provider configured');
    }

    return adapter.generateResponse(options);
  }

  /**
   * Generate response (streaming)
   */
  async *generateStream(
    options: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const adapter = this.adapters.get(this.currentProvider);
    if (!adapter) {
      throw new Error('No AI provider configured');
    }

    yield* adapter.generateStream(options);
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Get current user
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }
}

// Singleton instance
export const aiGateway = new AIGateway();
