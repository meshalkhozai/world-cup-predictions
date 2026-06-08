-- ============================================================
-- Migration 001: Core Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  nickname              TEXT UNIQUE NOT NULL,
  avatar_url            TEXT,
  total_points          INT NOT NULL DEFAULT 0,
  exact_predictions     INT NOT NULL DEFAULT 0,
  correct_predictions   INT NOT NULL DEFAULT 0,
  wrong_predictions     INT NOT NULL DEFAULT 0,
  is_admin              BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches
CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team       TEXT NOT NULL,
  away_team       TEXT NOT NULL,
  home_team_flag  TEXT,
  away_team_flag  TEXT,
  kickoff_time    TIMESTAMPTZ NOT NULL,
  home_score      INT CHECK (home_score >= 0),
  away_score      INT CHECK (away_score >= 0),
  status          TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming', 'live', 'finished')),
  stage           TEXT NOT NULL DEFAULT 'group'
                  CHECK (stage IN ('group','round_of_32','round_of_16',
                                   'quarter_final','semi_final','third_place','final')),
  venue           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_kickoff ON public.matches (kickoff_time);
CREATE INDEX idx_matches_status ON public.matches (status);

-- Predictions
CREATE TABLE public.predictions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id              UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score  INT NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score  INT NOT NULL CHECK (predicted_away_score >= 0),
  points_awarded        INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_predictions_user ON public.predictions (user_id);
CREATE INDEX idx_predictions_match ON public.predictions (match_id);

-- Auto-create profile skeleton on signup (nickname filled during onboarding)
-- We use a trigger but only insert a minimal row; nickname set after onboarding.
-- We store email from auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, avatar_url, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    '', -- placeholder; onboarding enforces real unique nickname
    NEW.raw_user_meta_data->>'avatar_url',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
