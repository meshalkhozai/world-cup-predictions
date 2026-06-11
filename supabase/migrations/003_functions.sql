-- ============================================================
-- Migration 003: Business Logic Functions
-- ============================================================

-- ─── calculate_match_points ───────────────────────────────────
-- Called by admin only. Scores all predictions for a match,
-- updates the match record, then recalculates affected user totals.
CREATE OR REPLACE FUNCTION public.calculate_match_points(
  p_match_id  UUID,
  p_home      INT,
  p_away      INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: caller must be admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Award points on all predictions for this match
  UPDATE public.predictions
  SET points_awarded = CASE
    -- Exact score: +3
    WHEN predicted_home_score = p_home
     AND predicted_away_score = p_away
      THEN 3
    -- Correct result (win/draw direction): +1
    WHEN (predicted_home_score > predicted_away_score AND p_home > p_away)
      OR (predicted_home_score < predicted_away_score AND p_home < p_away)
      OR (predicted_home_score = predicted_away_score AND p_home = p_away)
      THEN 1
    ELSE 0
  END
  WHERE match_id = p_match_id;

  -- 2. Finalise match record
  UPDATE public.matches
  SET home_score = p_home,
      away_score = p_away,
      status     = 'finished'
  WHERE id = p_match_id;

  -- 3. Recalculate totals for every user who predicted this match
  UPDATE public.profiles p
  SET
    total_points = (
      SELECT COALESCE(SUM(pr.points_awarded), 0)
      FROM public.predictions pr
      WHERE pr.user_id = p.id
    ),
    exact_predictions = (
      SELECT COUNT(*)
      FROM public.predictions pr
      WHERE pr.user_id = p.id AND pr.points_awarded = 3
    ),
    correct_predictions = (
      SELECT COUNT(*)
      FROM public.predictions pr
      WHERE pr.user_id = p.id AND pr.points_awarded > 0
    ),
    wrong_predictions = (
      SELECT COUNT(*)
      FROM public.predictions pr
      WHERE pr.user_id = p.id AND pr.points_awarded = 0
    )
  WHERE p.id IN (
    SELECT DISTINCT user_id
    FROM public.predictions
    WHERE match_id = p_match_id
  );
END;
$$;

-- ─── get_leaderboard ──────────────────────────────────────────
-- Returns ranked profiles.
-- Tiebreaker order: total_points → exact_predictions → correct_predictions → created_at (oldest first)
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank                BIGINT,
  id                  UUID,
  nickname            TEXT,
  avatar_url          TEXT,
  total_points        INT,
  exact_predictions   INT,
  correct_predictions INT,
  wrong_predictions   INT,
  champion_pick       TEXT,
  created_at          TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY
        p.total_points        DESC,
        p.exact_predictions   DESC,
        p.correct_predictions DESC,
        p.created_at          ASC
    ) AS rank,
    p.id,
    p.nickname,
    p.avatar_url,
    p.total_points,
    p.exact_predictions,
    p.correct_predictions,
    p.wrong_predictions,
    p.champion_pick,
    p.created_at
  FROM public.profiles p
  WHERE p.onboarding_completed = true
    AND p.is_admin = false;
$$;

-- ─── get_match_insights ───────────────────────────────────────
-- Returns community prediction distribution for a match.
-- Only accessible after kickoff (no leaking before lock).
CREATE OR REPLACE FUNCTION public.get_match_insights(p_match_id UUID)
RETURNS TABLE (
  total_predictions INT,
  home_win_count    INT,
  draw_count        INT,
  away_win_count    INT,
  home_win_pct      NUMERIC,
  draw_pct          NUMERIC,
  away_win_pct      NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_kickoff TIMESTAMPTZ;
  v_total   INT;
BEGIN
  SELECT kickoff_time INTO v_kickoff
  FROM public.matches WHERE id = p_match_id;

  IF v_kickoff IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Only available after kickoff
  IF NOW() < v_kickoff THEN
    RAISE EXCEPTION 'Insights not available before kickoff';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.predictions WHERE match_id = p_match_id;

  IF v_total = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_total,
    COUNT(*) FILTER (WHERE predicted_home_score > predicted_away_score)::INT  AS home_win_count,
    COUNT(*) FILTER (WHERE predicted_home_score = predicted_away_score)::INT  AS draw_count,
    COUNT(*) FILTER (WHERE predicted_home_score < predicted_away_score)::INT  AS away_win_count,
    ROUND(COUNT(*) FILTER (WHERE predicted_home_score > predicted_away_score)::NUMERIC / v_total * 100, 1),
    ROUND(COUNT(*) FILTER (WHERE predicted_home_score = predicted_away_score)::NUMERIC / v_total * 100, 1),
    ROUND(COUNT(*) FILTER (WHERE predicted_home_score < predicted_away_score)::NUMERIC / v_total * 100, 1)
  FROM public.predictions
  WHERE match_id = p_match_id;
END;
$$;
