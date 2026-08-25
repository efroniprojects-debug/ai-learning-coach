-- AI Learning Coach - Initial Database Schema
-- Created: 2026-08-25
-- Supabase PostgreSQL with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  profile_picture TEXT,
  language VARCHAR(10) DEFAULT 'he',
  theme VARCHAR(10) DEFAULT 'auto',
  focus_mode_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX users_email_idx ON users(email);
CREATE INDEX users_google_id_idx ON users(google_id);
CREATE INDEX users_created_at_idx ON users(created_at);

-- AI Provider Configurations
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  api_key_encrypted VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX ai_provider_configs_user_id_idx ON ai_provider_configs(user_id);
CREATE INDEX ai_provider_configs_provider_idx ON ai_provider_configs(provider);
CREATE INDEX ai_provider_configs_is_active_idx ON ai_provider_configs(is_active);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- Uploaded Files
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  storage_url TEXT NOT NULL,
  content_extracted TEXT,
  is_processed BOOLEAN DEFAULT false,
  processing_status VARCHAR(50) DEFAULT 'pending',
  extracted_concepts UUID[],
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX uploaded_files_user_id_idx ON uploaded_files(user_id);
CREATE INDEX uploaded_files_status_idx ON uploaded_files(processing_status);
CREATE INDEX uploaded_files_created_at_idx ON uploaded_files(created_at);

-- Knowledge Chunks (with pgvector embeddings)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(255),
  source_document_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  chunk_text TEXT NOT NULL,
  chunk_embedding vector(1536),
  concept_ids UUID[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX knowledge_chunks_source_type_idx ON knowledge_chunks(source_type);
CREATE INDEX knowledge_chunks_source_document_idx ON knowledge_chunks(source_document_id);
CREATE INDEX knowledge_chunks_created_at_idx ON knowledge_chunks(created_at);
-- Vector similarity search index
CREATE INDEX knowledge_chunks_embedding_idx ON knowledge_chunks USING HNSW (chunk_embedding vector_cosine_ops);

-- Practice Attempts
CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  submitted_answer TEXT,
  is_correct BOOLEAN,
  score INTEGER,
  time_spent_seconds INTEGER,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX practice_attempts_user_id_idx ON practice_attempts(user_id);
CREATE INDEX practice_attempts_question_id_idx ON practice_attempts(question_id);
CREATE INDEX practice_attempts_created_at_idx ON practice_attempts(created_at);

-- Skill Mastery (ELO ratings per concept)
CREATE TABLE IF NOT EXISTS skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id VARCHAR(255) NOT NULL,
  elo_rating INTEGER DEFAULT 1000,
  attempts_count INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP,
  confidence_level VARCHAR(20) DEFAULT 'novice',
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX skill_mastery_user_concept_idx ON skill_mastery(user_id, concept_id);
CREATE INDEX skill_mastery_elo_idx ON skill_mastery(elo_rating);
CREATE INDEX skill_mastery_user_id_idx ON skill_mastery(user_id);

-- Share Links
CREATE TABLE IF NOT EXISTS share_links (
  id VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  access_token VARCHAR NOT NULL UNIQUE,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX share_links_user_id_idx ON share_links(user_id);
CREATE INDEX share_links_resource_idx ON share_links(resource_id);
CREATE INDEX share_links_expires_at_idx ON share_links(expires_at);

-- Progress Snapshots (daily tracking)
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  mastery_levels JSONB,
  attempts_today INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  weak_areas VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX progress_snapshots_user_date_idx ON progress_snapshots(user_id, date);
CREATE INDEX progress_snapshots_user_id_idx ON progress_snapshots(user_id);

-- Grant permissions to anon role (for public access)
GRANT SELECT ON knowledge_chunks TO anon;
GRANT SELECT ON users TO anon;

-- Grant permissions to authenticated role (for logged-in users)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_provider_configs_updated_at BEFORE UPDATE ON ai_provider_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skill_mastery_updated_at BEFORE UPDATE ON skill_mastery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
