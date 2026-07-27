-- ============================================================================
-- MIGRATION 002: Question Embeddings (Separate Table for LLM Provider Support)
-- ============================================================================
-- This migration creates a separate table for question embeddings
-- Supports multiple LLM providers without modifying the questions table
--
-- Reason:
-- We want the platform to support multiple LLM providers (OpenAI, Anthropic, etc.)
-- in the future without changing the questions schema

-- ============================================================================
-- ENUM: LLM Embedding Provider
-- ============================================================================

CREATE TYPE embedding_provider AS ENUM ('openai', 'anthropic', 'cohere', 'other');

-- ============================================================================
-- TABLE: question_embeddings
-- ============================================================================
-- Stores embeddings for questions from different LLM providers

CREATE TABLE IF NOT EXISTS question_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to question
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Provider metadata
  provider embedding_provider NOT NULL,
  model VARCHAR(100) NOT NULL,  -- e.g., 'text-embedding-3-large', 'claude-embedding'
  dimensions INT NOT NULL,      -- e.g., 1536, 1024
  
  -- Embedding vector (pgvector extension required)
  embedding vector,             -- Dynamically sized to match dimensions
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one embedding per provider per question
  UNIQUE(question_id, provider)
);

CREATE INDEX idx_question_embeddings_question ON question_embeddings(question_id);
CREATE INDEX idx_question_embeddings_provider ON question_embeddings(provider);
CREATE INDEX idx_question_embeddings_model ON question_embeddings(model);
CREATE INDEX idx_question_embeddings_embedding ON question_embeddings USING ivfflat (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION 002
-- ============================================================================
