import { createClient } from '@supabase/supabase-js'

// Uses anon key — cron functions are SECURITY DEFINER so no service role needed.
// Server-side only, never exposed to browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
