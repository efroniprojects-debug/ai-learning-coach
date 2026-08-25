import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    googleId: varchar('google_id', { length: 255 }).unique(),
    displayName: varchar('display_name', { length: 255 }),
    profilePicture: text('profile_picture'),
    language: varchar('language', { length: 10 }).default('he'),
    theme: varchar('theme', { length: 10 }).default('auto'),
    focusModeEnabled: boolean('focus_mode_enabled').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      emailIdx: uniqueIndex('users_email_idx').on(table.email),
      googleIdIdx: index('users_google_id_idx').on(table.googleId),
      createdAtIdx: index('users_created_at_idx').on(table.createdAt),
    };
  }
);

export const aiProviderConfigs = pgTable(
  'ai_provider_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(), // 'claude', 'gemini', 'openai'
    model: varchar('model', { length: 100 }).notNull(),
    apiKeyEncrypted: varchar('api_key_encrypted').notNull(), // Never returned to client
    isActive: boolean('is_active').default(false),
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('ai_provider_configs_user_id_idx').on(table.userId),
      providerIdx: index('ai_provider_configs_provider_idx').on(table.provider),
      activeIdx: index('ai_provider_configs_is_active_idx').on(table.isActive),
    };
  }
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: varchar('refresh_token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('sessions_user_id_idx').on(table.userId),
      expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
    };
  }
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 255 }).notNull(),
    resourceType: varchar('resource_type', { length: 50 }),
    resourceId: varchar('resource_id', { length: 255 }),
    changes: jsonb('changes'),
    ipAddress: varchar('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
      actionIdx: index('audit_logs_action_idx').on(table.action),
      createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    };
  }
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AIProviderConfig = typeof aiProviderConfigs.$inferSelect;
export type NewAIProviderConfig = typeof aiProviderConfigs.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
