import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number
  id: string
  nickname: string
  avatar_url: string | null
  total_points: number
  exact_predictions: number
  correct_predictions: number
  wrong_predictions: number
  created_at: string
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.rpc('get_leaderboard')
  const board = (data ?? []) as LeaderboardEntry[]
  const top3 = board.slice(0, 3)
  const rest = board.slice(3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">الترتيب</h1>

      {board.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-white/40">
          لا توجد توقعات بعد. سيظهر الترتيب بعد تسجيل التوقعات.
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {top3[1] && <PodiumCard entry={top3[1]} currentUserId={user.id} height="h-24" />}
          {top3[0] && <PodiumCard entry={top3[0]} currentUserId={user.id} height="h-32" />}
          {top3[2] && <PodiumCard entry={top3[2]} currentUserId={user.id} height="h-20" />}
        </div>
      )}

      {/* Full list */}
      {board.length > 0 && (
        <div className="space-y-2">
          {board.map(entry => {
            const isMe = entry.id === user.id
            return (
              <div
                key={entry.id}
                className={`glass rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
                  isMe ? 'border border-brand-green/30 bg-brand-green/5' : ''
                }`}
              >
                <div className="w-8 text-center shrink-0">
                  {entry.rank === 1 ? <span className="text-sm font-bold text-brand-gold">#1</span> :
                   entry.rank === 2 ? <span className="text-sm font-bold text-white/60">#2</span> :
                   entry.rank === 3 ? <span className="text-sm font-bold text-amber-600">#3</span> :
                   <span className="text-sm font-bold text-white/40">#{entry.rank}</span>}
                </div>

                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt={entry.nickname} width={32} height={32} className="rounded-full ring-1 ring-white/10 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold shrink-0">
                    {entry.nickname[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${encodeURIComponent(entry.nickname)}`}>
                    <p className={`text-sm font-semibold truncate hover:underline ${isMe ? 'text-brand-green' : 'text-white'}`}>
                      {entry.nickname} {isMe && <span className="text-xs font-normal opacity-60">(أنت)</span>}
                    </p>
                  </Link>
                  <p className="text-xs text-white/40">
                    {entry.exact_predictions} دقيق · {entry.correct_predictions} صحيح
                  </p>
                </div>

                <div className="text-end shrink-0">
                  <p className="text-lg font-bold text-white">{entry.total_points}</p>
                  <p className="text-xs text-white/40">نقطة</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PodiumCard({ entry, currentUserId, height }: { entry: LeaderboardEntry; currentUserId: string; height: string }) {
  const isMe = entry.id === currentUserId
  const rankColors = ['text-brand-gold', 'text-white/60', 'text-amber-600']
  const rankColor = rankColors[entry.rank - 1] ?? 'text-white/40'

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className={`text-sm font-bold ${rankColor}`}>#{entry.rank}</span>
      {entry.avatar_url ? (
        <Image src={entry.avatar_url} alt={entry.nickname} width={40} height={40} className={`rounded-full ring-2 ${isMe ? 'ring-brand-green' : 'ring-white/20'}`} />
      ) : (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-brand-green/20 text-brand-green' : 'bg-white/10 text-white'}`}>
          {entry.nickname[0]?.toUpperCase()}
        </div>
      )}
      <p className="text-xs font-semibold text-white text-center truncate w-full px-1">{entry.nickname}</p>
      <p className="text-sm font-bold text-brand-gold">{entry.total_points} نقطة</p>
      <div className={`w-full ${height} glass rounded-t-lg flex items-end justify-center pb-1`}>
        <span className="text-xs text-white/50">{entry.rank}</span>
      </div>
    </div>
  )
}
