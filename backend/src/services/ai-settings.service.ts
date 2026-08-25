import { db, aiProviderConfigs, type AIProviderConfig } from '@/db';
import { eq, and } from 'drizzle-orm';
import { EncryptionService } from './encryption.service';

export class AISettingsService {
  /**
   * Save or update AI provider config
   */
  static async saveProviderConfig(
    userId: string,
    provider: 'claude' | 'gemini' | 'openai',
    model: string,
    apiKey: string
  ) {
    // Validate API key format (basic check)
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key format');
    }

    // Encrypt the API key
    const encryptedKey = EncryptionService.encrypt(apiKey);

    // Check if config already exists for this provider
    const existing = await db.query.aiProviderConfigs.findFirst({
      where: and(
        eq(aiProviderConfigs.userId, userId),
        eq(aiProviderConfigs.provider, provider)
      ),
    });

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(aiProviderConfigs)
        .set({
          model,
          apiKeyEncrypted: encryptedKey,
          updatedAt: new Date(),
        })
        .where(eq(aiProviderConfigs.id, existing.id))
        .returning();

      return this.formatConfigResponse(updated);
    } else {
      // Create new
      const [created] = await db
        .insert(aiProviderConfigs)
        .values({
          userId,
          provider,
          model,
          apiKeyEncrypted: encryptedKey,
          isActive: false,
        })
        .returning();

      return this.formatConfigResponse(created);
    }
  }

  /**
   * Get all configs for a user (without API key)
   */
  static async getUserConfigs(userId: string) {
    const configs = await db.query.aiProviderConfigs.findMany({
      where: eq(aiProviderConfigs.userId, userId),
    });

    return configs.map((config) => this.formatConfigResponse(config));
  }

  /**
   * Get active config for a user (with decrypted API key)
   */
  static async getActiveConfig(userId: string) {
    const config = await db.query.aiProviderConfigs.findFirst({
      where: and(
        eq(aiProviderConfigs.userId, userId),
        eq(aiProviderConfigs.isActive, true)
      ),
    });

    if (!config) {
      throw new Error('No active AI provider configured');
    }

    return {
      id: config.id,
      provider: config.provider,
      model: config.model,
      apiKey: EncryptionService.decrypt(config.apiKeyEncrypted),
    };
  }

  /**
   * Set a config as active (only one active per user)
   */
  static async setActiveConfig(userId: string, configId: string) {
    // First, deactivate all other configs
    await db
      .update(aiProviderConfigs)
      .set({ isActive: false })
      .where(eq(aiProviderConfigs.userId, userId));

    // Activate the specified config
    const [updated] = await db
      .update(aiProviderConfigs)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(and(eq(aiProviderConfigs.id, configId), eq(aiProviderConfigs.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error('Config not found');
    }

    return this.formatConfigResponse(updated);
  }

  /**
   * Delete a config
   */
  static async deleteConfig(userId: string, configId: string) {
    const result = await db
      .delete(aiProviderConfigs)
      .where(and(eq(aiProviderConfigs.id, configId), eq(aiProviderConfigs.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Config not found');
    }
  }

  private static formatConfigResponse(config: AIProviderConfig) {
    return {
      id: config.id,
      provider: config.provider,
      model: config.model,
      isActive: config.isActive,
      usageCount: config.usageCount,
      createdAt: config.createdAt instanceof Date ? config.createdAt.toISOString() : new Date(config.createdAt).toISOString(),
      updatedAt: config.updatedAt instanceof Date ? config.updatedAt.toISOString() : new Date(config.updatedAt).toISOString(),
    };
  }
}
