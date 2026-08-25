import { ClaudeAdapter } from './adapters/claude.adapter';
import type { AIAdapter, AIProvider, AIGenerateOptions, AIGenerateResponse } from './types';
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
          // TODO: Implement Gemini adapter
          throw new Error('Gemini adapter not yet implemented');

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
  ): AsyncGenerator<any, void, unknown> {
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
