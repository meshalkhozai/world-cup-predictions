-- Migration 005: Add external_id to matches for Zafronix API sync
-- Allows upsert by external API ID to prevent duplicate matches

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
