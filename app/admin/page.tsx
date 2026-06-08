import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UsersIcon, RefreshIcon, ActivityIcon } from '@/components/icons'

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: matchCount }, { count: predCount }, { count: userCount }] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">نظرة عامة</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="المباريات" value={matchCount ?? 0} icon={<ActivityIcon size={22} className="text-brand-green" />} />
        <StatCard label="التوقعات" value={predCount ?? 0} icon={<ActivityIcon size={22} className="text-blue-400" />} />
        <StatCard label="المستخدمون" value={userCount ?? 0} icon={<UsersIcon size={22} className="text-brand-gold" />} />
      </div>

      <div className="glass rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <p className="text-sm font-semibold text-white">المزامنة التلقائية مفعّلة</p>
        </div>
        <p className="text-sm text-gray-400">
          تتزامن المباريات والنتائج تلقائيًا من Zafronix مرة يوميًا.
          يمكنك المزامنة يدويًا من صفحة المباريات بعد انتهاء كل مباراة.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/users" className="glass glass-hover rounded-xl p-5 flex items-center gap-4">
          <UsersIcon size={28} className="text-brand-gold shrink-0" />
          <div>
            <p className="font-semibold text-white">إدارة المستخدمين</p>
            <p className="text-sm text-gray-400">عرض جميع المستخدمين وإحصائياتهم</p>
          </div>
        </Link>
        <Link href="/admin/matches" className="glass glass-hover rounded-xl p-5 flex items-center gap-4">
          <RefreshIcon size={28} className="text-brand-green shrink-0" />
          <div>
            <p className="font-semibold text-white">مزامنة المباريات</p>
            <p className="text-sm text-gray-400">تحديث النتائج وحساب النقاط</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-4 text-center space-y-1">
      <div className="flex justify-center">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
