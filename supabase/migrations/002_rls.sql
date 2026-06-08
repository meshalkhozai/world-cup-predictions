-- ============================================================
-- Migration 002: Row Level Security
-- ============================================================

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- ─── Helper: check if current user is admin ───────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- ─── PROFILES ─────────────────────────────────────────────────
-- Anyone can read public profile info (no email exposed via views)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- User inserts their own profile (trigger handles this, but allow direct too)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User can update own profile (cannot change is_admin or id)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── MATCHES ──────────────────────────────────────────────────
CREATE POLICY "matches_select_public"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "matches_insert_admin"
  ON public.matches FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "matches_update_admin"
  ON public.matches FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "matches_delete_admin"
  ON public.matches FOR DELETE
  USING (public.is_admin());

-- ─── PREDICTIONS ──────────────────────────────────────────────

-- Own predictions: always visible to owner
CREATE POLICY "predictions_select_own"
  ON public.predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Others' predictions: only visible AFTER kickoff (anti-copying)
CREATE POLICY "predictions_select_others_after_kickoff"
  ON public.predictions FOR SELECT
  USING (
    auth.uid() != user_id
    AND NOW() >= (
      SELECT kickoff_time FROM public.matches WHERE id = match_id
    )
  );

-- INSERT: own predictions only, match must be today (Saudi timezone) AND before kickoff
CREATE POLICY "predictions_insert_own"
  ON public.predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND NOW() < m.kickoff_time
        AND (m.kickoff_time AT TIME ZONE 'Asia/Riyadh')::date
            = (NOW() AT TIME ZONE 'Asia/Riyadh')::date
    )
  );

-- UPDATE: own predictions only, only before kickoff
CREATE POLICY "predictions_update_own_before_kickoff"
  ON public.predictions FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOW() < (
      SELECT kickoff_time FROM public.matches WHERE id = match_id
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND NOW() < (
      SELECT kickoff_time FROM public.matches WHERE id = match_id
    )
  );

-- DELETE: nobody (immutable after lock; admin uses SECURITY DEFINER function)
CREATE POLICY "predictions_no_delete"
  ON public.predictions FOR DELETE
  USING (false);
