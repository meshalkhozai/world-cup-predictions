-- ─── Champion Pick ────────────────────────────────────────────
-- Adds champion_pick and champion_pick_awarded to profiles.
-- Updates cron_process_finished_matches to award 15 pts when Final is done.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS champion_pick       TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS champion_pick_awarded BOOLEAN NOT NULL DEFAULT false;

-- ─── Updated cron_process_finished_matches ────────────────────
CREATE OR REPLACE FUNCTION public.cron_process_finished_matches()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match   RECORD;
  v_final   RECORD;
  v_champion TEXT;
  v_count   INT := 0;
BEGIN
  -- 1. Score all finished match predictions (idempotent)
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

  -- 2. Champion pick: award 15 pts when Final is finished
  SELECT home_team, away_team, home_score, away_score
  INTO v_final
  FROM public.matches
  WHERE stage = 'final' AND status = 'finished'
  LIMIT 1;

  IF FOUND AND v_final.home_score IS NOT NULL AND v_final.away_score IS NOT NULL THEN
    IF v_final.home_score > v_final.away_score THEN
      v_champion := v_final.home_team;
    ELSIF v_final.away_score > v_final.home_score THEN
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

  -- 3. Recalculate all profile totals (includes champion bonus)
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
