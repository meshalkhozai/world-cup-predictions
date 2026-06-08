-- Migration 006: Cron-safe functions (no auth.uid() dependency)
-- These run as postgres via SECURITY DEFINER, protected at the route level by CRON_SECRET

-- ─── Batch upsert matches from API ────────────────────────────
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
      kickoff_time, home_score, away_score, status, stage, venue
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
      v_match->>'venue'
    )
    ON CONFLICT (external_id) DO UPDATE SET
      home_team      = EXCLUDED.home_team,
      away_team      = EXCLUDED.away_team,
      home_team_flag = EXCLUDED.home_team_flag,
      away_team_flag = EXCLUDED.away_team_flag,
      home_score     = EXCLUDED.home_score,
      away_score     = EXCLUDED.away_score,
      status         = EXCLUDED.status,
      kickoff_time   = EXCLUDED.kickoff_time,
      venue          = EXCLUDED.venue;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ─── Score all finished matches (idempotent) ──────────────────
CREATE OR REPLACE FUNCTION public.cron_process_finished_matches()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_count INT := 0;
BEGIN
  FOR v_match IN
    SELECT id, home_score, away_score
    FROM public.matches
    WHERE status = 'finished'
      AND home_score IS NOT NULL
      AND away_score IS NOT NULL
  LOOP
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
    v_count := v_count + 1;
  END LOOP;

  -- Recalculate all user totals at once
  UPDATE public.profiles p
  SET
    total_points = (
      SELECT COALESCE(SUM(pr.points_awarded), 0)
      FROM public.predictions pr WHERE pr.user_id = p.id
    ),
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

GRANT EXECUTE ON FUNCTION public.cron_sync_matches(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_process_finished_matches() TO anon, authenticated;
