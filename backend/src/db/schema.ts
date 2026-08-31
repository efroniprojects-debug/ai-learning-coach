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
  (table: any) => {
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
  (table: any) => {
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
  (table: any) => {
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
  (table: any) => {
    return {
      userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
      actionIdx: index('audit_logs_action_idx').on(table.action),
      createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    };
  }
);

export const uploadedFiles = pgTable(
  'uploaded_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: varchar('mime_type', { length: 100 }),
    storageUrl: text('storage_url').notNull(),
    contentExtracted: text('content_extracted'),
    isProcessed: boolean('is_processed').default(false),
    processingStatus: varchar('processing_status', { length: 50 }).default('pending'), // pending, processing, completed, failed
    extractedConcepts: uuid('extracted_concepts').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table: any) => {
    return {
      userIdIdx: index('uploaded_files_user_id_idx').on(table.userId),
      statusIdx: index('uploaded_files_status_idx').on(table.processingStatus),
      createdAtIdx: index('uploaded_files_created_at_idx').on(table.createdAt),
    };
  }
);

export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceType: varchar('source_type', { length: 50 }).notNull(),
    sourceId: varchar('source_id', { length: 255 }),
    sourceDocumentId: uuid('source_document_id').references(() => uploadedFiles.id, {
      onDelete: 'set null',
    }),
    chunkText: text('chunk_text').notNull(),
    chunkEmbedding: text('chunk_embedding'),
    conceptIds: uuid('concept_ids').array(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table: any) => {
    return {
      sourceTypeIdx: index('knowledge_chunks_source_type_idx').on(table.sourceType),
      sourceDocumentIdx: index('knowledge_chunks_source_document_idx').on(
        table.sourceDocumentId
      ),
      createdAtIdx: index('knowledge_chunks_created_at_idx').on(table.createdAt),
    };
  }
);

export const practiceAttempts = pgTable(
  'practice_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull(), // Reference to knowledge chunk or practice problem
    submittedAnswer: text('submitted_answer'),
    isCorrect: boolean('is_correct'),
    score: integer('score'), // 0-100
    timeSpentSeconds: integer('time_spent_seconds'),
    feedback: text('feedback'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table: any) => {
    return {
      userIdIdx: index('practice_attempts_user_id_idx').on(table.userId),
      questionIdIdx: index('practice_attempts_question_id_idx').on(table.questionId),
      createdAtIdx: index('practice_attempts_created_at_idx').on(table.createdAt),
    };
  }
);

export const skillMastery = pgTable(
  'skill_mastery',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conceptId: varchar('concept_id', { length: 255 }).notNull(), // Physics concept (force, acceleration, etc.)
    eloRating: integer('elo_rating').default(1000),
    attemptsCount: integer('attempts_count').default(0),
    correctAttempts: integer('correct_attempts').default(0),
    lastAttemptedAt: timestamp('last_attempted_at'),
    confidenceLevel: varchar('confidence_level', { length: 20 }).default('novice'), // novice, intermediate, proficient, expert
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table: any) => {
    return {
      userConceptIdx: uniqueIndex('skill_mastery_user_concept_idx').on(
        table.userId,
        table.conceptId
      ),
      eloIdx: index('skill_mastery_elo_idx').on(table.eloRating),
      userIdIdx: index('skill_mastery_user_id_idx').on(table.userId),
    };
  }
);

export const shareLinks = pgTable(
  'share_links',
  {
    id: varchar('id', { length: 20 }).primaryKey(), // Short URL-safe ID
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resourceType: varchar('resource_type', { length: 50 }).notNull(), // question, solution, progress_report
    resourceId: uuid('resource_id').notNull(),
    accessToken: varchar('access_token').notNull().unique(),
    viewCount: integer('view_count').default(0),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table: any) => {
    return {
      userIdIdx: index('share_links_user_id_idx').on(table.userId),
      resourceIdx: index('share_links_resource_idx').on(table.resourceId),
      expiresAtIdx: index('share_links_expires_at_idx').on(table.expiresAt),
    };
  }
);

export const progressSnapshots = pgTable(
  'progress_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    masteryLevels: jsonb('mastery_levels'), // concept_id -> elo_rating
    attemptsToday: integer('attempts_today').default(0),
    problemsSolved: integer('problems_solved').default(0),
    timeSpentSeconds: integer('time_spent_seconds').default(0),
    weakAreas: varchar('weak_areas', { length: 255 }).array(), // Concepts with low ELO
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table: any) => {
    return {
      userDateIdx: uniqueIndex('progress_snapshots_user_date_idx').on(table.userId, table.date),
      userIdIdx: index('progress_snapshots_user_id_idx').on(table.userId),
    };
  }
);

export const conversationFolders = pgTable(
  'conversation_folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table: any) => ({
    userIdIdx: index('conversation_folders_user_id_idx').on(table.userId),
    userNameIdx: uniqueIndex('conversation_folders_user_name_idx').on(table.userId, table.name),
  })
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }),
    subject: varchar('subject', { length: 50 }).default('physics'),
    folderId: uuid('folder_id').references(() => conversationFolders.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table: any) => ({
    userIdIdx: index('conversations_user_id_idx').on(table.userId),
    createdAtIdx: index('conversations_created_at_idx').on(table.createdAt),
    folderIdIdx: index('conversations_folder_id_idx').on(table.folderId),
  })
);

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    structuredData: jsonb('structured_data'), // Parsed TutorStructuredResponse for assistant messages
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table: any) => ({
    conversationIdx: index('conv_messages_conversation_idx').on(table.conversationId),
    createdAtIdx: index('conv_messages_created_at_idx').on(table.createdAt),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AIProviderConfig = typeof aiProviderConfigs.$inferSelect;
export type NewAIProviderConfig = typeof aiProviderConfigs.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type NewUploadedFile = typeof uploadedFiles.$inferInsert;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
export type PracticeAttempt = typeof practiceAttempts.$inferSelect;
export type NewPracticeAttempt = typeof practiceAttempts.$inferInsert;
export type SkillMastery = typeof skillMastery.$inferSelect;
export type NewSkillMastery = typeof skillMastery.$inferInsert;
export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;
export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;
export type NewProgressSnapshot = typeof progressSnapshots.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationFolder = typeof conversationFolders.$inferSelect;
export type NewConversationFolder = typeof conversationFolders.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
