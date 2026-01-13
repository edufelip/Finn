-- Migration: Add env column to push_tokens table
-- This migration adds an environment field to separate dev and prod push tokens

-- Add env column to push_tokens table
ALTER TABLE push_tokens
ADD COLUMN IF NOT EXISTS env TEXT NOT NULL DEFAULT 'prod';

-- Add index for faster queries filtering by env
CREATE INDEX IF NOT EXISTS idx_push_tokens_env ON push_tokens(env);

-- Add index for faster queries filtering by user_id and env
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_env ON push_tokens(user_id, env);

-- Update existing tokens to prod environment
UPDATE push_tokens SET env = 'prod' WHERE env IS NULL OR env = '';

COMMENT ON COLUMN push_tokens.env IS 'Environment: dev or prod';
