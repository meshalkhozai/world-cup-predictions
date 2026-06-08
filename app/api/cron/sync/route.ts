import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAllMatches } from '@/lib/zafronix'

// Vercel Cron sends: Authorization: Bearer {CRON_SECRET}
// Also called manually from terminal or admin panel
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let matches
  try {
    matches = await fetchAllMatches()
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  const supabase = createAdminClient()

  // Batch upsert via SECURITY DEFINER function (no user session needed)
  const { error: syncError } = await supabase.rpc('cron_sync_matches', {
    p_matches: matches,
  })

  if (syncError) {
    return NextResponse.json({ error: syncError.message }, { status: 500 })
  }

  // Score all finished matches (idempotent)
  const { error: scoreError } = await supabase.rpc('cron_process_finished_matches')

  if (scoreError) {
    return NextResponse.json({ error: scoreError.message }, { status: 500 })
  }

  const finished = matches.filter(m => m.status === 'finished').length

  return NextResponse.json({
    ok: true,
    synced: matches.length,
    finished,
  })
}
