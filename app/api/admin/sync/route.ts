import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllMatches } from '@/lib/zafronix'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(profile as any)?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let matches
  try {
    matches = await fetchAllMatches()
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  const { error: syncError } = await supabase.rpc('cron_sync_matches', {
    p_matches: matches,
  })
  if (syncError) return NextResponse.json({ error: syncError.message }, { status: 500 })

  const { error: scoreError } = await supabase.rpc('cron_process_finished_matches')
  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 })

  return NextResponse.json({
    synced: matches.length,
    finished: matches.filter(m => m.status === 'finished').length,
  })
}
