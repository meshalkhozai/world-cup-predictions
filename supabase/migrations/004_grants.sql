-- ============================================================
-- Migration 004: Table grants for authenticated & anon roles
-- Required because "Automatically expose new tables" was disabled
-- ============================================================

-- profiles
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- matches
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.matches TO authenticated;

-- predictions
GRANT SELECT ON public.predictions TO authenticated;
GRANT INSERT, UPDATE ON public.predictions TO authenticated;

-- functions
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_match_points(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
