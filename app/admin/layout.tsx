import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboardIcon, UsersIcon, RefreshIcon, ArrowRightIcon } from '@/components/icons'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin, nickname').eq('id', user.id).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(profile as any)?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center px-6 gap-4 bg-brand-gold/10 border-b border-brand-gold/20">
        <span className="text-brand-gold font-bold text-sm flex items-center gap-1.5">
          <LayoutDashboardIcon size={16} />
          لوحة الإدارة
        </span>
        <nav className="flex items-center gap-1">
          <AdminLink href="/admin" label="نظرة عامة" />
          <AdminLink href="/admin/users" label="المستخدمون" icon={<UsersIcon size={14} />} />
          <AdminLink href="/admin/matches" label="المباريات" icon={<RefreshIcon size={14} />} />
        </nav>
        <div className="me-auto">
          <Link href="/dashboard" className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1">
            <ArrowRightIcon size={13} />
            العودة للتطبيق
          </Link>
        </div>
      </header>
      <main className="pt-14 max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function AdminLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
      {icon}
      {label}
    </Link>
  )
}
