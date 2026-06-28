-- Migration 008: Knockout stage prediction support
-- Adds knockout_winner to matches, predicted_winner to predictions,
-- and updates scoring logic for knockout rounds.

-- ─── New columns ──────────────────────────────────────────────
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS knockout_winner TEXT
    CHECK (knockout_winner IN ('home', 'away'));

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS predicted_winner TEXT
    CHECK (predicted_winner IN ('home', 'away'));

-- ─── Update cron_sync_matches to handle knockout_winner ────────
CREATE OR REPLACE FUNCTION public.cron_sync_matches(p_matches JSONB)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match JSONB;
  v_count INT := 0;
BEGIN
  FOR v_match IN SELECT * FROM jsonb_array_elements(p_matches)
  LOOP
    INSERT INTO public.matches (
      external_id, home_team, away_team, home_team_flag, away_team_flag,
      kickoff_time, home_score, away_score, status, stage, venue, knockout_winner
    )
    VALUES (
      v_match->>'external_id',
      v_match->>'home_team',
      v_match->>'away_team',
      v_match->>'home_team_flag',
      v_match->>'away_team_flag',
      (v_match->>'kickoff_time')::TIMESTAMPTZ,
      (v_match->>'home_score')::INT,
      (v_match->>'away_score')::INT,
      v_match->>'status',
      v_match->>'stage',
      v_match->>'venue',
      v_match->>'knockout_winner'
    )
    ON CONFLICT (external_id) DO UPDATE SET
      home_team       = EXCLUDED.home_team,
      away_team       = EXCLUDED.away_team,
      home_team_flag  = EXCLUDED.home_team_flag,
      away_team_flag  = EXCLUDED.away_team_flag,
      home_score      = EXCLUDED.home_score,
      away_score      = EXCLUDED.away_score,
      status          = EXCLUDED.status,
      kickoff_time    = EXCLUDED.kickoff_time,
      venue           = EXCLUDED.venue,
      knockout_winner = EXCLUDED.knockout_winner;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ─── Update cron_process_finished_matches with knockout scoring ─
CREATE OR REPLACE FUNCTION public.cron_process_finished_matches()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_final RECORD;
  v_champion TEXT;
  v_count INT := 0;
BEGIN
  -- 1. Score all finished match predictions (idempotent)
  FOR v_match IN
    SELECT id, home_score, away_score, stage, knockout_winner
    FROM public.matches
    WHERE status = 'finished'
      AND home_score IS NOT NULL
      AND away_score IS NOT NULL
  LOOP
    IF v_match.stage = 'group' THEN
      -- ── Group stage: standard win/draw/loss scoring ──────────
      UPDATE public.predictions
      SET points_awarded = CASE
        WHEN predicted_home_score = v_match.home_score
         AND predicted_away_score = v_match.away_score THEN 3
        WHEN (predicted_home_score > predicted_away_score AND v_match.home_score > v_match.away_score)
          OR (predicted_home_score < predicted_away_score AND v_match.home_score < v_match.away_score)
          OR (predicted_home_score = predicted_away_score AND v_match.home_score = v_match.away_score) THEN 1
        ELSE 0
      END
      WHERE match_id = v_match.id;

    ELSE
      -- ── Knockout stage: draw+winner popup scoring ────────────
      UPDATE public.predictions
      SET points_awarded = CASE
        -- User predicted home win
        WHEN predicted_home_score > predicted_away_score THEN
          CASE
            WHEN predicted_home_score = v_match.home_score
             AND predicted_away_score = v_match.away_score THEN 3
            WHEN v_match.knockout_winner = 'home' THEN 1
            ELSE 0
          END
        -- User predicted away win
        WHEN predicted_home_score < predicted_away_score THEN
          CASE
            WHEN predicted_home_score = v_match.home_score
             AND predicted_away_score = v_match.away_score THEN 3
            WHEN v_match.knockout_winner = 'away' THEN 1
            ELSE 0
          END
        -- User predicted draw (picked winner via popup)
        ELSE
          CASE
            -- Exact draw score + correct winner via penalties → 3
            WHEN v_match.home_score = v_match.away_score
             AND predicted_home_score = v_match.home_score
             AND predicted_away_score = v_match.away_score
             AND predicted_winner = v_match.knockout_winner THEN 3
            -- Correct advancing team (any path) → 1
            WHEN predicted_winner = v_match.knockout_winner THEN 1
            ELSE 0
          END
      END
      WHERE match_id = v_match.id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- 2. Champion pick: award 15 pts when Final is finished
  SELECT home_team, away_team, home_score, away_score, knockout_winner
  INTO v_final
  FROM public.matches
  WHERE stage = 'final' AND status = 'finished'
  LIMIT 1;

  IF FOUND AND v_final.knockout_winner IS NOT NULL THEN
    IF v_final.knockout_winner = 'home' THEN
      v_champion := v_final.home_team;
    ELSE
      v_champion := v_final.away_team;
    END IF;

    IF v_champion IS NOT NULL THEN
      UPDATE public.profiles
      SET champion_pick_awarded = true
      WHERE champion_pick = v_champion
        AND champion_pick_awarded = false
        AND onboarding_completed = true;
    END IF;
  END IF;

  -- 3. Recalculate all profile totals
  UPDATE public.profiles p
  SET
    total_points = (
      SELECT COALESCE(SUM(pr.points_awarded), 0)
      FROM public.predictions pr WHERE pr.user_id = p.id
    ) + CASE WHEN p.champion_pick_awarded THEN 15 ELSE 0 END,
    exact_predictions = (
      SELECT COUNT(*) FROM public.predictions pr
      WHERE pr.user_id = p.id AND pr.points_awarded = 3
    ),
    correct_predictions = (
      SELECT COUNT(*) FROM public.predictions pr
      WHERE pr.user_id = p.id AND pr.points_awarded > 0
    ),
    wrong_predictions = (
      SELECT COUNT(*) FROM public.predictions pr
      WHERE pr.user_id = p.id AND pr.points_awarded = 0
    )
  WHERE p.onboarding_completed = true;

  RETURN v_count;
END;
$$;
