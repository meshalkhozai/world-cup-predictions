-- Migration 009: Featured matches with doubled exact-prediction points

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- ─── Updated cron_process_finished_matches ────────────────────
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
    SELECT id, home_score, away_score, stage, knockout_winner, is_featured
    FROM public.matches
    WHERE status = 'finished'
      AND home_score IS NOT NULL
      AND away_score IS NOT NULL
  LOOP
    IF v_match.stage = 'group' THEN
      -- ── Group stage ──────────────────────────────────────────
      UPDATE public.predictions
      SET points_awarded = CASE
        WHEN predicted_home_score = v_match.home_score
         AND predicted_away_score = v_match.away_score
          THEN CASE WHEN v_match.is_featured THEN 6 ELSE 3 END
        WHEN (predicted_home_score > predicted_away_score AND v_match.home_score > v_match.away_score)
          OR (predicted_home_score < predicted_away_score AND v_match.home_score < v_match.away_score)
          OR (predicted_home_score = predicted_away_score AND v_match.home_score = v_match.away_score)
          THEN 1
        ELSE 0
      END
      WHERE match_id = v_match.id;

    ELSE
      -- ── Knockout stage ───────────────────────────────────────
      UPDATE public.predictions
      SET points_awarded = CASE
        -- User predicted home win
        WHEN predicted_home_score > predicted_away_score THEN
          CASE
            WHEN predicted_home_score = v_match.home_score
             AND predicted_away_score = v_match.away_score
              THEN CASE WHEN v_match.is_featured THEN 6 ELSE 3 END
            WHEN v_match.knockout_winner = 'home' THEN 1
            ELSE 0
          END
        -- User predicted away win
        WHEN predicted_home_score < predicted_away_score THEN
          CASE
            WHEN predicted_home_score = v_match.home_score
             AND predicted_away_score = v_match.away_score
              THEN CASE WHEN v_match.is_featured THEN 6 ELSE 3 END
            WHEN v_match.knockout_winner = 'away' THEN 1
            ELSE 0
          END
        -- User predicted draw
        ELSE
          CASE
            WHEN v_match.home_score = v_match.away_score THEN
              CASE
                WHEN predicted_home_score = v_match.home_score
                 AND predicted_away_score = v_match.away_score
                 AND predicted_winner = v_match.knockout_winner
                  THEN CASE WHEN v_match.is_featured THEN 8 ELSE 4 END
                WHEN predicted_home_score = v_match.home_score
                 AND predicted_away_score = v_match.away_score
                  THEN 3
                WHEN predicted_winner = v_match.knockout_winner THEN 2
                ELSE 1
              END
            ELSE
              CASE
                WHEN predicted_winner = v_match.knockout_winner THEN 1
                ELSE 0
              END
          END
      END
      WHERE match_id = v_match.id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- 2. Champion pick
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
      WHERE pr.user_id = p.id AND pr.points_awarded >= 3
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
